const intro = document.querySelector(".intro-section");
const history = document.querySelector(".history-section");
const choice = document.querySelector(".choice-section");
const introStage = intro.querySelector(".artboard");
const historyStage = history.querySelector(".artboard");
const choiceStage = choice.querySelector(".artboard");
const introLine = intro.querySelector(".intro-line");
const leftEnglish = choice.querySelector(".choice-english-left");
const rightEnglish = choice.querySelector(".choice-english-right");
let phrase = "The Moon Remains.\nThe City Gone.";
let leftQuestion = "WHAT WE\nHAVE\nGAINED\n?";
let rightQuestion = "WHAT WE\nHAVE\nLOST\n?";
const historyChinese=[
"1924\n厦门第一条现代市政道路，全长700余米。骑楼建筑奠定了老城的街区风貌。",
"1930\n厦禾路竣工，厦门第一条城乡公路，连接厦门与禾山。",
"1949.10\n厦门解放。经过三天三夜的激战，人民解放军歼灭守军二万八千余人。",
"1955.10\n历经两年零三个月，高集海堤建成，厦门岛终于与大陆相连。",
"1958\n工业区迅速扩张。竹架、草顶构成简易厂房，生产却蓬勃发展。",
"1960\n工业产值达三亿四千九百万元，为1950年的十二倍多，厦门的工业基础逐渐形成。",
"1970.7\n一千七百米长的海堤，将天然港湾围成一点七平方公里的内湖。延续数百年的“筼筜渔火”就此消逝。",
"1980\n国务院批准在湖里设立二点五平方公里的经济特区，厦门成为中国最早的四个经济特区之一。",
"1984\n经济特区由二点五平方公里扩大至一百三十一平方公里，覆盖全岛。",
"2002\n跨岛发展战略启动。城市向岛外拓展，岛外人口与建成区面积迅速增长。",
"2017\n鼓浪屿列入联合国教科文组织世界遗产名录，以“历史国际社区”获得认定。"
];

const events = [
  { year:"1924", date:"1924", text:"Xiamen’s first modern municipal road. Its arcade buildings set the architectural pattern for the old city.", image:"photo-1924.png", x:163,y:147,size:243,tx:303,ty:32,tw:231 },
  { year:"1930", date:"1930", text:"Xiahe Road was completed: Xiamen’s first urban–rural road, connecting Xiamen with Heshan.", image:"photo-1930.png", x:530,y:44,size:300,tx:830,ty:301,tw:231 },
  { year:"1949", date:"1949.10", text:"The Liberation of Xiamen. After three days and three nights of fierce fighting, the People’s Liberation Army wiped out more than 28,000 defending troops.", image:"photo-1949.png", x:912,y:143,size:128,tx:1090,ty:68,tw:177 },
  { year:"1955", date:"1955.10", text:"Completed after 2 years and 3 months. Xiamen Island was finally connected to the mainland.", image:"photo-1955.png", x:1240,y:202,size:195,tx:1472,ty:265,tw:177 },
  { year:"1958", date:"1958", text:"The industrial zone expanded rapidly. Workshops were makeshift — bamboo frames and straw roofing — yet production surged.", image:"photo-1958.png", x:1615,y:51,size:257,tx:1907,ty:45,tw:191 },
  { year:"1960", date:"1960", text:"Industrial output reached 349 million yuan, over 12 times the 1950 level. Xiamen’s industrial base took shape.", image:"photo-1960.png", x:2010,y:170,size:227,tx:2237,ty:65,tw:177 },
  { year:"1970", date:"1970.7", text:"A 1,700m dike turned the natural harbor into a 1.7 km² inland lake. The centuries-old “Yundang Fishing Fires” vanished forever.", image:"photo-1970.png", x:2409,y:93,size:301,tx:2762,ty:263,tw:199 },
  { year:"1980", date:"1980", text:"The State Council approved a 2.5 km² special economic zone in Huli. Xiamen became one of China’s first four SEZs.", image:"photo-1980.png", x:2787,y:73,size:123,tx:2984,ty:78,tw:178 },
  { year:"1984", date:"1984", text:"The SEZ expanded from 2.5 km² to 131 km², covering the entire island.", image:"photo-1984.png", x:3013,y:234,size:158,tx:3302,ty:296,tw:201 },
  { year:"2002", date:"2002", text:"The “cross-island development” strategy was launched. Xiamen expanded beyond the island, with rapid growth in outer-district population and built-up area.", image:"photo-2002.png", x:3219,y:38,size:205,tx:3447,ty:105,tw:201 },
  { year:"2017", date:"2017", text:"Gulangyu was inscribed as a UNESCO World Heritage Site, recognized as an Historical International Settlement.", image:"photo-2017.png", x:3679,y:148,size:241,tx:3901,ty:48,tw:243 }
];

