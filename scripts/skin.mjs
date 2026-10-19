import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs,storeDir,configure,loadTheme,verifyOwner,validateTarget,Session,root} from './core.mjs';
import {probeExpression,applyExpression,restoreExpression} from './renderer.mjs';

async function connect(port){
  const owner=await verifyOwner(port);
  const response=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error(`CDP HTTP ${response.status}`);
  const targets=(await response.json()).filter(t=>validateTarget(t,port));
  const sessions=[], diagnostics=[];
  try {
    for(const target of targets){
      const session=await Session.connect(target.webSocketDebuggerUrl);
      try{
        const result=await session.evaluate(probeExpression);
        diagnostics.push(result);
        if(result.recognized)sessions.push(session);else session.close();
      }catch(e){session.close();throw e;}
    }
  }catch(e){for(const s of sessions)s.close();throw e;}
  return {owner,sessions,diagnostics};
}
async function live(command,port,theme){
  const {owner,sessions,diagnostics}=await connect(port);
  try{
    if(command==='doctor')return {transport:true,owner,recognized:sessions.length,renderers:diagnostics};
    if(!sessions.length)throw new Error('RENDERER_UNRECOGNIZED: '+JSON.stringify(diagnostics)+'. No style was changed.');
    const results=[];
    for(const session of sessions){
      results.push(await session.evaluate(command==='restore'?restoreExpression:applyExpression(theme)));
    }
    return {command,results};
  }finally{for(const session of sessions)session.close();}
}
function htmlEscape(s){return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');}
async function preview(options){
  const theme=await loadTheme();
  const out=path.resolve(options.out || path.join(storeDir(),'preview.html'));
  await fs.mkdir(path.dirname(out),{recursive:true});
  const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>星海换肤 · 离线预览</title><style>html{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#090d1a url('${theme.dataUrl}') center/cover fixed;color:#eaf0ff;font:16px system-ui;min-height:100vh}section{min-height:100vh;display:grid;grid-template-columns:250px 1fr}aside{padding:32px;background:rgba(9,13,26,.90);backdrop-filter:blur(${theme.blur}px)}article{background:rgba(9,13,26,${theme.opacity});padding:6vh 8vw;display:flex;flex-direction:column;gap:24px}h1{font-size:36px;font-weight:600}small,p{line-height:1.9}small{color:#b6bdd3}textarea{margin-top:auto;min-height:110px;padding:20px;background:#11172bf0;border:1px solid #8b7cff66;border-radius:20px;color:inherit;font:inherit;width:100%;resize:vertical}button{background:#8b7cff;color:#090d1a;padding:12px 20px;border:0;border-radius:12px;cursor:pointer}@media(max-width:700px){section{grid-template-columns:1fr}aside{display:none}}</style><section><aside><h2>星海换肤</h2><p>洪荒星海</p><small>本地图片 · 星空紫<br>独立引擎 · 可恢复</small></aside><article><small>离线预览 · 并非真实 Codex 窗口</small><h1>山海初生，星河无垠。</h1><p>原始群山与紫色银河铺在工作区背后。阅读区域保持暗色，文字与输入框保持清晰。</p><small>阅读区不透明度 ${htmlEscape(String(theme.opacity))} · 模糊 ${theme.blur}px</small><textarea placeholder="在这里试试文字可读性"></textarea><div><button onclick="document.querySelector('textarea').focus()">继续创作</button></div></article></section></html>`;
  await fs.writeFile(out,html,'utf8');return {preview:out,liveVerified:false};
}
async function main(){
  const options=parseArgs(process.argv.slice(2));
  if(options.command==='help'){console.log('Starfield Skin\nconfigure [--image PATH] [--opacity 0.84] [--blur 12]\npreview [--out PATH]\ndoctor | apply | restore | watch [--port 9341]\nNode.js 22+, Windows for live commands.');return;}
  if(options.command==='configure'){console.log(JSON.stringify(await configure(options),null,2));return;}
  if(options.command==='preview'){console.log(JSON.stringify(await preview(options),null,2));return;}
  if(!['doctor','apply','restore','watch'].includes(options.command))throw new Error('Unknown command; use help.');
  const theme=['apply','watch'].includes(options.command)?await loadTheme():undefined;
  if(options.command==='watch'){
    let stop=false,last='';
    process.once('SIGINT',()=>{stop=true;});process.once('SIGTERM',()=>{stop=true;});
    console.log('Watch active. Ctrl+C stops watching; restore removes wallpaper.');
    while(!stop){
      try{const result=await live('apply',options.port,theme);const message=JSON.stringify(result);if(message!==last){console.log(message);last=message;}}
      catch(e){const message=e.message;if(message!==last){console.error(message);last=message;}}
      await new Promise(r=>setTimeout(r,2500));
    }
    return;
  }
  const result=await live(options.command,options.port,theme);
  console.log(JSON.stringify(result,null,2));
  if(options.command==='doctor' && !result.recognized)process.exitCode=2;
}
main().catch(e=>{console.error(JSON.stringify({ok:false,error:e.stderr?.trim()||e.message},null,2));process.exitCode=1;});
