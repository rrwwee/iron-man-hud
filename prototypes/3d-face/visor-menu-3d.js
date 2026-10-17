import * as THREE from 'three';
import {createMark7Instruments} from './mark7-instruments.js?v=single-hud-1';
export function createVisorMenu(options){
  // Clip-space edge falloff costs one draw and no postprocessing pass.
  const vignette=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'varying vec2 vUv;void main(){vec2 p=vec2(vUv.x,1.-vUv.y);float d=length((p-vec2(.5,.46))/vec2(.43,.80));float a=.84*smoothstep(.56,1.,d);a=1.-(1.-a)*(1.-.82*(1.-smoothstep(0.,.18,vUv.y)));gl_FragColor=vec4(0.,0.,0.,a);}'}));
  vignette.renderOrder=90;vignette.frustumCulled=false;options.scene.add(vignette);
  return createMark7Instruments(options);
}
