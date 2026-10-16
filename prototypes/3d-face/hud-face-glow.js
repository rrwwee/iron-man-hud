import * as THREE from 'three';

// Fixed light budget. Emitters are sampled from the displayed HUD geometry,
// including its real transfer/fade poses; there is no independent light animation.
export function createHUDFaceGlow(scene, {capacity=6,tint=0xffffff,tintMix=0,gain=1}={}) {
  const slots=Array.from({length:capacity},()=>{
    const light=new THREE.PointLight(0xffffff,0,.6,2);
    scene.add(light);
    return {light,id:null,target:0};
  });
  let settling=false;
  const targetColor=new THREE.Color(),wash=new THREE.Color(tint);
  return {
    update(sources,dt,enabled=true){
      const active=enabled?sources.filter(s=>s.strength>0.001).slice(0,capacity):[];
      const ids=new Set(active.map(s=>s.id));
      for(const slot of slots)slot.target=0;
      for(const source of active){
        let slot=slots.find(s=>s.id===source.id);
        if(!slot){
          slot=slots.filter(s=>!ids.has(s.id)).sort((a,b)=>a.light.intensity-b.light.intensity)[0];
          if(!slot)continue;
          slot.id=source.id;slot.light.intensity=0;
          slot.light.color.set(source.color).lerp(wash,tintMix);
        }
        slot.light.position.copy(source.position);
        slot.light.color.lerp(targetColor.set(source.color).lerp(wash,tintMix),1-Math.exp(-dt*14));
        slot.target=source.power*Math.min(1,source.strength)*gain;
      }
      const blend=1-Math.exp(-Math.max(0,dt)*12);
      settling=false;
      for(const slot of slots){
        slot.light.intensity+=(slot.target-slot.light.intensity)*blend;
        if(Math.abs(slot.target-slot.light.intensity)>0.000002)settling=true;
        else slot.light.intensity=slot.target;
      }
    },
    get needsFrame(){return settling;},
    get sample(){return slots.filter(s=>s.light.intensity>0).map(s=>({id:s.id,power:s.light.intensity,position:s.light.position.toArray()}));},
  };
}
