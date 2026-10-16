// One target policy for projected native controls and canvas hit testing.
export function targetSize(target,peers=[]){
  const nearest=Math.min(Infinity,...peers.filter(p=>p!==target&&p.key!==target.key).map(p=>Math.hypot(p.x-target.x,p.y-target.y)));
  return Math.max(24,Math.min(44,nearest-4));
}
export function pickControl(x,y,targets){
  let nearest=null,distance=Infinity;
  for(const target of targets){const d=Math.hypot(x-target.x,y-target.y);if(d<=target.size/2&&d<distance){nearest=target;distance=d;}}
  return nearest;
}
export function viewportShift(points,width,height,padding=30){
  const shift=(values,size)=>{const lo=Math.min(...values),hi=Math.max(...values);if(hi-lo>size-padding*2)return (size-lo-hi)/2;return lo<padding?padding-lo:hi>size-padding?size-padding-hi:0;};
  return {x:shift(points.map(p=>p.x),width),y:shift(points.map(p=>p.y),height)};
}
const prepared=new WeakSet();
const latestProjection=new WeakMap();
let acquired=null;
function placeControl(button,target){const size=target.size??44;Object.assign(button.style,{left:target.x+'px',top:target.y+'px',width:size+'px',height:size+'px'});}
function releaseControl(button){if(acquired?.button===button){button.style.zIndex='';acquired=null;const target=latestProjection.get(button);if(target)placeControl(button,target);}}
export function projectControl(button,target){
  if(!prepared.has(button)){
    prepared.add(button);
    button.addEventListener('pointerenter',(event={})=>{
      if(button.disabled||acquired)return;
      const r=button.getBoundingClientRect();
      acquired={button,x:r.x+r.width/2,y:r.y+r.height/2,size:r.width,pointerX:event.clientX??r.x+r.width/2,pointerY:event.clientY??r.y+r.height/2};
      button.style.zIndex='14';
    });
    button.addEventListener('pointermove',event=>{if(acquired?.button===button&&Math.hypot(event.clientX-acquired.pointerX,event.clientY-acquired.pointerY)>8)releaseControl(button);});
    button.addEventListener('pointerleave',()=>releaseControl(button));
    button.addEventListener('keydown',()=>{if(acquired)releaseControl(acquired.button);});
  }
  latestProjection.set(button,target);
  button.setAttribute('aria-label',button.textContent);
  button.classList.toggle('hud-projected-control',!!target);
  if(!target||button.disabled)releaseControl(button);
  if(!target){delete button.dataset.projected;return;}
  button.dataset.projected=target.key;
  // Keep only the acquired hit area stable until the pointer leaves. The
  // rendered geometry and the rest of the HUD continue tracking normally.
  placeControl(button,acquired?.button===button?acquired:target);
}
