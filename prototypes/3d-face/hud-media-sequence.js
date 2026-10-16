// One gesture advances one item; trackpad momentum cannot skip the sequence.
export function createMediaSequence(length,{duration=560}={}){
  let index=0,start=-Infinity,direction=1,lastWheel=-Infinity,wheelTotal=0,consumed=false;
  function step(delta,now){
    const next=Math.max(0,Math.min(length-1,index+Math.sign(delta)));
    if(!delta||next===index||now-start<duration)return false;
    direction=Math.sign(delta);index=next;start=now;return true;
  }
  return {
    step,
    wheel(delta,now){
      if(now-lastWheel>180){wheelTotal=0;consumed=false;}
      lastWheel=now;
      if(consumed)return false;
      wheelTotal+=delta;if(Math.abs(wheelTotal)<36)return false;
      consumed=true;return step(wheelTotal,now);
    },
    sample(now){const t=duration===0?1:Math.max(0,Math.min(1,(now-start)/duration));return {index,direction,progress:t*t*t*(t*(t*6-15)+10),active:t<1};},
    get index(){return index;},
  };
}
