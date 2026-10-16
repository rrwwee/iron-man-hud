import {suitModelSource} from './suit-model-source.js?v=kitesurf-gear-2';
import {createFlightSummary} from './hud-flight-summary.js?v=rory-29f';
// Scene geometry for the flight globe, wearable gear and instrument rims.
import {createSuitActivity} from './hud-suit-activity.js?v=rory-29f';
import * as THREE from 'three';
import {transferPhase} from './hud-transfer.js?v=rory-29f';
import {instrumentInk as ink} from './hud-instrument-style.js?v=rory-29f';
import {visorDepth} from './visor-space.js?v=selector-3';
import {globePoint,routeSegments,flightSummary} from './flight-routes.js?v=rory-29f';
import {diagnosticDepth} from './hud-reference-model.js?v=selector-3';
import {layout,layoutKey} from './hud-layouts.js?v=rory-29f';
import {eyeOnVisorPlane} from './hud-eye-anchor.js?v=rory-face-20261016';
const vector=(lon,lat,r=1)=>new THREE.Vector3(...globePoint(lon,lat,r));
export function createHUDVolumes({scene,camera,stage,wake,getFrame,getExpandedOffset,getHUDTarget,getPreviewWeights,getActivity}){
  const root=new THREE.Group();scene.add(root);
  const flightInstrument=getActivity?createFlightSummary({scene,stage}):null;let flightData=null;
  const globe=new THREE.Group();globe.position.set(layout.globe[0],layout.globe[1],diagnosticDepth(layout.globe[0],layout.globe[1])+.002);root.add(globe);
  const earth=new THREE.Group();earth.scale.setScalar(layout.globe[2]);globe.add(earth);
  const wireMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{color:{value:new THREE.Color(ink.white)},opacity:{value:.85}},vertexShader:'varying float facing;void main(){facing=normalize(normalMatrix*position).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 color;uniform float opacity;varying float facing;void main(){gl_FragColor=vec4(color,opacity*mix(.10,1.,smoothstep(-.15,.45,facing)));}'});
  function lines(points,material,parent=earth){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const m=new THREE.LineSegments(g,material);m.renderOrder=110;parent.add(m);return m;}
  const grid=[];const push=(a,b)=>grid.push(...a,...b);
  for(let lon=-180;lon<180;lon+=30)for(let lat=-90;lat<90;lat+=3)push(vector(lon,lat),vector(lon,lat+3));
  for(let lat=-60;lat<=60;lat+=30)for(let lon=-180;lon<180;lon+=3)push(vector(lon,lat),vector(lon+3,lat));
  const gridMaterial=wireMaterial.clone();gridMaterial.uniforms.opacity.value=.38;lines(grid,gridMaterial);
  fetch('./assets/globe-land.json').then(r=>r.json()).then(rings=>{const p=[];for(const ring of rings)for(let i=1;i<ring.length;i++)p.push(...vector(...ring[i-1]),...vector(...ring[i]));lines(p,wireMaterial);wake();});
  // Completed routes rise above the sphere; no destination menu or story cards.
  const routeMaterial=wireMaterial.clone();routeMaterial.uniforms.color.value.set(ink.gold);routeMaterial.uniforms.opacity.value=.82;
  const routeLines=lines([],routeMaterial);routeLines.renderOrder=112;
  const endpointMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{opacity:{value:.9},color:{value:new THREE.Color(ink.red)}},vertexShader:'varying float facing;void main(){facing=normalize(normalMatrix*position).z;gl_PointSize=4.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float opacity;uniform vec3 color;varying float facing;void main(){if(length(gl_PointCoord-.5)>.5||facing<0.)discard;gl_FragColor=vec4(color,opacity);}'});
  const endpoints=new THREE.Points(new THREE.BufferGeometry(),endpointMaterial);endpoints.renderOrder=114;earth.add(endpoints);
  fetch('./assets/flight-history.json').then(r=>{if(!r.ok)throw new Error('Flight history unavailable');return r.json();}).then(data=>{
    if(data.version!==1||!Array.isArray(data.routes))throw new Error('Invalid flight history');
    const routes=data.routes.filter(route=>[route.from,route.to].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90));
    routeLines.geometry.setAttribute('position',new THREE.Float32BufferAttribute(routeSegments(routes),3));routeLines.geometry.computeBoundingSphere();
    const airports=[...new Map(routes.flatMap(route=>[route.from,route.to]).map(p=>[p.join(','),p])).values()];
    endpoints.geometry.setAttribute('position',new THREE.Float32BufferAttribute(airports.flatMap(p=>globePoint(...p,1.012)),3));endpoints.geometry.computeBoundingSphere();
    flightData=flightSummary(routes);
    stage.dataset.flightRoutes=String(routes.length);stage.dataset.completedFlights=String(data.flightCount);stage.dataset.flightHistory=routes.length?'loaded':'empty';wake();
  }).catch(()=>{stage.dataset.flightHistory='unavailable';wake();});
  const suit=new THREE.Group();suit.position.set(layout.suit[0],layout.suit[1],diagnosticDepth(layout.suit[0],layout.suit[1])-.006);suit.scale.setScalar(layout.suit[2]);root.add(suit);
  const suitActivity=getActivity?createSuitActivity({scene,stage,getActivity}):null;
  let transfer=null,transferPoses=null,mode='suit',expandedMode=null,expanded=false;
  let opticUntil=performance.now()+1800,opticPhase=0,opticLast=performance.now(),armor=null,yaw=.55,pitch=.30,ty=yaw,tp=pitch,suitYaw=-.55,explode=0,targetExplode=0,down=null,hover=null,visible=true,contentOpen=false,globeVX=0,globeVY=0,suitVelocity=0,coastUntil=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qy=new THREE.Quaternion(),qx=new THREE.Quaternion(),yAxis=new THREE.Vector3(0,1,0),xAxis=new THREE.Vector3(1,0,0);
  // Wearable gear and the optional local study share the same batched renderer.
  fetch(suitModelSource(location)).then(r=>{if(!r.ok)throw new Error('Suit unavailable');return r.json();}).then(data=>{
    const characterStudy=data.publication==='local-study-unlicensed';
    const kitesurf=data.id==='kitesurf-gear';
    const buffers=()=>({position:[],offset:[],color:[],normal:[]}),wire=buffers(),surface=buffers();
    for(const part of data.parts){
      // Authored panel offsets keep seams with their cloth and split the harness front/back.
      const displacement=kitesurf
        ?(part.explodeOffset||[0,0,0])
        :[Math.sign(part.center[0])*.024,part.center[1]*.05,Math.sign(part.center[2]||1)*.11];
      for(const [indices,target] of [[part.edges,wire],[part.triangles||[],surface]])for(const i of indices){
        target.position.push(...part.vertices[i]);target.offset.push(...displacement);target.normal.push(...part.normals[i]);
        target.color.push(...part.color.map((value,channel)=>target===wire?value*(characterStudy?.45:.32)+(characterStudy?[.85,.80,.74]:[.62,.76,.79])[channel]*(characterStudy?.55:.68):value));
      }
    }
    const geometry=attributes=>{const g=new THREE.BufferGeometry();for(const [name,values] of Object.entries(attributes))g.setAttribute(name,new THREE.Float32BufferAttribute(values,3));g.computeBoundingSphere();return g;};
    const g=geometry(wire);
    const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,vertexColors:true,
      uniforms:{explode:{value:0},torsoOnly:{value:1},opacity:{value:characterStudy?1.15:1}},
      vertexShader:'attribute vec3 offset;varying vec3 tint;varying float facing;varying float bodyY;uniform float explode;void main(){tint=color;facing=(normalMatrix*normal).z;bodyY=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position+offset*explode,1.);}',
      fragmentShader:'varying vec3 tint;varying float facing;varying float bodyY;uniform float torsoOnly;uniform float opacity;void main(){float crop=smoothstep(mix(-.65,-.10,torsoOnly),mix(-.62,-.06,torsoOnly),bodyY);gl_FragColor=vec4(tint,mix(.13,.78,smoothstep(-.1,.5,facing))*crop*opacity);}'
    });
    if(surface.position.length){
      const skin=material.clone();skin.uniforms={...material.uniforms,opacity:{value:kitesurf?.55:characterStudy?.22:.11}};skin.side=kitesurf?THREE.DoubleSide:THREE.FrontSide;
      if(kitesurf)skin.fragmentShader='varying vec3 tint;varying float facing;varying float bodyY;uniform float torsoOnly;uniform float opacity;void main(){float crop=smoothstep(mix(-.65,-.10,torsoOnly),mix(-.62,-.06,torsoOnly),bodyY);float face=clamp(abs(facing),0.,1.);float rim=pow(1.-face,3.);vec3 shade=tint*(.6+.6*face)+vec3(.20,.28,.31)*rim;gl_FragColor=vec4(shade,crop*opacity);}';
      const volume=new THREE.Mesh(geometry(surface),skin);volume.renderOrder=109;suit.add(volume);
    }
    armor=lines([],material,suit);armor.geometry.dispose();armor.geometry=g;stage.dataset.suitModel=kitesurf?'kitesurf-gear':characterStudy?'iron-man-study':'aster-original';stage.dataset.suitSegments=String(wire.position.length/6);wake();
  }).catch(error=>{stage.dataset.suitModel='unavailable';console.error(error);});
  // The optic occupies the same forward visor shell and inherits the same transform.
  const optic=new THREE.Group();optic.position.set(...layout.optic);optic.scale.setScalar(.70);root.add(optic);
  const barrel=new THREE.Group();optic.add(barrel);
  const axis=new THREE.Vector3(0,0,1);
  barrel.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axis);
  const rotor=new THREE.Group();barrel.add(rotor);
  const blue=[],gold=[];
  const arc=(out,r,z,start,end,count=40)=>{for(let i=0;i<count;i++)for(const a of [start+(end-start)*i/count,start+(end-start)*(i+1)/count])out.push(Math.cos(a)*r,Math.sin(a)*r,z);};
  for(let i=0;i<8;i++)arc(blue,.013,0,i*Math.PI/4+.055,(i+1)*Math.PI/4-.055,6);
  arc(blue,.0105,.005,0,Math.PI*2);arc(blue,.0088,.010,.28,5.65);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;blue.push(Math.cos(a)*.0091,Math.sin(a)*.0091,.01,Math.cos(a)*.0096,Math.sin(a)*.0096,.01);}
  arc(blue,.0145,.014,-.8,1.2,22);arc(blue,.0145,.014,2.25,4.3,22);
  arc(gold,.0114,.007,-1.05,.5,20);arc(gold,.0134,0,2.2,2.8,8);
  for(let i=0;i<40;i++){const a=i*Math.PI/20,r=i%5===0?.0145:.0137;blue.push(Math.cos(a)*.0131,Math.sin(a)*.0131,0,Math.cos(a)*r,Math.sin(a)*r,0);}
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;blue.push(Math.cos(a)*.013,Math.sin(a)*.013,0,Math.cos(a)*.0145,Math.sin(a)*.0145,.014);}
  // Four chamfered brackets carry the focus affordance instead of a wire cylinder.
  for(let i=0;i<4;i++){const a=i*Math.PI/2;const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),a);const pts=[[.011,.009,.002],[.014,.009,.002],[.016,.007,.002],[.016,.004,.002]].map(v=>new THREE.Vector3(...v).applyQuaternion(q));for(let n=1;n<pts.length;n++)blue.push(...pts[n-1],...pts[n]);}
  const plates=[];
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4+.10,b=a+.38,z=i%2?.002:-.001;
    const p=(r,t)=>[Math.cos(t)*r,Math.sin(t)*r,z];
    plates.push(...p(.012,a),...p(.015,a),...p(.015,b),...p(.012,a),...p(.015,b),...p(.012,b));
  }
  const plateGeometry=new THREE.BufferGeometry();plateGeometry.setAttribute('position',new THREE.Float32BufferAttribute(plates,3));
  const plateMesh=new THREE.Mesh(plateGeometry,new THREE.MeshBasicMaterial({color:ink.dim,opacity:.18,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthWrite:false,depthTest:false,toneMapped:false}));plateMesh.renderOrder=102;barrel.add(plateMesh);
  const opticBlue=new THREE.LineBasicMaterial({color:ink.white,transparent:true,opacity:.74,depthTest:false,depthWrite:false,toneMapped:false});
  lines(blue,opticBlue,barrel).renderOrder=103;
  lines(gold,new THREE.LineBasicMaterial({color:ink.red,transparent:true,opacity:.95,depthTest:false,depthWrite:false}),rotor).renderOrder=104;
  const eyeWorld=new THREE.Vector3(),opticMeasured=new THREE.Vector3(),cameraLocal=new THREE.Vector3(),eyeLocal=new THREE.Vector3();
  let eyeAnchor=null;
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),inverse=new THREE.Matrix4(),localRay=new THREE.Ray(),hitPoint=new THREE.Vector3();
  function hit(x,y){
    if(!visible||(transfer&&!transferPhase(performance.now(),transfer).done))return null;
    const r=stage.getBoundingClientRect();mouse.set((x-r.x)/r.width*2-1,1-(y-r.y)/r.height*2);ray.setFromCamera(mouse,camera);
    inverse.copy(root.matrixWorld).invert();localRay.copy(ray.ray).applyMatrix4(inverse);
    const hud=getHUDTarget?.(x,y);if(hud&&!['preview','globe','selector'].includes(hud))return null;
    if(mode==='globe'||expandedMode==='globe'){
      if(globe.visible&&localRay.intersectSphere(new THREE.Sphere(globe.position,layout.globe[2]*globe.scale.x*1.3),hitPoint))return 'globe';
    }
    if(armor&&(mode==='suit'||expandedMode==='suit'))for(const g of [suit])if(g?.visible){const size=suit.scale.x*.70,width=size*(.43+explode*.16);if(localRay.intersectBox(new THREE.Box3(new THREE.Vector3(g.position.x-width,g.position.y-size,g.position.z-.055),new THREE.Vector3(g.position.x+width,g.position.y+size,g.position.z+.055)),hitPoint))return 'suit';}
    return null;
  }
  stage.addEventListener('pointermove',e=>{const target=hit(e.clientX,e.clientY);if(target!==hover){hover=target;opticBlue.opacity=target==='optic'?.95:.64;wake();}if(target)e.hudContentCursor=target==='globe'||target==='suit'?'grab':'pointer';
    if(down&&e.buttons){
      const now=performance.now(),dx=e.clientX-down.x,dy=e.clientY-down.y,dt=Math.max(.008,(now-down.at)/1000);
      down.moved=down.moved||Math.hypot(e.clientX-down.startX,e.clientY-down.startY)>3;
      const vx=THREE.MathUtils.clamp(dx*.012/dt,-3,3),vy=THREE.MathUtils.clamp(dy*.009/dt,-2,2);
      if(down.target==='globe'){ty=yaw+=dx*.012;tp=pitch=Math.max(-1.4,Math.min(1.4,pitch+dy*.009));globeVX=vx;globeVY=vy;}
      else if(down.target==='suit'){suitYaw+=dx*.012;suitVelocity=vx;}
      down.x=e.clientX;down.y=e.clientY;down.at=now;wake();
    }
  },{capture:true});
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('[data-ui]'))return;const target=hit(e.clientX,e.clientY);if(target&&e.button===0){
    globeVX=globeVY=suitVelocity=0;coastUntil=0;
    down={target,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,at:performance.now()};
    stage.setPointerCapture(e.pointerId);e.stopImmediatePropagation();
  }},{capture:true});
  stage.addEventListener('pointerup',e=>{if(!down)return;
    if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
    if(down.moved){const recent=performance.now()-down.at<150;if(reduced||!recent)globeVX=globeVY=suitVelocity=0;coastUntil=!reduced&&recent?performance.now()+30000:0;down=null;wake();}
  },{capture:true});
  stage.addEventListener('pointercancel',()=>{down=null;globeVX=globeVY=suitVelocity=0;coastUntil=0;});
  stage.addEventListener('click',e=>{if(!down)return;const d=down;down=null;e.stopImmediatePropagation();},{capture:true});
  stage.addEventListener('wheel',e=>{const target=hit(e.clientX,e.clientY);if(target==='globe'||target==='suit'){
    e.preventDefault();e.stopImmediatePropagation();
    if(target==='suit')adjustExplosion(e.deltaY);else{ty=yaw+=e.deltaY*.002;wake();}
  }},{capture:true,passive:false});
  function adjustExplosion(delta){targetExplode=THREE.MathUtils.clamp(targetExplode+delta*.0025,0,1);if(reduced)explode=targetExplode;wake();}
  function tick(x=0,y=0){root.updateWorldMatrix(true,true);root.visible=visible;
    const phase=transferPhase(reduced?Infinity:performance.now(),transfer);
    const amount=id=>expandedMode===id?(transfer?.moved===id?phase.travel:1):(transfer?.returned===id?1-phase.travel:0);
    const suitBlend=amount('suit');
    const suitTarget=[layout.expandedSuit[0],layout.expandedSuit[1],visorDepth(layout.expandedSuit[0],layout.expandedSuit[1])-.012];
    const suitStart=[layout.suit[0],layout.suit[1],diagnosticDepth(layout.suit[0],layout.suit[1])-.006];
    if(armor)armor.material.uniforms.torsoOnly.value=1-suitBlend;
    const globeStart=[layout.globe[0],layout.globe[1],diagnosticDepth(layout.globe[0],layout.globe[1])+.002];
    const globeTarget=[layout.expandedGlobe[0],layout.expandedGlobe[1],visorDepth(layout.expandedGlobe[0],layout.expandedGlobe[1])-.022];
    const contentOffset=getExpandedOffset(),weights=getPreviewWeights?.()||{[mode]:1};
    for(const [id,object,preview,target,previewScale,expandedScale] of [
      ['suit',suit,suitStart,suitTarget,layout.suit[2],layout.expandedSuit[2]],
      ['globe',globe,globeStart,globeTarget,1,layout.expandedGlobe[2]/layout.globe[2]],
    ]){
      const destination=new THREE.Vector3().fromArray(expandedMode===id?target:preview);
      if(expandedMode===id)destination.add(contentOffset);
      const targetScale=expandedMode===id?expandedScale:previewScale;
      const source=transferPoses?.[id];
      if(transfer&&(transfer.moved===id||transfer.returned===id)&&source){
        // Capture the displayed pose, including viewport fitting, before the
        // surfaces change owners. Neither endpoint may borrow the other panel's offset.
        object.position.lerpVectors(source.position,destination,phase.travel);
        object.scale.setScalar(THREE.MathUtils.lerp(source.scale,targetScale,phase.travel)*(1-.12*Math.sin(Math.PI*phase.travel)));
      }else{object.position.copy(destination);object.scale.setScalar(targetScale);}
      let alpha=expandedMode===id?1:(weights[id]||0);
      const travelling=transfer&&(transfer.moved===id||transfer.returned===id);
      if(travelling)alpha=THREE.MathUtils.lerp(source?.alpha??1,1,phase.travel);
      else if(expandedMode!==id){object.scale.multiplyScalar(.94+.06*alpha);object.position.y-=.003*(1-alpha);object.position.z-=.006*(1-alpha);}
      object.userData.alpha=alpha;object.visible=alpha>.001;
      object.traverse(child=>{const uniform=child.material?.uniforms?.opacity;if(uniform){child.userData.baseOpacity??=uniform.value;uniform.value=child.userData.baseOpacity*alpha;}});
    }
    flightInstrument?.update(globe,layout.globe[2]*globe.scale.x,flightData,visible,amount('globe'));
    optic.visible=visible;suitActivity?.update(suit,suitBlend,visible?(suit.userData.alpha??1):0);
    if(phase.done){transfer=null;transferPoses=null;}
    if(eyeAnchor){
      root.updateWorldMatrix(true,false);
      eyeWorld.copy(eyeAnchor);
      camera.getWorldPosition(cameraLocal);root.worldToLocal(cameraLocal);
      eyeLocal.copy(eyeWorld);root.worldToLocal(eyeLocal);
      optic.position.set(...eyeOnVisorPlane(cameraLocal,eyeLocal,layout.optic[2]));
    }else eyeWorld.set(.0303,.0062,.048).applyMatrix4(root.matrixWorld);
    barrel.rotation.set(.03,-.08,0);
    const now=performance.now(),dt=Math.min(.05,(now-opticLast)/1000);opticLast=now;
    if(!reduced){opticPhase+=dt*(now<opticUntil?1.4:0);rotor.rotation.z=opticPhase;rotor.position.z=now<opticUntil?Math.sin((opticUntil-now)/1000*Math.PI)*.0015:0;}
    if(!down&&now<coastUntil){
      // Long, frame-rate-independent coast; a new grab still cancels it immediately.
      const drag=.22,decay=Math.exp(-drag*dt),travel=(1-decay)/drag;
      yaw+=globeVX*travel;pitch=THREE.MathUtils.clamp(pitch+globeVY*travel,-1.4,1.4);
      if(Math.abs(globeVX)+Math.abs(globeVY)>.001){ty=yaw;tp=pitch;}
      suitYaw+=suitVelocity*travel;globeVX*=decay;globeVY*=decay;suitVelocity*=decay;
      if(Math.abs(globeVX)+Math.abs(globeVY)+Math.abs(suitVelocity)<.003)coastUntil=0;
    }else if(!down){globeVX=globeVY=suitVelocity=0;}
    const moving=Math.abs(yaw-ty)+Math.abs(pitch-tp)>.0005||Math.abs(explode-targetExplode)>.001;
    yaw+=(ty-yaw)*.15;pitch+=(tp-pitch)*.15;explode+=(targetExplode-explode)*.13;
    qy.setFromAxisAngle(yAxis,yaw);qx.setFromAxisAngle(xAxis,pitch);earth.quaternion.multiplyQuaternions(qx,qy);suit.rotation.y=suitYaw;

    if(armor)armor.material.uniforms.explode.value=explode;
    opticMeasured.copy(optic.position).applyMatrix4(root.matrixWorld);
    stage.dataset.volumeMoving=String(moving);stage.dataset.suitExploded=String(targetExplode>.5);stage.dataset.globeRotation=JSON.stringify({yaw,pitch});stage.dataset.suitYaw=String(suitYaw);stage.dataset.coasting=String(!down&&now<coastUntil);stage.dataset.visorDepth=String(optic.position.z);stage.dataset.opticEyeClearance=opticMeasured.distanceTo(eyeWorld).toFixed(6);stage.dataset.opticDepthAhead=(opticMeasured.z-eyeWorld.z).toFixed(6);stage.dataset.globeVisible=String(globe.visible);stage.dataset.previewKind=mode;stage.dataset.expanded=String(expanded);stage.dataset.explosion=explode.toFixed(3);
    const r=stage.getBoundingClientRect(),project=v=>{v.applyMatrix4(root.matrixWorld).project(camera);return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};};stage.dataset.volumeTargets=JSON.stringify({globe:project(globe.position.clone()),suit:project(suit.position.clone()),expandedSuit:project(suit.position.clone()),expandedGlobe:project(globe.position.clone()),optic:(()=>{const v=optic.position.clone().applyMatrix4(root.matrixWorld).project(camera);return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};})()});
  }
  return {get glowSources(){root.updateWorldMatrix(true,true);return [{id:'optic',position:optic.getWorldPosition(new THREE.Vector3()),color:0xffb58c,power:.0009,strength:optic.visible?1:0},...[['globe',globe],['suit',suit]].map(([id,object])=>({id,position:object.getWorldPosition(new THREE.Vector3()),color:id==='globe'?0x89d6f4:0x9acfea,power:.025,strength:visible&&object.visible?(object.userData.alpha??1):0}))];},setEyeAnchor(value){eyeAnchor=value;},get motionSamples(){return [suit,globe].map((object,i)=>({id:'model:'+['suit','globe'][i],visible:object.visible,opacity:object.userData.alpha??1,points:[...object.position.toArray(),object.scale.x]}));},beginTransfer(value){transferPoses={suit:{position:suit.position.clone(),scale:suit.scale.x,alpha:suit.userData.alpha??1},globe:{position:globe.position.clone(),scale:globe.scale.x,alpha:globe.userData.alpha??1}};transfer=value;wake();},get buttonAnchor(){if(!expanded)return null;return new THREE.Vector3(.095,-.085,.15);},tick,adjustExplosion,setMode(value){mode=value;wake();},setExpanded(value,kind=mode){expanded=value;expandedMode=value?kind:null;wake();},turnSuit:delta=>{suitYaw+=delta;wake();},step:delta=>{ty=yaw+=delta*.16;wake();},explode:()=>{targetExplode=targetExplode?0:1;wake();},setContentOpen:value=>{contentOpen=value;},setVisible:value=>{visible=value;wake();},get needsFrame(){return !!transfer||(!reduced&&performance.now()<opticUntil)||(!down&&performance.now()<coastUntil)||Math.abs(yaw-ty)+Math.abs(pitch-tp)>.0005||Math.abs(explode-targetExplode)>.001;}};
}
