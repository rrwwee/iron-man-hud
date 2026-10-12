import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { drawHUD } from './hud.js';
import { createEyeSurface } from './eye-surface.js?v=8';

const $=id=>document.getElementById(id),stage=$('stage');
const hologram=$('hologram'),hudContext=hologram.getContext('2d');
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true,powerPreference:'low-power'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1;
// No shadow pass, environment map, or per-frame HUD rasterization.
renderer.shadowMap.enabled=false;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(26,2,.01,10);
const ambient=new THREE.HemisphereLight(0x7da4c4,0x000000,0);scene.add(ambient);
const key=new THREE.SpotLight(0xffb98d,.15,2,.65,1,2);scene.add(key,key.target);
const fill=new THREE.SpotLight(0x82c9f4,.08,2,.65,1,2);scene.add(fill,fill.target);
let neutralLighting=new URLSearchParams(location.search).get('variant')==='inspection';
let expression='neutral',expressionMix={},blinkAt=-10,nextBlink=4,tx=0,ty=0,x=0,y=0,gazeX=0,gazeY=0,replayStart=null;
let blinkClose=.075,blinkHold=.04,blinkOpen=.155,blinkPeak=0;
let model,head,eyes=[],morphMeshes=[],loaded=false,raf=0,blinkTimer=0,hudDirty=true;
let photographicEyes,originalEyes;
const eyeGaze={value:new THREE.Vector2()};
const eyeRelaxation={value:new THREE.Vector2(1,.95)};
let elapsed=0,lastFrame=0,renderCount=0;
const started=performance.now(),rest=new Map(),eyeRestWorld=new Map();
const expressions={neutral:{},smirk:{mouthSmileLeft:.75,mouthDimpleLeft:.3,browOuterUpRight:.2},surprise:{browInnerUp:.85,browOuterUpLeft:.6,browOuterUpRight:.6,eyeWideLeft:.55,eyeWideRight:.55,jawOpen:.3},skeptical:{browOuterUpRight:.9,browDownLeft:.5,eyeSquintLeft:.3,mouthPressLeft:.4,mouthSmileRight:.16}};
function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
function beginBlink(automatic=false){
  clearTimeout(blinkTimer);
  elapsed=(performance.now()-started)/1000;blinkAt=elapsed;blinkPeak=0;
  const speed=$('slowBlink').checked?4:1;
  blinkClose=(.065+Math.random()*.02)*speed;blinkHold=.04*speed;blinkOpen=(.14+Math.random()*.035)*speed;
  // An occasional second blink, otherwise an irregular, quiet interval.
  nextBlink=elapsed+(automatic&&Math.random()<.12?.44:2.8+Math.random()*4);
  wake();
}
function scheduleBlink(){clearTimeout(blinkTimer);if($('autoBlink').checked&&!document.hidden)blinkTimer=setTimeout(()=>beginBlink(true),Math.max(50,(nextBlink-elapsed)*1000));}
function toggleControls(){const panel=$('trialControls');panel.hidden=!panel.hidden;$('controlsToggle').setAttribute('aria-expanded',String(!panel.hidden));}
$('controlsToggle').onclick=toggleControls;
function lighting(value){neutralLighting=value;$('neutralLight').checked=value;key.color.set(value?0xffffff:0xffb98d);key.intensity=value?.25:.15;fill.color.set(value?0xffeee4:0x82c9f4);fill.intensity=value?.2:.08;ambient.intensity=value?.2:0;$('variantLabel').textContent=value?'B / Inspection lighting':'A / Front-face light';const url=new URL(location.href);url.searchParams.set('variant',value?'inspection':'hud');history.replaceState(null,'',url);wake();}
$('neutralLight').onchange=()=>lighting($('neutralLight').checked);
$('previous').onclick=$('next').onclick=()=>lighting(!neutralLighting);
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h'&&!e.target.closest('textarea,[contenteditable],input[type=text]')){toggleControls();return;}if(e.key==='Escape'&&!$('trialControls').hidden){toggleControls();return;}if(e.target.closest('input,button'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();lighting(!neutralLighting);}});
$('hudToggle').onchange=()=>document.body.classList.toggle('no-hud',!$('hudToggle').checked);
$('photoEyes').onchange=()=>{if(photographicEyes){photographicEyes.visible=$('photoEyes').checked;originalEyes.visible=!$('photoEyes').checked;wake();}};
$('relaxedEyes').onchange=wake;
function chooseExpression(name){expression=name;$('expressionHud').textContent=name.toUpperCase();document.querySelectorAll('[data-expression]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.expression===name)));hudDirty=true;wake();}
document.querySelectorAll('[data-expression]').forEach(b=>b.onclick=()=>chooseExpression(b.dataset.expression));
$('blink').onclick=()=>beginBlink();
$('autoBlink').onchange=()=>{elapsed=(performance.now()-started)/1000;nextBlink=elapsed+4;scheduleBlink();};
function stopReplay(){replayStart=null;$('replay').textContent='Replay turn';}
$('center').onclick=()=>{stopReplay();tx=ty=x=y=0;wake();};
$('replay').onclick=()=>{if(replayStart!==null){stopReplay();wake();return;}elapsed=(performance.now()-started)/1000;replayStart=elapsed;$('replay').textContent='Stop replay';wake();};
stage.addEventListener('pointermove',e=>{if(replayStart!==null)return;const r=stage.getBoundingClientRect();tx=THREE.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);ty=THREE.MathUtils.clamp((e.clientY-r.top)/r.height*2-1,-1,1);wake();});
stage.addEventListener('pointerleave',()=>{if(replayStart===null){tx=ty=0;wake();}});
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setPixelRatio(Math.min(1,960/w,600/h));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();hologram.width=w;hologram.height=h;hudDirty=true;wake();}
new ResizeObserver(resize).observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;clearTimeout(blinkTimer);}else{elapsed=(performance.now()-started)/1000;nextBlink=elapsed+4;wake();scheduleBlink();}});
const route=[[0,0],[-1,0],[1,0],[.65,-.5],[-.65,.5],[0,0]];
const lidClosure={value:new THREE.Vector2()};
const lidReady={value:0};
const lidTexture=new THREE.TextureLoader().load('./assets/closed-eyelids.jpg',()=>{lidReady.value=1;wake();});
lidTexture.colorSpace=THREE.SRGBColorSpace;lidTexture.flipY=false;
function blinkSkin(shader){
  // Hide the open-eye photograph as the real lids close. The tiny eye strip
  // is sampled only during a blink, in the existing skin draw call.
  shader.uniforms.lidClosure=lidClosure;
  shader.uniforms.lidTexture={value:lidTexture};shader.uniforms.lidReady=lidReady;
  const mask=`(1.0-smoothstep(0.011,0.020,abs(abs(P.x)-0.0287)))
    *smoothstep(1.613,1.620,P.y)*(1.0-smoothstep(1.635,1.642,P.y))`;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 lidClosure;\nvarying vec2 closedLidUv;').replace('#include <morphtarget_vertex>',`#include <morphtarget_vertex>
closedLidUv=vec2(0.5+transformed.x*4.38,0.410+(1.626-transformed.y)*4.18);`).replace('#include <morphnormal_vertex>',`#include <morphnormal_vertex>
float closure = position.x > 0.0 ? lidClosure.x : lidClosure.y;
float lidMask = ${mask.replaceAll('P.', 'position.')};
objectNormal = normalize(mix(objectNormal,vec3(0.0,0.0,1.0),lidMask*closure));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec2 lidClosure;\nuniform sampler2D lidTexture;\nuniform float lidReady;\nvarying vec2 closedLidUv;').replace('#include <map_fragment>',`
#ifdef USE_MAP
vec4 sampledDiffuseColor = texture2D(map,vMapUv);
float closure = faceLocal.x > 0.0 ? lidClosure.x : lidClosure.y;
if(closure>0.001 && lidReady>0.5){
  float lidMask = ${mask.replaceAll('P.', 'faceLocal.')};
  if(lidMask>0.001){
    vec4 skin = texture2D(lidTexture,(closedLidUv-vec2(0.23,0.34))/vec2(0.54,0.18));
    sampledDiffuseColor = mix(sampledDiffuseColor,skin,lidMask*closure);
  }
}
diffuseColor *= sampledDiffuseColor;
#endif`);
}
// Local-position light aperture keeps the front illuminated and cut edges black.
function faceAperture(material){material.onBeforeCompile=shader=>{if(/Portrait_Skin/.test(material.name))blinkSkin(shader);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 faceLocal;').replace('#include <begin_vertex>','#include <begin_vertex>\nfaceLocal=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 faceLocal;').replace('#include <opaque_fragment>',`float front = smoothstep(0.025,0.10,faceLocal.z);
float sides = 1.0-smoothstep(0.045,0.070,abs(faceLocal.x));
float bottom = smoothstep(1.500,1.540,faceLocal.y);
float top = 1.0-smoothstep(1.675,1.735,faceLocal.y);
outgoingLight *= front*sides*bottom*top;
#include <opaque_fragment>`);};material.customProgramCacheKey=()=> 'front-face-aperture-v2'+material.name;}
new GLTFLoader().load('./assets/tony-head.glb',gltf=>{
  model=gltf.scene;scene.add(model);const bones=[];
  model.traverse(o=>{if(o.isBone){bones.push(o);rest.set(o,o.quaternion.clone());}if(o.isMesh){o.frustumCulled=false;if(o.morphTargetDictionary)morphMeshes.push(o);const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m.transparent=false;m.opacity=1;m.depthWrite=true;m.roughness=/eyes/i.test(m.name)?.22:.64;m.metalness=0;if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());faceAperture(m);});}});
  model.traverse(o=>{if(o.isMesh&&/Brown_Eyes/.test(o.material.name))originalEyes=o;});
  photographicEyes=createEyeSurface(originalEyes,eyeGaze,lidClosure,lidTexture,lidReady,eyeRelaxation);
  originalEyes.visible=!$('photoEyes').checked;photographicEyes.visible=$('photoEyes').checked;
  head=bones.find(o=>/^head$/i.test(o.name));eyes=bones.filter(o=>/^eye[._]?[LR]$/i.test(o.name));
  model.updateMatrixWorld(true);eyes.forEach(b=>eyeRestWorld.set(b,b.getWorldQuaternion(new THREE.Quaternion())));const aim=head.getWorldPosition(new THREE.Vector3());
  camera.position.set(aim.x,aim.y+.023,aim.z+.48);camera.lookAt(aim.x,aim.y+.003,aim.z);
  key.position.set(aim.x-.11,aim.y+.09,aim.z+.25);key.target.position.set(aim.x,aim.y+.025,aim.z+.10);
  fill.position.set(aim.x+.10,aim.y+.035,aim.z+.26);fill.target.position.copy(key.target.position);
  const names=[...new Set(morphMeshes.flatMap(o=>Object.keys(o.morphTargetDictionary)))];
  $('rig').textContent=`${bones.length} bones / ${names.length} controls / no shadows / 30 fps while moving`;
  loaded=true;$('loading').style.display='none';resize();lighting(neutralLighting);scheduleBlink();wake();
},undefined,error=>{$('loading').textContent='The face could not load. See the browser console.';console.error(error);});
const q=new THREE.Quaternion(),euler=new THREE.Euler(0,0,0,'YXZ');
const eyeParent=new THREE.Quaternion(),eyeDelta=new THREE.Quaternion(),eyeEuler=new THREE.Euler(0,0,0,'YXZ');
function aimEye(b,pitch,yaw){
  // Aim in world space: the eyes acquire the target before the slower head,
  // then counter-rotate as the head catches up instead of adding both turns.
  b.parent.updateWorldMatrix(true,false);b.parent.getWorldQuaternion(eyeParent);
  eyeDelta.setFromEuler(eyeEuler.set(pitch,yaw,0));
  b.quaternion.copy(eyeParent.invert()).multiply(eyeDelta).multiply(eyeRestWorld.get(b));
}
function blinkWeight(age){
  if(age<0)return 0;
  const smooth=t=>t*t*(3-2*t),hold=blinkHold;
  if(age<blinkClose)return smooth(age/blinkClose);
  if(age<blinkClose+hold)return 1;
  if(age<blinkClose+hold+blinkOpen)return 1-smooth((age-blinkClose-hold)/blinkOpen);
  return 0;
}
function frame(now){
  raf=0;if(document.hidden||!loaded)return;
  if(now-lastFrame<1000/30){wake();return;}
  const dt=Math.min((now-lastFrame)/1000,.08);lastFrame=now;elapsed=(now-started)/1000;
  if(replayStart!==null){const p=(elapsed-replayStart)/1.4,i=Math.floor(p);if(i>=route.length-1){stopReplay();tx=ty=0;}else{const a=p-i;tx=THREE.MathUtils.lerp(route[i][0],route[i+1][0],a);ty=THREE.MathUtils.lerp(route[i][1],route[i+1][1],a);}}
  x+=(tx-x)*(1-Math.exp(-dt*6));y+=(ty-y)*(1-Math.exp(-dt*6));
  gazeX+=(tx-gazeX)*(1-Math.exp(-dt*24));gazeY+=(ty-gazeY)*(1-Math.exp(-dt*20));
  const age=elapsed-blinkAt,blinkLeft=blinkWeight(age),blinkRight=blinkWeight(age-.006),blink=Math.max(blinkLeft,blinkRight);
  blinkPeak=Math.max(blinkPeak,Math.min(blinkLeft,blinkRight));
  lidClosure.value.set(blinkLeft,blinkRight);
  const goal=expressions[expression],keys=new Set([...Object.keys(expressionMix),...Object.keys(goal)]);let changing=false;
  keys.forEach(k=>{expressionMix[k]=(expressionMix[k]||0)+((goal[k]||0)-(expressionMix[k]||0))*(1-Math.exp(-dt*10));if(Math.abs((goal[k]||0)-expressionMix[k])>.001)changing=true;});
  const relaxed=$('relaxedEyes').checked?1:0;
  eyeRelaxation.value.set(relaxed*(1-(expressionMix.eyeWideLeft||0)/.55),relaxed*.95*(1-(expressionMix.eyeWideRight||0)/.55));
  euler.set(y*.12,x*.21,0);q.setFromEuler(euler);head.quaternion.copy(rest.get(head)).multiply(q);eyes.forEach(b=>aimEye(b,gazeY*.085,gazeX*.14));
  eyeGaze.value.set(gazeX*.14-x*.21,gazeY*.085-y*.12);
  // A little lid follow softens downward gaze. Blink wins over eye-opening
  // expressions, including surprise, so both lids can actually meet.
  const lidFollow=Math.max(0,gazeY*.085-y*.12)*1.3;
  morphMeshes.forEach(mesh=>{Object.entries(mesh.morphTargetDictionary).forEach(([name,i])=>{
    const closure=name.endsWith('Right')?blinkRight:blinkLeft;
    let weight=expressionMix[name]||0;
    if(name==='eyeBlinkLeft'||name==='eyeBlinkRight')weight=closure+lidFollow*(1-closure);
    else if(/^eyeWide|^eyeSquint/.test(name))weight*=1-closure;
    mesh.morphTargetInfluences[i]=weight;
  });});
  const active=Math.abs(tx-x)>.0003||Math.abs(ty-y)>.0003||Math.abs(tx-gazeX)>.0003||Math.abs(ty-gazeY)>.0003||changing||(age>=0&&age<blinkClose+blinkHold+blinkOpen+.006)||replayStart!==null;
  $('pose').textContent=`Yaw ${(x*12).toFixed(1)}° / pitch ${(-y*7).toFixed(1)}° / ${expression}${blink>.1?' / blink':''} / ${active?'moving':'idle paused'}`;
  renderer.render(scene,camera);renderCount++;
  // A read-only DOM diagnostic provides a repeatable idle/render-budget check.
  $('pose').dataset.frames=String(renderCount);$('pose').dataset.pixels=String(renderer.domElement.width*renderer.domElement.height);$('pose').dataset.triangles=String(renderer.info.render.triangles);$('pose').dataset.drawCalls=String(renderer.info.render.calls);$('pose').dataset.active=String(active);
  $('pose').dataset.blink=blink.toFixed(3);$('pose').dataset.blinkPeak=blinkPeak.toFixed(3);$('pose').dataset.gazeYaw=(gazeX*.14*180/Math.PI).toFixed(2);$('pose').dataset.eyeYaw=((gazeX*.14-x*.21)*180/Math.PI).toFixed(2);
  $('pose').dataset.eyeSurface=photographicEyes.visible?'photographic':'globe';
  $('pose').dataset.relaxedEyes=String($('relaxedEyes').checked);
  if(hudDirty){drawHUD(hudContext,stage.clientWidth,stage.clientHeight,0,0,0,expression);hudDirty=false;}
  if(active)wake();else scheduleBlink();
}
resize();lighting(neutralLighting);wake();
