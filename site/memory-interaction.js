// Activity is measured inside the scene, not from time spent reading the page.
export const brushRadius=Object.freeze({mouse:.03,touch:.026,hand:.022});
export class MemoryGuidance {
  constructor(onDismiss){this.onDismiss=onDismiss;this.reset();}
  reset(){this.started=null;this.last=null;this.dismissed=false;}
  move(now){
    if(this.dismissed)return;
    if(this.last===null||now-this.last>300)this.started=now;
    this.last=now;this.tick(now);
  }
  tick(now){
    if(!this.dismissed&&this.started!==null&&now-this.last<=300&&now-this.started>=2000){this.dismissed=true;this.onDismiss();}
  }
}
