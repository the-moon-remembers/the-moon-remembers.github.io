// Home -> decision -> Explore -> Gained, all inside the same document.
const gained=document.querySelector('#gained-chapter');
// Warm only files, not a live chapter or camera. Keep the full-resolution source assets.
const choice=document.querySelector('#choice');
if(choice){
  const preload=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    preload.disconnect();
    // Prepare only the small detail-page code. Never fetch all six films or
    // initialise a second renderer / camera behind the current page.
    for(const [rel,href] of [['prefetch','./lost.html?v=loading28'],...['lost','memory-water','memory-media','memory-records','memory-interaction'].map(name=>['modulepreload',`./${name}.js?v=${['lost','memory-media'].includes(name)?'loading28':'performance27'}`])]){
      const link=document.createElement('link');link.rel=rel;link.href=href;
      if(rel==='preload')link.as='image';
      link.fetchPriority='low';document.head.append(link);
    }
  },{rootMargin:'500px 0px',threshold:0});
  preload.observe(choice);
}
const warmedPosters=new Set();
document.querySelectorAll('#explore-chapter .crater').forEach(crater=>{
  const warm=()=>{const prefix={arcades:'street',harbor:'screen',waterfront:'shore'}[crater.hash.slice(1)];if(!prefix||warmedPosters.has(prefix))return;warmedPosters.add(prefix);for(const period of ['now','then']){const link=document.createElement('link');link.rel='preload';link.as='image';link.fetchPriority='low';link.href=`./assets/${prefix}-${period}-20261013.jpg`;document.head.append(link);}};
  crater.addEventListener('pointerenter',warm,{once:true});crater.addEventListener('focus',warm,{once:true});crater.addEventListener('pointerdown',warm,{once:true,passive:true});
});
if(gained){
  const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    observer.disconnect();import('./gained.js?v=performance27').catch(()=>{
      gained.querySelectorAll('.object-fallback').forEach(label=>{label.textContent=window.MoonI18n?.t('Interactive models could not load. Please refresh.')??'Interactive models could not load. Please refresh.';});
    });
  },{rootMargin:'400px 0px',threshold:0});
  observer.observe(gained);
}
