// Media belong to a detail room, never to the persistent background-music player.
export const MEMORY_BUFFER_SECONDS=2.5;
export class MemoryMedia {
  constructor({present,earlier,audio,motion,sound,note,view,reduced,onError,preferences,onBuffer=()=>{}}){
    Object.assign(this,{present,earlier,audio,motion,sound,note,view,onError,preferences,onBuffer});
    this.inView=false;this.hidden=false;this.userPaused=reduced;this.soundWanted=true;this.failed=new Set();this.epoch=0;this.pendingPlay=new Map();
    this.needsBuffer=true;this.started=false;this.bufferNotice='';
    this.present.muted=this.earlier.muted=true;this.audio.volume=.14;
    for(const v of [present,earlier]){
      v.addEventListener('loadeddata',()=>{if(this.data){v.classList.add('has-frame');this.sync();}});
      v.addEventListener('error',()=>{if(this.data&&v.getAttribute('src')){this.failed.add(v);v.classList.remove('has-frame');this.onError('A video could not load. The still images and water interaction remain available.');this.sync();}});
      // A starved layer must not let the other period (or scene sound) run
      // ahead. The water renderer keeps animating over the last decoded frames.
      const waiting=()=>{if(this.data?.videoNow&&!this.failed.has(v)&&this.inView&&!this.hidden&&!this.userPaused){this.needsBuffer=true;this.sync();}};
      v.addEventListener('waiting',waiting);v.addEventListener('stalled',()=>{if(v.readyState<3)waiting();});
      for(const event of ['progress','canplay','canplaythrough','loadedmetadata'])v.addEventListener(event,()=>{if(this.data?.videoNow)this.sync();});
    }
    audio.addEventListener('error',()=>{if(this.data?.ambient&&audio.getAttribute('src')){this.failed.add(audio);audio.pause();this.sound.textContent='Scene sound off';this.onError('The sound could not load. The moving memories are still available.');}});
    present.addEventListener('timeupdate',()=>{if(audio.paused||!Number.isFinite(audio.duration))return;if(Math.abs(audio.currentTime-present.currentTime)>.5)audio.currentTime=Math.min(present.currentTime,Math.max(0,audio.duration-.05));});
    motion.addEventListener('click',()=>{this.userPaused=!this.userPaused;this.sync();});
    sound.addEventListener('click',()=>{this.soundWanted=audio.paused||!this.soundWanted;this.sync();});
  }
  configure(data){
    this.release();this.data=data;this.failed.clear();this.needsBuffer=true;this.started=false;this.motion.hidden=this.sound.hidden=this.note.hidden=!data.videoNow;
    if(!data.videoNow)return;
    this.view.classList.add('has-moving-memories');
    for(const[v,src,poster]of[[this.present,data.videoNow,data.posterNow||data.now],[this.earlier,data.videoOld,data.posterOld||data.old]]){
      v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.poster='./assets/'+poster;v.src='./assets/'+src;v.load();
    }
    if(data.ambient){this.audio.loop=true;this.audio.preload='auto';this.audio.src='./assets/'+data.ambient;this.audio.load();}
    this.sync();
  }
  // Loading, preferences and pointer events can all arrive before play() settles.
  // One pending request per stream avoids duplicated decoder work; old promises
  // cannot pause the next room's audio after its source has already changed.
  play(media,ready,failed){
    if(this.pendingPlay.has(media))return;
    const request={epoch:this.epoch};this.pendingPlay.set(media,request);
    const current=()=>this.pendingPlay.get(media)===request&&request.epoch===this.epoch;
    let result;try{result=media.play();}catch(error){if(current()){this.pendingPlay.delete(media);failed?.(error);}return;}
    Promise.resolve(result).then(()=>{if(!current())return;this.pendingPlay.delete(media);ready?.();},error=>{if(!current())return;this.pendingPlay.delete(media);failed?.(error);});
  }
  pause(media){this.pendingPlay.delete(media);media.pause();}
  bufferedEnough(media){
    if(this.failed.has(media))return true;
    if(media.readyState<3)return false;
    // Some mobile browsers cap paused preloading. HAVE_ENOUGH_DATA is their
    // explicit estimate that playback can continue; do not deadlock waiting
    // for a larger paused buffer that the browser will not fetch until play().
    if(media.readyState>=4)return true;
    const time=Math.max(0,Number.isFinite(media.currentTime)?media.currentTime:0),duration=media.duration;
    // Short films and the last seconds before an independent loop only need
    // their remaining content, never an impossible full 2.5-second tail.
    const needed=Number.isFinite(duration)&&duration>0?Math.min(MEMORY_BUFFER_SECONDS,Math.max(0,duration-time)):MEMORY_BUFFER_SECONDS;
    const ranges=media.buffered;if(!ranges)return media.readyState>=4;
    try{for(let i=0;i<ranges.length;i++)if(ranges.start(i)<=time+.05&&ranges.end(i)>=time)return ranges.end(i)-time+.05>=needed;}catch{/* A source change can invalidate a TimeRanges snapshot. */}
    return false;
  }
  bufferHint(active){const text=active?(this.started?'Buffering moving memories…':'Preparing moving memories…'):'';if(text===this.bufferNotice)return;this.bufferNotice=text;this.onBuffer(!!text,text);}
  sync(){
    if(!this.data?.videoNow)return;
    const epoch=this.epoch,wanted=this.inView&&!this.hidden&&!this.userPaused;
    if(this.needsBuffer&&[this.present,this.earlier].every(video=>this.bufferedEnough(video)))this.needsBuffer=false;
    const playing=wanted&&!this.needsBuffer;
    this.bufferHint(wanted&&this.needsBuffer);
    if(playing)this.started=true;
    this.motion.textContent=this.userPaused?'Play moving memories':'Pause moving memories';this.motion.setAttribute('aria-pressed',String(this.userPaused));
    for(const v of [this.present,this.earlier]){
      if(!playing||this.failed.has(v)){this.pause(v);continue;}
      if(v.paused)this.play(v,()=>{if(!this.inView||this.hidden||this.userPaused)this.pause(v);},error=>{if(epoch===this.epoch&&this.inView&&!this.hidden&&!this.userPaused&&error.name!=='AbortError'){this.userPaused=true;this.pause(this.present);this.pause(this.earlier);this.pause(this.audio);this.motion.textContent='Play moving memories';this.motion.setAttribute('aria-pressed','true');this.sound.textContent='Scene sound off';this.sound.setAttribute('aria-pressed','false');}});
    }
    const site=this.preferences();this.sound.disabled=!site.enabled;this.sound.title=site.enabled?'Present-day scene sound, softly mixed with the site music.':'Site sound is muted';
    const sounding=playing&&site.enabled&&this.soundWanted&&!this.failed.has(this.audio)&&!this.failed.has(this.present);
    if(sounding){
      if(this.audio.paused&&!this.pendingPlay.has(this.audio)){if(Number.isFinite(this.audio.duration))this.audio.currentTime=Math.min(this.present.currentTime,Math.max(0,this.audio.duration-.05));this.play(this.audio,()=>{if(this.hidden||!this.inView||this.userPaused||!this.soundWanted||!this.preferences().enabled){this.pause(this.audio);return;}this.sound.textContent='Scene sound on';this.sound.setAttribute('aria-pressed','true');},error=>{if(epoch===this.epoch&&this.inView&&!this.hidden&&!this.userPaused&&error.name!=='AbortError'){this.sound.textContent='Enable scene sound';this.sound.setAttribute('aria-pressed','false');}});}
    }else this.pause(this.audio);
    this.sound.textContent=sounding&&!this.audio.paused?'Scene sound on':'Scene sound off';this.sound.setAttribute('aria-pressed',String(sounding&&!this.audio.paused));
  }
  release(){
    this.epoch++;this.pendingPlay.clear();this.data=null;this.needsBuffer=true;this.started=false;this.bufferHint(false);this.view.classList.remove('has-moving-memories');
    for(const media of [this.present,this.earlier,this.audio]){media.pause();media.removeAttribute('src');media.load();media.classList.remove('has-frame');}
  }
}
