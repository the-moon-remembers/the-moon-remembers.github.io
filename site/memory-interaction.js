// Activity is measured inside the scene, not from time spent reading the page.
// Mouse midpoint between the original .07 stroke and the later .03 stroke.
// Touch and camera fingertips retain their separately tuned sizes.
export const brushRadius=Object.freeze({mouse:.05,touch:.026,hand:.022});
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