// Timeline requests share two slots. A portrait visit needs photographs only;
// the original desktop outlines are prepared when that composition is visible.
function createTimelineLoader({count,isPortrait,load,commit,onError=()=>{}}){
  const records=new Map(),queued=new Set(),running=new Map();
  let enabled=false,current=0,portrait=isPortrait(),scheduled=false;
  function resetPromise(item){
    item.promise=new Promise((resolve,reject)=>{item.resolve=resolve;item.reject=reject;});
    item.promise.catch(()=>{});item.settled=false;
  }
  function record(kind,index){
    const key=`${kind}:${index}`;
    if(!records.has(key)){
      const item={key,kind,index,status:'idle',value:null};
      resetPromise(item);records.set(key,item);
    }
    return records.get(key);
  }
  function priority(item){return Math.abs(item.index-current)*4+(item.index<current?1:0)+(item.kind==='outline'?1:0);}
  function schedule(){if(scheduled)return;scheduled=true;Promise.resolve().then(()=>{scheduled=false;drain();});}
  function request(kind,index){
    const item=record(kind,index);
    // A failed portrait photo is retryable on a revisit/tap, not a permanently
    // rejected cache entry that keeps the last successful year on screen.
    if(portrait&&kind==='photo'&&item.status==='error')item.status='idle';
    if(item.status==='idle'){if(item.settled)resetPromise(item);item.status='queued';queued.add(item);schedule();}
    else if(item.status==='ready'&&!portrait)commit(kind,index,item.value);
    return item.promise;
  }
  function drain(){
    if(!enabled)return;
    while(running.size<2&&queued.size){
      const item=[...queued].sort((a,b)=>priority(a)-priority(b))[0];queued.delete(item);
      const controller=typeof AbortController==='function'?new AbortController():null;
      item.status='loading';running.set(item,controller);
      Promise.resolve().then(()=>load(item.kind,item.index,controller?.signal)).then(value=>{
        item.status='ready';item.value=value;item.settled=true;item.resolve(value);
        if(!portrait)commit(item.kind,item.index,value);
      },error=>{
        item.settled=true;
        if(error?.name==='AbortError'){item.status='idle';item.reject(error);return;}
        item.status='error';item.reject(error);onError(item.kind,item.index,error);
      }).finally(()=>{
        running.delete(item);
        // A rapid second rotation can make a cancelled outline relevant again.
        if(item.status==='idle'&&(!portrait||(item.kind==='photo'&&Math.abs(item.index-current)<=1)))request(item.kind,item.index);
        schedule();
      });
    }
  }
  function refresh(){
    portrait=isPortrait();if(!enabled)return;
    if(portrait){
      for(const item of queued)if(item.kind==='outline'||Math.abs(item.index-current)>1){queued.delete(item);item.status='idle';}
      for(const [item,controller] of running)if(item.kind==='outline'||Math.abs(item.index-current)>1)controller?.abort();
    }
    const indices=portrait?[current,current+1,current-1].filter(index=>index>=0&&index<count):Array.from({length:count},(_,index)=>index);
    for(const index of indices){request('photo',index);if(!portrait)request('outline',index);}
    schedule();
  }
  return{
    focus(index){const next=Math.min(count-1,Math.max(0,index));if(enabled&&next===current&&portrait===isPortrait())return;current=next;enabled=true;refresh();},
    photo(index){if(!enabled){current=index;enabled=true;refresh();}return request('photo',index);},
    refresh,
    getState:()=>({enabled,current,portrait,active:[...running.keys()].map(item=>item.key),queued:[...queued].map(item=>item.key),ready:[...records.values()].filter(item=>item.status==='ready').map(item=>item.key)})
  };
}

function loadTimelinePhoto(src,{signal,priority='low',timeoutMs=0}={}){
  return new Promise((resolve,reject)=>{
    const image=new Image();let settled=false,timer;
    image.decoding='async';image.fetchPriority=priority;
    const clean=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);image.onload=image.onerror=null;};
    const fail=error=>{if(settled)return;settled=true;clean();image.removeAttribute('src');reject(error);};
    const abort=()=>fail(Object.assign(new Error('Photo request superseded'),{name:'AbortError'}));
    image.onload=()=>Promise.resolve(image.decode?.()).then(()=>{if(settled)return;settled=true;clean();resolve(image);},fail);
    image.onerror=()=>fail(new Error('Photograph could not load'));
    if(signal?.aborted){abort();return;}
    signal?.addEventListener('abort',abort,{once:true});
    if(timeoutMs)timer=setTimeout(()=>fail(Object.assign(new Error('Photograph is taking too long'),{name:'TimeoutError'})),timeoutMs);
    image.src=src;
  });
}

