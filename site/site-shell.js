const frame=document.querySelector('#chapter-view'),audio=document.querySelector('#site-music'),gate=document.querySelector('#entry-gate'),curtain=document.querySelector('#chapter-curtain');
const pages={home:'home.html',gained:'gained.html',lost:'lost.html'},reduced=matchMedia('(prefers-reduced-motion: reduce)');
function preference(key,fallback){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,value);}catch{}}
// Language belongs to this visit: fresh opens/reloads always begin in English.
// Keep music preferences persistent, but ignore any legacy saved language.
let lang='en',enabled=preference('moon-music','on')!=='off',musicState='waiting',currentPage=null,entered=false,entering=false,navigationId=0,loadTimer,lostVisited=false,gainedUnlocked=false;
const loadError=document.createElement('section');loadError.id='chapter-error';loadError.hidden=true;loadError.setAttribute('role','status');loadError.innerHTML='<p></p><div><button type="button" data-retry>Try again</button><button type="button" data-home>Home</button></div>';document.body.append(loadError);
audio.volume=.5;
function broadcast(){document.documentElement.lang=lang;frame.title=lang==='en'?'The Moon Remembers · website content':'月照旧城 · 网站内容';document.querySelector('#entry-hint').textContent=lang==='en'?'Click the moon to begin':'点击月球，开启旅程';document.querySelector('#enter-moon').setAttribute('aria-label',lang==='en'?'Click the moon to enter':'点击月球进入网站');gate.setAttribute('aria-label',lang==='en'?'Enter The Moon Remembers':'进入月照旧城');loadError.querySelector('p').textContent=lang==='en'?'This chapter could not load. Please try again.':'这一章节暂时未能加载，请重试。';loadError.querySelector('[data-retry]').textContent=lang==='en'?'Try again':'重新加载';loadError.querySelector('[data-home]').textContent=lang==='en'?'Home':'返回首页';audio.dataset.enabled=String(enabled);audio.dataset.state=musicState;try{frame.contentWindow.dispatchEvent(new CustomEvent('moon-preferences',{detail:{lang,enabled,musicState,lostVisited,gainedUnlocked}}));}catch{}}
async function play(){if(!enabled||(!entered&&!entering))return;try{await audio.play();musicState='playing';}catch(error){musicState=error.name==='NotAllowedError'?'blocked':'error';}broadcast();}
function route(){const parts=location.hash.replace(/^#\/?/,'').split('/');return{page:pages[parts[0]]?parts[0]:'home',section:parts[0]==='choice'?'choice':decodeURIComponent(parts.slice(1).join('/'))};}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,reduced.matches?0:ms));
// Hosting may canonicalize /gained.html to /gained (or /gained/).
// The chapter marker is authoritative; normalized paths also support older cached HTML.
function loadedChapter(){try{const doc=frame.contentDocument;if(!doc?.body)return null;const marker=doc.body.dataset.moonChapter;const detailReady=marker==='lost'&&doc.body.dataset.shellReady==='true'&&doc.readyState==='interactive';if(doc.readyState!=='complete'&&!detailReady)return null;if(pages[marker])return marker;const name=frame.contentWindow.location.pathname.replace(/\/+$/,'').split('/').pop().replace(/\.html$/,'');return pages[name]?name:null;}catch{return null;}}
async function uncover(id){await pause(70);if(id===navigationId)curtain.classList.remove('covered');}
function loadFailed(id){if(id!==navigationId)return;clearTimeout(loadTimer);curtain.classList.remove('covered');loadError.hidden=false;frame.inert=true;frame.setAttribute('aria-hidden','true');broadcast();}
function watchLoad(id){clearTimeout(loadTimer);loadTimer=setTimeout(()=>{if(loadedChapter()===currentPage)completeLoad();else loadFailed(id);},15000);}
function normalizedTarget(page,section){
  if(page==='lost'&&(!section||section==='atlas'))return{page:'home',section:'explore-chapter'};
  if(page==='home'&&memorySections.includes(section))return{page:'lost',section};
  if(page==='gained')return{page:'home',section:section||'gained-chapter'};
  return{page,section:section==='atlas'?'explore-chapter':section};
}
const journeySections=['explore-chapter','gained-chapter','shore-archive','everyday-objects','memory-constellation','last-signal'];
const memorySections=['arcades','harbor','waterfront'];
function scrollToTarget(section,behavior='auto'){
  const win=frame.contentWindow;
  if(!section){win.scrollTo(0,0);return;}
  const target=win.document.getElementById(section);if(!target)return;
  if(section==='choice'){win.scrollTo({top:win.scrollY+target.getBoundingClientRect().top+Math.max(0,target.offsetHeight-win.innerHeight)*.38,behavior});win.dispatchEvent(new CustomEvent('moon-choice-ready'));}
  else target.scrollIntoView({behavior});
}

// Home fragments must never compete with the shell's completed-choice positioning.
async function restoreHomeTarget(section,id){
  scrollToTarget(section);
  const win=frame.contentWindow;
  if(section==='choice'&&typeof win.requestAnimationFrame==='function'){
    await new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
    if(id===navigationId&&loadedChapter()==='home')scrollToTarget(section);
  }
}
async function completeLoad(){if(!currentPage||loadedChapter()!==currentPage)return;const id=navigationId;clearTimeout(loadTimer);loadError.hidden=true;if(entered){frame.inert=false;frame.removeAttribute('aria-hidden');}if(currentPage==='lost')lostVisited=true;frame.dataset.page=currentPage;frame.contentDocument.documentElement.lang=lang;document.title=frame.contentDocument.title;broadcast();const target=normalizedTarget(route().page,route().section);if(currentPage==='home')await restoreHomeTarget(target.section,id);await uncover(id);}
async function navigate(page,section='',push=true){const requested={page,section};({page,section}=normalizedTarget(page,section));const legacy=requested.page!==page||requested.section!==section;if(!pages[page])return;if(page==='lost'||(page==='home'&&journeySections.includes(section))){gainedUnlocked=true;lostVisited=true;broadcast();}const id=++navigationId,hash='#/'+page+(section?'/'+encodeURIComponent(section):'');clearTimeout(loadTimer);loadError.hidden=true;if(entered){frame.inert=false;frame.removeAttribute('aria-hidden');}if(push&&location.hash!==hash)history.pushState(null,'',hash);else if(legacy&&location.hash!==hash)history.replaceState(null,'',hash);const url=pages[page]+'?v=journey24'+(page==='lost'?'#'+encodeURIComponent(section||'arcades'):'');const win=frame.contentWindow;
  if(currentPage===page&&loadedChapter()===page){
    if(page==='lost'&&win.location.hash!=='#'+section){if(entered){curtain.classList.add('covered');await pause(380);if(id!==navigationId)return;}win.history.replaceState(null,'',url);win.dispatchEvent(new HashChangeEvent('hashchange'));}
    else if(page==='home'){win.history.replaceState(null,'',url);scrollToTarget(section,section&&section!=='choice'&&entered&&!reduced.matches?'smooth':'auto');}
    broadcast();win.dispatchEvent(new CustomEvent('moon-navigation-restored'));if(section==='choice')await restoreHomeTarget(section,id);await uncover(id);return;}
  if(entered){curtain.classList.add('covered');await pause(380);if(id!==navigationId)return;}
  currentPage=page;watchLoad(id);try{win.location.replace(url);broadcast();}catch{loadFailed(id);}
}
window.MoonApp={getState:()=>({lang,enabled,musicState,entered,lostVisited,gainedUnlocked}),navigate,chapterReady(win){if(win===frame.contentWindow&&currentPage==='lost'&&loadedChapter()==='lost')completeLoad();},toggleLanguage(){lang=lang==='en'?'zh-Hans':'en';broadcast();},toggleMusic(){if(musicState==='error'){enabled=true;save('moon-music','on');audio.load();play();return;}enabled=!enabled;save('moon-music',enabled?'on':'off');if(enabled)play();else{audio.pause();musicState='off';broadcast();}},unlock(){if(entered&&enabled&&audio.paused)play();}};
audio.addEventListener('playing',()=>{musicState='playing';broadcast();});audio.addEventListener('error',()=>{musicState='error';broadcast();});
frame.addEventListener('load',completeLoad);
frame.addEventListener('error',()=>loadFailed(navigationId));
loadError.querySelector('[data-retry]').addEventListener('click',()=>{const r=route();currentPage=null;navigate(r.page,r.section,false);});
loadError.querySelector('[data-home]').addEventListener('click',()=>{currentPage=null;navigate('home');});
document.querySelector('#enter-moon').addEventListener('click',()=>{if(entered||entering)return;entering=true;play();gate.classList.add('leaving');frame.inert=false;frame.removeAttribute('aria-hidden');entered=true;broadcast();pause(720).then(()=>{gate.hidden=true;entering=false;frame.contentWindow.focus();});});
window.addEventListener('popstate',()=>{const r=route();navigate(r.page,r.section,false);});window.addEventListener('hashchange',()=>{const r=route();navigate(r.page,r.section,false);});
const initial=route();navigate(initial.page,initial.section,false);if(!enabled)musicState='off';broadcast();
