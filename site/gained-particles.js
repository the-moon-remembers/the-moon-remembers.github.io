import * as THREE from './vendor/three/three.module.min.js';
import {MeshSurfaceSampler} from './vendor/three/MeshSurfaceSampler.js';

// Sample the existing meshes, rather than substituting a different particle silhouette.
function surface(model,count){
  model.updateMatrixWorld(true);const entries=[];let total=0;
  model.traverse(mesh=>{if(!mesh.isMesh)return;const sampler=new MeshSurfaceSampler(mesh).build();const area=sampler.distribution[sampler.distribution.length-1];if(!area)return;const scale=new THREE.Vector3();mesh.matrixWorld.decompose(new THREE.Vector3(),new THREE.Quaternion(),scale);total+=area*Math.pow(Math.abs(scale.x*scale.y*scale.z),2/3);entries.push({mesh,sampler,end:total});});
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3),point=new THREE.Vector3(),cream=new THREE.Color(0xfdf1d7);
  for(let i=0;i<count;i++){const ticket=Math.random()*total,entry=entries.find(e=>e.end>=ticket)||entries.at(-1);entry.sampler.sample(point);point.applyMatrix4(entry.mesh.matrixWorld);point.toArray(positions,i*3);const color=entry.mesh.material.color.clone().lerp(cream,.24);color.toArray(colors,i*3);}
  return{positions,colors};
}

export function prepareDissolve(model){
  const dissolve={value:0};
  model.traverse(mesh=>{if(!mesh.isMesh)return;mesh.material=mesh.material.clone();mesh.material.onBeforeCompile=shader=>{
    shader.uniforms.uDissolve=dissolve;
    shader.vertexShader='varying vec3 vDustSurface;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDustSurface=transformed;');
    shader.fragmentShader='uniform float uDissolve;varying vec3 vDustSurface;float dustHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(uDissolve>0.0&&dustHash(floor(vDustSurface*42.0))<uDissolve)discard;');
  };mesh.material.customProgramCacheKey=()=> 'moon-dust-dissolve-v1';});
  return dissolve;
}

export function createDustTransition(from,to,count=12000){
  const start=surface(from,count),end=surface(to,count),scatter=new Float32Array(count*3),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,z=Math.random()*2-1,radius=.65+Math.random()*1.1,r=Math.sqrt(1-z*z);scatter.set([Math.cos(angle)*r*radius,z*radius*.8,Math.sin(angle)*r*radius],i*3);seeds[i]=Math.random();}
  const geometry=new THREE.BufferGeometry();
  for(const[name,array,size]of[['position',start.positions,3],['aTarget',end.positions,3],['aFromColor',start.colors,3],['aToColor',end.colors,3],['aScatter',scatter,3],['aSeed',seeds,1]])geometry.setAttribute(name,new THREE.BufferAttribute(array,size));
  const progress={value:0},pixelRatio={value:1};
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uProgress:progress,uPixelRatio:pixelRatio},vertexShader:`
    uniform float uProgress;uniform float uPixelRatio;
    attribute vec3 aTarget;attribute vec3 aFromColor;attribute vec3 aToColor;attribute vec3 aScatter;attribute float aSeed;
    varying vec3 vColor;varying float vOpacity;varying float vSeed;
    void main(){
      float t=clamp(uProgress,0.0,1.0),gather=smoothstep(.28,.91,t);
      float cloud=sin(3.14159265*smoothstep(.04,.96,t));
      vec3 base=mix(position,aTarget,gather);
      float angle=t*5.0+aSeed*6.2831853;
      vec3 curl=vec3(sin(angle+base.y*2.0),cos(angle*.8+base.x*2.0),sin(angle*.7+base.z*2.0));
      vec3 transformed=base+cloud*(aScatter+curl*.34);
      vec4 view=modelViewMatrix*vec4(transformed,1.0);gl_Position=projectionMatrix*view;
      gl_PointSize=clamp((1.6+aSeed*2.1)*uPixelRatio*(5.8/-view.z),1.0,7.0);
      vColor=mix(aFromColor,aToColor,gather);vColor=mix(vColor,vec3(.72,.89,1.0),cloud*.36);
      vOpacity=smoothstep(.01,.18,t)*(1.0-smoothstep(.84,1.0,t));vSeed=aSeed;
    }`,fragmentShader:`
    varying vec3 vColor;varying float vOpacity;varying float vSeed;
    void main(){vec2 p=gl_PointCoord-.5;float d=length(p);if(d>.5)discard;float core=1.0-smoothstep(.12,.5,d);gl_FragColor=vec4(vColor,core*vOpacity*(.58+vSeed*.4));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.renderOrder=2;
  return{points,update(t,dpr){progress.value=t;pixelRatio.value=dpr;},dispose(){geometry.dispose();material.dispose();}};
}

export function disposeModel(model){model.traverse(mesh=>{mesh.geometry?.dispose();if(mesh.isMesh)mesh.material.dispose();});}