const yearArc = document.querySelector("#year-arc");
const track = document.querySelector("#timeline-track");
const yearNodes = [];
const captionStates = [];
const timelinePhotos=[];
const timelineDesign = window.TIMELINE_DESIGN;
const orbitGeometry = {cx:555, cy:-925, radius:1081, sweep:.48};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const portraitLayout=matchMedia('(orientation: portrait)');
let portraitBoardHeight=625;
let previousPortrait=portraitLayout.matches,viewportAnchor=null;
// A separately composed portrait timeline; never move the Figma desktop nodes.
const portraitHistory=document.createElement('div');portraitHistory.className='portrait-history';
portraitHistory.innerHTML='<div class="portrait-history-cap" aria-hidden="true"></div><p class="portrait-history-label">XIAMEN · A MEMORY ATLAS</p><div class="portrait-years" aria-label="Timeline years"></div><button type="button" class="portrait-history-photo"><div class="timeline-photo-surface"><img class="timeline-photo-image" alt=""><img class="timeline-photo-image timeline-photo-cyanotype" alt="" aria-hidden="true"><span class="timeline-photo-atmosphere" aria-hidden="true"></span></div><span class="portrait-photo-status" role="status" aria-live="polite" hidden></span></button><div class="portrait-history-caption"><h2></h2><p></p></div>';
history.querySelector('.sticky-scene').append(portraitHistory);
const portraitPhoto=portraitHistory.querySelector('button'),portraitCopy=portraitHistory.querySelector('.portrait-history-caption p');
let portraitIndex=-1,portraitTimer,portraitTyping,portraitLanguage='',portraitRequest=0;
function showPortraitEvent(index,force=false){
  const lang=document.documentElement.lang;if(!force&&portraitIndex===index&&portraitLanguage===lang)return;
  const first=portraitIndex<0,requestId=++portraitRequest;portraitIndex=index;portraitLanguage=lang;clearTimeout(portraitTimer);cancelAnimationFrame(portraitTyping);portraitHistory.classList.add('is-changing');
  const event=events[index],zh=lang==='zh-Hans',status=portraitPhoto.querySelector('.portrait-photo-status');
  const photoState=state=>{
    portraitPhoto.dataset.photoState=state;portraitPhoto.dataset.photoYear=state==='ready'?event.year:'';
    portraitPhoto.setAttribute('aria-busy',String(state==='loading'));
    status.hidden=state==='ready';status.textContent=state==='error'?(zh?'照片暂未加载，点击重试。':'Photograph unavailable. Tap to retry.'):(zh?'正在加载 '+event.year+' 年的照片……':'Loading '+event.year+' photograph…');
  };
  // Never label a previous photograph as the newly selected year, even while
  // the current original is downloading, fails, or the visitor swipes quickly.
  portraitPhoto.querySelectorAll('img').forEach(img=>img.removeAttribute('src'));
  portraitPhoto.classList.remove('memory-active','memory-playing');photoState('loading');
  portraitPhoto.setAttribute('aria-label',zh?'厦门，'+event.year:`Xiamen, ${event.year}`);
  timelineLoader.focus(index);
  const fill=()=>{
    const event=events[index];portraitHistory.querySelector('h2').textContent=event.date;
    timelineLoader.photo(index).then(image=>{
      if(requestId!==portraitRequest)return;
      // Both image layers are committed only for this exact selected year.
      portraitPhoto.querySelectorAll('img').forEach(img=>{img.src=image.src;});
      portraitPhoto.dataset.kind=event.year==='1970'?'aerial':'street';photoState('ready');
    }).catch(error=>{if(requestId!==portraitRequest)return;if(error?.name==='AbortError'){showPortraitEvent(index,true);return;}photoState('error');});
    portraitHistory.querySelector('.portrait-years').replaceChildren(...events.slice(Math.max(0,Math.min(index-2,events.length-5)),Math.max(0,Math.min(index-2,events.length-5))+5).map(e=>{const node=document.createElement('span');node.textContent=e.year;if(e===event)node.setAttribute('aria-current','date');return node;}));
    const text=lang==='zh-Hans'?historyChinese[index].split('\n').slice(1).join('\n'):event.text;
    portraitCopy.setAttribute('aria-label',text);portraitCopy.textContent=reducedMotion?text:'';portraitHistory.classList.remove('is-changing');
    if(!reducedMotion){const start=performance.now();const type=now=>{portraitCopy.textContent=text.slice(0,Math.min(text.length,Math.floor((now-start)/12)));if(portraitCopy.textContent.length<text.length)portraitTyping=requestAnimationFrame(type);};portraitTyping=requestAnimationFrame(type);}
  };
  if(first||reducedMotion)fill();else portraitTimer=setTimeout(fill,160);
}
function pulsePortraitMemory(){if(portraitPhoto.dataset.photoState==='error'){showPortraitEvent(portraitIndex,true);return;}if(portraitPhoto.dataset.photoState!=='ready')return;portraitPhoto.classList.add('memory-active','memory-playing');clearTimeout(portraitPhoto.memoryTimer);portraitPhoto.memoryTimer=setTimeout(()=>portraitPhoto.classList.remove('memory-active','memory-playing'),2800);}
portraitPhoto.addEventListener('click',pulsePortraitMemory);portraitPhoto.addEventListener('pointerenter',pulsePortraitMemory);portraitPhoto.addEventListener('pointerleave',()=>portraitPhoto.classList.remove('memory-active'));portraitPhoto.addEventListener('blur',()=>portraitPhoto.classList.remove('memory-active'));
const linkLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
linkLayer.classList.add("timeline-link");
linkLayer.setAttribute("viewBox", "0 0 4220 407");
linkLayer.setAttribute("width", "4220");
linkLayer.setAttribute("height", "407");
track.append(linkLayer);

timelineDesign.connectors.forEach((connector, index) => {
  const d = connector.points.map((point, i) => `${i ? "L" : "M"} ${point[0]} ${point[1]}`).join(" ");
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
  base.setAttribute("d", d);
  base.classList.add("connector-base");
  const light = base.cloneNode();
  light.classList.remove("connector-base");
  light.classList.add("connector-flow");
  light.setAttribute("pathLength", "100");
  light.style.animationDelay = `${-index * .28}s`;
  group.dataset.figmaNode = connector.figmaNodeId;
  group.append(base, light);
  linkLayer.append(group);
});

