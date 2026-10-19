// A phone-only composition: keep each original object (and its current generation)
// alive, but show just one family in the shared window. Landscape is untouched.
export const PHONE_OBJECT_QUERY='(max-width:650px) and (orientation:portrait)';
let pageSwitcher;
const listeners=new Set();
export function ensureObjectSwitcher(onChange){
  if(onChange)listeners.add(onChange);
  if(!pageSwitcher)pageSwitcher=createObjectSwitcher([...document.querySelectorAll('.object-item')],()=>listeners.forEach(listener=>listener()));
  return pageSwitcher;
}

export function createObjectSwitcher(items,onChange=()=>{},options={}){
  const doc=options.document||document,media=options.media||matchMedia(PHONE_OBJECT_QUERY);
  if(!items.length)return{isActive:()=>true,destroy(){},getState:()=>({portrait:false,selected:0})};
  const grid=items[0].parentElement,section=items[0].closest('.objects');
  const tabs=doc.createElement('div'),labels=['PHONE','TRANSPORT','BOATS'];
  tabs.className='object-switcher';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Object categories');
  let selected=0,portrait=false;
  const buttons=items.map((item,index)=>{
    const button=doc.createElement('button');button.type='button';button.id=`object-category-${item.dataset.family}`;
    button.textContent=labels[index];button.setAttribute('role','tab');
    const panelId=item.id||`object-panel-${item.dataset.family}`;item.id=panelId;
    button.setAttribute('aria-controls',panelId);
    button.addEventListener('click',()=>select(index));
    button.addEventListener('keydown',event=>{
      let next=selected;
      if(event.key==='ArrowRight')next=(selected+1)%items.length;
      else if(event.key==='ArrowLeft')next=(selected+items.length-1)%items.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=items.length-1;
      else return;
      event.preventDefault();select(next);buttons[next].focus();
    });
    tabs.append(button);return button;
  });
  grid.before(tabs);
  function update(){
    portrait=media.matches;section.classList.toggle('phone-object-mode',portrait);
    tabs.hidden=!portrait;tabs.inert=!portrait;
    items.forEach((item,index)=>{
      const active=index===selected;item.hidden=portrait&&!active;item.inert=portrait&&!active;
      buttons[index].setAttribute('aria-selected',String(active));buttons[index].tabIndex=active?0:-1;
      if(portrait){item.setAttribute('role','tabpanel');item.setAttribute('aria-labelledby',buttons[index].id);}
      else{item.removeAttribute('role');item.removeAttribute('aria-labelledby');}
    });
    section.dataset.objectCategory=items[selected].dataset.family;
    onChange();
  }
  function select(index){if(index<0||index>=items.length||index===selected)return;selected=index;update();}
  media.addEventListener('change',update);update();
  return{isActive:item=>!portrait||items[selected]===item,select,getState:()=>({portrait,selected}),destroy(){media.removeEventListener('change',update);items.forEach(item=>{item.hidden=false;item.inert=false;item.removeAttribute('role');item.removeAttribute('aria-labelledby');});section.classList.remove('phone-object-mode');tabs.remove();onChange();}};
}
