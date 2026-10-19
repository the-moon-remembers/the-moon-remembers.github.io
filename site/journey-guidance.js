// Small, non-blocking cues; never capture clicks or request camera access.
function visitorReady(){
  if(document.hidden)return false;
  try{if(window!==parent){if(!parent.MoonApp?.getState().entered)return false;if(parent.document.querySelector('#chapter-curtain')?.classList.contains('covered'))return false;}}
  catch{return false;}
  return true;
}
function idleCue(element,canShow,onChange=()=>{},persistent=false){
  let idleSince=performance.now(),visible=false;
  if(persistent){element.classList.add('is-visible');element.setAttribute('aria-hidden','false');}
  function set(next){if(next===visible)return;visible=next;element.classList.toggle('is-visible',next||persistent);element.setAttribute('aria-hidden',String(!(next||persistent)));onChange(next);}
  const reset=()=>{idleSince=performance.now();set(false);};
  const timer=setInterval(()=>{const now=performance.now();if(!visitorReady()||!canShow()){idleSince=now;set(false);return;}set(now-idleSince>=3000);},200);
  document.addEventListener('visibilitychange',reset);
  window.addEventListener('pagehide',()=>{clearInterval(timer);set(false);},{once:true});
  return{reset};
}
const scrollHint=document.querySelector('#scroll-guidance');
if(scrollHint){
  const cue=idleCue(scrollHint,()=>{
    if(document.querySelector('.credit-open,.chapter-leaving'))return false;
    if(scrollY+innerHeight>=document.documentElement.scrollHeight-8)return false;
    const explore=document.querySelector('#explore-chapter');if(explore&&!explore.hidden&&explore.getBoundingClientRect().top<innerHeight)return false;
    const choice=document.querySelector('#choice');if(choice&&choice.getBoundingClientRect().top<=0&&choice.getBoundingClientRect().bottom>0)return false;
    return ![...document.querySelectorAll('.choice-button')].some(button=>{const rect=button.getBoundingClientRect();return rect.top<innerHeight&&rect.bottom>0&&getComputedStyle(button).opacity>.95&&!button.disabled;});
  });
  for(const type of ['scroll','wheel','touchmove'])window.addEventListener(type,cue.reset,{passive:true});
  window.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))cue.reset();});
}
const atlasHint=document.querySelector('#atlas-guidance');
if(atlasHint){
  const atlas=document.querySelector('#atlas'),moon=atlas.querySelector('.moon-atlas');let inView=false;
  const cue=idleCue(atlasHint,()=>!atlas.hidden&&inView,visible=>moon.classList.toggle('atlas-awaiting',visible),true);
  new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;cue.reset();},{threshold:.15}).observe(moon);
  window.addEventListener('hashchange',cue.reset);
  atlas.addEventListener('click',event=>{if(event.target.closest('.crater'))cue.reset();});
}

// Inline the exact existing vector paths without filter surfaces or bitmap layers.
// The clean external SVG remains a fallback if local asset loading is interrupted.
for(const image of document.querySelectorAll('.title-en-outline,.moon-disc')){
  fetch(image.getAttribute('src')).then(response=>{if(!response.ok)throw new Error('Vector unavailable');return response.text();}).then(text=>{
    const source=new DOMParser().parseFromString(text,'image/svg+xml').documentElement;
    if(source.localName!=='svg')return;
    const svg=document.importNode(source,true);svg.setAttribute('class',image.className);svg.style.removeProperty('display');
    if(image.alt){svg.setAttribute('role','img');svg.setAttribute('aria-label',image.classList.contains('title-en-outline')?'The Moon Remembers':image.alt);}else svg.setAttribute('aria-hidden','true');
    const prefix=image.classList.contains('moon-disc')?'crisp-moon-':'crisp-title-';
    for(const node of svg.querySelectorAll('[id]')){const old=node.id;node.id=prefix+old;for(const target of svg.querySelectorAll('*'))for(const attribute of [...target.attributes])if(attribute.value.includes(`url(#${old})`))target.setAttribute(attribute.name,attribute.value.replaceAll(`url(#${old})`,`url(#${prefix+old})`));}
    image.replaceWith(svg);
  }).catch(()=>{/* Already-visible clean SVG fallback is retained. */});
}
