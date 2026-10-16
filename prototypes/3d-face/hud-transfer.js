// One clock for the panel, its travelling button and the remaining row.
export const transferDuration=1040;
const clamp=x=>Math.max(0,Math.min(1,x));
export const smoothProgress=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
const ease=smoothProgress;
export function transferPhase(now,transfer){
  const t=transfer?clamp((now-transfer.at)/transferDuration):1;
  return {t,done:t===1,travel:ease((t-.20)/.60),row:ease((t-(transfer?.kind==='expand'?.10:0))/.62),lift:t<.20?ease(t/.20):1-ease((t-.80)/.20)};
}
export function flightPoint(from,to,phase,lift=.018){
  if(phase.t===0)return [...from];
  if(phase.done)return [...to];
  return from.map((v,i)=>v+(to[i]-v)*phase.travel+(i===1?lift*phase.lift:i===2?.003*phase.lift:0));
}
export function rowSlot(index,count,total=6){return index+(total-count)/2;}
// Fold clear early on departure; wait for a returning window to clear before
// unfolding the instrument. Both phases share the window's transfer clock.
export function instrumentFoldProgress(now,at,revealing){
  return ease((now-at-transferDuration*(revealing?.55:0))/(transferDuration*.45));
}