events.forEach((event, index) => {
  const t = index / (events.length - 1);
  const angle = -orbitGeometry.sweep + 2 * orbitGeometry.sweep * t;
  const labelRadius = orbitGeometry.radius + 55;
  const year = document.createElement("span");
  year.className = "year-label";
  year.textContent = event.year;
  const markerX = Math.sin(angle) * 1075;
  year.style.left = `${orbitGeometry.cx + markerX}px`;
  year.style.top = `${orbitGeometry.cy + Math.sqrt(labelRadius * labelRadius - markerX * markerX)}px`;
  year.style.setProperty("--label-angle", `${-angle * 180 / Math.PI}deg`);
  yearArc.append(year);
  yearNodes.push(year);

  const photo = document.createElement("button");
  photo.className = "timeline-photo";
  photo.type = "button";
  photo.setAttribute('aria-label',`Xiamen, ${event.year}`);
  photo.dataset.kind=event.year==='1970'?'aerial':'street';
  const photograph=document.createElement('img');photograph.className='timeline-photo-image';photograph.alt='';photograph.decoding='async';
  const surface=document.createElement('div');surface.className='timeline-photo-surface';
  const cyanotype=photograph.cloneNode();cyanotype.className='timeline-photo-image timeline-photo-cyanotype';cyanotype.setAttribute('aria-hidden','true');
  const atmosphere=document.createElement('span');atmosphere.className='timeline-photo-atmosphere';atmosphere.setAttribute('aria-hidden','true');
  surface.append(photograph,cyanotype,atmosphere);photo.append(surface);
  timelinePhotos.push([photograph,cyanotype]);
  let hoverTimer;
  let panAnimation;
  const reducedMemoryMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function settleMemory(){
    photo.classList.remove('memory-active');
    const transform=getComputedStyle(surface).transform;panAnimation?.cancel();
    if(!reducedMemoryMotion.matches)panAnimation=surface.animate([{transform},{transform:'scale(1)'}],{duration:650,easing:'ease-out',fill:'forwards'});
  }
  function animateMemory(){
    clearTimeout(hoverTimer);photo.classList.add('memory-active');
    photo.classList.remove('memory-playing');void photo.offsetWidth;photo.classList.add('memory-playing');
    const transform=getComputedStyle(surface).transform;panAnimation?.cancel();
    if(!reducedMemoryMotion.matches)panAnimation=surface.animate([
      {transform,offset:0},{transform:'scale(1.055) translate(-1%,-.5%)',offset:.35},
      {transform:'scale(1.065) translate(1%,.7%)',offset:.75},{transform:'scale(1.04)',offset:1}
    ],{duration:2800,easing:'ease-in-out',fill:'forwards'});
    hoverTimer=setTimeout(()=>{photo.classList.remove('memory-playing');if(!photo.matches(':hover,:focus-visible'))settleMemory();},2800);
  }
  photo.addEventListener('pointerenter',animateMemory);photo.addEventListener('focus',animateMemory);photo.addEventListener('click',animateMemory);
  photo.addEventListener('pointerleave',settleMemory);
  photo.addEventListener('blur',()=>{if(!photo.matches(':hover'))settleMemory();});
  Object.assign(photo.style, {left:`${event.x}px`,top:`${event.y}px`,width:`${event.size}px`,height:`${event.size}px`});
  track.append(photo);

  const caption = document.createElement("div");
  caption.className = "timeline-caption";
  const design = timelineDesign.captions.find(c => c.year === event.year);
  caption.setAttribute("role", "img");
  caption.setAttribute("aria-label", design.text);
  caption.dataset.year = event.year;
  Object.assign(caption.style, {
    left:`${design.x}px`, top:`${design.y}px`,
    width:`${design.width * design.scale}px`, height:`${design.height * design.scale}px`
  });
  track.append(caption);
  const cn=document.createElement('p');cn.className='caption-cn';historyChinese[index].split('').forEach(char=>{const span=document.createElement('span');span.textContent=char;span.style.opacity='0';cn.append(span);});caption.append(cn);
  const state = {element:caption,design,glyphs:[],englishGlyphs:[],chineseGlyphs:[...cn.children],started:null,count:-1,index};
  if(document.documentElement.lang==='zh-Hans')state.glyphs=state.chineseGlyphs;
  captionStates.push(state);
});

const timelineLoader=createTimelineLoader({
  count:events.length,isPortrait:()=>portraitLayout.matches,
  load(kind,index,signal){
    const event=events[index],design=captionStates[index].design;
    if(kind==='outline')return fetch(`./assets/${design.asset}${event.year==='1930'?'?v=journey24':''}`,{signal}).then(response=>{if(!response.ok)throw new Error(design.asset);return response.text();});
    return loadTimelinePhoto(`./assets/${event.image}`,{signal,priority:index===Math.round(range(progress(history),.05,.83)*(events.length-1))?'high':'low',timeoutMs:portraitLayout.matches?25000:0});
  },
  commit(kind,index,value){
    if(portraitLayout.matches)return;
    if(kind==='photo'){for(const image of timelinePhotos[index])if(image.getAttribute('src')!==value.src)image.src=value.src;return;}
    const state=captionStates[index],{element:caption,design}=state;
    if(state.outlineReady)return;
    state.outlineReady=true;
    try{
      const text=value;
      const svg = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
      svg.setAttribute("aria-hidden", "true");
      svg.style.transform = `scale(${design.scale})`;
      state.glyphs = Array.from(svg.querySelectorAll("[data-glyph]"));
      state.glyphs.forEach(glyph => { glyph.style.opacity = "0"; });
      caption.append(document.importNode(svg, true));
      state.englishGlyphs = Array.from(caption.querySelectorAll("[data-glyph]"));
      state.glyphs=document.documentElement.lang==='zh-Hans'?state.chineseGlyphs:state.englishGlyphs;
      state.count=-1;invalidateStory();
    }catch(error){console.error('Unable to prepare timeline outlines',error);caption.textContent=design.text;}
  },
  onError(kind,index,error){if(kind==='outline'){console.error('Unable to load timeline outlines',error);if(!portraitLayout.matches)captionStates[index].element.textContent=captionStates[index].design.text;}}
});
let timelineNear=false,timelineFocusFrame=0;
function focusVisibleTimeline(){
  timelineFocusFrame=0;if(!timelineNear)return;
  timelineLoader.focus(Math.round(range(progress(history),.05,.83)*(events.length-1)));
}
if(typeof IntersectionObserver==='function'){
  const timelineObserver=new IntersectionObserver(entries=>{timelineNear=entries[0].isIntersecting;if(timelineNear)focusVisibleTimeline();},{rootMargin:'1000px 0px'});timelineObserver.observe(history);
}
else{timelineNear=true;focusVisibleTimeline();}
window.addEventListener('scroll',()=>{if(timelineNear&&!timelineFocusFrame)timelineFocusFrame=requestAnimationFrame(focusVisibleTimeline);},{passive:true});
portraitLayout.addEventListener?.('change',()=>{timelineLoader.refresh();if(timelineNear)focusVisibleTimeline();});

