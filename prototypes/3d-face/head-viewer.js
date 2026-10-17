import {createHUDFaceGlow} from './hud-face-glow.js?v=red-hud-3';
// Rory: source-fitted face with local eyelid and ocular-surface motion.
import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {createFaceEyeRig} from './face-eye-rig.js?v=red-hud-3';
import {makeBlinkPlan, blinkWeight, gazeTarget, dampGaze} from './face-motion.js';
import {frameCamera} from './visor-space.js?v=selector-3';
import {createHUD} from './hud.js?v=single-hud-1';
import {canonicalSiteUrl} from './site-url.js';
history.replaceState(null,'',canonicalSiteUrl(location.href));

const $=id=>document.getElementById(id),stage=$('stage');
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true,powerPreference:'low-power'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=false;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(26,2,.01,10);
const pivot=new THREE.Group();pivot.position.set(0,1.619,.095);scene.add(pivot);
const cinematicLight={ambient:.035,bounce:.09,photoFill:.06,key:.018,fill:.0035};
const ambient=new THREE.HemisphereLight(0xb98b7a,0x000000,cinematicLight.ambient);scene.add(ambient);
// Soft reflected light keeps downward-facing skin readable beneath the nose.
const bounce=new THREE.HemisphereLight(0x000000,0xd69276,cinematicLight.bounce);scene.add(bounce);
// Art-directed portrait light keeps the warm movie mood across HUD layouts.
const key=new THREE.PointLight(0xffffff,0,2,2),fill=new THREE.PointLight(0xffffff,0,2,2);
key.position.set(-.12,1.64,.25);fill.position.set(.13,1.66,.23);scene.add(key,fill);
frameCamera(camera,2);
const ctx=$('hologram').getContext('2d');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let pointerX=0,pointerY=0;
const expression='neutral';
let loaded=false,hasBlinkTargets=false,faceRig=null;
let tx=0,ty=0,x=0,y=0,gx=0,gy=0,raf=0,lastFrame=0,frames=0,hudDirty=true,readingCV=false;
let blinkAt=-10,nextBlink=4,blinkPlan=makeBlinkPlan(),blinkPeak=0,blinkTimer=0,elapsed=0,previousDouble=false,blinkCount=0;
let gazeYaw=0,gazePitch=0;
const start=performance.now();
let windowActive=true;
function wake(){if(!raf&&!document.hidden&&windowActive)raf=requestAnimationFrame(frame);}
key.color.set(0xffa17f);fill.color.set(0x8899aa);
key.intensity=cinematicLight.key;fill.intensity=cinematicLight.fill;
stage.dataset.assemblyPivot='0,1.619,0.095';stage.dataset.sharedAssembly='true';
const visorRoot=new THREE.Group();visorRoot.position.set(0,0,-.070);pivot.add(visorRoot);
const hudGlow=createHUDFaceGlow(scene,{tint:0xff634a,tintMix:.72,gain:.4});
const hud=createHUD({scene:visorRoot,camera,wake,invalidate:()=>{hudDirty=true;}});
function beginBlink(automatic=false){
  if(!hasBlinkTargets||document.hidden||!windowActive)return;
  clearTimeout(blinkTimer);elapsed=(performance.now()-start)/1000;blinkAt=elapsed;blinkPeak=0;blinkCount++;
  blinkPlan=makeBlinkPlan(Math.random,automatic&&!previousDouble);
  previousDouble=blinkPlan.double;
  nextBlink=elapsed+Math.max(blinkPlan.next,blinkPlan.close+blinkPlan.hold+blinkPlan.open+.1);
  wake();
}
function scheduleBlink(){clearTimeout(blinkTimer);if(hasBlinkTargets&&!reducedMotion&&!document.hidden&&windowActive)blinkTimer=setTimeout(()=>beginBlink(true),Math.max(50,(nextBlink-elapsed)*1000));}
function holdTracking(){tx=x;ty=y;gx=x;gy=y;stage.dataset.pointerTracking='held';wake();}
window.addEventListener('pointermove',e=>{
  const r=stage.getBoundingClientRect();
  pointerX=THREE.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);
  pointerY=THREE.MathUtils.clamp((e.clientY-r.top)/r.height*2-1,-1,1);
  // Reading/dragging can hold the head without freezing the eyes.
  if(e.buttons&&stage.hasPointerCapture(e.pointerId)){holdTracking();return;}
  if(e.target.closest('#contentPanel')){wake();return;}
  tx=pointerX*.5;ty=pointerY*.65;
  stage.dataset.pointerTracking='following';wake();
});
stage.addEventListener('pointerleave',()=>{pointerX=pointerY=tx=ty=0;wake();});
document.addEventListener('hud-center',()=>{pointerX=pointerY=tx=ty=x=y=gx=gy=0;wake();});
document.addEventListener('hud-panel',()=>wake());
const cvVisible=()=>stage.dataset.selectedSection==='cv'||stage.dataset.expandedSection==='cv';
function resize(){readingCV=cvVisible();const w=stage.clientWidth,h=stage.clientHeight,scale=Math.min(1,(readingCV?1280:960)/w,(readingCV?800:600)/h);renderer.setPixelRatio(scale);renderer.setSize(w,h,false);frameCamera(camera,w/h);stage.dataset.cameraDistance=camera.position.z.toFixed(3);$('hologram').width=Math.round(w*scale);$('hologram').height=Math.round(h*scale);hudDirty=true;wake();}
new ResizeObserver(resize).observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;clearTimeout(blinkTimer);}else{elapsed=(performance.now()-start)/1000;nextBlink=elapsed+4;blinkAt=-10;wake();scheduleBlink();}});
window.addEventListener('blur',()=>{windowActive=false;cancelAnimationFrame(raf);raf=0;clearTimeout(blinkTimer);stage.dataset.suspended='true';});
window.addEventListener('focus',()=>{windowActive=true;elapsed=(performance.now()-start)/1000;nextBlink=elapsed+4;blinkAt=-10;stage.dataset.suspended='false';wake();scheduleBlink();});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;clearTimeout(blinkTimer);});
// Align the model's measured eye centre to the shared visor pivot.
Promise.all([
  new GLTFLoader().loadAsync('./assets/rory-head.glb?v=red-hud-3'),
  fetch('./assets/rory-head-build.json?v=red-hud-3').then(r=>r.json()),
]).then(([gltf,metadata])=>{
  const model=gltf.scene;
  const characterScale=metadata.modelScale;
  model.scale.setScalar(characterScale);
  model.rotation.x=metadata.rotationX;
  const eyeOffset=new THREE.Vector3(...metadata.eyeCenter).multiplyScalar(characterScale).applyEuler(model.rotation);
  model.position.set(0,1.6252,.073).sub(pivot.position).sub(eyeOffset);
  pivot.add(model);
  model.traverse(o=>{
    if(!o.isMesh)return;
    o.frustumCulled=false;
    const material=o.material;
    o.material=material.clone();
    o.material.roughness=.78;o.material.metalness=0;
    if(/eyebrow|eyelash|short02/.test(o.name)){o.material.transparent=true;o.material.alphaTest=.03;o.material.depthWrite=false;o.material.emissive.set(0x30251b);o.material.emissiveMap=o.material.map;o.material.emissiveIntensity=.24;}
    if(o.material.map)o.material.map.anisotropy=2;
    if(o.material.map){
      o.material.emissive.set(0xffffff);o.material.emissiveMap=o.material.map;
      // The atlas already contains illumination; a modest photo contribution
      // avoids shading those original shadows a second time.
      o.material.emissiveIntensity=cinematicLight.photoFill;
    }
    if(/Goatee/.test(o.name)){o.material.transparent=true;o.material.alphaTest=.06;o.material.depthWrite=false;}
    // Fade the face-only boundary in eye-relative visor units. Authoring units
    // are independent of the old full-head model's scale and origin.
    o.material.onBeforeCompile=shader=>{
      shader.uniforms.pilotEyeCenter={value:new THREE.Vector3(...metadata.eyeCenter)};
      shader.uniforms.pilotScale={value:characterScale};
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 pilotPosition; uniform vec3 pilotEyeCenter; uniform float pilotScale;').replace('#include <begin_vertex>','#include <begin_vertex>\npilotPosition=(position-pilotEyeCenter)*pilotScale;');
      const {bottom,top,side,depth}=metadata.fade;
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 pilotPosition;').replace('#include <opaque_fragment>',`float edgeFade=smoothstep(${bottom[0]},${bottom[1]},pilotPosition.y)*(1.-smoothstep(${side[0]},${side[1]},abs(pilotPosition.x)))*(1.-smoothstep(${top[0]},${top[1]},pilotPosition.y));
      outgoingLight*=edgeFade*smoothstep(${depth[0]},${depth[1]},pilotPosition.z);
      #include <opaque_fragment>`);
    };
    o.material.customProgramCacheKey=()=>`rory-face-fade-${metadata.version}`;
  });
  scene.updateMatrixWorld(true);
  ocularAnchor.copy(model.localToWorld(new THREE.Vector3(...metadata.rightEye)));
  faceRig=createFaceEyeRig(model);
  hasBlinkTargets=true;
  $('loading').style.display='none';
  loaded=true;$('rig').textContent='Rory · fitted from video';stage.dataset.character='rory';
  elapsed=(performance.now()-start)/1000;nextBlink=elapsed+2.5+Math.random();
  resize();scheduleBlink();wake();
}).catch(error=>{
  console.error('Pilot could not load',error);loaded=true;
  $('rig').textContent='Pilot unavailable';stage.dataset.character='unavailable';wake();
});
const ocularAnchor=new THREE.Vector3(.0303,1.6252,.073),trackedEyeWorld=new THREE.Vector3(),eyeProjected=new THREE.Vector3(),eyeRestProjected=new THREE.Vector3();
function frame(now){
  raf=0;if(!loaded||document.hidden||!windowActive)return;
  const blinkAge=(now-start)/1000-blinkAt;
  const blinking=(blinkAge>=0&&blinkAge<blinkPlan.close+blinkPlan.hold+blinkPlan.open);
  const pendingGaze=gazeTarget(pointerX,pointerY,x*.61,y*.12);
  const eyeMoving=Math.abs(gazeYaw-pendingGaze.yaw)>.0005||Math.abs(gazePitch-pendingGaze.pitch)>.0005;
  if(now-lastFrame<1000/(blinking||eyeMoving?60:24)-.5){wake();return;}
  // Dense serif text needs more samples than the wireframe. Keep a fixed cap
  // while CV is visible and restore the original budget for other Sections.
  if(readingCV!==cvVisible())resize();
  const dt=Math.min((now-lastFrame)/1000,.08);lastFrame=now;elapsed=(now-start)/1000;
  if(reducedMotion){x=tx;y=ty;gx=tx;gy=ty;}
  x+=(tx-x)*(1-Math.exp(-dt*6));y+=(ty-y)*(1-Math.exp(-dt*6));gx+=(tx-gx)*(1-Math.exp(-dt*22));gy+=(ty-gy)*(1-Math.exp(-dt*20));
  pivot.rotation.set(y*.12,x*.61,0,'YXZ');
  const targetGaze=gazeTarget(pointerX,pointerY,x*.61,y*.12);
  gazeYaw=dampGaze(gazeYaw,targetGaze.yaw,dt,reducedMotion);
  gazePitch=dampGaze(gazePitch,targetGaze.pitch,dt,reducedMotion);
  const age=elapsed-blinkAt,bl=blinkWeight(age,blinkPlan),br=bl;blinkPeak=Math.max(blinkPeak,Math.min(bl,br));
  if(faceRig)faceRig.apply({blinkLeft:bl,blinkRight:br,yaw:gazeYaw,pitch:gazePitch});
  if(faceRig)faceRig.getPupilWorldPosition('right',trackedEyeWorld);
  else trackedEyeWorld.copy(ocularAnchor).sub(pivot.position).applyQuaternion(pivot.quaternion).add(pivot.position);
  eyeProjected.copy(trackedEyeWorld).project(camera);
  eyeRestProjected.copy(ocularAnchor).project(camera);
  hud.setPose(x,y,{world:trackedEyeWorld,x:(eyeProjected.x+1)*stage.clientWidth/2,y:(1-eyeProjected.y)*stage.clientHeight/2,restX:(eyeRestProjected.x+1)*stage.clientWidth/2,restY:(1-eyeRestProjected.y)*stage.clientHeight/2});
  hudGlow.update(hud.glowSources,dt,true);
  const active=Math.abs(tx-x)>.0003||Math.abs(ty-y)>.0003||Math.abs(tx-gx)>.0003||Math.abs(ty-gy)>.0003||Math.abs(gazeYaw-targetGaze.yaw)>.0001||Math.abs(gazePitch-targetGaze.pitch)>.0001||(age>=0&&age<blinkPlan.close+blinkPlan.hold+blinkPlan.open+.006)||hud.needsFrame||hudGlow.needsFrame;
  renderer.render(scene,camera);frames++;
  $('pose').textContent=`Yaw ${(x*35).toFixed(1)}° / pitch ${(-y*7).toFixed(1)}° / ${expression} / ${active?'moving':'idle paused'}`;
  Object.assign($('pose').dataset,{frames:String(frames),pixels:String(renderer.domElement.width*renderer.domElement.height),triangles:String(renderer.info.render.triangles),drawCalls:String(renderer.info.render.calls),lines:String(renderer.info.render.lines),points:String(renderer.info.render.points),active:String(active),blink:Math.max(bl,br).toFixed(3),blinkPeak:blinkPeak.toFixed(3),blinkCount:String(blinkCount),gazeYaw:gazeYaw.toFixed(4),gazePitch:gazePitch.toFixed(4),hudGlow:JSON.stringify(hudGlow.sample),model:'rory-video',yaw:(x*35).toFixed(1)});
  if(hudDirty){hud.draw(ctx,$('hologram').width,$('hologram').height,expression);hudDirty=false;}
  if(active)wake();else scheduleBlink();
}
resize();
