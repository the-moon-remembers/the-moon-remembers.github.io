// Mount only the final chapters as the visitor approaches them. No initial
// photograph downloads, extra WebGL contexts or silent TV decoding at Home.
for(const[id,moduleName,exportName]of[['memory-constellation','memory-constellation','mountMemoryConstellation'],['last-signal','tv-ending','mountTelevisionEnding']]){
  const section=document.getElementById(id);if(!section)continue;
  const observer=new IntersectionObserver(entries=>{if(!entries.some(entry=>entry.isIntersecting))return;observer.disconnect();import(`./${moduleName}.js?v=journey24`).then(module=>module[exportName](section)).catch(error=>{console.warn('Final chapter unavailable',error);section.dataset.failed='true';const note=document.createElement('p');note.className='ending-load-note';note.textContent=document.documentElement.lang==='zh-Hans'?'这一段暂时未能加载，请刷新重试。':'This part could not load. Please refresh to try again.';section.append(note);});},{rootMargin:'1000px 0px',threshold:0});observer.observe(section);
}
