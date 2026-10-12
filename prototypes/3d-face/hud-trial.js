import {treatments,drawTreatment} from './hud-treatments.js?v=3';

export function createHUDTrial({wake,invalidate}){
  const params=new URLSearchParams(location.search);
  let key=treatments.some(t=>t.key===params.get('variant'))?params.get('variant'):'visor';
  let draws=0;
  const bar=document.getElementById('hudComparison'),canvas=document.getElementById('hologram');
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  bar.hidden=!(local||params.get('trial')==='1');
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
    if(e.target.closest('input,textarea,select,[contenteditable]'))return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();cycle(e.key==='ArrowLeft'?-1:1);}
  });
  select(key);
  return {draw(ctx,w,h,expression){drawTreatment(ctx,w,h,key,expression);draws++;
    canvas.dataset.treatment=key;canvas.dataset.draws=String(draws);canvas.dataset.pixels=String(w*h);
  }};
}
