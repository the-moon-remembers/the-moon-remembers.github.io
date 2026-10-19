import {MemoryWater} from './memory-water.js?v=performance27';
import {memories} from './memory-records.js?v=performance27';
import {MemoryMedia} from './memory-media.js?v=performance27';
import {brushRadius,MemoryGuidance} from './memory-interaction.js?v=performance27';
const $=s=>document.querySelector(s);
const room=$('#memory-room'),view=$('#memory-view'),canvas=$('#memory-canvas'),range=$('#reveal-range'),status=$('#interaction-status'),video=$('#hand-video'),cameraButton=$('#camera-toggle');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let water=null,active=null,loadId=0,pointer=null,demoStart=0,stream=null,landmarker=null,cameraBusy=false,cameraEpoch=0,lastVideoTime=-1,lastDetection=0,handPoints=[],lastFrame=0,inView=false,frameRequest=null,pageActive=true;
function canDraw(){return pageActive&&active&&inView&&!document.hidden&&water?.ready;}
function suspendFrame(){if(frameRequest!=null)cancelAnimationFrame(frameRequest);frameRequest=null;lastFrame=0;}
function wakeFrame(){if(frameRequest!=null||!canDraw())return;lastFrame=0;frameRequest=requestAnimationFrame(frame);}
const touches=new Map();
const prompt=$('#scene-prompt');
const guidance=new MemoryGuidance(()=>{prompt.classList.add('is-dismissed');prompt.setAttribute('aria-hidden','true');});
function placeGuidance(){if(guidance.dismissed)return;const r=view.getBoundingClientRect(),top=Math.max(0,r.top),bottom=Math.min(window.innerHeight||r.height,r.top+r.height);if(bottom>top)prompt.style.setProperty('--scene-hint-y',`${top+(bottom-top)*.78-r.top}px`);}
function resetGuidance(){guidance.reset();prompt.textContent='Move your mouse or finger across this window to uncover a memory.';prompt.classList.remove('is-dismissed');prompt.setAttribute('aria-hidden','false');placeGuidance();}
window.addEventListener('scroll',placeGuidance,{passive:true});window.addEventListener('resize',placeGuidance,{passive:true});
function clearTouches(){for(const id of [...touches.keys()])if(view.hasPointerCapture?.(id))view.releasePointerCapture(id);touches.clear();view.dataset.touchPoints='0';}
function touchPoint(e){const r=view.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),radius:brushRadius.touch};}
function updateTouch(e){if(!touches.has(e.pointerId)&&touches.size>=5)return false;touches.set(e.pointerId,touchPoint(e));view.dataset.touchPoints=String(touches.size);demoStart=0;pointer=null;return true;}
const media=new MemoryMedia({present:$('#scene-present-video'),earlier:$('#scene-earlier-video'),audio:$('#street-audio'),motion:$('#motion-toggle'),sound:$('#ambient-toggle'),note:$('#ambient-note'),view,reduced,onError:setStatus,preferences:()=>{try{return parent.MoonApp?.getState()||{enabled:true};}catch{return{enabled:true};}}});
media.hidden=document.hidden;
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;media.inView=inView;media.sync();if(inView)wakeFrame();else{suspendFrame();if(stream||cameraBusy)stopCamera('The camera was turned off when this page left the foreground.');}},{threshold:.01}).observe(view);
const image=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('image'));img.src='./assets/'+src;});
function setStatus(text){if(status.textContent!==text)status.textContent=text;}
function stopCamera(message){cameraEpoch++;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;handPoints=[];cameraBusy=false;cameraButton.disabled=false;cameraButton.textContent='Enable hand tracking';cameraButton.setAttribute('aria-pressed','false');$('#camera-preview').hidden=true;if(message)setStatus(message);}
function creditLink(href,text){const a=document.createElement('a');a.href=href;a.textContent=text;a.target='_blank';a.rel='noopener noreferrer';return a;}
async function route(key=location.hash.slice(1)){
  if(!memories[key])key='arcades';
  const data=memories[key];suspendFrame();stopCamera();clearTouches();water?.stopVideos();if(water)water.ready=false;demoStart=0;pointer=null;
  active=key;const version=++loadId;room.hidden=false;canvas.hidden=true;
  $('#memory-title').textContent=data.title;$('#memory-number').textContent=data.number;$('#memory-subtitle').textContent=data.subtitle;$('#scene-place').textContent=data.place;
  for(const period of ['now','old']){ $('#'+period+'-heading').textContent=data[period+'Heading'];$('#'+period+'-copy').textContent=data[period+'Copy'];$('#'+period+'-caption').textContent=data[period+'Caption'];$('#'+period+'-still').src='./assets/'+data[period];$('#'+period+'-still').alt=data[period+'Caption']; }
  $('#asset-note').textContent=data.note;$('#scene-comparison').textContent=data.comparison;
  const credits=$('#image-credit');credits.replaceChildren();for(const[label,href]of data.credits){const p=document.createElement('p');p.append(href?creditLink(href,label):document.createTextNode(label));credits.append(p);}
  document.querySelectorAll('.memory-switch a,.crater').forEach(a=>{if(a.hash==='#'+key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.title=data.title+' · Explore · The Moon Remembers';range.value=0;$('#scene-loading').hidden=false;$('#scene-loading').textContent='Unfolding the images…';resetGuidance();setStatus('Move without clicking. On a touchscreen, sweep a finger or use the slider.');
  window.scrollTo({top:0,behavior:'instant'});placeGuidance();$('#memory-title').focus({preventScroll:true});
  // Start streaming and both posters together; show a poster while shaders compile.
  media.configure(data);
  const posters=Promise.all([image(data.posterNow||data.now),image(data.posterOld||data.old)]);
  let preparing;try{water??=new MemoryWater(canvas);preparing=Promise.resolve(water.compilation).then(()=>null,error=>error);}catch(error){preparing=Promise.resolve(error);}
  try{const[now,old]=await posters;if(version!==loadId)return;$('#scene-fallback').src=now.src;$('#scene-earlier-fallback').src=old.src;view.style.setProperty('--fallback-reveal','0%');$('#scene-loading').hidden=true;
    try{const error=await preparing;if(version!==loadId)return;if(error)throw error;water.onVideoError=()=>setStatus('A video could not load. The still images and water interaction remain available.');water.setImages(now,old);water.reveal=0;water.resize();canvas.hidden=false;view.dataset.renderer='webgl';}
    catch(error){console.warn('Water rendering unavailable',error);canvas.hidden=true;view.dataset.renderer='image';setStatus('Water rendering is unavailable in this browser. Use the slider to compare the photographs.');}
    if(data.videoNow&&water?.ready)water.setVideos($('#scene-present-video'),$('#scene-earlier-video'));
    wakeFrame();
  }catch(error){if(version!==loadId)return;$('#scene-loading').textContent='Images could not load. Please refresh to try again.';setStatus('The story and chapter navigation are still available.');}
}
view.addEventListener('pointerdown',e=>{if(stream||e.pointerType==='mouse')return;if(updateTouch(e))view.setPointerCapture?.(e.pointerId);});
view.addEventListener('pointermove',e=>{if(stream)return;if(e.pointerType!=='mouse'){if(touches.has(e.pointerId)&&updateTouch(e))guidance.move(performance.now());return;}const r=view.getBoundingClientRect();pointer={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),radius:brushRadius.mouse};demoStart=0;guidance.move(performance.now());});
view.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')pointer=null;});
function releaseTouch(e){touches.delete(e.pointerId);view.dataset.touchPoints=String(touches.size);if(e.pointerType!=='mouse')pointer=null;if(view.hasPointerCapture?.(e.pointerId))view.releasePointerCapture(e.pointerId);}
view.addEventListener('pointerup',releaseTouch);view.addEventListener('pointercancel',releaseTouch);view.addEventListener('lostpointercapture',releaseTouch);
range.addEventListener('input',()=>{if(water)water.reveal=Number(range.value)/100;view.style.setProperty('--fallback-reveal',range.value+'%');});
document.addEventListener('pointerdown',()=>media.sync());document.addEventListener('keydown',()=>media.sync());window.addEventListener('moon-preferences',()=>media.sync());
view.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();range.value=Number(range.value)+(e.key==='ArrowRight'?10:-10);range.dispatchEvent(new Event('input'));}});
$('#scene-reset').addEventListener('click',()=>{clearTouches();water?.clear();if(water)water.reveal=0;range.value=0;range.dispatchEvent(new Event('input'));demoStart=0;pointer=null;setStatus('The water has settled. Sweep across it again.');});
$('#gesture-demo').addEventListener('click',()=>{if(!water?.ready){setStatus('Use the comparison slider to explore both photographs.');return;}stopCamera();clearTouches();range.value=0;water.reveal=0;water.clear();demoStart=performance.now();pointer=null;setStatus('Five moving touches stir the water. This demonstration does not use a camera.');});
cameraButton.addEventListener('click',async()=>{
  if(stream||cameraBusy){stopCamera('Hand tracking is off. Continue exploring with the pointer.');return;}
  if(!navigator.mediaDevices?.getUserMedia){setStatus('Camera access is unavailable in this browser. Use the pointer or the slider.');return;}
  if(!water?.ready){setStatus('Wait for the photographs to load, or use the comparison slider.');return;}
  const epoch=++cameraEpoch;clearTouches();cameraBusy=true;cameraButton.textContent='Cancel hand tracking';setStatus('Preparing hand tracking. Camera frames are processed on your device, without recording or uploading.');demoStart=0;
  try{
    const camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
    if(epoch!==cameraEpoch){camera.getTracks().forEach(t=>t.stop());return;}stream=camera;video.srcObject=camera;await video.play();
    if(!landmarker){const {FilesetResolver,HandLandmarker}=await import('./vendor/mediapipe/vision_bundle.mjs');if(epoch!==cameraEpoch)return;const files=await FilesetResolver.forVisionTasks('./vendor/mediapipe/wasm');if(epoch!==cameraEpoch)return;const prepared=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/mediapipe/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.55,minTrackingConfidence:.5});if(epoch!==cameraEpoch){prepared.close?.();return;}landmarker=prepared;}
    if(epoch!==cameraEpoch)return;cameraBusy=false;cameraButton.disabled=false;cameraButton.textContent='Disable hand tracking';cameraButton.setAttribute('aria-pressed','true');$('#camera-preview').hidden=false;pointer=null;range.value=0;water.reveal=0;lastVideoTime=-1;setStatus('Open one hand towards the camera. Move gently to stir the water with five fingertips.');
  }catch(error){if(epoch!==cameraEpoch)return;stopCamera();setStatus(error.name==='NotAllowedError'?'Camera permission was declined. The pointer, touchscreen and slider still work.':error.name==='NotFoundError'?'No camera was found. Use the pointer, touchscreen or slider.':'Hand tracking could not start. Try again, or continue with the pointer and slider.');console.warn('Hand tracking unavailable',error);}
});
function frame(now){frameRequest=null;if(!canDraw())return;const dt=Math.min(40,now-lastFrame||16.7);lastFrame=now;guidance.tick(now);
  if(canDraw()){
    if(stream&&!cameraBusy&&landmarker&&video.readyState>=2&&now-lastDetection>65&&video.currentTime!==lastVideoTime){lastDetection=now;lastVideoTime=video.currentTime;try{const result=landmarker.detectForVideo(video,now);const targets=result.landmarks[0]?[4,8,12,16,20].map(i=>({x:1-result.landmarks[0][i].x,y:result.landmarks[0][i].y,radius:brushRadius.hand})):[];if(targets.some((p,i)=>handPoints[i]&&Math.hypot(p.x-handPoints[i].x,p.y-handPoints[i].y)>.002))guidance.move(now);handPoints=targets.map((p,i)=>{const last=handPoints[i]||p;return {...p,x:last.x+(p.x-last.x)*.55,y:last.y+(p.y-last.y)*.55};});setStatus(handPoints.length?'Five fingertips tracked. Sweep slowly to bring the earlier image to the surface.':'Keep one open hand fully inside the camera view.');}catch(error){stopCamera('Hand tracking stopped and the camera is off. Continue exploring with the pointer.');}}
    let points=stream?handPoints:touches.size?[...touches.values()]:pointer?[pointer]:[];
    if(demoStart){const t=(now-demoStart)/5200;if(t>1){demoStart=0;setStatus('The demonstration has ended. Sweep the pointer or enable hand tracking.');}else points=Array.from({length:5},(_,i)=>({x:.18+t*.62+Math.sin(t*8+i*.45)*.055,y:.28+i*.085+Math.sin(t*6+i*.3)*.10,radius:brushRadius.hand}));}
    water.setPoints(points);water.shift=reduced?[0,0]:points.length?[(points[0].x-.5)*2,(points[0].y-.5)*2]:[0,0];water.draw(dt);
  }if(canDraw())frameRequest=requestAnimationFrame(frame);
}
window.addEventListener('hashchange',()=>route());
window.addEventListener('pagehide',()=>{loadId++;pageActive=false;suspendFrame();stopCamera();clearTouches();water?.stopVideos();water?.dispose?.();water=null;landmarker?.close?.();landmarker=null;media.release();});
window.addEventListener('pageshow',event=>{if(event.persisted){pageActive=true;media.hidden=document.hidden;route();}});
document.addEventListener('visibilitychange',()=>{media.hidden=document.hidden;media.sync();if(document.hidden){suspendFrame();stopCamera('The camera was turned off when this page left the foreground.');clearTouches();}else wakeFrame();});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();suspendFrame();stopCamera();clearTouches();water?.stopVideos();water?.dispose?.();canvas.hidden=true;view.dataset.renderer='image';water=null;setStatus('Graphics were interrupted. Use the comparison slider to continue.');});
route();
// The detail layout is ready: a buffering film must not hold the page curtain.
// The loader/posters stay visible until the full water renderer is prepared.
document.body.dataset.shellReady='true';try{parent.MoonApp?.chapterReady?.(window);}catch{}
