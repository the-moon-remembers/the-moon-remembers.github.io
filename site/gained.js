import {ensureObjectSwitcher} from './gained-object-switcher.js';
// Category controls must also work if the optional WebGL model import fails.
ensureObjectSwitcher();
const records=[
{year:'1955',title:'An island,<br>connected.',copy:'The Gaoji causeway linked Xiamen Island to the mainland, carrying roads and rail across the sea.',value:'2,212',unit:'METRES / GAOJI CAUSEWAY',source:'https://slt.fujian.gov.cn/wzsy/mtjj/202007/t20200717_5324867.htm'},
{year:'1980',title:'A new chapter<br>of exchange.',copy:'Xiamen became one of China’s first special economic zones. The historical record describes a city with a built-up area of just 13.8 square kilometres at the time.',value:'13.8',unit:'KM² / CITY BUILT-UP AREA, NOT ISLAND AREA',source:'https://www.xmrd.gov.cn/xwzx/rdsd/202106/t20210629_5441705.htm'},
{year:'2012',title:'Letting the sea<br>breathe again.',copy:'Parts of the Gaoji causeway were reopened to the sea to restore water circulation. Progress can also mean undoing an earlier barrier.',value:'2012',unit:'REOPENING THE CAUSEWAY TO WATER',source:'https://www.xmrd.gov.cn/zt/xmsj/wzbd/202402/t20240226_5589340.htm'}
];
document.querySelectorAll('[data-era]').forEach((b,i)=>b.addEventListener('click',()=>{const r=records[i],d=document.querySelector('#era-detail');document.querySelectorAll('[data-era]').forEach((e,j)=>e.setAttribute('aria-pressed',String(i===j)));d.querySelector('.archive-year').textContent=r.year;d.querySelector('h3').innerHTML=r.title;d.querySelector('.archive-copy').textContent=r.copy;d.querySelector('strong').textContent=r.value;d.querySelector('.archive-measure span').textContent=r.unit;d.querySelector('a').href=r.source;}));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
// Display the user's white-background renders without modifying the source assets.
async function prepareRender(src){const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height);let minX=c.width,minY=c.height,maxX=0,maxY=0;for(let p=0;p<pixels.data.length;p+=4){if(!pixels.data[p+3])continue;if(Math.min(pixels.data[p],pixels.data[p+1],pixels.data[p+2])>240)pixels.data[p+3]=0;else{const n=p/4,x=n%c.width,y=Math.floor(n/c.width);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}ctx.putImageData(pixels,0,0);const trim=document.createElement('canvas');trim.width=maxX-minX+61;trim.height=maxY-minY+61;const tc=trim.getContext('2d');tc.drawImage(c,minX,minY,maxX-minX+1,maxY-minY+1,30,30,maxX-minX+1,maxY-minY+1);return{canvas:trim,pixels:tc.getImageData(0,0,trim.width,trim.height)};}
document.querySelectorAll('[data-island]').forEach(async c=>{try{const {canvas}=await prepareRender(`./assets/island-${c.dataset.island}-user.png`);c.width=canvas.width;c.height=canvas.height;c.getContext('2d').drawImage(canvas,0,0);c.parentElement.classList.add('ready');}catch{/* The original user image remains as a fallback. */}});
function mapLayerAt(red,green,blue){
  let best=0,distance=(194-red)**2+(230-green)**2+(243-blue)**2;
  const middle=(141-red)**2+(187-green)**2+(227-blue)**2;
  if(middle<distance){best=1;distance=middle;}
  const recent=(106-red)**2+(151-green)**2+(177-blue)**2;
  if(recent<distance)best=2;
  return best;
}
async function setupMap(){const c=document.querySelector('#shore-map'),{canvas:base,pixels}=await prepareRender('./assets/island-layers-user.png');c.width=base.width;c.height=base.height;const ctx=c.getContext('2d');const lookup=new Int8Array(c.width*c.height).fill(-1),masks=[0,1,2].map(()=>{const m=document.createElement('canvas');m.width=c.width;m.height=c.height;return m;});const maskData=masks.map(m=>m.getContext('2d').createImageData(m.width,m.height));
// Same nearest-colour masks, without arrays/closures for every image pixel.
for(let p=0;p<lookup.length;p++){const k=p*4,a=pixels.data[k+3];if(!a)continue;const best=mapLayerAt(pixels.data[k],pixels.data[k+1],pixels.data[k+2]);lookup[p]=best;const data=maskData[best].data;data[k]=data[k+1]=data[k+2]=255;data[k+3]=a;}
masks.forEach((m,i)=>m.getContext('2d').putImageData(maskData[i],0,0));let active=0,visible=false,last=0;const buttons=[...document.querySelectorAll('[data-layer]')],labels=['EARLY LAYER / LIGHT BLUE','INTERMEDIATE LAYER / MEDIUM BLUE','RECENT LAYER / DEEP BLUE'];
function select(i){active=i;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));document.querySelector('#map-status').textContent=labels[i];draw(performance.now());}
function draw(t){ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(base,0,0);ctx.globalAlpha=reduced.matches?.22:.12+.32*(.5+.5*Math.sin(t/600));ctx.drawImage(masks[active],0,0);ctx.globalAlpha=1;}
buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('focus',()=>select(i));b.addEventListener('pointerenter',()=>select(i));});c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*c.width/r.width),y=Math.floor((e.clientY-r.top)*c.height/r.height);const i=lookup[y*c.width+x];c.style.cursor=i>=0?'pointer':'default';if(i>=0&&i!==active)select(i);});c.addEventListener('click',e=>{const r=c.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*c.width/r.width),y=Math.floor((e.clientY-r.top)*c.height/r.height),i=lookup[y*c.width+x];if(i>=0)select(i);});
let mapFrame=0,pageActive=true;
function stop(){if(mapFrame)cancelAnimationFrame(mapFrame);mapFrame=0;}
function schedule(){if(!mapFrame&&pageActive&&visible&&!document.hidden&&!reduced.matches)mapFrame=requestAnimationFrame(frame);}
function frame(t){mapFrame=0;if(!pageActive||!visible||document.hidden||reduced.matches)return;if(t-last>40){draw(t);last=t;}schedule();}
const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)schedule();else stop();});observer.observe(c);draw(0);c.parentElement.classList.add('ready');
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
window.addEventListener('pagehide',event=>{pageActive=false;stop();if(!event.persisted)observer.disconnect();});
window.addEventListener('pageshow',()=>{pageActive=true;schedule();});
reduced.addEventListener('change',()=>{draw(performance.now());if(reduced.matches)stop();else schedule();});}
setupMap().catch(()=>{/* Keep the supplied map readable when Canvas is unavailable. */});
import('./gained-objects.js?v=performance27').catch(()=>import('./gained-object-data.js?v=texture5').then(({families,updateCaption,changeCaption})=>{document.querySelectorAll('.object-item').forEach(item=>{let stage=0;updateCaption(item,stage);item.querySelector('button').addEventListener('click',()=>{stage=(stage+1)%3;changeCaption(item,stage);item.querySelector('.object-fallback').textContent=families[item.dataset.family][stage].name;});});}));
