import {createHUDFaceGlow} from './hud-face-glow.js?v=red-hud-3';
// Rory: source-fitted face with local eyelid and ocular-surface motion.
import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {createFaceEyeRig} from './face-eye-rig.js?v=red-hud-3';
import {makeBlinkPlan, blinkWeight, gazeTarget, dampGaze} from './face-motion.js';
import {frameCamera} from './visor-space.js?v=selector-3';
import { createHUDTrial } from './hud-trial.js?v=long-coast-1';

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
const params=new URLSearchParams(location.search);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let wideMotion=false,pointerX=0,pointerY=0;
let neutralLighting=false,expression='neutral',mix={},loaded=false,hasBlinkTargets=false,faceRig=null;
let holdBlink=false,tx=0,ty=0,x=0,y=0,gx=0,gy=0,replayStart=null,raf=0,lastFrame=0,frames=0,hudDirty=true,readingCV=false;
let blinkAt=-10,nextBlink=4,blinkPlan=makeBlinkPlan(),blinkPeak=0,blinkTimer=0,elapsed=0,previousDouble=false,blinkCount=0;
let gazeYaw=0,gazePitch=0;
const start=performance.now();
const expressions={neutral:{},smirk:{mouthSmileLeft:.85,browOuterUpRight:.2},surprise:{browInnerUp:.85,browOuterUpLeft:.5,browOuterUpRight:.5,jawOpen:.6},skeptical:{browOuterUpRight:.9,browDownLeft:.6,mouthSmileRight:.22}};
let windowActive=true;
function wake(){if(!raf&&!document.hidden&&windowActive)raf=requestAnimationFrame(frame);}
function lighting(value){
  neutralLighting=value;$('neutralLight').checked=value;
  key.color.set(value?0xffffff:0xffa17f);fill.color.set(value?0xffffff:0x8899aa);
  key.intensity=value?.10:cinematicLight.key;fill.intensity=value?.065:cinematicLight.fill;
  ambient.color.set(value?0xffffff:0xb98b7a);
  ambient.groundColor.set(value?0xffffff:0x000000);
  ambient.intensity=value?.8:cinematicLight.ambient;bounce.intensity=value?0:cinematicLight.bounce;
  $('variantLabel').textContent=value?'Inspection lighting':'Cinematic lighting';
  const u=new URL(location.href);
  if(value)u.searchParams.set('light','inspection');else u.searchParams.delete('light');
  history.replaceState(null,'',u);wake();
}
stage.dataset.assemblyPivot='0,1.619,0.095';stage.dataset.sharedAssembly='true';
const visorRoot=new THREE.Group();visorRoot.position.set(0,0,-.070);pivot.add(visorRoot);
const hudGlow=createHUDFaceGlow(scene,{tint:0xff634a,tintMix:.72,gain:.4});
const hudTrial=createHUDTrial({scene:visorRoot,camera,wake,invalidate:()=>{hudDirty=true;}});
const motionLabel=document.createElement('label');motionLabel.className='motion-label';motionLabel.innerHTML='<span>Pointer turns</span><select aria-label="Pointer turn range"><option value="gentle">Gentle · easier targeting</option><option value="wide">Wide · comparison</option></select>';document.querySelector('.toggles').append(motionLabel);
const motionRange=motionLabel.querySelector('select');motionRange.value=wideMotion?'wide':'gentle';
motionRange.onchange=()=>{wideMotion=motionRange.value==='wide';stopReplay();const gain=wideMotion?1:.5;tx=pointerX*gain;ty=pointerY*(wideMotion?1:.65);const u=new URL(location.href);u.searchParams.set('motion',wideMotion?'wide':'gentle');history.replaceState(null,'',u);stage.dataset.assemblyPivot='0,1.619,0.095';stage.dataset.sharedAssembly='true';
stage.dataset.pointerTurnRange=wideMotion?'wide':'gentle';wake();};
stage.dataset.pointerTurnRange=wideMotion?'wide':'gentle';
document.body.dataset.debug=String(params.get('debug')==='1');
function toggleControls(){if(params.get('debug')!=='1')return;const p=$('trialControls');p.hidden=!p.hidden;$('controlsToggle').setAttribute('aria-expanded',String(!p.hidden));}
$('controlsToggle').onclick=toggleControls;
$('previous').onclick=$('next').onclick=()=>lighting(!neutralLighting);
$('neutralLight').onchange=()=>lighting($('neutralLight').checked);
$('hudToggle').onchange=()=>{document.body.classList.toggle('no-hud',!$('hudToggle').checked);hudTrial.setVisible($('hudToggle').checked);wake();};
// These belonged to the MPFB comparison. This candidate uses its own fitted eye surfaces.
$('photoEyes').closest('label').hidden=true;$('relaxedEyes').closest('label').hidden=true;
$('photoEyes').closest('label').style.display='none';$('relaxedEyes').closest('label').style.display='none';
$('loading').style.display='none';
document.querySelector('.disclaimer').textContent='Original HUD instrumentation';
window.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key.toLowerCase()==='h'){toggleControls();return;}if(e.key==='Escape'&&!$('trialControls').hidden)toggleControls();});
function chooseExpression(name){expression=name;$('expressionHud').textContent=name.toUpperCase();document.querySelectorAll('[data-expression]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.expression===name)));hudDirty=true;wake();}
document.querySelectorAll('[data-expression]').forEach(b=>b.onclick=()=>chooseExpression(b.dataset.expression));
function beginBlink(automatic=false){
  if(!hasBlinkTargets||document.hidden||!windowActive)return;
  clearTimeout(blinkTimer);elapsed=(performance.now()-start)/1000;blinkAt=elapsed;blinkPeak=0;blinkCount++;
  blinkPlan=makeBlinkPlan(Math.random,automatic&&!previousDouble);
  previousDouble=blinkPlan.double;
  const speed=$('slowBlink').checked?4:1;
  blinkPlan={...blinkPlan,close:blinkPlan.close*speed,hold:blinkPlan.hold*speed,open:blinkPlan.open*speed};
  nextBlink=elapsed+Math.max(blinkPlan.next,blinkPlan.close+blinkPlan.hold+blinkPlan.open+.1);
  wake();
}
function scheduleBlink(){clearTimeout(blinkTimer);if(hasBlinkTargets&&!holdBlink&&!reducedMotion&&$('autoBlink').checked&&!document.hidden&&windowActive)blinkTimer=setTimeout(()=>beginBlink(true),Math.max(50,(nextBlink-elapsed)*1000));}
$('blink').onclick=()=>beginBlink();$('autoBlink').onchange=()=>{elapsed=(performance.now()-start)/1000;nextBlink=elapsed+4;scheduleBlink();};
function stopReplay(){replayStart=null;$('replay').textContent='Replay turn';}
for(const [label,value] of [['Turn left',-1],['Turn right',1]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{stopReplay();tx=value;ty=0;wake();};document.querySelector('.actions').append(b);}
const held=document.createElement('button');held.textContent='Hold blink';held.setAttribute('aria-pressed','false');held.onclick=()=>{holdBlink=!holdBlink;held.setAttribute('aria-pressed',String(holdBlink));wake();};document.querySelector('.actions').append(held);
$('center').onclick=()=>{stopReplay();pointerX=pointerY=tx=ty=x=y=gx=gy=0;wake();};
$('replay').onclick=()=>{if(replayStart!==null){stopReplay();wake();return;}replayStart=(performance.now()-start)/1000;$('replay').textContent='Stop replay';wake();};
function holdTracking(){if(replayStart!==null)stopReplay();tx=x;ty=y;gx=x;gy=y;stage.dataset.pointerTracking='held';wake();}
window.addEventListener('pointermove',e=>{
  const r=stage.getBoundingClientRect();
  pointerX=THREE.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);
  pointerY=THREE.MathUtils.clamp((e.clientY-r.top)/r.height*2-1,-1,1);
  // Reading/dragging can hold the head without freezing the eyes.
  if(e.buttons&&stage.hasPointerCapture(e.pointerId)){holdTracking();return;}
  if(replayStart!==null||e.target.closest('#contentPanel')){wake();return;}
  tx=pointerX*(wideMotion?1:.5);ty=pointerY*(wideMotion?1:.65);
  stage.dataset.pointerTracking='following';wake();
});
stage.addEventListener('pointerleave',()=>{pointerX=pointerY=0;if(replayStart===null)tx=ty=0;wake();});
document.addEventListener('hud-center',()=>{stopReplay();pointerX=pointerY=tx=ty=x=y=gx=gy=0;wake();});
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
    const materialReview=params.get('debug')==='1'?params.get('material'):null;
    o.material=materialReview==='atlas'
      ?new THREE.MeshBasicMaterial({map:material.map,side:material.side})
      :materialReview==='clay'
        ?new THREE.MeshStandardMaterial({color:0xc6c6c6,roughness:.78,side:material.side})
        :material.clone();
    o.material.roughness=.78;o.material.metalness=0;
    if(/eyebrow|eyelash|short02/.test(o.name)){o.material.transparent=true;o.material.alphaTest=.03;o.material.depthWrite=false;o.material.emissive.set(0x30251b);o.material.emissiveMap=o.material.map;o.material.emissiveIntensity=.24;}
    if(o.material.map)o.material.map.anisotropy=2;
    if(!materialReview&&o.material.map){
      o.material.emissive.set(0xffffff);o.material.emissiveMap=o.material.map;
      // The atlas already contains illumination; a modest photo contribution
      // avoids shading those original shadows a second time.
      o.material.emissiveIntensity=params.get('debug')==='1'&&params.has('photo-fill')
        ?THREE.MathUtils.clamp(Number(params.get('photo-fill'))||0,0,.3):cinematicLight.photoFill;
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
  document.querySelectorAll('[data-expression]').forEach(b=>{b.disabled=b.dataset.expression!=='neutral';});
  loaded=true;$('rig').textContent='Rory · fitted from video';stage.dataset.character='rory';
  elapsed=(performance.now()-start)/1000;nextBlink=elapsed+2.5+Math.random();
  resize();scheduleBlink();wake();
}).catch(error=>{
  console.error('Pilot could not load',error);loaded=true;
  $('rig').textContent='Pilot unavailable';stage.dataset.character='unavailable';wake();
});
// A slow wide sweep, fast reversal, vertical glance, then return to rest.
const route=[[0,0],[-1,0],[1,0],[.6,-.5],[-.6,.4],[0,0]];
const ocularAnchor=new THREE.Vector3(.0303,1.6252,.073),trackedEyeWorld=new THREE.Vector3(),eyeProjected=new THREE.Vector3(),eyeRestProjected=new THREE.Vector3();
function frame(now){
  raf=0;if(!loaded||document.hidden||!windowActive)return;
  const blinkAge=(now-start)/1000-blinkAt;
  const blinking=holdBlink||(blinkAge>=0&&blinkAge<blinkPlan.close+blinkPlan.hold+blinkPlan.open);
  const pendingGaze=gazeTarget(pointerX,pointerY,x*.61,y*.12);
  const eyeMoving=Math.abs(gazeYaw-pendingGaze.yaw)>.0005||Math.abs(gazePitch-pendingGaze.pitch)>.0005;
  if(now-lastFrame<1000/(blinking||eyeMoving?60:24)-.5){wake();return;}
  // Dense serif text needs more samples than the wireframe. Keep a fixed cap
  // while CV is visible and restore the original budget for other Sections.
  if(readingCV!==cvVisible())resize();
  const dt=Math.min((now-lastFrame)/1000,.08);lastFrame=now;elapsed=(now-start)/1000;
  if(replayStart!==null){const p=(elapsed-replayStart)/1.5,i=Math.floor(p);if(i>=route.length-1){stopReplay();tx=ty=0;}else{const a=p-i;tx=THREE.MathUtils.lerp(route[i][0],route[i+1][0],a);ty=THREE.MathUtils.lerp(route[i][1],route[i+1][1],a);}}
  // Local visual-proof fixture: hold a repeatable moderate target through capture.
  if(params.get('debug')==='1'&&params.get('review-pose')==='turn'){tx=.4;ty=0;}
  if(reducedMotion){x=tx;y=ty;gx=tx;gy=ty;}
  x+=(tx-x)*(1-Math.exp(-dt*6));y+=(ty-y)*(1-Math.exp(-dt*6));gx+=(tx-gx)*(1-Math.exp(-dt*22));gy+=(ty-gy)*(1-Math.exp(-dt*20));
  pivot.rotation.set(y*.12,x*.61,0,'YXZ');
  const targetGaze=gazeTarget(pointerX,pointerY,x*.61,y*.12);
  gazeYaw=dampGaze(gazeYaw,targetGaze.yaw,dt,reducedMotion);
  gazePitch=dampGaze(gazePitch,targetGaze.pitch,dt,reducedMotion);
  const age=elapsed-blinkAt,bl=holdBlink?1:blinkWeight(age,blinkPlan),br=bl;blinkPeak=Math.max(blinkPeak,Math.min(bl,br));
  if(faceRig)faceRig.apply({blinkLeft:bl,blinkRight:br,yaw:gazeYaw,pitch:gazePitch});
  if(faceRig)faceRig.getPupilWorldPosition('right',trackedEyeWorld);
  else trackedEyeWorld.copy(ocularAnchor).sub(pivot.position).applyQuaternion(pivot.quaternion).add(pivot.position);
  eyeProjected.copy(trackedEyeWorld).project(camera);
  eyeRestProjected.copy(ocularAnchor).project(camera);
  hudTrial.setPose(x,y,{world:trackedEyeWorld,x:(eyeProjected.x+1)*stage.clientWidth/2,y:(1-eyeProjected.y)*stage.clientHeight/2,restX:(eyeRestProjected.x+1)*stage.clientWidth/2,restY:(1-eyeRestProjected.y)*stage.clientHeight/2});
  hudGlow.update(hudTrial.glowSources,dt,!neutralLighting&&$('hudToggle').checked);
  const goal=expressions[expression];let changing=false;
  new Set([...Object.keys(mix),...Object.keys(goal)]).forEach(k=>{mix[k]=(mix[k]||0)+((goal[k]||0)-(mix[k]||0))*(1-Math.exp(-dt*10));if(Math.abs((goal[k]||0)-mix[k])>.001)changing=true;});
  const active=Math.abs(tx-x)>.0003||Math.abs(ty-y)>.0003||Math.abs(tx-gx)>.0003||Math.abs(ty-gy)>.0003||Math.abs(gazeYaw-targetGaze.yaw)>.0001||Math.abs(gazePitch-targetGaze.pitch)>.0001||changing||(age>=0&&age<blinkPlan.close+blinkPlan.hold+blinkPlan.open+.006)||replayStart!==null||hudTrial.needsFrame||hudGlow.needsFrame;
  renderer.render(scene,camera);frames++;
  $('pose').textContent=`Yaw ${(x*35).toFixed(1)}° / pitch ${(-y*7).toFixed(1)}° / ${expression} / ${active?'moving':'idle paused'}`;
  Object.assign($('pose').dataset,{frames:String(frames),pixels:String(renderer.domElement.width*renderer.domElement.height),triangles:String(renderer.info.render.triangles),drawCalls:String(renderer.info.render.calls),lines:String(renderer.info.render.lines),points:String(renderer.info.render.points),active:String(active),blink:Math.max(bl,br).toFixed(3),blinkPeak:blinkPeak.toFixed(3),blinkCount:String(blinkCount),gazeYaw:gazeYaw.toFixed(4),gazePitch:gazePitch.toFixed(4),hudGlow:JSON.stringify(hudGlow.sample),model:'rory-video',yaw:(x*35).toFixed(1)});
  if(hudDirty){hudTrial.draw(ctx,$('hologram').width,$('hologram').height,expression);hudDirty=false;}
  if(active)wake();else scheduleBlink();
}
resize();lighting(neutralLighting);
