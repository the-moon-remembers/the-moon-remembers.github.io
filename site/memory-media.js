// Media belong to a detail room, never to the persistent background-music player.
export class MemoryMedia {
  constructor({present,earlier,audio,motion,sound,note,view,reduced,onError,preferences}){
    Object.assign(this,{present,earlier,audio,motion,sound,note,view,onError,preferences});
    this.inView=false;this.hidden=false;this.userPaused=reduced;this.soundWanted=true;this.failed=new Set();this.epoch=0;
    this.present.muted=this.earlier.muted=true;this.audio.volume=.14;
    for(const v of [present,earlier]){
      v.addEventListener('loadeddata',()=>{if(this.data){v.classList.add('has-frame');this.sync();}});
      v.addEventListener('error',()=>{if(this.data&&v.getAttribute('src')){this.failed.add(v);v.classList.remove('has-frame');this.onError('A video could not load. The still images and water interaction remain available.');this.sync();}});
    }
    audio.addEventListener('error',()=>{if(this.data?.ambient&&audio.getAttribute('src')){this.failed.add(audio);audio.pause();this.sound.textContent='Scene sound off';this.onError('The sound could not load. The moving memories are still available.');}});
    present.addEventListener('timeupdate',()=>{if(audio.paused||!Number.isFinite(audio.duration))return;if(Math.abs(audio.currentTime-present.currentTime)>.5)audio.currentTime=Math.min(present.currentTime,Math.max(0,audio.duration-.05));});
    motion.addEventListener('click',()=>{this.userPaused=!this.userPaused;this.sync();});
    sound.addEventListener('click',()=>{this.soundWanted=audio.paused||!this.soundWanted;this.sync();});
  }
  configure(data){
    this.release();this.data=data;this.failed.clear();this.motion.hidden=this.sound.hidden=this.note.hidden=!data.videoNow;
    if(!data.videoNow)return;
    this.view.classList.add('has-moving-memories');
    for(const[v,src,poster]of[[this.present,data.videoNow,data.posterNow||data.now],[this.earlier,data.videoOld,data.posterOld||data.old]]){
      v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.poster='./assets/'+poster;v.src='./assets/'+src;v.load();
    }
    if(data.ambient){this.audio.loop=true;this.audio.preload='auto';this.audio.src='./assets/'+data.ambient;this.audio.load();}
    this.sync();
  }
  sync(){
    if(!this.data?.videoNow)return;
    const epoch=this.epoch,playing=this.inView&&!this.hidden&&!this.userPaused;
    this.motion.textContent=this.userPaused?'Play moving memories':'Pause moving memories';this.motion.setAttribute('aria-pressed',String(this.userPaused));
    for(const v of [this.present,this.earlier]){
      if(!playing||this.failed.has(v)){v.pause();continue;}
      if(v.paused)v.play().catch(error=>{if(epoch===this.epoch&&this.inView&&!this.hidden&&!this.userPaused&&error.name!=='AbortError'){this.userPaused=true;this.present.pause();this.earlier.pause();this.audio.pause();this.motion.textContent='Play moving memories';this.motion.setAttribute('aria-pressed','true');this.sound.textContent='Scene sound off';this.sound.setAttribute('aria-pressed','false');}});
    }
    const site=this.preferences();this.sound.disabled=!site.enabled;this.sound.title=site.enabled?'Present-day scene sound, softly mixed with the site music.':'Site sound is muted';
    const sounding=playing&&site.enabled&&this.soundWanted&&!this.failed.has(this.audio)&&!this.failed.has(this.present);
    if(sounding){
      if(this.audio.paused){if(Number.isFinite(this.audio.duration))this.audio.currentTime=Math.min(this.present.currentTime,Math.max(0,this.audio.duration-.05));this.audio.play().then(()=>{if(epoch!==this.epoch||this.hidden||!this.inView||this.userPaused||!this.soundWanted||!this.preferences().enabled){this.audio.pause();return;}this.sound.textContent='Scene sound on';this.sound.setAttribute('aria-pressed','true');}).catch(error=>{if(epoch===this.epoch&&this.inView&&!this.hidden&&!this.userPaused&&error.name!=='AbortError'){this.sound.textContent='Enable scene sound';this.sound.setAttribute('aria-pressed','false');}});}
    }else this.audio.pause();
    this.sound.textContent=sounding&&!this.audio.paused?'Scene sound on':'Scene sound off';this.sound.setAttribute('aria-pressed',String(sounding&&!this.audio.paused));
  }
  release(){
    this.epoch++;this.data=null;this.view.classList.remove('has-moving-memories');
    for(const media of [this.present,this.earlier,this.audio]){media.pause();media.removeAttribute('src');media.load();media.classList.remove('has-frame');}
  }
}
