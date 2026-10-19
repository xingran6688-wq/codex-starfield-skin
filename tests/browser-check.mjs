// Optional real-browser fixture check. Never connects to a desktop Codex window.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {root,validateImage} from '../scripts/core.mjs';
import {probeExpression,applyExpression,restoreExpression} from '../scripts/renderer.mjs';
const modulePath=process.env.STARFIELD_PLAYWRIGHT_MODULE;
const {chromium}=modulePath ? await import(pathToFileURL(modulePath).href) : await import('playwright');
const browser=await chromium.launch({headless:true,...(process.env.STARFIELD_BROWSER_CHANNEL?{channel:process.env.STARFIELD_BROWSER_CHANNEL}:{})});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;color:#eaf0ff;font:16px system-ui}main{min-height:100vh;padding:40px;box-sizing:border-box;background:#111}header{padding:20px}textarea{display:block;width:75%;height:100px;margin-top:200px;color:white;padding:20px}button{padding:14px;background:#8b7cff;border:0;border-radius:8px}</style></head><body><main data-app-shell-main-surface><header data-pip-obstacle="app-shell-header">星海换肤 · 新版结构独立测试页</header><section data-app-shell-main-content-layout><h1>洪荒星海</h1><p>测试背景、文字可读性、按钮交互和恢复。</p><div data-composer-layout="test" data-composer-surface-variant="test"><textarea aria-label="message"></textarea><button onclick="this.textContent='已点击'">测试按钮</button></div></section></main></body></html>`);
  assert.equal((await page.evaluate(probeExpression)).recognized,true);
  const {bytes,mime}=await validateImage(path.join(root,'assets','honghuang-starfield.png'));
  const theme={dataUrl:`data:${mime};base64,${bytes.toString('base64')}`,opacity:0.72,blur:12};
  await page.evaluate(applyExpression(theme));
  assert.equal((await page.evaluate(probeExpression)).imageLoaded,true);
  await page.getByRole('textbox').fill('星空之下继续创作');
  await page.getByRole('button').click();
  assert.equal(await page.getByRole('button').textContent(),'已点击');
  await page.evaluate(applyExpression(theme));
  assert.equal(await page.locator('#codex-starfield-style').count(),1);
  assert.ok((await page.evaluate(()=>getComputedStyle(document.body).backgroundImage)).startsWith('url("data:image/png'));
  await fs.mkdir(path.join(root,'dist'),{recursive:true});
  await page.screenshot({path:path.join(root,'dist','fixture-preview.png')});
  await page.evaluate(restoreExpression);
  assert.equal(await page.locator('#codex-starfield-style').count(),0);
  assert.equal(await page.getByRole('textbox').inputValue(),'星空之下继续创作');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('main')).backgroundColor),'rgb(17, 17, 17)');
  await page.setContent('<main><p>An unrelated page</p></main>');
  assert.equal((await page.evaluate(probeExpression)).recognized,false);
  console.log('PASS: real browser image decode, modern hidden-sidebar shell, textarea, button, idempotence, native style restoration, unrelated page rejection.');
}finally{await browser.close();}
