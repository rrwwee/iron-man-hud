// Disposable candidate: Nathang30 geometry/UVs, authored local expression controls.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { createHUDTrial } from './hud-trial.js?v=3';

const $=id=>document.getElementById(id),stage=$('stage');
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true,powerPreference:'low-power'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=false;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(26,2,.01,10);
const pivot=new THREE.Group();pivot.position.set(0,1.619,.025);scene.add(pivot);
const ambient=new THREE.HemisphereLight(0xaccddd,0x000000,.02);scene.add(ambient);
const key=new THREE.PointLight(0xffbd99,.045,2,2),fill=new THREE.PointLight(0x8bcdf7,.023,2,2);
key.position.set(-.11,1.67,.27);fill.position.set(.12,1.64,.25);scene.add(key,fill);
camera.position.set(0,1.615,.43);camera.lookAt(0,1.612,.01);
const ctx=$('hologram').getContext('2d');
const params=new URLSearchParams(location.search);
let neutralLighting=params.get('light')==='inspection'||params.get('variant')==='inspection',expression='neutral',mix={},meshes=[],loaded=false;
let holdBlink=false,tx=0,ty=0,x=0,y=0,gx=0,gy=0,replayStart=null,raf=0,lastFrame=0,frames=0,hudDirty=true;
let blinkAt=-10,nextBlink=4,blinkClose=.075,blinkHold=.045,blinkOpen=.17,blinkPeak=0,blinkTimer=0,elapsed=0;
const lidReady={value:0};
const lidTexture=new THREE.TextureLoader().load('./assets/nathang30-closed-eyes.jpg',()=>{lidReady.value=1;wake();});lidTexture.colorSpace=THREE.SRGBColorSpace;lidTexture.flipY=false;
const start=performance.now(),gaze={value:new THREE.Vector2()},closure={value:new THREE.Vector2()};
const expressions={neutral:{},smirk:{mouthSmileLeft:.85,browOuterUpRight:.2},surprise:{browInnerUp:.85,browOuterUpLeft:.5,browOuterUpRight:.5,jawOpen:.6},skeptical:{browOuterUpRight:.9,browDownLeft:.6,mouthSmileRight:.22}};
function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
function lighting(value){neutralLighting=value;$('neutralLight').checked=value;key.color.set(value?0xffffff:0xffbd99);fill.color.set(value?0xffffff:0x8bcdf7);key.intensity=value?.06:.045;fill.intensity=value?.04:.023;ambient.intensity=value?.35:.02;$('variantLabel').textContent=value?'Inspection lighting':'Cinematic lighting';const u=new URL(location.href);if(value)u.searchParams.set('light','inspection');else u.searchParams.delete('light');history.replaceState(null,'',u);wake();}
const hudTrial=createHUDTrial({wake,invalidate:()=>{hudDirty=true;}});
function toggleControls(){const p=$('trialControls');p.hidden=!p.hidden;$('controlsToggle').setAttribute('aria-expanded',String(!p.hidden));}
$('controlsToggle').onclick=toggleControls;
$('previous').onclick=$('next').onclick=()=>lighting(!neutralLighting);
$('neutralLight').onchange=()=>lighting($('neutralLight').checked);
$('hudToggle').onchange=()=>document.body.classList.toggle('no-hud',!$('hudToggle').checked);
// These belonged to the MPFB comparison. This candidate uses its own fitted eye surfaces.
$('photoEyes').closest('label').hidden=true;$('relaxedEyes').closest('label').hidden=true;
$('photoEyes').closest('label').style.display='none';$('relaxedEyes').closest('label').style.display='none';
$('loading').textContent='Loading Nathang30 head…';
document.querySelector('.disclaimer').innerHTML='Tony Stark by <a href="https://sketchfab.com/3d-models/tony-stark-86c267264a2e4903b8c2bcc1b972cb74" target="_blank" rel="noreferrer">Nathang30</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a><br>Modified head trial · authored expressions · texture-based blink/gaze';
const comparison=document.createElement('a');comparison.href='?model=mpfb&variant=hud';comparison.textContent='Compare previous MPFB head';comparison.style.cssText='display:block;margin-top:10px;font-size:10px;color:#83b5c0';document.querySelector('.disclaimer').after(comparison);
window.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key.toLowerCase()==='h'){toggleControls();return;}if(e.key==='Escape'&&!$('trialControls').hidden)toggleControls();});
function chooseExpression(name){expression=name;$('expressionHud').textContent=name.toUpperCase();document.querySelectorAll('[data-expression]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.expression===name)));hudDirty=true;wake();}
document.querySelectorAll('[data-expression]').forEach(b=>b.onclick=()=>chooseExpression(b.dataset.expression));
function beginBlink(automatic=false){clearTimeout(blinkTimer);elapsed=(performance.now()-start)/1000;blinkAt=elapsed;blinkPeak=0;const speed=$('slowBlink').checked?4:1;blinkClose=(.065+Math.random()*.02)*speed;blinkHold=.045*speed;blinkOpen=(.15+Math.random()*.035)*speed;nextBlink=elapsed+(automatic&&Math.random()<.1?.48:3+Math.random()*4);wake();}
function scheduleBlink(){clearTimeout(blinkTimer);if($('autoBlink').checked&&!document.hidden)blinkTimer=setTimeout(()=>beginBlink(true),Math.max(50,(nextBlink-elapsed)*1000));}
$('blink').onclick=()=>beginBlink();$('autoBlink').onchange=()=>{elapsed=(performance.now()-start)/1000;nextBlink=elapsed+4;scheduleBlink();};
function stopReplay(){replayStart=null;$('replay').textContent='Replay turn';}
for(const [label,value] of [['Turn left',-1],['Turn right',1]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{stopReplay();tx=value;ty=0;wake();};document.querySelector('.actions').append(b);}
const held=document.createElement('button');held.textContent='Hold blink';held.setAttribute('aria-pressed','false');held.onclick=()=>{holdBlink=!holdBlink;held.setAttribute('aria-pressed',String(holdBlink));wake();};document.querySelector('.actions').append(held);
$('center').onclick=()=>{stopReplay();tx=ty=x=y=gx=gy=0;wake();};
$('replay').onclick=()=>{if(replayStart!==null){stopReplay();wake();return;}replayStart=(performance.now()-start)/1000;$('replay').textContent='Stop replay';wake();};
stage.addEventListener('pointermove',e=>{if(replayStart!==null)return;const r=stage.getBoundingClientRect();tx=THREE.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);ty=THREE.MathUtils.clamp((e.clientY-r.top)/r.height*2-1,-1,1);wake();});
stage.addEventListener('pointerleave',()=>{if(replayStart===null)tx=ty=0;wake();});
function resize(){const w=stage.clientWidth,h=stage.clientHeight,scale=Math.min(1,960/w,600/h);renderer.setPixelRatio(scale);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();$('hologram').width=Math.round(w*scale);$('hologram').height=Math.round(h*scale);hudDirty=true;wake();}
new ResizeObserver(resize).observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;clearTimeout(blinkTimer);}else{elapsed=(performance.now()-start)/1000;nextBlink=elapsed+4;wake();scheduleBlink();}});
function surface(material,eye){
  material.onBeforeCompile=shader=>{
    shader.uniforms.gaze=gaze;shader.uniforms.closure=closure;shader.uniforms.lidTexture={value:lidTexture};shader.uniforms.lidReady=lidReady;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 faceLocal;').replace('#include <begin_vertex>','#include <begin_vertex>\nfaceLocal=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 faceLocal;\nuniform vec2 gaze;\nuniform vec2 closure;\nuniform sampler2D lidTexture;\nuniform float lidReady;`);
    if(eye){
      const left=eye==='EyeLeft';
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #ifdef USE_MAP
      vec2 openCenter=vec2(${left?'0.33563,0.124014':'0.420985,0.265148'});
      vec2 delta=vMapUv-openCenter;
      float frontMask=1.0-smoothstep(0.035,0.060,length(delta));
      float irisMask=(1.0-smoothstep(0.010,0.024,abs(delta.x)))*(1.0-smoothstep(0.012,0.028,abs(delta.y)));
      vec2 lookUv=vMapUv-gaze*vec2(0.0032,-0.0024)*irisMask;
      vec4 openColor=texture2D(map,lookUv);
      // Project the matched closed-eye render onto the source eye geometry.
      vec2 photoUv=vec2(0.5+(faceLocal.x/0.78)/0.31,
        (1.095-((faceLocal.y-1.626)/0.78+0.925))/0.31);
      vec2 lidUv=(photoUv+vec2(0.0,0.016)-vec2(0.30,0.43))/vec2(0.42,0.23);
      vec4 shutColor=texture2D(lidTexture,lidUv);
      shutColor.rgb*=vec3(0.73,0.64,0.58);
      float amount=lidReady*closure.${left?'x':'y'}*frontMask;
      float wipe=amount>0.999?1.0:smoothstep(-0.004,0.004,amount*0.044-0.023-delta.y);
      diffuseColor*=mix(openColor,shutColor,wipe*frontMask*lidReady);
      #endif`);
    }
    if(!eye){
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #ifdef USE_MAP
      vec4 skin=texture2D(map,vMapUv);
      float side=faceLocal.x<0.0?closure.x:closure.y;
      vec2 eyeCenter=faceLocal.x<0.0?vec2(-0.02691,1.6252):vec2(0.03003,1.6252);
      float lidMask=1.0-smoothstep(0.80,1.16,length((faceLocal.xy-eyeCenter)/vec2(0.019,0.017)));
      vec2 photoUv=vec2(0.5+(faceLocal.x/0.78)/0.31,
        (1.095-((faceLocal.y-1.626)/0.78+0.925))/0.31);
      vec2 lidUv=(photoUv+vec2(0.0,0.016)-vec2(0.30,0.43))/vec2(0.42,0.23);
      vec4 shut=texture2D(lidTexture,lidUv);shut.rgb*=vec3(0.73,0.64,0.58);
      diffuseColor*=mix(skin,shut,side*lidMask*lidReady);
      #endif`);
    }
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float front=smoothstep(-0.010,0.050,faceLocal.z);
      float sides=1.0-smoothstep(0.055,0.079,abs(faceLocal.x));
      float bottom=smoothstep(1.518,1.546,faceLocal.y);
      float top=1.0-smoothstep(1.688,1.722,faceLocal.y);
      outgoingLight*=front*sides*bottom*top;
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>`nathang30-v5-${eye||'face'}`;
}
new GLTFLoader().load('./assets/nathang30-head.glb',gltf=>{
  const model=gltf.scene;model.position.copy(pivot.position).multiplyScalar(-1);pivot.add(model);
  model.traverse(o=>{if(!o.isMesh)return;meshes.push(o);o.frustumCulled=false;o.material=o.material.clone();o.material.roughness=.75;o.material.metalness=0;o.material.side=THREE.FrontSide;if(o.material.map)o.material.map.anisotropy=2;surface(o.material,/^Eye/.test(o.name)?o.name:null);});
  loaded=true;$('loading').style.display='none';$('rig').textContent='Nathang30 · 7 authored morphs · fitted photo eyes · no shadows';resize();lighting(neutralLighting);scheduleBlink();wake();
},undefined,error=>{$('loading').textContent='Head load failed. See console.';console.error(error);});
function blinkWeight(age){if(age<0)return 0;const s=t=>t*t*(3-2*t);if(age<blinkClose)return s(age/blinkClose);if(age<blinkClose+blinkHold)return 1;if(age<blinkClose+blinkHold+blinkOpen)return 1-s((age-blinkClose-blinkHold)/blinkOpen);return 0;}
// A slow wide sweep, fast reversal, vertical glance, then return to rest.
const route=[[0,0],[-1,0],[1,0],[.6,-.5],[-.6,.4],[0,0]];
function frame(now){
  raf=0;if(!loaded||document.hidden)return;if(now-lastFrame<1000/30){wake();return;}
  const dt=Math.min((now-lastFrame)/1000,.08);lastFrame=now;elapsed=(now-start)/1000;
  if(replayStart!==null){const p=(elapsed-replayStart)/1.5,i=Math.floor(p);if(i>=route.length-1){stopReplay();tx=ty=0;}else{const a=p-i;tx=THREE.MathUtils.lerp(route[i][0],route[i+1][0],a);ty=THREE.MathUtils.lerp(route[i][1],route[i+1][1],a);}}
  x+=(tx-x)*(1-Math.exp(-dt*6));y+=(ty-y)*(1-Math.exp(-dt*6));gx+=(tx-gx)*(1-Math.exp(-dt*22));gy+=(ty-gy)*(1-Math.exp(-dt*20));
  pivot.rotation.set(y*.12,x*.61,0,'YXZ');
  // Keep the small photo gaze within the fitted eye surfaces; large direction
  // changes come from the actual head geometry, not sliding photo plates.
  gaze.value.set(THREE.MathUtils.clamp(gx-x*.75,-1,1),gy-y*.5);
  const age=elapsed-blinkAt,bl=holdBlink?1:blinkWeight(age),br=holdBlink?1:blinkWeight(age-.006);closure.value.set(bl,br);blinkPeak=Math.max(blinkPeak,Math.min(bl,br));
  const goal=expressions[expression];let changing=false;
  new Set([...Object.keys(mix),...Object.keys(goal)]).forEach(k=>{mix[k]=(mix[k]||0)+((goal[k]||0)-(mix[k]||0))*(1-Math.exp(-dt*10));if(Math.abs((goal[k]||0)-mix[k])>.001)changing=true;});
  meshes.forEach(m=>{if(m.morphTargetDictionary)Object.entries(m.morphTargetDictionary).forEach(([name,i])=>m.morphTargetInfluences[i]=name==='eyeBlinkLeft'?bl:name==='eyeBlinkRight'?br:mix[name]||0);});
  const active=Math.abs(tx-x)>.0003||Math.abs(ty-y)>.0003||Math.abs(tx-gx)>.0003||Math.abs(ty-gy)>.0003||changing||(age>=0&&age<blinkClose+blinkHold+blinkOpen+.006)||replayStart!==null;
  renderer.render(scene,camera);frames++;
  $('pose').textContent=`Yaw ${(x*35).toFixed(1)}° / pitch ${(-y*7).toFixed(1)}° / ${expression} / ${active?'moving':'idle paused'}`;
  Object.assign($('pose').dataset,{frames:String(frames),pixels:String(renderer.domElement.width*renderer.domElement.height),triangles:String(renderer.info.render.triangles),drawCalls:String(renderer.info.render.calls),active:String(active),blink:Math.max(bl,br).toFixed(3),blinkPeak:blinkPeak.toFixed(3),model:'nathang30',yaw:(x*35).toFixed(1)});
  if(hudDirty){hudTrial.draw(ctx,$('hologram').width,$('hologram').height,expression);hudDirty=false;}
  if(active)wake();else scheduleBlink();
}
resize();lighting(neutralLighting);
