import * as THREE from './vendor/three/three.module.min.js';
import {archiveMemories} from './ending-memory-data.js?v=signals23';
import {photoPools,createPhotoChannel} from './tv-photo-channels.js?v=signals23';

// Three distinct recordings appear once each. The remaining photographic sets
// use disjoint archive pools, so no two televisions repeat the same content.
const RECORDINGS=['street','screen','shore'].map(name=>({video:`./assets/${name}-then-20261013.mp4`,poster:`./assets/${name}-then-20261013.jpg`}));
const COPY={
  '05 / THE LAST SIGNAL':'05 / 最后的信号',
  'A city keeps':'一座城，',
  'sending memories.':'记忆仍在传来。',
  'The story does not end at the edge of the screen. Follow a signal back to the beginning, or open a memory once more.':'故事并未在屏幕边缘结束。循着信号回到起点，或再次打开一段记忆。',
  'Keep scrolling. Let the screens turn towards you.':'继续向下，让屏幕转向你。',
  'Choose a screen. A familiar place is waiting.':'选择一块屏幕，熟悉的地方仍在等你。',
  'Return to Home':'回到首页',
  'Return to Explore':'回到探索',
  'One city. One moon.':'一座城，一轮月。',
  'XIAMEN / THE MOON REMEMBERS':'厦门 / 月照旧城',
  'Some images, recordings and music are sourced from the internet or supplied by the designer. This educational portfolio explores city memory; all rights remain with their respective creators. For attribution, correction or removal requests, please use the author’s contact details included with the accompanying portfolio.':'部分图片、影像与音乐来源于互联网或由设计者提供。本教育作品集以城市记忆为主题，原作者保留其作品的相关权利。如需补充署名、更正或删除素材，请通过随附作品集中的作者联系方式联系。',
  'The last signal, an interactive wall of vintage televisions':'最后的信号，可交互的复古电视墙',
  'Your browser cannot display the television wall. The journey continues through these links.':'当前浏览器无法显示电视墙，仍可通过以下入口继续浏览。',
  'Home':'首页','Explore':'探索'
};
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const ease=value=>value*value*(3-2*value);
// These are structural families, not recoloured copies: the face aperture,
// controls, cabinet aspect, rear depth, feet and carrying handle vary together.
const TV_STYLES={
  classic:{front:'tv-cabinet-front.png',ratio:1.31,depth:.45,radius:.075,controls:'right',screen:[.09,.75,.13,.83],tint:0xcbdde7},
  portable:{front:'tv-cabinet-portable.png',ratio:1.13,depth:.54,radius:.115,controls:'right',screen:[.09,.75,.13,.83],tint:0xaec9dc,handle:true},
  console:{front:'tv-cabinet-console.png',ratio:1.72,depth:.39,radius:.035,controls:'right',screen:[.09,.75,.13,.83],tint:0xd4dbdb,plinth:true},
  left:{front:'tv-cabinet-left-controls.png',ratio:1.37,depth:.48,radius:.065,controls:'left',screen:[.28,.94,.13,.84],tint:0xa4bfd2},
  bottom:{front:'tv-cabinet-bottom-controls.png',ratio:1.54,depth:.43,radius:.052,controls:'bottom',screen:[.10,.90,.08,.73],tint:0xd0dfdf}
};
// Back-layer sets form a deep, imperfect silhouette; the two working navigation
// sets are deliberately in front, with clear apertures and no intersecting TV.
const TV_LAYOUT=[
  {x:-3.17,y:-2.96,z:.30,w:2.42,style:'classic',kind:'video',source:0,roll:-.038,yaw:-.14},
  {x:-.31,y:-3.00,z:.66,w:3.18,style:'console',kind:'noise',pattern:2,roll:.016,yaw:.06},
  {x:2.69,y:-2.92,z:.20,w:2.48,style:'portable',kind:'video',source:2,roll:.052,yaw:.18},
  {x:-4.14,y:-2.60,z:-1.62,w:2.40,style:'console',kind:'noise',pattern:3,roll:-.095,yaw:-.34},
  {x:3.98,y:-1.66,z:-1.48,w:2.72,style:'left',kind:'photos',channel:0,roll:.067,yaw:.33},
  {x:-3.36,y:.81,z:-1.02,w:3.14,style:'console',kind:'photos',channel:1,roll:.105,yaw:-.27},
  {x:3.22,y:1.14,z:-.82,w:2.63,style:'classic',kind:'noise',pattern:1,roll:-.11,yaw:.32},
  {x:-3.40,y:2.65,z:-1.68,w:1.94,style:'portable',kind:'noise',pattern:4,roll:-.115,yaw:-.23,antenna:true},
  {x:.30,y:1.25,z:-2.05,w:2.27,style:'bottom',kind:'noise',pattern:0,roll:.135,yaw:.21},
  {x:-.72,y:1.37,z:.18,w:2.96,style:'console',kind:'photos',channel:2,roll:.046,yaw:-.09},
  {x:2.08,y:1.78,z:.46,w:2.48,style:'portable',kind:'video',source:1,roll:-.082,yaw:.15},
  {x:-.86,y:3.25,z:-.52,w:1.96,style:'portable',kind:'photos',channel:3,roll:.115,yaw:-.16,antenna:true},
  {x:-1.86,y:-.73,z:1.38,w:3.16,style:'left',kind:'home',roll:-.039,yaw:.025},
  {x:1.60,y:-.72,z:1.68,w:3.46,style:'bottom',kind:'explore',roll:.047,yaw:-.035}
];

