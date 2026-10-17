import {createSiteNavigation} from './site-navigation.js?v=single-hud-1';

export function createHUD(options){
  const canvas=document.getElementById('hologram');
  const navigation=createSiteNavigation(options);
  document.body.dataset.hud='visor';
  let draws=0;
  return {
    get glowSources(){return navigation.glowSources;},
    setPose:(x,y,eye)=>navigation.setPose(x,y,eye),
    get needsFrame(){return navigation.needsFrame;},
    draw(ctx,w,h){
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
      canvas.dataset.treatment='radial';canvas.dataset.draws=String(++draws);canvas.dataset.pixels=String(w*h);
    },
  };
}