function clamp(value, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }
function range(value, start, end) { return clamp((value - start) / (end - start)); }
function mix(a, b, t) { return a + (b - a) * t; }
function progress(section) {
  const span = section.offsetHeight - window.innerHeight;
  return clamp(-section.getBoundingClientRect().top / Math.max(span, 1));
}
function setScale() {
  const portrait=portraitLayout.matches;
  portraitBoardHeight=portrait?window.innerHeight*1110/window.innerWidth:625;
  document.documentElement.style.setProperty('--portrait-board-height',`${portraitBoardHeight}px`);
  document.documentElement.style.setProperty("--stage-scale", String(portrait?window.innerWidth/1110:Math.min(window.innerWidth / 1110, window.innerHeight / 625)));
  // Rotating a tablet must not strand the visitor several chapters away.
  if(portrait!==previousPortrait&&viewportAnchor){
    const {section,fraction,pinned}=viewportAnchor;
    if(!section.hidden){const top=scrollY+section.getBoundingClientRect().top;window.scrollTo({top:top+fraction*Math.max(1,section.offsetHeight-(pinned?innerHeight:0)),behavior:'instant'});}
  }
  previousPortrait=portrait;
}
const stageValues = new WeakMap();
function write(stage, values) {
  let previous=stageValues.get(stage);
  if(!previous){previous=new Map();stageValues.set(stage,previous);}
  for(const [name,value] of Object.entries(values)){
    const text=String(value);
    if(previous.get(name)!==text){stage.style.setProperty(name,text);previous.set(name,text);}
  }
}

function updateIntro(p) {
  const arrival = range(p, 0, .61);
  const move = range(arrival, .2, .82);
  const typeIn = range(p, .48, .59);
  const typeOut = range(p, .75, .86);
  const exit = range(p, .75, 1);
  write(introStage, {
    "--intro-dark": range(p, .14, .55).toFixed(3),
    "--intro-solid-opacity": range(p, .86, .98).toFixed(3),
    "--title-up": `${-(portraitLayout.matches?portraitBoardHeight*.48:540) * range(p, .13, .45)}px`,
    "--title-opacity": (1 - range(p, .25, .46)).toFixed(3),
    "--moon-up": `${-(portraitLayout.matches?portraitBoardHeight*.42:366) * move - (portraitLayout.matches?portraitBoardHeight*.75:730) * range(p, .79, .98)}px`,
    "--moon-scale": (1 - (portraitLayout.matches?.57:.452) * move - .15 * range(p, .79, .98)).toFixed(4),
    "--poem-opacity": (1 - range(p, .012, .07)).toFixed(3),
    "--utility-opacity": (1 - range(p, .07, .13)).toFixed(3),
    "--contour-opacity": (1 - range(p, .82, .98)).toFixed(3),
    "--intro-line-up": `${-150 * exit}px`,
    "--intro-line-opacity": (1 - range(p, .79, .89)).toFixed(3)
  });
  const count = Math.round(phrase.length * typeIn * (1 - typeOut));
  const text=phrase.slice(0,count);
  if(introLine.textContent!==text)introLine.textContent=text;
  shaderState.fade = range(p, .37, .78);
}