function shape(width,height,radius){
  const s=new THREE.Shape(),x=-width/2,y=-height/2,r=radius;
  s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);
  s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function cabinetGeometry(w,h,d,radius=.075){const geo=new THREE.ExtrudeGeometry(shape(w,h,radius*h),{depth:d,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,curveSegments:5,steps:1});geo.translate(0,0,-d/2);return geo;}
function screenGeometry(width,height){
  const cols=24,rows=18,positions=[],uvs=[],indices=[],r=height*.12;
  for(let j=0;j<=rows;j++){
    const y=(j/rows-.5)*height,corner=Math.max(0,Math.abs(y)-(height/2-r));
    const half=width/2-r+Math.sqrt(Math.max(0,r*r-corner*corner));
    for(let i=0;i<=cols;i++){const x=(i/cols-.5)*2*half;positions.push(x,y,.08*(1-Math.pow(x/(width/2),2))*(1-Math.pow(y/(height/2),2)));uvs.push(i/cols,j/rows);}
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;indices.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
const screenVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const screenFragment=`
  uniform sampler2D uMap;uniform sampler2D uNextMap;uniform float uTime;uniform float uNoise;uniform float uHover;uniform float uSeed;uniform float uPattern;uniform float uInvite;uniform float uMotion;uniform float uPhoto;uniform float uBlend;uniform float uImageAspect;uniform float uNextImageAspect;uniform float uScreenAspect;uniform vec2 uPhotoProgress;varying vec2 vUv;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  vec2 photographUv(vec2 uv,float imageAspect,float progress,float seed){
    vec2 cover=vec2(1.);if(imageAspect>uScreenAspect)cover.x=uScreenAspect/imageAspect;else cover.y=imageAspect/uScreenAspect;
    float zoom=1.035+.055*progress;vec2 scale=cover/zoom;
    vec2 pan=vec2(sin(seed+progress*1.7),cos(seed*.73+progress*1.2))*(1.-scale)*.175;
    return .5+(uv-.5)*scale+pan;
  }
  void main(){
    vec2 q=vUv-.5;vec2 uv=q*(1.+.018*dot(q,q))+.5;
    vec3 original=texture2D(uMap,uv).rgb;
    if(uPhoto>.5){vec3 a=texture2D(uMap,photographUv(uv,uImageAspect,uPhotoProgress.x,uSeed)).rgb;vec3 b=texture2D(uNextMap,photographUv(uv,uNextImageAspect,uPhotoProgress.y,uSeed)).rgb;original=mix(a,b,smoothstep(0.,1.,uBlend));}
    float grey=dot(original,vec3(.299,.587,.114));
    vec3 image=mix(original,vec3(grey*.65,grey*.83,grey),.55);
    float grain=hash(floor(vUv*vec2(420.,320.))+vec2(uSeed*113.,floor(uTime*9.)+uSeed*41.));
    float band=.5+.5*sin(vUv.y*(21.+uSeed*.3)+uTime*(.19+uSeed*.003)+uSeed);
    float field=grain*.55+band*.20;
    if(uPattern>.5&&uPattern<1.5){float drift=(fract(vUv.y+uTime*.035+uSeed*.013)-.5)*9.;float tracking=exp(-drift*drift);field=.08+grain*.15+tracking*.48+pow(.5+.5*sin(vUv.y*69.+uSeed),14.)*.08;}
    if(uPattern>1.5&&uPattern<2.5){float bars=mod(floor(vUv.x*8.+uSeed),3.)/2.;field=.10+grain*.12+bars*.43+band*.10;}
    if(uPattern>2.5&&uPattern<3.5){float tear=step(.945,hash(vec2(floor(vUv.y*100.)+uSeed,floor(uTime*.8))));field=.08+grain*.27+tear*.32+(.5+.5*sin((vUv.x+vUv.y*.7)*24.+uSeed))*.15;}
    if(uPattern>3.5){float circle=1.-smoothstep(.018,.045,abs(length(q*vec2(1.,.76))-.27));float cross=exp(-abs(q.x)*130.)+exp(-abs(q.y)*130.);field=.10+floor(vUv.x*7.)/7.*.31+grain*.08+circle*.20+cross*.10;}
    vec3 snow=mix(vec3(.022,.045,.078),vec3(.32,.45,.52),clamp(field,0.,.76));
    vec3 colour=mix(image,snow,uNoise);
    colour*=.84+.16*(1.-dot(q*1.14,q*1.14));
    colour*=.97+.03*sin(vUv.y*720.);
    colour+=vec3(.19,.27,.32)*pow(max(0.,1.-length((vUv-vec2(.23,.84))*vec2(1.8,3.5))),6.)*.22;
    colour+=uHover*vec3(.025,.045,.055);
    float breathe=.5+.5*sin(uTime*1.32+uSeed*.15);
    colour*=1.+uInvite*(.10+.16*breathe*uMotion);
    float ring=exp(-abs(length(q*vec2(1.,1.15))-(.28+.10*breathe))*85.);
    colour+=uInvite*uMotion*ring*vec3(.026,.046,.057);
    gl_FragColor=vec4(colour,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function mountTelevisionEnding(section){
  if(!section||section.__televisionEnding)return section?.__televisionEnding;
  window.MoonI18n?.add(COPY);
  section.innerHTML=`<div class="tv-ending__sticky"><header class="tv-ending__header"><div><p class="tv-ending__eyebrow">05 / THE LAST SIGNAL</p><h2 id="last-signal-title">A city keeps<br><em>sending memories.</em></h2></div><p class="tv-ending__intro">The story does not end at the edge of the screen. Follow a signal back to the beginning, or open a memory once more.</p></header><div class="tv-ending__stage"><canvas class="tv-ending__canvas" aria-label="The last signal, an interactive wall of vintage televisions"></canvas><button class="tv-ending__screen-link" type="button" data-destination="home" aria-label="Return to Home" disabled><span>Home</span></button><button class="tv-ending__screen-link" type="button" data-destination="explore" aria-label="Return to Explore" disabled><span>Explore</span></button></div><p class="tv-ending__instruction" aria-live="polite">Keep scrolling. Let the screens turn towards you.</p><div class="tv-ending__fallback"><p>Your browser cannot display the television wall. The journey continues through these links.</p><nav aria-label="Chapter navigation"><button type="button" data-destination="home">Home</button><button type="button" data-destination="explore">Explore</button></nav></div></div><footer class="tv-ending__credits"><p class="tv-ending__signature">One city. One moon.<span>XIAMEN / THE MOON REMEMBERS</span></p><p class="tv-ending__disclaimer">Some images, recordings and music are sourced from the internet or supplied by the designer. This educational portfolio explores city memory; all rights remain with their respective creators. For attribution, correction or removal requests, please use the author’s contact details included with the accompanying portfolio.</p></footer>`;
  const stage=section.querySelector('.tv-ending__stage'),canvas=stage.querySelector('canvas'),instruction=section.querySelector('.tv-ending__instruction'),credits=section.querySelector('.tv-ending__credits'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),buttons=[...section.querySelectorAll('[data-destination]')],cleanups=[];
  let disposed=false,renderer,visible=false,raf=0,facing=false,progress=0,width=1,height=1,lastFrameTime=0;
  let settleTimer=0,settling=false,settleLocked=false,forwardIntentUntil=0,touchY=null,lastSectionTop=section.getBoundingClientRect().top;
  function cancelSettle(stop=false){
    if(settleTimer){clearTimeout(settleTimer);settleTimer=0;}
    if(stop&&settling)window.scrollTo({top:window.scrollY,behavior:'instant'});
    settling=false;
  }
  function scrollIntent(direction){
    if(direction<0){forwardIntentUntil=0;cancelSettle(true);}
    else if(direction>0)forwardIntentUntil=performance.now()+700;
  }
  function wheelIntent(event){if(!event.ctrlKey)scrollIntent(Math.sign(event.deltaY));}
  function touchStart(event){touchY=event.touches[0]?.clientY??null;}
  function touchMove(event){const y=event.touches[0]?.clientY;if(y===undefined||touchY===null)return;const delta=touchY-y;touchY=y;if(Math.abs(delta)>2)scrollIntent(Math.sign(delta));}
  function keyIntent(event){
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;
    if(['ArrowUp','PageUp','Home'].includes(event.key)||(event.key===' '&&event.shiftKey))scrollIntent(-1);
    else if(['ArrowDown','PageDown','End',' '].includes(event.key))scrollIntent(1);
  }
  function queueSettle(top,downward){
    if(top>innerHeight*.40)settleLocked=false;
    if(settling&&top<=2){settling=false;return;}
    if(settleTimer){clearTimeout(settleTimer);settleTimer=0;}
    // Only finish a deliberate forward approach, once per visit. Never drag a
    // reader back down after scrolling up or following a navigation link.
    if(disposed||!visible||document.hidden||reduced.matches||settleLocked||!downward||!forwardIntentUntil||top<=2||top>innerHeight*.34||performance.now()>forwardIntentUntil)return;
    settleTimer=setTimeout(()=>{
      settleTimer=0;const currentTop=section.getBoundingClientRect().top;
      if(disposed||!visible||document.hidden||reduced.matches||settleLocked||!forwardIntentUntil||currentTop<=2||currentTop>innerHeight*.34||performance.now()>forwardIntentUntil)return;
      settling=true;settleLocked=true;forwardIntentUntil=0;
      // Settle the sticky scene at its own start, not at the document bottom:
      // short viewports and the credits no longer determine button access.
      window.scrollTo({top:window.scrollY+currentTop,behavior:'smooth'});
    },110);
  }
  function navigate(destination){
    forwardIntentUntil=0;cancelSettle(true);
    const target=destination==='explore'?'explore-chapter':'';
    if(window.MoonNavigation?.go){window.MoonNavigation.go('home',target);return;}
    try{if(parent.MoonApp?.navigate){parent.MoonApp.navigate('home',target);return;}}catch{}
    if(window.MoonApp?.navigate){window.MoonApp.navigate('home',target);return;}
    const anchor=target?document.getElementById(target):document.documentElement;
    if(anchor){anchor.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});return;}
    location.href=`./index.html#/home${target?'/'+target:''}`;
  }
  buttons.forEach(button=>{const listener=()=>navigate(button.dataset.destination);button.addEventListener('click',listener);cleanups.push(()=>button.removeEventListener('click',listener));});
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{section.classList.add('is-fallback');const api={dispose(){disposed=true;cleanups.forEach(fn=>fn());delete section.__televisionEnding;}};section.__televisionEnding=api;return api;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const scene=new THREE.Scene(),rig=new THREE.Group(),camera=new THREE.PerspectiveCamera(36,1,.1,80);scene.add(rig);
  const textures=new Set(),materials=new Set(),geometries=new Set(),screenMaterials=[],navScreens=[],media=[],loader=new THREE.TextureLoader();
  const material=options=>{const m=new THREE.MeshStandardMaterial(options);materials.add(m);return m;};
  const bodyMaterials=[material({color:0x263b52,roughness:.81,metalness:.12}),material({color:0x344956,roughness:.76,metalness:.12}),material({color:0x182b43,roughness:.83,metalness:.15}),material({color:0x536975,roughness:.86,metalness:.09}),material({color:0x202e3a,roughness:.9,metalness:.08})];
  const trim=material({color:0x688393,roughness:.5,metalness:.55}),rubber=material({color:0x0b1727,roughness:.9}),vents=material({color:0x071320,roughness:.95}),rearBase=material({color:0x152638,roughness:.92});
  function mesh(geometry,mat,group,x=0,y=0,z=0){geometries.add(geometry);const item=new THREE.Mesh(geometry,mat);item.position.set(x,y,z);group.add(item);return item;}
  function loadTexture(url,onLoad){const tex=loader.load(url,loaded=>{if(disposed){loaded.dispose();return;}onLoad?.(loaded);schedule();},undefined,()=>{});tex.colorSpace=THREE.SRGBColorSpace;textures.add(tex);return tex;}
  const frontStyles=new Map(),photoMaterials=new Set(),rearPanels=[];let rearTextureReady=false;
  Object.entries(TV_STYLES).forEach(([name,definition])=>{
    const style={...definition,ready:false,panels:[]};frontStyles.set(name,style);
    const map=loadTexture(`./assets/${definition.front}`,()=>{style.ready=true;style.panels.forEach(panel=>panel.visible=true);});
    style.photo=material({map,roughness:.82,color:definition.tint,alphaTest:.15});photoMaterials.add(style.photo);
  });
  const rearTexture=loadTexture('./assets/tv-cabinet-rear.png',()=>{rearTextureReady=true;rearPanels.forEach(panel=>panel.visible=true);});
  const rearPhoto=material({map:rearTexture,roughness:.95,color:0xb6cbd8,alphaTest:.15});photoMaterials.add(rearPhoto);
  scene.add(new THREE.HemisphereLight(0xd7e6e4,0x13253a,2.0));
  const key=new THREE.DirectionalLight(0xd5e8ee,3.2);key.position.set(-6,10,7);scene.add(key);
  const fill=new THREE.DirectionalLight(0x779fba,1.35);fill.position.set(7,4,3);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xabc9dc,2.7);rim.position.set(4,8,-5);scene.add(rim);
  const frontGlow=new THREE.PointLight(0x95b8d0,3.0,13,2);frontGlow.position.set(0,-1,5);scene.add(frontGlow);

  const videoSlots=RECORDINGS.map((record,index)=>{
    const poster=loadTexture(record.poster),slot={...record,index,poster,texture:poster,videoElement:null,videoTexture:null,started:false};media.push(slot);return slot;
  });
  const navyData=new Uint8Array([31,54,76,255]),blank=new THREE.DataTexture(navyData,1,1);blank.needsUpdate=true;textures.add(blank);
  const photoResources=new Set(),photoScreens=new Map();
  function loadPhotograph(record){
    return new Promise((resolve,reject)=>{
      const resource={texture:null,aspect:4/3,released:false,dispose(){if(this.released)return;this.released=true;this.texture?.dispose();photoResources.delete(this);}};photoResources.add(resource);
      try{
        const texture=loader.load(record.src,loaded=>{const image=loaded.image;resource.aspect=(image?.naturalWidth||image?.width||4)/(image?.naturalHeight||image?.height||3);resolve(resource);},undefined,()=>{resource.dispose();reject(new Error('Photograph unavailable'));});
        texture.colorSpace=THREE.SRGBColorSpace;resource.texture=texture;
      }catch(error){resource.dispose();reject(error);}
    });
  }
  const photoChannels=photoPools(archiveMemories,4).map((records,index)=>createPhotoChannel({records,load:loadPhotograph,duration:[14.8,17.3,19.1,22.4][index],fadeDuration:1.8,phase:[.12,.37,.57,.76][index],onChange:schedule}));
  photoChannels.forEach(channel=>channel.setReduced(reduced.matches));
  function navTexture(label){
    const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textures.add(tex);
    const paint=()=>{const chinese=document.documentElement.lang==='zh-Hans',text=chinese?(label==='Home'?'首页':'探索'):label.toUpperCase();ctx.fillStyle='#20364e';ctx.fillRect(0,0,640,480);const g=ctx.createRadialGradient(320,215,15,320,240,400);g.addColorStop(0,'#547589');g.addColorStop(1,'#172c43');ctx.fillStyle=g;ctx.fillRect(0,0,640,480);ctx.strokeStyle='#adcad04d';ctx.lineWidth=1.5;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(320,220,115+i*38,0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#edf2e7';ctx.font=`${chinese?108:(label==='Home'?98:80)}px ${chinese?'"Alimama DaoLiTi"':'"Krona One"'}, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,320,220);ctx.font=chinese?'25px "Alimama DaoLiTi", sans-serif':'20px "Krona One", sans-serif';ctx.fillStyle='#c8d8d8';ctx.fillText(chinese?(label==='Home'?'00 / 回到起点':'02 / 再访记忆'):(label==='Home'?'00 / REWIND':'02 / REVISIT'),320,326);ctx.beginPath();ctx.moveTo(301,373);ctx.lineTo(339,373);ctx.moveTo(328,362);ctx.lineTo(339,373);ctx.lineTo(328,384);ctx.strokeStyle='#d3e0de';ctx.lineWidth=3;ctx.stroke();tex.needsUpdate=true;};paint();return {tex,paint};
  }
  TV_LAYOUT.forEach((entry,index)=>{
    const style=frontStyles.get(entry.style),group=new THREE.Group(),w=entry.w,h=w/style.ratio,d=w*style.depth;group.position.set(entry.x,entry.y,entry.z);group.rotation.set(.018*(index%3-1),entry.yaw,entry.roll);group.userData.cabinetStyle=entry.style;rig.add(group);
    mesh(cabinetGeometry(w,h,d,style.radius),bodyMaterials[index%bodyMaterials.length],group);
    const front=mesh(new THREE.PlaneGeometry(w,h),style.photo,group,0,0,d/2+.045);front.visible=style.ready;style.panels.push(front);
    const back=mesh(new THREE.PlaneGeometry(w*.76,h*.72),rearPhoto,group,0,.02,-d*.72-.045);back.rotation.y=Math.PI;back.visible=rearTextureReady;rearPanels.push(back);
    // The protruding rear casing catches light during the turn instead of
    // revealing a paper-thin billboard or a mirrored front image.
    mesh(cabinetGeometry(w*.76,h*.72,d*.32),rearBase,group,0,.02,-d*.56);
    for(let row=0;row<5;row++)mesh(new THREE.BoxGeometry(w*.58,.022,.018),vents,group,0,h*.17-row*.085,-d*.72-.025);
    if(style.plinth)mesh(new THREE.BoxGeometry(w*.95,.115,d*.84),bodyMaterials[4],group,0,-h/2-.07,-.01);
    for(const x of[-w*.34,w*.34]){mesh(new THREE.BoxGeometry(w*(style.handle?.09:.13),style.handle?.15:.1,d*.64),rubber,group,x,-h/2-.04,.02);mesh(new THREE.CylinderGeometry(.035,.035,.02,8),trim,group,x,-h*.30,-d*.73).rotation.x=Math.PI/2;}
    // Controls occupy three genuinely different parts of the face. Their
    // hardware and live-screen aperture match the corresponding photograph.
    if(style.controls==='bottom'){
      mesh(new THREE.BoxGeometry(w*.80,h*.022,.05),trim,group,0,-h*.245,d/2+.065);
      for(const x of[w*.245,w*.365]){const knob=mesh(new THREE.CylinderGeometry(w*.034,w*.037,.07,20),trim,group,x,-h*.35,d/2+.09);knob.rotation.x=Math.PI/2;mesh(new THREE.BoxGeometry(.012,w*.040,.02),rubber,group,x,-h*.35+w*.008,d/2+.135);}
      for(let row=0;row<3;row++)mesh(new THREE.BoxGeometry(w*.36,.014,.016),vents,group,-w*.20,-h*.31-row*.043,d/2+.06);
    }else{
      const side=style.controls==='left'?-1:1;
      mesh(new THREE.BoxGeometry(w*.025,h*.73,.045),trim,group,w*.287*side,0,d/2+.065);
      for(const y of[h*.323,h*.128]){const knob=mesh(new THREE.CylinderGeometry(w*.049,w*.052,.075,20),trim,group,w*.38*side,y,d/2+.095);knob.rotation.x=Math.PI/2;mesh(new THREE.BoxGeometry(.015,w*.057,.02),rubber,group,w*.38*side,y+w*.011,d/2+.143);}
      for(let row=0;row<5;row++)mesh(new THREE.BoxGeometry(w*.14,.017,.016),vents,group,w*.37*side,-h*.25-row*.045,d/2+.06);
    }
    if(style.handle){mesh(new THREE.BoxGeometry(w*.36,.055,d*.09),rubber,group,0,h/2+.15,0);for(const x of[-w*.18,w*.18])mesh(new THREE.BoxGeometry(.05,.13,d*.09),trim,group,x,h/2+.09,0);}
    let map=blank,nav;
    if(entry.kind==='video')map=videoSlots[entry.source].poster;
    else if(entry.kind==='home'||entry.kind==='explore'){nav=navTexture(entry.kind==='home'?'Home':'Explore');map=nav.tex;}
    const [left,right,top,bottom]=style.screen,sw=w*(right-left),sh=h*(bottom-top),sx=w*((left+right)/2-.5),sy=h*(.5-(top+bottom)/2);
    const uniforms={uMap:{value:map},uNextMap:{value:map},uTime:{value:0},uNoise:{value:entry.kind==='noise'||entry.kind==='photos'?1:0},uHover:{value:0},uSeed:{value:1.7+index*2.39},uPattern:{value:entry.pattern??index%5},uInvite:{value:nav?1:0},uMotion:{value:reduced.matches?0:1},uPhoto:{value:0},uBlend:{value:0},uImageAspect:{value:4/3},uNextImageAspect:{value:4/3},uScreenAspect:{value:sw/sh},uPhotoProgress:{value:new THREE.Vector2()}},screenMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:screenVertex,fragmentShader:screenFragment,toneMapped:true});materials.add(screenMaterial);screenMaterials.push(screenMaterial);
    const screen=mesh(screenGeometry(sw,sh),screenMaterial,group,sx,sy,d/2+.105);
    if(entry.kind==='video')screen.userData.source=entry.source;
    if(entry.kind==='photos'){screen.userData.photoChannel=entry.channel;photoScreens.set(entry.channel,screenMaterial);}
    if(nav){const button=stage.querySelector(`[data-destination="${entry.kind}"]`);navScreens.push({screen,group,button,sw,sh,paint:nav.paint});const on=()=>{uniforms.uHover.value=1;schedule();},off=()=>{uniforms.uHover.value=0;schedule();};button.addEventListener('pointerenter',on);button.addEventListener('pointerleave',off);button.addEventListener('focus',on);button.addEventListener('blur',off);cleanups.push(()=>{button.removeEventListener('pointerenter',on);button.removeEventListener('pointerleave',off);button.removeEventListener('focus',on);button.removeEventListener('blur',off);});}
    if(entry.antenna){for(const direction of[-1,1]){const start=new THREE.Vector3(w*.20*direction,h/2+.05,-d*.12),end=new THREE.Vector3(w*.48*direction,h*.91,-d*.15),v=end.clone().sub(start),a=mesh(new THREE.CylinderGeometry(.009,.009,v.length(),5),trim,group);a.position.copy(start.add(end).multiplyScalar(.5));a.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());}}
  });
  // Bake the static physical details into one draw per material. The cabinet
  // bevels, feet, antennae and vents stay intact without hundreds of draw calls.
  rig.updateWorldMatrix(true,true);
  const batches=new Map();
  rig.traverse(item=>{if(!item.isMesh||item.material.isShaderMaterial||photoMaterials.has(item.material))return;const parts=batches.get(item.material)||[];parts.push(item);batches.set(item.material,parts);});
  batches.forEach((parts,mat)=>{
    const pieces=parts.map(item=>{const geo=item.geometry.index?item.geometry.toNonIndexed():item.geometry.clone();geo.applyMatrix4(item.matrixWorld);return geo;});
    const combined=new THREE.BufferGeometry();
    for(const name of['position','normal','uv']){const arrays=pieces.map(geo=>geo.getAttribute(name).array),total=arrays.reduce((sum,a)=>sum+a.length,0),array=new Float32Array(total);let offset=0;arrays.forEach(a=>{array.set(a,offset);offset+=a.length;});combined.setAttribute(name,new THREE.Float32BufferAttribute(array,name==='uv'?2:3));}
    pieces.forEach(geo=>geo.dispose());parts.forEach(item=>{item.parent.remove(item);geometries.delete(item.geometry);item.geometry.dispose();});mesh(combined,mat,rig);
  });
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=512;shadowCanvas.height=128;const shadowContext=shadowCanvas.getContext('2d'),gradient=shadowContext.createRadialGradient(256,64,8,256,64,250);gradient.addColorStop(0,'#030e20c0');gradient.addColorStop(1,'#030e2000');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,512,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);textures.add(shadowTexture);const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.8});materials.add(shadowMaterial);const shadow=mesh(new THREE.PlaneGeometry(12,3),shadowMaterial,scene,0,-4.12,0);shadow.rotation.x=-Math.PI/2;
  camera.position.set(0,.55,20);camera.lookAt(0,.30,0);
  const corner=new THREE.Vector3();
  function updateButtons(){
    rig.updateWorldMatrix(true,true);
    navScreens.forEach(({screen,button,sw,sh})=>{let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const x of[-sw/2,sw/2])for(const y of[-sh/2,sh/2]){corner.set(x,y,0);screen.localToWorld(corner);corner.project(camera);const px=(corner.x*.5+.5)*width,py=(-corner.y*.5+.5)*height;minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);}button.style.left=`${(minX+maxX)/2}px`;button.style.top=`${(minY+maxY)/2}px`;button.style.width=`${Math.max(44,maxX-minX)}px`;button.style.height=`${Math.max(44,maxY-minY)}px`;button.disabled=!facing;button.tabIndex=facing?0:-1;});
  }
  function startMedia(){
    media.forEach(slot=>{
      if(!slot.started){slot.started=true;const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');video.src=slot.video;slot.videoElement=video;const ready=()=>{if(disposed)return;if(!slot.videoTexture){slot.videoTexture=new THREE.VideoTexture(video);slot.videoTexture.colorSpace=THREE.SRGBColorSpace;textures.add(slot.videoTexture);rig.traverse(item=>{if(item.isMesh&&item.userData.source===slot.index)item.material.uniforms.uMap.value=slot.videoTexture;});}schedule();};video.addEventListener('loadeddata',ready);cleanups.push(()=>video.removeEventListener('loadeddata',ready));}
      if(visible&&!document.hidden&&progress>.84&&slot.videoElement.paused)slot.videoElement.play()?.catch(()=>{});
    });
  }
  function syncMedia(){const active=visible&&!document.hidden&&progress>.84;if(active)startMedia();else{media.forEach(slot=>slot.videoElement?.pause());lastFrameTime=0;}photoChannels.forEach(channel=>{channel.setReduced(reduced.matches);channel.setActive(active);});}
  function schedule(){if(disposed||raf||!visible||document.hidden)return;raf=requestAnimationFrame(frame);}
  function scroll(){
    const rect=section.getBoundingClientRect(),downward=lastSectionTop-rect.top>.5,upward=rect.top-lastSectionTop>.5,next=reduced.matches?1:ease(clamp((innerHeight*.85-rect.top)/(innerHeight*.73)));lastSectionTop=rect.top;progress=next;instruction.style.opacity=credits.getBoundingClientRect().top<innerHeight-25?'0':'1';
    if(upward){forwardIntentUntil=0;cancelSettle(true);}
    // Ten degrees or less from frontal is already a clear, usable screen.
    // Enable the projected hit areas before the final scroll pixels are spent.
    const nextFacing=next>.945;if(nextFacing!==facing){facing=nextFacing;section.classList.toggle('is-facing',facing);instruction.textContent=window.MoonI18n?.t(facing?'Choose a screen. A familiar place is waiting.':'Keep scrolling. Let the screens turn towards you.')||(facing?'Choose a screen. A familiar place is waiting.':'Keep scrolling. Let the screens turn towards you.');}
    rig.rotation.y=(1-next)*Math.PI;rig.rotation.x=(1-next)*-.028;syncMedia();updateButtons();schedule();
    queueSettle(rect.top,downward);
  }
  function frame(time){
    raf=0;if(disposed||!visible||document.hidden)return;const delta=lastFrameTime?clamp((time-lastFrameTime)/1000,0,.1):0;lastFrameTime=time;
    screenMaterials.forEach(m=>{m.uniforms.uTime.value=reduced.matches?0:time/1000;m.uniforms.uMotion.value=reduced.matches?0:1;});
    photoChannels.forEach((channel,index)=>{channel.setReduced(reduced.matches);const state=channel.tick(delta),u=photoScreens.get(index).uniforms,current=state.currentResource,next=state.nextResource||current;u.uPhoto.value=current?1:0;u.uNoise.value=current?0:1;if(current){u.uMap.value=current.texture;u.uNextMap.value=next.texture;u.uImageAspect.value=current.aspect;u.uNextImageAspect.value=next.aspect;u.uBlend.value=state.blend;u.uPhotoProgress.value.set(state.currentProgress,state.nextProgress);}});
    renderer.render(scene,camera);schedule();
  }
  function resize(){width=stage.clientWidth;height=stage.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;const vertical=11.6,horizontal=12.1/Math.max(camera.aspect,.2),fit=Math.max(vertical,horizontal);camera.position.z=fit/(2*Math.tan(THREE.MathUtils.degToRad(18)));camera.lookAt(0,.30,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();updateButtons();schedule();}
  function visibility(){if(document.hidden){forwardIntentUntil=0;cancelSettle(true);}syncMedia();schedule();}
  function layoutOrMotionChanged(){forwardIntentUntil=0;cancelSettle(true);scroll();}
  function language(){navScreens.forEach(nav=>nav.paint());const text=facing?'Choose a screen. A familiar place is waiting.':'Keep scrolling. Let the screens turn towards you.';instruction.textContent=window.MoonI18n?.t(text)||text;schedule();}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelSettle(true);if(raf){cancelAnimationFrame(raf);raf=0;}}scroll();syncMedia();schedule();},{rootMargin:'100px 0px'});observer.observe(section.querySelector('.tv-ending__sticky'));
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',layoutOrMotionChanged,{passive:true});window.addEventListener('moon-language-change',language);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',layoutOrMotionChanged);
  window.addEventListener('wheel',wheelIntent,{passive:true});window.addEventListener('touchstart',touchStart,{passive:true});window.addEventListener('touchmove',touchMove,{passive:true});window.addEventListener('keydown',keyIntent);
  const contextLost=event=>{event.preventDefault();visible=false;cancelSettle(true);if(raf){cancelAnimationFrame(raf);raf=0;}section.classList.add('is-fallback');syncMedia();};canvas.addEventListener('webglcontextlost',contextLost);
  function dispose(){if(disposed)return;disposed=true;cancelSettle(true);if(raf)cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',layoutOrMotionChanged);window.removeEventListener('moon-language-change',language);window.removeEventListener('wheel',wheelIntent);window.removeEventListener('touchstart',touchStart);window.removeEventListener('touchmove',touchMove);window.removeEventListener('keydown',keyIntent);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',layoutOrMotionChanged);canvas.removeEventListener('webglcontextlost',contextLost);window.removeEventListener('pagehide',dispose);cleanups.forEach(fn=>fn());media.forEach(slot=>{if(slot.videoElement){slot.videoElement.pause();slot.videoElement.removeAttribute('src');slot.videoElement.load();}});photoChannels.forEach(channel=>channel.dispose());photoResources.forEach(resource=>resource.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();delete section.__televisionEnding;}
  window.addEventListener('pagehide',dispose,{once:true});const api={dispose,navigate,getState:()=>({visible,facing,progress,settling,settleScheduled:!!settleTimer,videoSources:media.filter(m=>m.started).length,cabinetCount:TV_LAYOUT.length,cabinetStyles:Object.keys(TV_STYLES).length,photoTextures:photoResources.size,photoChannels:photoChannels.map(channel=>{const state=channel.getState();return{current:state.current?.id,next:state.next?.id,blend:state.blend,active:state.active};})})};section.__televisionEnding=api;resize();scroll();return api;
}
