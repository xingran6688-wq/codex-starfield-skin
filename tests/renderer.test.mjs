import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {probeExpression,applyExpression,restoreExpression} from '../scripts/renderer.mjs';

function fixture(generation='modern'){
  const styles=new Map();
  const matches=(selector)=>generation==='modern' ? selector.includes('[data-app-shell-main-surface]') : selector.includes('main.main-surface');
  const shell={querySelector(selector){
    if(generation==='modern')return selector.includes('[data-pip-obstacle')||selector.includes('[data-composer-layout]')||selector.includes('[data-app-shell-main-content-layout]')?{}:null;
    return selector.includes('.composer-surface-chrome')?{}:null;
  }};
  const document={
    querySelector(selector){if(generation==='unknown')return null;if(matches(selector))return shell;return generation==='legacy' && selector==='aside.app-shell-left-panel'?{}:null;},
    getElementById(id){return styles.get(id)||null;},
    createElement(){return {sheet:{},remove(){styles.delete(this.id);}};},
    head:{append(node){styles.set(node.id,node);}},
  };
  class Image {set src(value){queueMicrotask(()=>{if(value.startsWith('data:image/'))this.onload();else this.onerror();});}}
  const context=vm.createContext({document,window:{},Image});
  return {context,styles,run:expression=>vm.runInContext(expression,context)};
}
test('modern shell with hidden sidebar and legacy shell are recognized',()=>{
  for(const gen of ['modern','legacy'])assert.equal(fixture(gen).run(probeExpression).recognized,true);
  assert.equal(fixture('unknown').run(probeExpression).recognized,false);
});
test('application is idempotent and restore deletes only its own style',async()=>{
  const page=fixture();page.styles.set('other-theme',{id:'other-theme'});
  const expression=applyExpression({dataUrl:'data:image/png;base64,AA==',opacity:0.84,blur:12});
  await page.run(expression);await page.run(expression);
  assert.equal(page.styles.size,2);
  assert.equal(page.run(probeExpression).imageLoaded,true);
  assert.equal(page.run(restoreExpression).removed,true);
  assert.equal(page.styles.size,1);assert.ok(page.styles.has('other-theme'));
});
test('failed image decode leaves no new style',async()=>{
  const page=fixture();await assert.rejects(page.run(applyExpression({dataUrl:'bad',opacity:0.8,blur:12})));
  assert.equal(page.styles.size,0);
});