let historyPosition = 0;
let previousHistoryTime = null;
let previousHistoryActive = -1;
const timelineAnchors = events.map(e => (e.x + e.size / 2 + e.tx + e.tw / 2) / 2);
function updateHistory(p, now) {
  const timeline = range(p, .05, .83);
  const exit = range(p, .86, 1);
  const exactIndex = timeline * (events.length - 1);
  const active = Math.round(exactIndex);
  if(portraitLayout.matches){
    portraitHistory.style.setProperty('--portrait-history-opacity',Math.min(range(p,0,.035),1-range(p,.88,1)).toFixed(3));
    portraitHistory.style.setProperty('--portrait-history-up',`${-innerHeight*.25*exit}px`);
    portraitHistory.style.setProperty('--portrait-history-pointer',p>.02&&p<.96?'auto':'none');
    showPortraitEvent(active);
  }
  const elapsed = previousHistoryTime === null ? 16 : Math.min(now - previousHistoryTime, 100);
  previousHistoryTime = now;
  historyPosition = reducedMotion ? active : mix(historyPosition, active, 1 - Math.exp(-elapsed / 150));
  const low = Math.floor(historyPosition);
  const high = Math.min(events.length - 1, low + 1);
  const local = historyPosition - low;
  const anchor = mix(timelineAnchors[low], timelineAnchors[high], local);
  const trackX = 555 - anchor;
  const enterY = -220 * (1 - range(p, 0, .045)) - 470 * exit;

  write(historyStage, {
    "--orbit-enter": `${enterY}px`,
    "--orbit-rotation": `${-2 * orbitGeometry.sweep * historyPosition / (events.length - 1) * 180 / Math.PI}deg`,
    "--orbit-opacity": Math.min(range(p, 0, .035), 1 - range(p, .88, 1)).toFixed(3),
    "--arc-opacity": Math.min(range(p, .01, .045), 1 - range(p, .88, 1)).toFixed(3),
    "--arc-up": `${enterY}px`,
    "--track-x": `${trackX}px`,
    "--timeline-opacity": Math.min(range(p, .02, .05), 1 - range(p, .85, 1)).toFixed(3),
    "--timeline-up": `${-270 * exit}px`,
    "--marker-opacity": Math.min(range(p, .015, .045), 1 - range(p, .88, 1)).toFixed(3)
  });
  if(active!==previousHistoryActive){
    yearNodes.forEach((node,index)=>{
      node.style.setProperty("--active-scale",index===active?"1.34":"1");
      node.style.setProperty("--year-opacity",index===active?"1":".5");
      node.style.zIndex=index===active?"1":"0";
    });
    previousHistoryActive=active;
  }
  captionStates.forEach(state => {
    const x = state.design.x + trackX;
    const width = state.design.width * state.design.scale;
    const visible = p > .02 && p < .96 && x < 1080 && x + width > 30;
    if (visible && state.started === null && state.glyphs.length) state.started = now;
    if(p<.015){
      // Reset once, not once per glyph on every frame before this chapter.
      if(state.count!==0)state.glyphs.forEach(glyph=>{glyph.style.opacity="0";});
      state.started=null;state.count=0;
    }
    if (state.started === null) return;
    const count = reducedMotion ? state.glyphs.length : Math.min(state.glyphs.length, Math.floor((now - state.started) / 15));
    if (count !== state.count) {
      if(state.count<0)state.glyphs.forEach((glyph,index)=>{glyph.style.opacity=index<count?"1":"0";});
      else for(let i=Math.min(state.count,count);i<Math.max(state.count,count);i++)state.glyphs[i].style.opacity=i<count?"1":"0";
      state.count = count;
    }
  });
}

let choiceStart = null;
function updateChoice(p, now) {
  const enter = range(p, .02, .24);
  write(choiceStage, {
    "--left-sphere-x": `${-650 * (1 - enter)}px`,
    "--right-sphere-x": `${650 * (1 - enter)}px`,
    "--left-sphere-r": `${-55 * enter - 16 * range(p, .34, 1)}deg`,
    "--right-sphere-r": `${55 * enter + 16 * range(p, .34, 1)}deg`
  });
  if (enter > .985 && choiceStart === null) {
    choiceStart = now;
    choiceStage.classList.add("choice-stage-playing");
  } else if (p < .08 && choiceStart !== null) {
    choiceStart = null;
    choiceStage.classList.remove("choice-stage-playing","choice-stage-ready");
    leftEnglish.textContent = "";
    rightEnglish.textContent = "";
  }
  if (choiceStart !== null) {
    const typing = reducedMotion?1:range(now - choiceStart, 250, 1000);
    const leftCount = Math.round(leftQuestion.length * typing);
    const rightCount = Math.round(rightQuestion.length * typing);
    const left=leftQuestion.slice(leftQuestion.length-leftCount),right=rightQuestion.slice(0,rightCount);
    if(leftEnglish.textContent!==left)leftEnglish.textContent=left;
    if(rightEnglish.textContent!==right)rightEnglish.textContent=right;
  }
}

// The final date is a destination, not another long empty scroll corridor.
let historyAdvanceUntil=0,historyTouchY=null;
function historyChoiceReady(p,position){return p>=.79&&p<.96&&position>=events.length-1-.10;}
function advanceHistoryToChoice(){
  const now=performance.now();
  if(now<historyAdvanceUntil)return true;
  if(!historyChoiceReady(progress(history),historyPosition)||progress(choice)>=.24)return false;
  historyAdvanceUntil=now+1300;
  const top=scrollY+choice.getBoundingClientRect().top;
  window.scrollTo({top:top+Math.max(0,choice.offsetHeight-innerHeight)*.27,behavior:reducedMotion?'instant':'smooth'});
  return true;
}
function cancelHistoryAdvance(){if(performance.now()<historyAdvanceUntil)window.scrollTo({top:scrollY,behavior:'instant'});historyAdvanceUntil=0;}
window.addEventListener('wheel',e=>{if(e.ctrlKey)return;if(e.deltaY<0){cancelHistoryAdvance();return;}if(e.deltaY>0&&advanceHistoryToChoice())e.preventDefault();},{passive:false});
window.addEventListener('touchstart',e=>{historyTouchY=e.touches.length===1?e.touches[0].clientY:null;},{passive:true});
window.addEventListener('touchmove',e=>{if(historyTouchY===null||e.touches.length!==1)return;const dy=historyTouchY-e.touches[0].clientY;if(dy<-12){cancelHistoryAdvance();historyTouchY=null;}else if(dy>12&&advanceHistoryToChoice())e.preventDefault();},{passive:false});
window.addEventListener('touchend',()=>{historyTouchY=null;},{passive:true});
window.addEventListener('keydown',e=>{if(e.target.closest?.('input,textarea,select,[contenteditable=true]')||e.altKey||e.metaKey||e.ctrlKey)return;if(['ArrowUp','PageUp'].includes(e.key)){cancelHistoryAdvance();return;}if(['ArrowDown','PageDown',' '].includes(e.key)&&!e.shiftKey&&advanceHistoryToChoice())e.preventDefault();});

