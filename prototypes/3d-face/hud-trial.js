import {treatments,drawTreatment} from './hud-treatments.js?v=targeting-2';
import {createSiteNavigation} from './site-navigation.js?v=targeting-2';

export function createHUDTrial({wake,invalidate,scene,camera}){
  const params=new URLSearchParams(location.search);
  let key=treatments.some(t=>t.key===params.get('variant'))?params.get('variant'):'visor';
  let draws=0;
  const bar=document.getElementById('hudComparison'),canvas=document.getElementById('hologram');
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  bar.hidden=!(local||params.get('trial')==='1');
  const navigation=createSiteNavigation({wake,invalidate,scene,camera});
  function select(next){
    key=next;const current=treatments.find(t=>t.key===key);
    const url=new URL(location.href);url.searchParams.set('variant',key);history.replaceState(null,'',url);
    document.body.dataset.hud=key;
    document.getElementById('hudDescription').textContent=current.description;
    document.getElementById('hudCurrent').textContent=`${current.letter} / ${current.name}`;
    bar.querySelectorAll('[data-treatment]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.treatment===key)));
    canvas.classList.remove('hud-reveal');void canvas.offsetWidth;canvas.classList.add('hud-reveal');
    invalidate();wake();
  }
  function cycle(delta){const i=treatments.findIndex(t=>t.key===key);select(treatments[(i+delta+treatments.length)%treatments.length].key);}
  bar.querySelectorAll('[data-treatment]').forEach(b=>b.onclick=()=>select(b.dataset.treatment));
  document.getElementById('hudPrevious').onclick=()=>cycle(-1);
  document.getElementById('hudNext').onclick=()=>cycle(1);
  window.addEventListener('keydown',e=>{
    if(e.target.closest('input,textarea,select,[contenteditable]')||(navigation.active&&!e.target.closest('#hudComparison')))return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();cycle(e.key==='ArrowLeft'?-1:1);}
  });
  select(key);
  return {setPose:(x,y,eye)=>navigation.setPose(x,y,eye),setVisible:value=>navigation.setVisible(value),get isHovering(){return navigation.isHovering;},get isOpen(){return navigation.isOpen;},draw(ctx,w,h,expression){drawTreatment(ctx,w,h,key,expression,{interactive:navigation.active});draws++;
    const current=treatments.find(t=>t.key===key);
    document.getElementById('hudCurrent').textContent=navigation.active?(navigation.isSpatial?'Curved 3D navigation':'Flat radial navigation'):`${current.letter} / ${current.name}`;
    document.getElementById('hudDescription').textContent=navigation.active?(navigation.isSpatial?'Live tracking · hover to highlight · click to open':'Scroll to browse · click to open'):current.description;
    canvas.dataset.treatment=navigation.active?'radial':key;canvas.dataset.draws=String(draws);canvas.dataset.pixels=String(w*h);
  }};
}
