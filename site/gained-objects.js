import * as THREE from './vendor/three/three.module.min.js';
import {updateCaption,beginCaptionChange,changeCaption} from './gained-object-data.js?v=flow6';
import {prepareDissolve,createDustTransition,disposeModel} from './gained-particles.js';
import {ensureObjectSwitcher} from './gained-object-switcher.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mats={cream:new THREE.MeshStandardMaterial({color:0xfdf1d7,roughness:.36,metalness:.15}),blue:new THREE.MeshStandardMaterial({color:0x6b9ebd,roughness:.42,metalness:.2}),dark:new THREE.MeshStandardMaterial({color:0x142548,roughness:.32,metalness:.2}),glass:new THREE.MeshStandardMaterial({color:0x355674,roughness:.18,metalness:.5}),wood:new THREE.MeshStandardMaterial({color:0xa99473,roughness:.65})};
function mesh(g,geo,mat,pos=[0,0,0]){const m=new THREE.Mesh(geo,mats[mat]);m.position.set(...pos);g.add(m);return m;}
function box(g,w,h,d,mat,pos){return mesh(g,new THREE.BoxGeometry(w,h,d),mat,pos);}
function rod(g,a,b,r=.025,mat='cream'){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);const m=mesh(g,new THREE.CylinderGeometry(r,r,v.length(),10),mat);m.position.copy(p.add(q).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
function rounded(g,w,h,d,r,mat,pos=[0,0,0]){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const geo=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2,steps:1});geo.translate(0,0,-d/2);return mesh(g,geo,mat,pos);}
function phone(stage){const g=new THREE.Group();if(stage===0){rounded(g,.72,1.85,.48,.05,'cream',[0,-.02,0]);box(g,.5,.32,.025,'glass',[0,.49,.25]);rod(g,[-.24,.91,0],[-.24,1.65,0],.05,'dark');for(let r=0;r<4;r++)for(let c=0;c<3;c++)rounded(g,.12,.09,.03,.015,'dark',[(c-1)*.19,-.14-r*.18,.26]);box(g,.45,.06,.035,'dark',[0,.76,.26]);}
else if(stage===1){rounded(g,.82,1.68,.3,.13,'blue');rounded(g,.58,.53,.025,.035,'glass',[0,.35,.16]);rounded(g,.21,.14,.04,.04,'cream',[0,-.08,.18]);for(let r=0;r<3;r++)for(let c=0;c<3;c++)rounded(g,.16,.08,.03,.025,'cream',[(c-1)*.22,-.32-r*.15,.18]);box(g,.26,.035,.03,'dark',[0,.72,.18]);}
else{rounded(g,.95,1.87,.15,.12,'cream');rounded(g,.86,1.73,.015,.09,'glass',[0,0,.088]);rounded(g,.3,.06,.018,.027,'dark',[0,.73,.11]);for(let r=0;r<3;r++)for(let c=0;c<3;c++)rounded(g,.15,.15,.018,.035,(r+c)%2?'cream':'blue',[(c-1)*.24,.32-r*.24,.11]);rounded(g,.36,.025,.018,.01,'cream',[0,-.76,.11]);}return g;}
function bicycle(){const g=new THREE.Group();for(const x of[-.86,.86]){const wheel=mesh(g,new THREE.TorusGeometry(.46,.045,12,40),'dark',[x,-.35,0]);mesh(g,new THREE.TorusGeometry(.43,.017,8,40),'cream',[x,-.35,.005]);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(g,[x,-.35,.01],[x+Math.cos(a)*.4,-.35+Math.sin(a)*.4,.01],.007);}}
const a=[-.86,-.35,0],b=[-.28,.36,0],c=[.08,-.35,0],d=[.53,.31,0],e=[.86,-.35,0];[[a,b],[b,c],[c,a],[b,d],[d,c],[d,e]].forEach(pair=>rod(g,...pair,.035,'blue'));rod(g,b,[-.33,.63,0],.025);box(g,.32,.06,.2,'dark',[-.33,.64,0]);rod(g,d,[.46,.6,0],.025);rod(g,[.46,.6,-.18],[.46,.6,.18],.025);rod(g,[.08,-.35,-.19],[.08,-.35,.19],.025);g.scale.setScalar(.92);return g;}
function vehicle(stage){if(stage===0)return bicycle();const g=new THREE.Group(),metro=stage===2;const count=metro?2:1;for(let car=0;car<count;car++){const sub=new THREE.Group();sub.position.x=metro?(car-.5)*1.35:0;g.add(sub);rounded(sub,metro?1.25:2.45,.93,.62,.12,'cream',[0,.05,0]);box(sub,metro?1.26:2.46,.12,.635,'blue',[0,-.16,0]);for(let i=0;i<(metro?3:6);i++){const x=metro?-.4+i*.39:-.93+i*.36;rounded(sub,.25,.3,.018,.04,'glass',[x,.22,.33]);rounded(sub,.25,.3,.018,.04,'glass',[x,.22,-.33]);}for(const x of metro?[-.38,.38]:[-.77,.77])for(const z of[-.34,.34]){const m=mesh(sub,new THREE.CylinderGeometry(.17,.17,.07,20),'dark',[x,-.47,z]);m.rotation.x=Math.PI/2;}box(sub,.018,.34,.48,'glass',[metro?.636:1.236,.21,0]);}if(metro){rod(g,[-1.5,-.68,-.22],[1.5,-.68,-.22],.02,'blue');rod(g,[-1.5,-.68,.22],[1.5,-.68,.22],.02,'blue');}return g;}
function boat(stage){const g=new THREE.Group();const shape=new THREE.Shape();shape.moveTo(-1.25,0);shape.quadraticCurveTo(-1.05,-.45,-.6,-.47);shape.lineTo(.8,-.47);shape.quadraticCurveTo(1.12,-.3,1.4,.02);shape.closePath();const hull=new THREE.ExtrudeGeometry(shape,{depth:.7,bevelEnabled:true,bevelThickness:.07,bevelSize:.07,bevelSegments:2});hull.translate(0,0,-.35);mesh(g,hull,stage===0?'wood':'cream',[0,-.22,0]);box(g,2.15,.06,.65,'blue',[0,-.15,0]);if(stage===0){rod(g,[-.15,-.14,0],[-.15,1.35,0],.035,'cream');const sail=new THREE.Shape();sail.moveTo(-.08,.01);sail.lineTo(-.08,1.3);sail.quadraticCurveTo(.4,.74,.78,.05);sail.closePath();const m=mesh(g,new THREE.ShapeGeometry(sail),'cream',[-.15,-.1,0]);m.material=new THREE.MeshStandardMaterial({color:0xfdf1d7,roughness:.8,side:THREE.DoubleSide});rod(g,[-.2,.05,0],[.8,.05,0],.025,'wood');}else if(stage===1){rounded(g,1.7,.65,.5,.06,'cream',[0,.19,0]);for(let x=-.58;x<.7;x+=.32)for(const z of[-.26,.26])box(g,.22,.25,.018,'glass',[x,.28,z]);box(g,1.85,.055,.68,'blue',[0,.56,0]);rod(g,[-.5,.58,0],[-.5,.95,0],.03,'cream');}else{const glass=rounded(g,.75,.38,.5,.1,'glass',[-.05,.04,0]);glass.rotation.z=-.22;box(g,.65,.12,.35,'blue',[-.63,-.02,0]);}return g;}
const factories={phone,transport:vehicle,boat};
function mount(item,index,canRun){
  const button=item.querySelector('button'),canvas=button.querySelector('canvas');let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});}catch{return false;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),rig=new THREE.Group(),camera=new THREE.PerspectiveCamera(32,1,.1,30);scene.add(rig);
  camera.position.set(3,1.6,6);camera.lookAt(0,.1,0);scene.add(new THREE.HemisphereLight(0xfdf1d7,0x6b9ebd,2));
  const light=new THREE.DirectionalLight(0xfff7e8,3);light.position.set(-3,5,4);scene.add(light);
  const rim=new THREE.DirectionalLight(0x6b9ebd,2);rim.position.set(4,1,-3);scene.add(rim);
  let stage=0,model=factories[item.dataset.family](stage),dissolve=prepareDissolve(model),transition=0,nextModel=null,nextDissolve=null,dust=null,switched=false,hover=false,frameId=0,pausedAt=0,contextLost=false,disposed=false;
  rig.add(model);updateCaption(item,stage);button.classList.add('ready');button.dataset.transition='idle';button.dataset.generation='0';
  function size(){const w=button.clientWidth,h=button.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();sync();}
  const resize=new ResizeObserver(size);resize.observe(button);size();
  button.addEventListener('pointerenter',()=>{hover=true;sync();});button.addEventListener('pointerleave',()=>{hover=false;sync();});
  function finish(){rig.remove(model);disposeModel(model);model=nextModel;dissolve=nextDissolve;dissolve.value=0;rig.remove(dust.points);dust.dispose();dust=null;nextModel=null;transition=0;item.classList.remove('changing');button.removeAttribute('aria-busy');button.dataset.transition='idle';}
  function immediate(){rig.remove(model);disposeModel(model);stage=(stage+1)%3;model=factories[item.dataset.family](stage);dissolve=prepareDissolve(model);rig.add(model);updateCaption(item,stage);button.dataset.generation=String(stage);sync();}
  button.addEventListener('click',()=>{
    if(transition)return;if(reduced.matches){immediate();return;}
    nextModel=factories[item.dataset.family]((stage+1)%3);nextDissolve=prepareDissolve(nextModel);nextDissolve.value=1;
    // Temporarily detach to sample model-local surfaces, keeping the same view transform on the rig.
    rig.remove(model);dust=createDustTransition(model,nextModel,innerWidth<650?6500:14000);rig.add(model,nextModel,dust.points);
    renderer.compile(scene,camera);transition=performance.now();switched=false;beginCaptionChange(item);button.setAttribute('aria-busy','true');button.dataset.transition='dissolving';sync();
  });
  const ease=(a,b,t)=>{const x=Math.min(1,Math.max(0,(t-a)/(b-a)));return x*x*(3-2*x);};
  function frame(t){
    frameId=0;if(!running())return;
    if(transition){
      const p=reduced.matches?1:Math.min((t-transition)/1800,1);
      dissolve.value=ease(.015,.25,p);nextDissolve.value=1-ease(.72,.99,p);dust.update(p,renderer.getPixelRatio());
      button.dataset.transition=p<.28?'dissolving':p<.72?'particles':'reassembling';
      if(p>=.58&&!switched){stage=(stage+1)%3;switched=true;updateCaption(item,stage,{animate:true});button.dataset.generation=String(stage);}
      if(p===1)finish();
    }else if(!reduced.matches){rig.position.y=Math.sin(t/950+index*1.3)*.09;rig.rotation.y=Math.sin(t/4200+index)*.24+(hover?.35:0);rig.rotation.z=Math.sin(t/2500+index)*.025;}
    renderer.render(scene,camera);
    if(!reduced.matches||transition)frameId=requestAnimationFrame(frame);
  }
  function running(){return!disposed&&!contextLost&&canRun();}
  function sync(){
    if(running()){
      if(pausedAt){if(transition)transition+=performance.now()-pausedAt;pausedAt=0;}
      if(!frameId)frameId=requestAnimationFrame(frame);
    }else{if(frameId)cancelAnimationFrame(frameId);frameId=0;if(!pausedAt)pausedAt=performance.now();}
    button.dataset.rendering=String(running());
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;sync();button.classList.remove('ready');button.querySelector('.object-fallback').textContent='3D paused · reload to restore';});
  return{sync,dispose(){disposed=true;sync();resize.disconnect();disposeModel(model);if(nextModel)disposeModel(nextModel);dust?.dispose();renderer.dispose();}};
}
const items=[...document.querySelectorAll('.object-item')],records=new Map(),byButton=new Map();
let pageInactive=false,switcher={isActive:()=>true};
items.forEach((item,index)=>{const record={item,index,near:false,visible:false,controller:null,attempted:false};records.set(item,record);byButton.set(item.querySelector('.object-view'),record);});
function syncViews(){
  for(const record of records.values()){
    if(record.near&&switcher.isActive(record.item)&&!document.hidden&&!pageInactive&&!record.attempted){
      record.attempted=true;
      record.controller=mount(record.item,record.index,()=>record.visible&&switcher.isActive(record.item)&&!document.hidden&&!pageInactive);
      record.item.dataset.renderer=record.controller?'mounted':'fallback';
      if(!record.controller){let stage=0;updateCaption(record.item,stage);record.item.querySelector('.object-view').addEventListener('click',()=>{stage=(stage+1)%3;changeCaption(record.item,stage);});}
    }
    record.controller?.sync();
  }
}
switcher=ensureObjectSwitcher(syncViews);
// Nothing is mounted for a distant/locked chapter. Only the active phone panel
// can create a context, and hidden/offscreen contexts have no RAF polling loop.
const nearObserver=new IntersectionObserver(entries=>{for(const entry of entries)byButton.get(entry.target).near=entry.isIntersecting;syncViews();},{rootMargin:'350px 0px'});
const viewObserver=new IntersectionObserver(entries=>{for(const entry of entries)byButton.get(entry.target).visible=entry.isIntersecting;syncViews();});
for(const button of byButton.keys()){nearObserver.observe(button);viewObserver.observe(button);}
document.addEventListener('visibilitychange',syncViews);reduced.addEventListener('change',syncViews);
window.addEventListener('pagehide',event=>{pageInactive=true;syncViews();if(!event.persisted){nearObserver.disconnect();viewObserver.disconnect();for(const record of records.values())record.controller?.dispose();}});
window.addEventListener('pageshow',()=>{pageInactive=false;syncViews();});
