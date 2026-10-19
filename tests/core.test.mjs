import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseArgs,validateTarget,validateImage,root} from '../scripts/core.mjs';

test('configuration rejects invalid ranges and missing values',()=>{
  for(const argv of [['apply','--port','0'],['configure','--opacity','NaN'],['configure','--blur','31'],['configure','--image'],['apply','--unknown','1']])assert.throws(()=>parseArgs(argv));
  assert.equal(parseArgs(['configure','--opacity','0.84']).opacity,0.84);
});
test('CDP endpoint filter rejects remote sockets and non-app targets',()=>{
  const base={type:'page',url:'app://codex/index.html',webSocketDebuggerUrl:'ws://127.0.0.1:9341/devtools/page/abc'};
  assert.equal(validateTarget(base,9341),true);
  for(const change of [{url:'https://example.com'},{type:'worker'},{webSocketDebuggerUrl:'ws://example.com:9341/devtools/page/abc'},{webSocketDebuggerUrl:'ws://127.0.0.1:9333/devtools/page/abc'},{webSocketDebuggerUrl:'ws://user:pass@127.0.0.1:9341/devtools/page/abc'},{webSocketDebuggerUrl:'ws://127.0.0.1:9341/devtools/browser/abc'}])assert.equal(validateTarget({...base,...change},9341),false);
});
test('bundled wallpaper is a valid PNG and SVG is rejected',async()=>{
  const image=await validateImage(path.join(root,'assets','honghuang-starfield.png'));
  assert.equal(image.mime,'image/png');assert.ok(image.bytes.length>100000);
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'starfield-image-'));
  try{const file=path.join(dir,'invalid.png');await fs.writeFile(file,'<svg><script>not a bitmap</script></svg>');await assert.rejects(validateImage(file));}
  finally{await fs.rm(dir,{recursive:true});}
});
