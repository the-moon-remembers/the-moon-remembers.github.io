(() => {
const page=location.pathname.includes('gained')?'gained':location.pathname.includes('lost')?'lost':'home';
if(window===window.top){location.replace('./index.html#/'+page+(location.hash?'/'+encodeURIComponent(location.hash.slice(1)):''));return;}
let app;try{app=parent.MoonApp;}catch{}if(!app)return;
window.MoonNavigation={go:(p,s='')=>app.navigate(p,s)};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#audio-toggle,[data-music-toggle]'))app.unlock();},{capture:true});document.addEventListener('keydown',e=>{if(!e.target.closest('#audio-toggle,[data-music-toggle]'))app.unlock();},{capture:true});
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.target||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;const match=url.pathname.match(/(?:index|home|gained|lost)(?:\.html)?$/);if(a.getAttribute('href').startsWith('#')){e.preventDefault();app.navigate(page,decodeURIComponent(url.hash.slice(1)));}else if(match){e.preventDefault();app.navigate(match[0].startsWith('gained')?'gained':match[0].startsWith('lost')?'lost':'home',decodeURIComponent(url.hash.slice(1)));}},true);
document.addEventListener('DOMContentLoaded',()=>{
const header=document.querySelector('.chapter-header');if(header){const controls=document.createElement('div');controls.className='chapter-preferences';controls.innerHTML='<button type="button" data-language-toggle aria-label="Switch language">中文</button><button type="button" data-music-toggle aria-label="Turn music off">♫</button>';header.append(controls);}
const languages=[...document.querySelectorAll('#language-toggle,[data-language-toggle]')],musics=[...document.querySelectorAll('#audio-toggle,[data-music-toggle]')];
languages.forEach(language=>language.addEventListener('click',()=>app.toggleLanguage()));musics.forEach(music=>{music.disabled=false;music.addEventListener('click',()=>app.toggleMusic());});
function sync(){const state=app.getState();document.documentElement.lang=state.lang;window.MoonI18n?.apply(state.lang);languages.forEach(language=>{const label=language.querySelector('span:last-child');(label||language).textContent=state.lang==='en'?'中文':'English';language.setAttribute('aria-label',state.lang==='en'?'Switch to Chinese':'切换至英文');});
musics.forEach(music=>{music.setAttribute('aria-pressed',String(state.enabled));music.dataset.state=state.musicState;music.classList.toggle('music-off',!state.enabled);const label=state.musicState==='error'?(state.lang==='en'?'Music could not load. Click to retry.':'音乐加载失败，点击重试。'):state.enabled?(state.lang==='en'?'Turn music off':'关闭音乐'):(state.lang==='en'?'Turn music on':'开启音乐');music.setAttribute('aria-label',label);music.title=state.musicState==='blocked'?(state.lang==='en'?'Music is on; playback starts with your first interaction.':'音乐默认开启，首次互动后开始播放。'):label;});
try{parent.document.title=document.title;}catch{}}
window.addEventListener('moon-preferences',sync);window.addEventListener('moon-i18n-ready',sync);sync();
});
})();