// Returning to a decision should not replay its scroll-driven introduction.
window.addEventListener('moon-choice-ready',()=>{
  resetChapterTransition();syncChoiceJourney();
  choiceStart=performance.now()-2600;
  choiceStage.classList.add('choice-stage-playing','choice-stage-ready');
  updateChoice(.38,performance.now());
});

function createContourShader() {
  const canvas = document.querySelector("#contour-canvas");
  const gl = canvas.getContext("webgl2", {alpha:true, antialias:false, premultipliedAlpha:true});
  if (!gl) return {render(){}};
  const vertex = `#version 300 es
    in vec2 aPosition;
    void main(){ gl_Position=vec4(aPosition,0.0,1.0); }`;
  const fragment = `#version 300 es
    precision highp float;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uFade;
    out vec4 outColor;
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
    float snoise(vec2 v){
      const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
      vec2 i=floor(v+dot(v,C.yy));
      vec2 x0=v-i+dot(i,C.xx);
      vec2 i1=x0.x>x0.y?vec2(1.,0.):vec2(0.,1.);
      vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
      i=mod289(i);
      vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
      vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
      m=m*m; m=m*m;
      vec3 x=2.*fract(p*C.www)-1.;
      vec3 h=abs(x)-.5;
      vec3 ox=floor(x+.5);
      vec3 a0=x-ox;
      m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
      vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
      return 130.*dot(m,g);
    }
    float fbm(vec2 p){
      float value=0.;float amp=.52;
      mat2 rot=mat2(.8,.6,-.6,.8);
      for(int i=0;i<3;i++){value+=amp*snoise(p);p=rot*p*1.88+vec2(9.2,4.7);amp*=.46;}
      return value;
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/uResolution.xy;
      vec2 p=(gl_FragCoord.xy-.5*uResolution.xy)/uResolution.y;
      float t=uTime*.043;
      vec2 q=vec2(fbm(p*.43+vec2(t,-t*.55)),fbm(p*.43+vec2(5.2,-3.1)-t*.7));
      vec2 r=vec2(fbm(p*.48+1.45*q+vec2(1.7,8.2)+t*.45),fbm(p*.48+1.3*q+vec2(8.3,2.8)-t*.38));
      float terrain=fbm(p*.5+.72*r+.24*q);
      float scaled=(terrain*.5+.5)*7.0;
      float nearest=abs(fract(scaled+.5)-.5);
      float aa=clamp(fwidth(scaled),.0015,.045);
      float thin=1.-smoothstep(aa*.28,aa*.92,nearest);
      float level=floor(scaled+.5);
      float indexMask=1.-step(.12,abs(mod(level,5.0)));
      float thick=1.-smoothstep(aa*.48,aa*1.65,nearest);
      float contour=max(thin,thick*indexMask);
      float lowerFade=mix(1.,smoothstep(.03,.72,uv.y),uFade);
      float edgeFade=smoothstep(0.,.055,uv.x)*smoothstep(0.,.055,1.-uv.x);
      float alpha=contour*.78*lowerFade*edgeFade;
      outColor=vec4(vec3(alpha),alpha);
    }`;
  const compile = (type, source) => {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(program));
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const resolution = gl.getUniformLocation(program,"uResolution");
  const time = gl.getUniformLocation(program,"uTime");
  const fade = gl.getUniformLocation(program,"uFade");
  return {
    render(seconds, fadeValue) {
      const dpr=Math.min(devicePixelRatio||1,1.6);
      const width=Math.round(1110*dpr), height=Math.round((portraitLayout.matches?portraitBoardHeight:625)*dpr);
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
      gl.useProgram(program);
      gl.uniform2f(resolution,width,height);
      gl.uniform1f(time,seconds);
      gl.uniform1f(fade,fadeValue);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
  };
}

const contour = createContourShader();
const shaderState = {fade:0};
const storySections=[intro,history,choice,document.querySelector('#explore-chapter'),document.querySelector('#gained-chapter')].filter(Boolean);
let storyFrame=0,storyDirty=true,storyEntered=true,lastIntroProgress=-1,lastHistoryProgress=-1,lastChoiceProgress=-1;
function requestStoryFrame(){if(!storyFrame&&!document.hidden)storyFrame=requestAnimationFrame(frame);}
function invalidateStory(){storyDirty=true;requestStoryFrame();}
function stopStory(){if(storyFrame)cancelAnimationFrame(storyFrame);storyFrame=0;previousHistoryTime=null;}
function frame(now) {
  storyFrame=0;
  if(document.hidden)return;
  // Read layout together, before any CSS/text changes. Later chapters need a
  // single scroll/resize update, not a perpetual loop over invisible SVGs.
  const metrics=storySections.map(section=>{
    if(section.hidden)return null;
    const bounds=section.getBoundingClientRect(),height=section.offsetHeight;
    return{section,bounds,height,p:clamp(-bounds.top/Math.max(1,height-innerHeight)),visible:bounds.bottom>0&&bounds.top<innerHeight};
  });
  const [introMetric,historyMetric,choiceMetric]=metrics;
  const ip=introMetric.p,hp=historyMetric.p,cp=choiceMetric.p;
  if(storyDirty||introMetric.visible||ip!==lastIntroProgress)updateIntro(ip);
  if(!historyMetric.visible||!storyEntered){historyPosition=Math.round(range(hp,.05,.83)*(events.length-1));previousHistoryTime=null;}
  if(storyDirty||historyMetric.visible||hp!==lastHistoryProgress)updateHistory(hp,now);
  // The final scheduled frame may land just after 1000ms: paint its complete
  // text once before the loop sleeps, rather than leaving the last glyph out.
  if(storyDirty||choiceMetric.visible||cp!==lastChoiceProgress)updateChoice(cp,now);
  // Identical contour resolution, shader and elapsed time while it can be seen.
  if(storyEntered&&introMetric.visible)contour.render(now/1000,shaderState.fade);
  for(let i=metrics.length-1;i>=0;i--){
    const metric=metrics[i];
    if(!metric||metric.bounds.top>innerHeight*.35||metric.bounds.bottom<=innerHeight*.35)continue;
    const pinned=i<3;
    viewportAnchor={section:metric.section,pinned,fraction:Math.max(0,-metric.bounds.top)/Math.max(1,metric.height-(pinned?innerHeight:0))};
    break;
  }
  lastIntroProgress=ip;lastHistoryProgress=hp;lastChoiceProgress=cp;storyDirty=false;
  const choiceTyping=choiceMetric.visible&&choiceStart!==null&&now-choiceStart<=1000;
  if(storyEntered&&(introMetric.visible||historyMetric.visible||choiceTyping))requestStoryFrame();
}

window.addEventListener('scroll',requestStoryFrame,{passive:true});
window.addEventListener("resize",()=>{setScale();invalidateStory();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopStory();else invalidateStory();});
window.addEventListener('pagehide',stopStory);
window.addEventListener('pageshow',invalidateStory);
if(typeof ResizeObserver==='function'){
  const layoutObserver=new ResizeObserver(invalidateStory);
  storySections.forEach(section=>layoutObserver.observe(section));
}
document.fonts?.ready.then(invalidateStory);
const info = document.querySelector("#info-toggle");
const credit = document.querySelector("#credit-overlay");
function setCredit(open) {
  introStage.classList.toggle("credit-open", open);
  credit.setAttribute("aria-hidden", String(!open));
}
let creditTouch=false;
info.addEventListener('pointerdown',event=>{creditTouch=event.pointerType!=='mouse';});
info.addEventListener("mouseenter", () => {if(matchMedia('(hover: hover)').matches)setCredit(true);});
info.addEventListener("mouseleave", () => {if(matchMedia('(hover: hover)').matches)setCredit(false);});
info.addEventListener("focus", () => {if(!creditTouch)setCredit(true);});
info.addEventListener("blur", () => setCredit(false));
info.addEventListener("click", () => setCredit(!introStage.classList.contains("credit-open")));
function syncHomeLanguage(){const zh=document.documentElement.lang==='zh-Hans';phrase=zh?'明月依旧。\n旧城已远。':'The Moon Remains.\nThe City Gone.';leftQuestion=zh?'我们\n获得了\n什么\n？':'WHAT WE\nHAVE\nGAINED\n?';rightQuestion=zh?'我们\n失去了\n什么\n？':'WHAT WE\nHAVE\nLOST\n?';introLine.setAttribute('aria-label',phrase.replace('\n',' '));leftEnglish.setAttribute('aria-label',zh?'我们获得了什么？':'What we have gained?');rightEnglish.setAttribute('aria-label',zh?'我们失去了什么？':'What we have lost?');captionStates.forEach(s=>{s.glyphs=zh?s.chineseGlyphs:s.englishGlyphs;s.count=-1;s.element.setAttribute('aria-label',zh?historyChinese[s.index]:s.design.text);});invalidateStory();}
window.addEventListener('moon-language-change',syncHomeLanguage);syncHomeLanguage();
document.querySelector(".choice-button-lost").addEventListener("click",()=>window.MoonNavigation.go('home','explore-chapter'));
function syncChoiceJourney(){
  let visited=false,gainedUnlocked=false;try{({lostVisited:visited,gainedUnlocked}=parent.MoonApp.getState());}catch{}
  try{storyEntered=parent.MoonApp.getState().entered!==false;}catch{storyEntered=true;}
  // Hidden physical sections prevent skipping Explore via wheel, touch or keyboard.
  // Once Explore is activated, the whole remainder stays open in both directions.
  for(const section of document.querySelectorAll('#explore-chapter,#gained-chapter')){
    if(section.hidden===gainedUnlocked)section.hidden=!gainedUnlocked;
    if(section.inert===gainedUnlocked)section.inert=!gainedUnlocked;
  }
  invalidateStory();
}
window.addEventListener('moon-preferences',syncChoiceJourney);syncChoiceJourney();
function resetChapterTransition() {
  choiceStage.classList.remove("chapter-leaving","chapter-leaving-gained");
  choice.querySelectorAll(".sphere-float").forEach(el=>{el.style.animationPlayState = "";});
  choice.querySelectorAll(".choice-button").forEach(button => { button.disabled = false; });
}
window.addEventListener("pageshow",event=>{if(event.persisted)resetChapterTransition();});
window.addEventListener("moon-navigation-restored",resetChapterTransition);
setScale();
requestStoryFrame();
// Core Home navigation is ready even if distant photographs/fonts are pending.
document.body.dataset.shellReady='true';try{parent.MoonApp?.chapterReady(window);}catch{}
