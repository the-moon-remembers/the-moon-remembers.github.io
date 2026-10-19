// Slideshow bookkeeping is independent of Three.js. Each channel owns at most
// its current photograph and one prepared successor, including in-flight loads.
export function photoPools(records,count=4){
  const unique=[...new Map(records.filter(record=>record?.src).map(record=>[record.src,record])).values()];
  return Array.from({length:count},(_,channel)=>unique.filter((_,index)=>index%count===channel));
}
export function createPhotoChannel({records,load,duration=16,fadeDuration=1.8,phase=0,onChange=()=>{}}){
  const pool=[...records];let active=false,reduced=false,disposed=false,current=null,next=null,pending=null,candidate=0,elapsed=duration*phase,clock=0,retryAt=0,failures=0;
  const clamp=n=>Math.max(0,Math.min(1,n));
  function state(out={}){out.active=active;out.reduced=reduced;out.disposed=disposed;out.current=current?.record||null;out.next=next?.record||null;out.currentResource=current?.resource||null;out.nextResource=next?.resource||null;out.blend=next?clamp((elapsed-duration)/fadeDuration):0;out.currentProgress=clamp(elapsed/(duration+fadeDuration));out.nextProgress=clamp(Math.max(0,elapsed-duration)/(duration+fadeDuration));out.elapsed=elapsed;out.clock=clock;out.pending=!!pending;out.resident=(current?1:0)+(next?1:0);out.owned=(current?1:0)+(next?1:0)+(pending?1:0);return out;}
  function ensure(){
    if(disposed||!active||pending||!pool.length||clock<retryAt||next||(current&&(reduced||pool.length<2)))return;
    let index=candidate%pool.length;if(current&&index===current.index)index=(index+1)%pool.length;
    const request={index,record:pool[index],purpose:current?'next':'current'};pending=request;
    let promise;try{promise=load(request.record);}catch(error){promise=Promise.reject(error);}
    Promise.resolve(promise).then(resource=>{
      if(disposed||pending!==request){resource?.dispose?.();return;}
      pending=null;failures=0;retryAt=0;candidate=(index+1)%pool.length;
      const ready={record:request.record,index,resource};if(current)next=ready;else current=ready;
      onChange(state());ensure();
    },()=>{
      if(disposed||pending!==request)return;pending=null;candidate=(index+1)%pool.length;failures++;
      if(failures>=Math.max(1,pool.length-(current?1:0))){failures=0;retryAt=clock+10;}
      // Retain the current photograph on failures; before the first success the
      // screen's individual generated signal remains visible, never an empty map.
      onChange(state());ensure();
    });
  }
  return{
    getState:state,
    setActive(value){if(disposed)return;active=!!value;ensure();},
    setReduced(value){if(disposed)return;reduced=!!value;ensure();},
    tick(delta,out){
      if(disposed||!active||reduced)return state(out);
      const step=Math.max(0,Math.min(.15,Number.isFinite(delta)?delta:0));clock+=step;
      if(current){elapsed+=step;if(!next)elapsed=Math.min(elapsed,duration);}
      if(current&&next&&elapsed>=duration+fadeDuration){
        const previous=current;current=next;next=null;elapsed=fadeDuration;previous.resource?.dispose?.();onChange(state());
      }
      ensure();return state(out);
    },
    dispose(){if(disposed)return;disposed=true;active=false;pending=null;current?.resource?.dispose?.();next?.resource?.dispose?.();current=null;next=null;onChange(state());}
  };
}
