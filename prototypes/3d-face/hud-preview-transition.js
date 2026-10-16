import {smoothProgress,transferDuration} from './hud-transfer.js?v=rory-29f';
// A single interruptible envelope drives documents, models and their instruments.
export function createPreviewTransition(initial){
  let weights={[initial]:1},transition=null;
  function sample(now){
    if(!transition)return weights;
    let done=true;
    for(const id of transition.ids){
      const incoming=id===transition.selected;
      const delay=incoming?transition.delay:0,duration=incoming?transition.incoming:transition.outgoing;
      const t=smoothProgress((now-transition.at-delay)/duration);
      weights[id]=transition.from[id]+((incoming?1:0)-transition.from[id])*t;
      if(t<1)done=false;
    }
    if(done)transition=null;
    return weights;
  }
  return {sample,get active(){return !!transition;},get weights(){return weights;},
    select(selected,now,transfer=null,reduced=false){
      sample(now);
      if(reduced){weights={[selected]:1};transition=null;return;}
      if(!transition&&weights[selected]===1)return;
      const ids=[...new Set([...Object.keys(weights),selected])];
      const from=Object.fromEntries(ids.map(id=>[id,weights[id]||0]));
      transition={selected,ids,from,at:transfer?.at??now,
        delay:transfer?.kind==='expand'?transferDuration*.46:transfer?.kind==='return'?transferDuration*.56:0,
        incoming:transfer?transferDuration*.30:420,outgoing:transfer?transferDuration*.20:360};
    },
  };
}
