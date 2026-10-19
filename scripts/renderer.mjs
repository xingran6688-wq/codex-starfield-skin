// Original renderer. Only style nodes owned by this project are changed.
export function probeRenderer() {
  const shell=document.querySelector('main.main-surface, [data-app-shell-main-surface]');
  const markers={
    shell:Boolean(shell),
    sidebar:Boolean(document.querySelector('aside.app-shell-left-panel')),
    header:Boolean(shell?.querySelector('header.app-header-tint, [data-pip-obstacle="app-shell-header"]')),
    composer:Boolean(shell?.querySelector('.composer-surface-chrome, [data-composer-layout][data-composer-surface-variant]')),
    main:Boolean(shell?.querySelector('[data-app-shell-main-content-layout], [role="main"], .thread-scroll-container')),
  };
  const style=document.getElementById('codex-starfield-style');
  return {recognized:markers.shell && (markers.sidebar||markers.header) && (markers.composer||markers.main),markers,applied:Boolean(style?.sheet),imageLoaded:Boolean(window.__codexStarfield?.imageLoaded)};
}
export function applyRenderer(theme) {
  const state=window.__codexStarfield || (window.__codexStarfield={});
  const image=new Image();
  return new Promise((resolve,reject)=>{
    image.onerror=()=>reject(new Error('Wallpaper could not be decoded'));
    image.onload=()=>{
      let style=document.getElementById('codex-starfield-style');
      if(!style){style=document.createElement('style');style.id='codex-starfield-style';document.head.append(style);}
      // A body background cannot intercept input or create a fake UI overlay.
      style.textContent=`
        html:has(#codex-starfield-style), body { background-color:#090d1a !important; }
        body { background-image:url("${theme.dataUrl}") !important; background-size:cover !important; background-position:center !important; background-attachment:fixed !important; }
        main.main-surface, [data-app-shell-main-surface] { background:rgba(9,13,26,${theme.opacity}) !important; color:#eaf0ff !important; color-scheme:dark; }
        aside.app-shell-left-panel { background:rgba(9,13,26,0.90) !important; backdrop-filter:blur(${theme.blur}px); }
        main.main-surface > [data-app-shell-main-content-layout], [data-app-shell-main-surface] > [data-app-shell-main-content-layout] { background-color:transparent !important; }
        .composer-surface-chrome, [data-composer-layout][data-composer-surface-variant] { background-color:rgba(17,23,43,0.94) !important; }
        .composer-surface-chrome textarea, [data-composer-layout][data-composer-surface-variant] textarea { background-color:transparent !important; color:#eaf0ff !important; }
      `;
      state.imageLoaded=true;
      state.style=style;
      resolve({applied:Boolean(style.sheet),imageLoaded:true});
    };
    image.src=theme.dataUrl;
  });
}
export function restoreRenderer() {
  document.getElementById('codex-starfield-style')?.remove();
  delete window.__codexStarfield;
  return {removed:!document.getElementById('codex-starfield-style')};
}
export const probeExpression=`(${probeRenderer.toString()})()`;
export const restoreExpression=`(${restoreRenderer.toString()})()`;
export function applyExpression(theme){return `(${applyRenderer.toString()})(${JSON.stringify({dataUrl:theme.dataUrl,opacity:theme.opacity,blur:theme.blur})})`;}
