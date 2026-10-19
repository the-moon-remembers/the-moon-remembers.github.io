export const families={
phone:[{name:'Brick mobile',era:'1980s / 01',title:'A voice, untethered.',copy:'A brick-sized mobile phone puts a call in your hand, away from a fixed line.'},{name:'Feature phone',era:'1990s–2000s / 02',title:'A message in your pocket.',copy:'Smaller phones bring calls and text messages into everyday routines.'},{name:'Smartphone',era:'TODAY / 03',title:'A city in your hand.',copy:'Maps, messages and payments share one screen. Connection becomes a constant companion.'}],
transport:[{name:'Bicycle',era:'EVERYDAY JOURNEYS / 01',title:'At your own pace.',copy:'A bicycle makes the neighbourhood a journey measured in pedals.'},{name:'Bus',era:'SHARED JOURNEYS / 02',title:'A route for many.',copy:'Public buses connect homes, schools and workplaces across a growing city.'},{name:'Metro',era:'CONNECTED JOURNEYS / 03',title:'Beyond the island.',copy:'Rail adds another way to cross the city. A network turns distant places into everyday destinations.'}],
boat:[{name:'Sailing boat',era:'WORKING WATER / 01',title:'With the wind.',copy:'A sailing boat carries lives and goods across the water that shapes the city.'},{name:'Motor ferry',era:'SHARED CROSSINGS / 02',title:'A crossing together.',copy:'Motor ferries carry more people across familiar waters, connecting work and daily life.'},{name:'Speedboat',era:'NEW CROSSINGS / 03',title:'Water, crossed differently.',copy:'A faster vessel changes a journey’s rhythm. The sea remains a route, a livelihood and a memory.'}]
};
const captions=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const local=text=>window.MoonI18n?.t(text)??text;
function captionState(item){if(!captions.has(item))captions.set(item,{stage:0,frame:0,timer:0,typing:false});return captions.get(item);}
function cancel(state){cancelAnimationFrame(state.frame);clearTimeout(state.timer);state.frame=0;state.timer=0;}
export function beginCaptionChange(item){
  const state=captionState(item);cancel(state);state.typing=false;
  item.querySelector('.object-caption').setAttribute('aria-busy','true');
  item.dataset.captionState='fading';item.classList.add('changing');
}
export function updateCaption(item,stage,{animate=false}={}){
  const state=captionState(item);cancel(state);state.stage=stage;state.typing=false;
  const d=families[item.dataset.family][stage],caption=item.querySelector('.object-caption');
  item.dataset.stage=String(stage);caption.querySelector('.object-era').textContent=local(d.era);
  item.querySelector('button').setAttribute('aria-label',local(`${d.name}. Change ${item.dataset.family} object to the next generation`));
  item.querySelector('.object-fallback').textContent=local(d.name);
  item.querySelectorAll('.object-progress i').forEach((e,i)=>e.classList.toggle('active',i===stage));
  const heading=local(d.title),copy=local(d.copy);
  item.classList.remove('changing');
  if(!animate||reduced.matches){caption.querySelector('h3').textContent=heading;caption.querySelector('p').textContent=copy;caption.setAttribute('aria-busy','false');item.dataset.captionState='idle';return;}
  const glyphs=[];
  // Reserve the complete line layout, revealing glyphs without moving the page.
  for(const [selector,text] of [['h3',heading],['p',copy]]){
    const accessible=document.createElement('span'),visual=document.createElement('span');
    accessible.className='caption-accessible';accessible.textContent=text;visual.setAttribute('aria-hidden','true');
    for(const letter of Array.from(text)){const span=document.createElement('span');span.className='caption-glyph';span.textContent=letter;span.style.opacity='0';visual.append(span);glyphs.push(span);}
    caption.querySelector(selector).replaceChildren(accessible,visual);
  }
  state.typing=true;caption.setAttribute('aria-busy','true');item.dataset.captionState='typing';
  const start=performance.now(),duration=Math.min(1450,Math.max(700,glyphs.length*13));let shown=0;
  function reveal(now){
    const count=reduced.matches?glyphs.length:Math.min(glyphs.length,Math.floor(glyphs.length*Math.max(0,now-start-100)/duration));
    while(shown<count)glyphs[shown++].style.opacity='1';
    if(shown<glyphs.length){state.frame=requestAnimationFrame(reveal);return;}
    caption.querySelector('h3').textContent=heading;caption.querySelector('p').textContent=copy;
    state.typing=false;state.frame=0;item.dataset.captionState='idle';caption.setAttribute('aria-busy','false');
  }
  state.frame=requestAnimationFrame(reveal);
}
// Non-WebGL fallback keeps the same fade/typing sequence.
export function changeCaption(item,stage){
  if(reduced.matches){updateCaption(item,stage);return;}
  beginCaptionChange(item);captionState(item).timer=setTimeout(()=>updateCaption(item,stage,{animate:true}),240);
}
window.addEventListener('moon-language-change',()=>{
  for(const [item,state] of captions){
    if(item.dataset.captionState==='fading'){
      const d=families[item.dataset.family][state.stage],caption=item.querySelector('.object-caption');
      caption.querySelector('.object-era').textContent=local(d.era);caption.querySelector('h3').textContent=local(d.title);caption.querySelector('p').textContent=local(d.copy);
    }else updateCaption(item,state.stage,{animate:state.typing});
  }
});
