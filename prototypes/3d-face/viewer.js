import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { drawHUD } from './hud.js';

const $=id=>document.getElementById(id), stage=$('stage');
const hologram=$('hologram'),hudContext=hologram.getContext('2d');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function toggleControls(){const panel=$('trialControls');panel.hidden=!panel.hidden;$('controlsToggle').setAttribute('aria-expanded',String(!panel.hidden));}
$('controlsToggle').onclick=toggleControls;
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1;
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(30,1,.01,100);
const ambient=new THREE.HemisphereLight(0x7da4c4,0x000000,.035);scene.add(ambient);
const key=new THREE.SpotLight(0xffb48a,.32,3,.55,.85,2);scene.add(key,key.target);
key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0001;key.shadow.normalBias=.001;
const fill=new THREE.SpotLight(0x82c9f4,.19,3,.55,1,2);scene.add(fill,fill.target);
const rim=new THREE.DirectionalLight(0x3b6e99,.18);scene.add(rim);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
let neutralLighting=new URLSearchParams(location.search).get('variant')==='inspection';
function lighting(value){neutralLighting=value;$('neutralLight').checked=value;key.color.set(value?0xffffff:0xffb48a);key.intensity=value?1.1:.32;fill.color.set(value?0xffeee4:0x82c9f4);fill.intensity=value?.8:.19;key.angle=value?.8:.55;fill.angle=value?.8:.55;rim.intensity=value?.5:.18;ambient.intensity=value?.7:.035;$('variantLabel').textContent=value?'B / Inspection lighting':'A / Cinematic';const url=new URL(location.href);url.searchParams.set('variant',value?'inspection':'hud');history.replaceState(null,'',url);}
$('neutralLight').onchange=()=>lighting($('neutralLight').checked);
$('previous').onclick=$('next').onclick=()=>lighting(!neutralLighting);
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h'&&!e.target.closest('textarea,[contenteditable],input[type=text]')){toggleControls();return;}if(e.key==='Escape'&&!$('trialControls').hidden){toggleControls();return;}if(e.target.closest('input,button'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();lighting(!neutralLighting);}});
$('hudToggle').onchange=()=>document.body.classList.toggle('no-hud',!$('hudToggle').checked);
const expressions={neutral:{},smirk:{mouthSmileLeft:.75,mouthDimpleLeft:.3,browOuterUpRight:.2},surprise:{browInnerUp:.85,browOuterUpLeft:.6,browOuterUpRight:.6,eyeWideLeft:.55,eyeWideRight:.55,jawOpen:.3},skeptical:{browOuterUpRight:.9,browDownLeft:.5,eyeSquintLeft:.3,mouthPressLeft:.4,mouthSmileRight:.16}};
let expression='neutral',expressionMix={},blinkAt=-10,nextBlink=3.4,tx=0,ty=0,x=0,y=0,replayStart=null,model,head,neck,eyes=[],morphMeshes=[],last=performance.now(),elapsed=0,rest=new Map(),loaded=false;
function chooseExpression(name){expression=name;$('expressionHud').textContent=name.toUpperCase();document.querySelectorAll('[data-expression]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.expression===name)));}
document.querySelectorAll('[data-expression]').forEach(b=>b.onclick=()=>chooseExpression(b.dataset.expression));
$('blink').onclick=()=>{blinkAt=elapsed;nextBlink=elapsed+3.8;};
function stopReplay(){replayStart=null;$('replay').textContent='Replay turn';}
$('center').onclick=()=>{stopReplay();tx=ty=x=y=0;};
$('replay').onclick=()=>{if(replayStart!==null){stopReplay();return;}replayStart=elapsed;$('replay').textContent='Stop replay';};
stage.addEventListener('pointermove',e=>{if(replayStart!==null)return;const r=stage.getBoundingClientRect();tx=THREE.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);ty=THREE.MathUtils.clamp((e.clientY-r.top)/r.height*2-1,-1,1);});
stage.addEventListener('pointerleave',()=>{if(replayStart===null)tx=ty=0;});
function resize(){const w=stage.clientWidth,h=stage.clientHeight,dpr=Math.min(devicePixelRatio,2);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();hologram.width=w*dpr;hologram.height=h*dpr;hudContext.setTransform(dpr,0,0,dpr,0,0);}
new ResizeObserver(resize).observe(stage);resize();lighting(neutralLighting);
const route=[[0,0],[-1,0],[1,0],[.65,-.5],[-.65,.5],[0,0]];
new GLTFLoader().load('./assets/tony-head.glb',gltf=>{
  model=gltf.scene;scene.add(model);const bones=[];
  model.traverse(o=>{if(o.isBone){bones.push(o);rest.set(o,o.quaternion.clone());}if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;if(o.morphTargetDictionary)morphMeshes.push(o);
    const materials=Array.isArray(o.material)?o.material:[o.material];
    materials.forEach(m=>{m.transparent=false;m.opacity=1;m.depthWrite=true;
      if(/short|hair|beard|eyebrow|eyelash/i.test(m.name)){m.alphaTest=.4;m.side=THREE.DoubleSide;}
      if(/beard/i.test(m.name)){m.color.setRGB(.18,.10,.065);m.roughness=.9;}
      if(/body/i.test(m.name))m.roughness=.85;
      m.needsUpdate=true;
    });
  }});
  head=bones.find(o=>/^head$/i.test(o.name))||bones.find(o=>/head/i.test(o.name));
  neck=bones.find(o=>/^neck(01)?$/i.test(o.name));eyes=bones.filter(o=>/^(LeftEye|RightEye|eye[._]?[LR]|eye[-_](left|right))$/i.test(o.name));
  model.updateMatrixWorld(true);
  const aim=head?head.getWorldPosition(new THREE.Vector3()):new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  // MPFB is converted from Blender Z-up to glTF Y-up; use the actual head position to frame its proportions.
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  const headScale=size.y>2.5?size.y/1.8:1;
  camera.position.set(aim.x,aim.y+.02*headScale,aim.z+.5*headScale);
  camera.lookAt(aim.x,aim.y,aim.z);
  key.position.set(aim.x-.28,aim.y+.12,aim.z+.35);key.target.position.set(aim.x,aim.y,aim.z+.055);
  fill.position.set(aim.x+.28,aim.y+.015,aim.z+.31);fill.target.position.copy(key.target.position);
  rim.position.set(aim.x+.3,aim.y+.15,aim.z-.2);rim.target.position.copy(aim);scene.add(rim.target);
  const names=[...new Set(morphMeshes.flatMap(o=>Object.keys(o.morphTargetDictionary)))];
  $('rig').textContent=`${bones.length} bones / ${names.length} face controls / ${eyes.length} eye bones`;
  loaded=true;$('loading').style.display='none';
  window.__faceTrial={bones:bones.map(b=>b.name),morphs:names,asset:'tony-head.glb'};
},undefined,error=>{$('loading').textContent='The 3D head could not load. See the browser console.';console.error(error);});
const q=new THREE.Quaternion(),euler=new THREE.Euler(0,0,0,'YXZ');
function rotate(b,pitch,yaw){if(!b)return;euler.set(pitch,yaw,0);q.setFromEuler(euler);b.quaternion.copy(rest.get(b)).multiply(q);}
function aimEye(b,pitch,yaw){
  b.parent.updateWorldMatrix(true,false);
  const parent=b.parent.getWorldQuaternion(new THREE.Quaternion());
  const delta=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
  b.quaternion.copy(parent.clone().invert().multiply(delta).multiply(parent).multiply(rest.get(b)));
}
function frame(now){const dt=Math.min((now-last)/1000,.06);last=now;elapsed+=dt;
  if(replayStart!==null){const p=(elapsed-replayStart)/1.4,i=Math.floor(p);if(i>=route.length-1){stopReplay();tx=ty=0;}else{const a=p-i;tx=THREE.MathUtils.lerp(route[i][0],route[i+1][0],a);ty=THREE.MathUtils.lerp(route[i][1],route[i+1][1],a);}}
  x+=(tx-x)*(1-Math.exp(-dt*6));y+=(ty-y)*(1-Math.exp(-dt*6));
  if($('autoBlink').checked&&elapsed>nextBlink){blinkAt=elapsed;nextBlink=elapsed+3.5+Math.random()*2.5;}
  const age=elapsed-blinkAt,blink=age<0?0:age<.12?Math.sin(age/.12*Math.PI/2):age<.19?1:age<.34?Math.cos((age-.19)/.15*Math.PI/2):0;
  const goal=expressions[expression];const keys=new Set([...Object.keys(expressionMix),...Object.keys(goal)]);keys.forEach(k=>expressionMix[k]=(expressionMix[k]||0)+((goal[k]||0)-(expressionMix[k]||0))*(1-Math.exp(-dt*10)));
  if(loaded){rotate(head,y*.25,x*.48);rotate(neck,y*.06,x*.09);eyes.forEach(b=>aimEye(b,ty*.12,tx*.12));
    morphMeshes.forEach(mesh=>{const dict=mesh.morphTargetDictionary,weights=mesh.morphTargetInfluences;Object.entries(dict).forEach(([name,i])=>{const clean=name.replace(/^arkit[_-]?/i,'');weights[i]=clean==='eyeBlinkLeft'||clean==='eyeBlinkRight'?blink:(expressionMix[clean]||0);});});
  }
  $('pose').textContent=`Head yaw ${(x*33).toFixed(1)}° · pitch ${(-y*18).toFixed(1)}° · ${expression}${blink>.1?' · blink':''}`;
  renderer.render(scene,camera);requestAnimationFrame(frame);
  drawHUD(hudContext,stage.clientWidth,stage.clientHeight,reducedMotion?0:elapsed,x,y,expression);
}requestAnimationFrame(frame);
