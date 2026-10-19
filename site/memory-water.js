// Advected velocity/density + pressure projection + wave refraction.
// Five fingertips inject momentum; revealing regions diffuse, curl, then settle.
// Upload decoded frames, not every refresh of the display. The fluid still runs
// at the display's requestAnimationFrame cadence, including between video frames.
export class VideoFrames {
  constructor(video){this.video=video;this.dirty=true;this.time=-1;this.closed=false;this.callback=null;this.notified=typeof video?.requestVideoFrameCallback==='function';if(this.notified)this.watch();}
  watch(){if(this.closed)return;this.callback=this.video.requestVideoFrameCallback(()=>{if(this.closed)return;this.dirty=true;this.watch();});}
  needsUpload(){const v=this.video;return !this.closed&&v.readyState>=2&&v.videoWidth&&(this.notified?this.dirty:v.currentTime!==this.time);}
  uploaded(){this.dirty=false;this.time=this.video.currentTime;}
  close(){this.closed=true;if(this.callback!==null)this.video.cancelVideoFrameCallback?.(this.callback);this.callback=null;}
}
export class MemoryWater {
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false});if(!this.gl)throw new Error('WebGL2 unavailable');
    const g=this.gl;this.float=!!g.getExtension('EXT_color_buffer_float');this.parallel=g.getExtension('KHR_parallel_shader_compile');this.programs=[];this.uniforms=new Map();this.pointValues=new Float32Array(20);this.previousValues=new Float32Array(10);this.size=[384,216];this.points=[];this.lastPoints=[];this.reveal=0;this.shift=[0,0];this.ready=false;this.clock=0;
    const vs=`#version 300 es
    in vec2 a;out vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0,1);}`;
    const common=`#version 300 es
    precision highp float;in vec2 uv;out vec4 color;uniform sampler2D field;uniform vec2 texel;`;
    this.sim=this.program(vs,common+`
    uniform vec4 points[5];uniform vec2 previous[5];uniform int count;uniform float aspect;uniform float decay;
    float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/max(dot(d,d),.00001),0.,1.));}
    void main(){vec4 s=texture(field,uv);float h=s.r-.5019608;float v=s.g-.5019608;
    float l=texture(field,uv-vec2(texel.x,0)).r;float r=texture(field,uv+vec2(texel.x,0)).r;float b=texture(field,uv-vec2(0,texel.y)).r;float t=texture(field,uv+vec2(0,texel.y)).r;
    v=(v+(l+r+b+t-4.*s.r)*.23)*.965;h=clamp(h+v,-.4,.4);vec2 flow=vec2(r-l,t-b)*.018;
    float mask=max(0.,texture(field,clamp(uv-flow,.001,.999)).b-decay);
    for(int i=0;i<5;i++){if(i>=count)break;float d=segment(uv*vec2(aspect,1),points[i].xy*vec2(aspect,1),previous[i]*vec2(aspect,1));float brush=1.-smoothstep(points[i].w*.25,points[i].w,d);mask=max(mask,brush*.98);h+=brush*points[i].z*.06;}
    color=vec4(h+.5019608,v+.5019608,mask,1.);}`);
    this.flow=this.program(vs,common+`
    uniform vec4 points[5];uniform vec2 previous[5];uniform int count;uniform float aspect;uniform float stepSize;uniform float time;
    const float zero=.5019608;
    float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/max(dot(d,d),.00001),0.,1.));}
    void main(){vec2 v=texture(field,uv).rg-vec2(zero);vec2 back=clamp(uv-v*stepSize,.001,.999);vec4 s=texture(field,back);
      vec4 l=texture(field,back-vec2(texel.x,0)),r=texture(field,back+vec2(texel.x,0)),b=texture(field,back-vec2(0,texel.y)),t=texture(field,back+vec2(0,texel.y));
      vec4 average=(l+r+b+t)*.25;v=mix(s.rg,average.rg,.12)-vec2(zero);v*=pow(.990,stepSize);
      float spread=(texture(field,back-vec2(texel.x*4.,0)).b+texture(field,back+vec2(texel.x*4.,0)).b+texture(field,back-vec2(0,texel.y*4.)).b+texture(field,back+vec2(0,texel.y*4.)).b)*.25;
      float dye=max(0.,mix(mix(s.b,average.b,.20),spread,.10)-.0018*stepSize);
      vec2 curl=vec2(-(t.b-b.b),r.b-l.b);v+=curl*.0025*sin(time*1.2+uv.x*9.+uv.y*7.)*stepSize;
      // A divergence-free, evolving current acts only on disturbed water.
      vec2 phase=uv*vec2(23.,38.)+vec2(-time*.35,time*.5);
      v+=vec2(sin(phase.x)*cos(phase.y),-cos(phase.x)*sin(phase.y)*23./38.)*dye*.0009*stepSize;
      for(int i=0;i<5;i++){if(i>=count)break;vec2 movement=points[i].xy-previous[i];float speed=min(1.,length(movement*vec2(aspect,1))*55.);
        vec2 relative=(uv-points[i].xy)*vec2(aspect,1);float radius=points[i].w*(.75+speed*.65);
        float d=segment(uv*vec2(aspect,1),points[i].xy*vec2(aspect,1),previous[i]*vec2(aspect,1));
        float falloff=exp(-d*d/(radius*radius*.48));
        // Momentum and a local eddy keep each touch from becoming a rigid stamp.
        vec2 tangential=vec2(-relative.y,relative.x)/vec2(aspect,1);
        v+=movement*falloff*1.5+tangential*falloff*speed*.045;
        // Stationary pointers don't keep painting; moving strokes retain fluid eddies.
        dye=min(1.,dye+falloff*speed*.42*stepSize);
      }
      if(uv.x<texel.x||uv.x>1.-texel.x)v.x=0.;if(uv.y<texel.y||uv.y>1.-texel.y)v.y=0.;
      color=vec4(clamp(v,-.035,.035)+vec2(zero),dye,1.);
    }`);
    this.divergence=this.program(vs,common+`
    void main(){float l=texture(field,uv-vec2(texel.x,0)).r,r=texture(field,uv+vec2(texel.x,0)).r,b=texture(field,uv-vec2(0,texel.y)).g,t=texture(field,uv+vec2(0,texel.y)).g;color=vec4(.5019608+.5*(r-l+t-b),0,0,1);}`);
    this.pressure=this.program(vs,common+`
    uniform sampler2D divergence;
    void main(){float l=texture(field,uv-vec2(texel.x,0)).r-.5019608,r=texture(field,uv+vec2(texel.x,0)).r-.5019608,b=texture(field,uv-vec2(0,texel.y)).r-.5019608,t=texture(field,uv+vec2(0,texel.y)).r-.5019608;float d=texture(divergence,uv).r-.5019608;color=vec4(.5019608+(l+r+b+t-d)*.25,0,0,1);}`);
    this.project=this.program(vs,common+`
    uniform sampler2D pressure;
    void main(){float l=texture(pressure,uv-vec2(texel.x,0)).r,r=texture(pressure,uv+vec2(texel.x,0)).r,b=texture(pressure,uv-vec2(0,texel.y)).r,t=texture(pressure,uv+vec2(0,texel.y)).r;vec4 s=texture(field,uv);s.rg-=.5*vec2(r-l,t-b);color=s;}`);
    this.display=this.program(vs,common+`
    uniform sampler2D present;uniform sampler2D past;uniform sampler2D currents;uniform vec2 nowSize;uniform vec2 oldSize;uniform vec2 screen;uniform float reveal;uniform vec2 shift;
    vec2 cover(vec2 p,vec2 image){float sa=screen.x/screen.y;float ia=image.x/image.y;vec2 scale=ia>sa?vec2(sa/ia,1):vec2(1,ia/sa);return (p-.5)*scale*.97+.5+shift*.006;}
    void main(){vec4 f=texture(field,uv),flow=texture(currents,uv);vec2 grad=vec2(texture(field,uv+vec2(texel.x,0)).r-texture(field,uv-vec2(texel.x,0)).r,texture(field,uv+vec2(0,texel.y)).r-texture(field,uv-vec2(0,texel.y)).r);vec2 edge=vec2(texture(currents,uv+vec2(texel.x*2.,0)).b-texture(currents,uv-vec2(texel.x*2.,0)).b,texture(currents,uv+vec2(0,texel.y*2.)).b-texture(currents,uv-vec2(0,texel.y*2.)).b);vec2 ripple=grad*.22+(flow.rg-vec2(.5019608))*.9+edge*.018;vec3 n=texture(present,cover(uv+ripple,nowSize)).rgb;vec3 o=texture(past,cover(uv-ripple*.4,oldSize)).rgb;float m=max(smoothstep(.025,.6,flow.b),reveal);vec3 c=mix(n,o,m);c+=vec3(.55,.75,.85)*clamp((grad.x-grad.y)*1.1+length(edge)*.15,-.1,.12);color=vec4(c,1.);}`);
    this.buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),g.STATIC_DRAW);this.fields=[this.target(),this.target()];this.flows=[this.target(),this.target()];this.pressures=[this.target(),this.target()];this.div=this.target();this.index=0;this.clear();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();this.compilation=this.finishPrograms();
  }
  program(v,f){const g=this.gl,p=g.createProgram();for(const[type,source]of[[g.VERTEX_SHADER,v],[g.FRAGMENT_SHADER,f]]){const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);g.attachShader(p,s);g.deleteShader(s);}g.bindAttribLocation(p,0,'a');g.linkProgram(p);this.programs.push(p);return p;}
  finishPrograms(){const g=this.gl,started=performance.now();return new Promise((resolve,reject)=>{const poll=()=>{try{if(g.isContextLost())throw new Error('Water graphics context interrupted');if(this.parallel&&!this.programs.every(p=>g.getProgramParameter(p,this.parallel.COMPLETION_STATUS_KHR))){if(performance.now()-started>30000)throw new Error('Water shader preparation timed out');requestAnimationFrame(poll);return;}for(const p of this.programs)if(!g.getProgramParameter(p,g.LINK_STATUS))throw new Error(g.getProgramInfoLog(p)||'Water shader could not link');this.vao=g.createVertexArray();g.bindVertexArray(this.vao);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.enableVertexAttribArray(0);g.vertexAttribPointer(0,2,g.FLOAT,false,0,0);resolve();}catch(error){reject(error);}};requestAnimationFrame(poll);});}
  uniform(p,name){let cache=this.uniforms.get(p);if(!cache){cache=new Map();this.uniforms.set(p,cache);}if(!cache.has(name))cache.set(name,this.gl.getUniformLocation(p,name));return cache.get(name);}
  target(){const g=this.gl,texture=g.createTexture();g.bindTexture(g.TEXTURE_2D,texture);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage2D(g.TEXTURE_2D,0,this.float?g.RGBA16F:g.RGBA,...this.size,0,g.RGBA,this.float?g.HALF_FLOAT:g.UNSIGNED_BYTE,null);const fbo=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,texture,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw new Error('Water buffer unavailable');return {texture,fbo};}
  clear(){const g=this.gl;[...this.fields,...this.flows,...this.pressures,this.div].forEach(t=>{g.bindFramebuffer(g.FRAMEBUFFER,t.fbo);g.clearColor(128/255,128/255,0,1);g.clear(g.COLOR_BUFFER_BIT);});g.bindFramebuffer(g.FRAMEBUFFER,null);this.points=[];this.lastPoints=[];}
  resize(){const box=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),width=Math.max(1,Math.round(box.width*dpr)),height=Math.max(1,Math.round(box.height*dpr));if(this.canvas.width!==width)this.canvas.width=width;if(this.canvas.height!==height)this.canvas.height=height;}
  texture(image){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,image);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);return t;}
  setImages(now,old){const g=this.gl;this.stopVideos();if(this.nowTexture)g.deleteTexture(this.nowTexture);if(this.oldTexture)g.deleteTexture(this.oldTexture);this.nowTexture=this.texture(now);this.oldTexture=this.texture(old);this.nowSize=[now.naturalWidth,now.naturalHeight];this.oldSize=[old.naturalWidth,old.naturalHeight];this.clear();this.ready=true;}
  stopVideos(){this.videoFrames?.forEach(frame=>frame.close());this.videoFrames=null;this.videos=null;this.videoTimes=[-1,-1];}
  setVideos(now,old){this.stopVideos();this.videos=[now,old];this.videoFrames=this.videos.map(v=>new VideoFrames(v));}
  updateVideos(){if(!this.videos)return;const g=this.gl;this.videos.forEach((v,i)=>{const frame=this.videoFrames[i];if(!v||!frame.needsUpload())return;try{g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,i?this.oldTexture:this.nowTexture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);const size=i?this.oldSize:this.nowSize;if(size[0]!==v.videoWidth||size[1]!==v.videoHeight){g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,v);if(i)this.oldSize=[v.videoWidth,v.videoHeight];else this.nowSize=[v.videoWidth,v.videoHeight];}else g.texSubImage2D(g.TEXTURE_2D,0,0,0,g.RGBA,g.UNSIGNED_BYTE,v);this.videoTimes[i]=v.currentTime;frame.uploaded();}catch(error){frame.close();this.videos[i]=null;this.onVideoError?.(error);}});}
  setPoints(points){this.points=points.slice(0,5);}
  bind(p){const g=this.gl;g.useProgram(p);g.bindVertexArray(this.vao);}
  sampler(p,name,unit,texture){const g=this.gl;g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,texture);g.uniform1i(this.uniform(p,name),unit);}
  pass(p,target,field){const g=this.gl;this.bind(p);g.bindFramebuffer(g.FRAMEBUFFER,target.fbo);g.viewport(0,0,...this.size);this.sampler(p,'field',0,field);g.uniform2f(this.uniform(p,'texel'),1/this.size[0],1/this.size[1]);}
  draw(dt){if(!this.ready)return;this.updateVideos();const g=this.gl,src=this.fields[this.index],dest=this.fields[1-this.index];this.clock+=dt/1000;
    const pts=this.pointValues,prev=this.previousValues;pts.fill(0);prev.fill(0);this.points.forEach((p,i)=>{const last=this.lastPoints[i]||p,j=i*4,k=i*2;pts[j]=p.x;pts[j+1]=1-p.y;pts[j+2]=Math.min(1,Math.hypot(p.x-last.x,p.y-last.y)*25);pts[j+3]=p.radius||.03;prev[k]=last.x;prev[k+1]=1-last.y;});
    this.pass(this.flow,this.flows[1],this.flows[0].texture);g.uniform4fv(this.uniform(this.flow,'points[0]'),pts);g.uniform2fv(this.uniform(this.flow,'previous[0]'),prev);g.uniform1i(this.uniform(this.flow,'count'),this.points.length);g.uniform1f(this.uniform(this.flow,'aspect'),this.canvas.width/this.canvas.height);g.uniform1f(this.uniform(this.flow,'stepSize'),Math.min(dt/16.667,2));g.uniform1f(this.uniform(this.flow,'time'),this.clock);g.drawArrays(g.TRIANGLES,0,3);
    if(this.float){this.pass(this.divergence,this.div,this.flows[1].texture);g.drawArrays(g.TRIANGLES,0,3);let p=0;for(let i=0;i<12;i++){this.pass(this.pressure,this.pressures[1-p],this.pressures[p].texture);this.sampler(this.pressure,'divergence',1,this.div.texture);g.drawArrays(g.TRIANGLES,0,3);p=1-p;}this.pass(this.project,this.flows[0],this.flows[1].texture);this.sampler(this.project,'pressure',1,this.pressures[p].texture);g.drawArrays(g.TRIANGLES,0,3);}else{[this.flows[0],this.flows[1]]=[this.flows[1],this.flows[0]];}
    this.pass(this.sim,dest,src.texture);g.uniform1f(this.uniform(this.sim,'aspect'),this.canvas.width/this.canvas.height);g.uniform1f(this.uniform(this.sim,'decay'),Math.max(this.float?0:.004,dt/4200));g.uniform4fv(this.uniform(this.sim,'points[0]'),pts);g.uniform2fv(this.uniform(this.sim,'previous[0]'),prev);g.uniform1i(this.uniform(this.sim,'count'),this.points.length);g.drawArrays(g.TRIANGLES,0,3);this.lastPoints=this.points.map(p=>({...p}));this.index=1-this.index;
    this.bind(this.display);g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,this.canvas.width,this.canvas.height);this.sampler(this.display,'field',0,dest.texture);this.sampler(this.display,'present',1,this.nowTexture);this.sampler(this.display,'past',2,this.oldTexture);this.sampler(this.display,'currents',3,this.flows[0].texture);g.uniform2f(this.uniform(this.display,'texel'),1/this.size[0],1/this.size[1]);g.uniform2fv(this.uniform(this.display,'nowSize'),this.nowSize);g.uniform2fv(this.uniform(this.display,'oldSize'),this.oldSize);g.uniform2f(this.uniform(this.display,'screen'),this.canvas.width,this.canvas.height);g.uniform1f(this.uniform(this.display,'reveal'),this.reveal);g.uniform2fv(this.uniform(this.display,'shift'),this.shift);g.drawArrays(g.TRIANGLES,0,3);
  }
}
