import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exec = promisify(execFile);
export function parseArgs(argv) {
  const result = { command: argv[0] || 'help', port: 9341 };
  for (let i = 1; i < argv.length; i++) {
    const key = argv[i];
    if (!['--port','--image','--opacity','--blur','--out'].includes(key) || !argv[i+1] || argv[i+1].startsWith('--')) throw new Error(`Invalid option or missing value: ${key}`);
    if (Object.hasOwn(result, key.slice(2)) && key !== '--port') throw new Error(`Repeated option: ${key}`);
    result[key.slice(2)] = ['--port','--opacity','--blur'].includes(key) ? Number(argv[++i]) : argv[++i];
  }
  if (!Number.isInteger(result.port) || result.port < 1024 || result.port > 65535) throw new Error('Port must be an integer from 1024 to 65535');
  for (const [key,min,max] of [['opacity',0.35,1],['blur',0,30]]) if (result[key] !== undefined && (!Number.isFinite(result[key]) || result[key] < min || result[key] > max)) throw new Error(`${key} must be ${min}–${max}`);
  return result;
}
export function storeDir() {
  if (!process.env.LOCALAPPDATA) throw new Error('LOCALAPPDATA is unavailable; Windows is required for local settings.');
  return path.join(process.env.LOCALAPPDATA,'CodexStarfieldSkin');
}
export async function validateImage(file) {
  const stat = await fs.stat(file);
  if (!stat.isFile() || stat.size < 24 || stat.size > 16*1024*1024) throw new Error('Image must be a file under 16 MiB.');
  const bytes = await fs.readFile(file);
  let mime;
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    const w=bytes.readUInt32BE(16), h=bytes.readUInt32BE(20);
    if (!w || !h || w>16384 || h>16384 || w*h>50e6) throw new Error('PNG exceeds the image dimension limit.');
    mime='image/png';
  } else if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) mime='image/jpeg';
  else if (bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP') mime='image/webp';
  else throw new Error('Use PNG, JPEG, or WebP; SVG and executable content are unsupported.');
  return {bytes,mime};
}
export async function loadTheme() {
  let config = { opacity:0.84, blur:12, image:path.join(root,'assets','honghuang-starfield.png') };
  try { config = {...config,...JSON.parse(await fs.readFile(path.join(storeDir(),'settings.json'),'utf8'))}; }
  catch (e) { if(e.code!=='ENOENT') throw e; }
  parseArgs(['configure','--opacity',String(config.opacity),'--blur',String(config.blur)]);
  const {bytes,mime}=await validateImage(config.image);
  return {...config,dataUrl:`data:${mime};base64,${bytes.toString('base64')}`};
}
export async function configure(options) {
  const dir=storeDir(); await fs.mkdir(dir,{recursive:true});
  const target=path.join(dir,'settings.json');
  let previous={};
  try { const raw=await fs.readFile(target); previous=JSON.parse(raw); await fs.writeFile(path.join(dir,`settings.backup-${Date.now()}.json`),raw,{flag:'wx'}); }
  catch(e) { if(e.code!=='ENOENT') throw e; }
  const source=path.resolve(options.image || path.join(root,'assets','honghuang-starfield.png'));
  const {bytes,mime}=await validateImage(source);
  const image=path.join(dir,`wallpaper-${Date.now()}.${mime.split('/')[1]}`);
  await fs.writeFile(image,bytes,{flag:'wx'});
  const config={image,opacity:options.opacity ?? previous.opacity ?? 0.84,blur:options.blur ?? previous.blur ?? 12};
  await fs.writeFile(`${target}.tmp`,JSON.stringify(config,null,2)+'\n',{encoding:'utf8'});
  await fs.rename(`${target}.tmp`,target);
  return {configured:true,settings:target};
}
export function validateTarget(target,port) {
  if (target.type!=='page' || !target.url?.startsWith('app://')) return false;
  try { const u=new URL(target.webSocketDebuggerUrl); return u.protocol==='ws:' && u.hostname==='127.0.0.1' && u.port===String(port) && !u.username && !u.password && !u.search && !u.hash && /^\/devtools\/page\/[^/]+$/.test(u.pathname); } catch {return false;}
}
export async function verifyOwner(port) {
  if (process.platform!=='win32') throw new Error('Windows live mode only. Offline tests and preview are cross-platform.');
  const {stdout}=await exec('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(root,'scripts','inspect-codex.ps1'),'-Port',String(port)],{timeout:15000,windowsHide:true});
  const owner=JSON.parse(stdout.replace(/^\uFEFF/,''));
  if(owner.verified!==true) throw new Error('CDP process identity verification failed');
  return owner;
}
export class Session {
  constructor(socket){ this.ws=socket; this.next=0; this.pending=new Map(); }
  static async connect(url){
    const ws=new WebSocket(url), session=new Session(ws);
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{ws.close();reject(new Error('CDP socket connection timed out'));},5000);
      ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
      ws.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('CDP socket connection failed'));},{once:true});
    });
    ws.addEventListener('message',event=>{
      const msg=JSON.parse(String(event.data)), pending=session.pending.get(msg.id);
      if(!pending)return;clearTimeout(pending.timer);session.pending.delete(msg.id);
      if(msg.error)pending.reject(new Error(msg.error.message));else pending.resolve(msg.result);
    });
    ws.addEventListener('close',()=>{for(const p of session.pending.values()){clearTimeout(p.timer);p.reject(new Error('CDP socket closed'));}session.pending.clear();});
    return session;
  }
  send(method,params={}){
    return new Promise((resolve,reject)=>{
      const id=++this.next;
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error(`CDP timed out: ${method}`));},7000);
      this.pending.set(id,{resolve,reject,timer});
      try{this.ws.send(JSON.stringify({id,method,params}));}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e);}
    });
  }
  async evaluate(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error('Renderer script failed: '+r.exceptionDetails.text);return r.result?.value;}
  close(){this.ws.close();}
}
