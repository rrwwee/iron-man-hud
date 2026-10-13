// Genuine scene geometry for the location globe, armor and offset instrument rims.
import * as THREE from 'three';
import {visorDepth} from './visor-space.js?v=icons-3';
import {places} from './places.js?v=icons-3';
const rad=Math.PI/180;
const vector=(lon,lat,r=1)=>new THREE.Vector3(Math.cos(lat*rad)*Math.sin(lon*rad)*r,Math.sin(lat*rad)*r,Math.cos(lat*rad)*Math.cos(lon*rad)*r);
export function createHUDVolumes({scene,camera,stage,wake,getFrame,getHUDTarget,onPlace,onSelection}){
  const root=new THREE.Group();root.matrixAutoUpdate=false;scene.add(root);
  const globe=new THREE.Group();globe.position.set(.076,.032,visorDepth(.076,.032)-.012);root.add(globe);
  const earth=new THREE.Group();earth.scale.setScalar(.0185);globe.add(earth);
  const wireMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{color:{value:new THREE.Color('#8bdde8')},opacity:{value:.85}},vertexShader:'varying float facing;void main(){facing=normalize(normalMatrix*position).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 color;uniform float opacity;varying float facing;void main(){gl_FragColor=vec4(color,opacity*mix(.10,1.,smoothstep(-.15,.45,facing)));}'});
  function lines(points,material,parent=earth){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const m=new THREE.LineSegments(g,material);m.renderOrder=110;parent.add(m);return m;}
  const grid=[];const push=(a,b)=>grid.push(...a,...b);
  for(let lon=-180;lon<180;lon+=30)for(let lat=-90;lat<90;lat+=3)push(vector(lon,lat),vector(lon,lat+3));
  for(let lat=-60;lat<=60;lat+=30)for(let lon=-180;lon<180;lon+=3)push(vector(lon,lat),vector(lon+3,lat));
  const gridMaterial=wireMaterial.clone();gridMaterial.uniforms.opacity.value=.38;lines(grid,gridMaterial);
  fetch('./assets/globe-land.json').then(r=>r.json()).then(rings=>{const p=[];for(const ring of rings)for(let i=1;i<ring.length;i++)p.push(...vector(...ring[i-1]),...vector(...ring[i]));lines(p,wireMaterial);wake();});
  // A shallow, tilted annulus: each wedge is a place, and the center opens its story.
  const selector=new THREE.Group();selector.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(globe.position.x,globe.position.y,globe.position.z-.048).normalize());globe.add(selector);
  const menuCanvas=document.createElement('canvas');menuCanvas.width=menuCanvas.height=768;
  const menuTexture=new THREE.CanvasTexture(menuCanvas);menuTexture.colorSpace=THREE.SRGBColorSpace;menuTexture.generateMipmaps=false;menuTexture.minFilter=THREE.LinearFilter;
  const annulus=new THREE.Mesh(new THREE.RingGeometry(.0225,.032,112,3),new THREE.MeshBasicMaterial({map:menuTexture,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false}));
  annulus.renderOrder=111;selector.add(annulus);
  const shortNames=places.map(place=>place.label);
  function paintPlaces(){
    const c=menuCanvas.getContext('2d'),n=places.length;c.clearRect(0,0,768,768);c.save();c.translate(384,384);
    for(let i=0;i<n;i++){
      const a=-Math.PI/2+i*Math.PI*2/n,b=a+Math.PI*2/n,chosen=i===selected,hot=hover==='place:'+i;
      c.beginPath();c.arc(0,0,381,a+.018,b-.018);c.arc(0,0,270,b-.018,a+.018,true);c.closePath();c.fillStyle=hot?'#548ca16a':chosen?'#c08a4240':'#15364248';c.fill();c.strokeStyle=chosen?'#f4cb90':'#6998a9';c.lineWidth=chosen?3:1;c.stroke();
      c.save();c.rotate((a+b)/2);c.translate(329,0);c.rotate(Math.PI/2+(((a+b)/2+Math.PI/2)%(Math.PI*2)>Math.PI/2&&((a+b)/2+Math.PI/2)%(Math.PI*2)<Math.PI*1.5?Math.PI:0));c.fillStyle=chosen?'#ffdda5':'#add9e4';c.textAlign='center';c.textBaseline='middle';c.font=(chosen?'bold ':'')+'23px Arial';c.fillText(shortNames[i],0,0);c.restore();
    }
    c.restore();menuTexture.needsUpdate=true;
  }
  const markerGeo=new THREE.BufferGeometry();markerGeo.setAttribute('position',new THREE.Float32BufferAttribute(places.flatMap(p=>vector(p.lon,p.lat,1.018).toArray()),3));
  const markerMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{selected:{value:places.length-1}},vertexShader:'attribute float index;uniform float selected;varying float chosen;varying float facing;void main(){chosen=1.-step(.1,abs(index-selected));facing=normalize(normalMatrix*position).z;gl_PointSize=mix(4.,8.,chosen);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying float chosen;varying float facing;void main(){if(length(gl_PointCoord-.5)>.5||facing<0.)discard;gl_FragColor=vec4(mix(vec3(.45,.8,.9),vec3(1.,.72,.38),chosen),.9);}'});
  markerGeo.setAttribute('index',new THREE.Float32BufferAttribute(places.map((_,i)=>i),1));const markers=new THREE.Points(markerGeo,markerMaterial);markers.renderOrder=114;earth.add(markers);
  const markerRingPoints=[];for(let i=0;i<40;i++){for(const a of [i/40*Math.PI*2,(i+1)/40*Math.PI*2])markerRingPoints.push(Math.cos(a)*.07,Math.sin(a)*.07,0);}
  const ring=lines(markerRingPoints,new THREE.LineBasicMaterial({color:'#ffd399',transparent:true,opacity:.9,depthTest:false}),earth);
  const suit=new THREE.Group();suit.position.set(.076,-.041,visorDepth(.076,-.041)-.01);suit.scale.setScalar(.048);root.add(suit);
  let opticUntil=performance.now()+1800,opticPhase=0,opticLast=performance.now(),armor=null,selected=places.length-1,yaw=-places[selected].lon*rad,pitch=places[selected].lat*rad,ty=yaw,tp=pitch,suitYaw=-.55,explode=0,targetExplode=0,down=null,hover=null,visible=true,contentOpen=false,lastWheel=0,globeVX=0,globeVY=0,suitVelocity=0,coastUntil=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qy=new THREE.Quaternion(),qx=new THREE.Quaternion(),yAxis=new THREE.Vector3(0,1,0),xAxis=new THREE.Vector3(1,0,0),zAxis=new THREE.Vector3(0,0,1);
  function select(index){globeVX=globeVY=0;selected=(index+places.length)%places.length;const p=places[selected];ty=yaw+Math.atan2(Math.sin(-p.lon*rad-yaw),Math.cos(-p.lon*rad-yaw));tp=p.lat*rad;if(reduced){yaw=ty;pitch=tp;}markerMaterial.uniforms.selected.value=selected;ring.position.copy(vector(p.lon,p.lat,1.019));ring.quaternion.setFromUnitVectors(zAxis,ring.position.clone().normalize());paintPlaces();onSelection?.(selected,places);stage.dataset.place=p.id;wake();}
  fetch('./assets/mark7-wireframe.json').then(r=>r.json()).then(data=>{
    const pos=[],off=[],colors=[],normals=[];
    for(const part of data.parts){
      // Split mirrored islands only for the displacement vector; geometry stays one batched draw.
      const neighbors=part.vertices.map(()=>[]);for(let e=0;e<part.edges.length;e+=2){const a=part.edges[e],b=part.edges[e+1];neighbors[a].push(b);neighbors[b].push(a);}
      const offsets=new Array(part.vertices.length);
      for(let start=0;start<offsets.length;start++)if(!offsets[start]){
        const ids=[start],center=new THREE.Vector3();offsets[start]=true;
        for(let n=0;n<ids.length;n++){const i=ids[n];center.add(new THREE.Vector3(...part.vertices[i]));for(const j of neighbors[i])if(!offsets[j]){offsets[j]=true;ids.push(j);}}
        center.divideScalar(ids.length);
        // Armor plates peel away along the viewing-depth axis, not out to the sides.
        const depth=THREE.MathUtils.clamp(center.z*3,-.26,.26);
        const direction=new THREE.Vector3(Math.sign(center.x)*.012,center.y*.025,depth);
        for(const i of ids)offsets[i]=direction;
      }
      for(const i of part.edges){pos.push(...part.vertices[i]);off.push(...offsets[i]);normals.push(...part.normals[i]);colors.push(.47,.74,.81);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('offset',new THREE.Float32BufferAttribute(off,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,vertexColors:true,uniforms:{explode:{value:0}},vertexShader:'attribute vec3 offset;varying vec3 tint;varying float facing;uniform float explode;void main(){tint=color;facing=(normalMatrix*normal).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position+offset*explode,1.);}',fragmentShader:'varying vec3 tint;varying float facing;void main(){gl_FragColor=vec4(tint,mix(.08,.65,smoothstep(-.1,.5,facing)));}'});
    armor=lines([],material,suit);armor.geometry.dispose();armor.geometry=g;stage.dataset.suitSegments=String(pos.length/6);wake();
  });
  // The optic occupies the same forward visor shell and inherits the same transform.
  const optic=new THREE.Group();optic.position.set(.030,.008,.075);optic.scale.setScalar(.82);root.add(optic);
  const barrel=new THREE.Group();optic.add(barrel);
  const axis=new THREE.Vector3(optic.position.x-.0303,optic.position.y-.0062,optic.position.z-.048).normalize();
  barrel.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axis);
  const rotor=new THREE.Group();barrel.add(rotor);
  const blue=[],gold=[];
  const arc=(out,r,z,start,end,count=40)=>{for(let i=0;i<count;i++)for(const a of [start+(end-start)*i/count,start+(end-start)*(i+1)/count])out.push(Math.cos(a)*r,Math.sin(a)*r,z);};
  for(let i=0;i<8;i++)arc(blue,.013,0,i*Math.PI/4+.055,(i+1)*Math.PI/4-.055,6);
  arc(blue,.0105,.005,0,Math.PI*2);arc(blue,.0088,.010,.28,5.65);
  arc(gold,.0114,.007,-1.05,.5,20);arc(gold,.0134,0,2.2,2.8,8);
  for(let i=0;i<40;i++){const a=i*Math.PI/20,r=i%5===0?.0145:.0137;blue.push(Math.cos(a)*.0131,Math.sin(a)*.0131,0,Math.cos(a)*r,Math.sin(a)*r,0);}
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;blue.push(Math.cos(a)*.013,Math.sin(a)*.013,0,Math.cos(a)*.0105,Math.sin(a)*.0105,.005);}
  // Four chamfered brackets carry the focus affordance instead of a wire cylinder.
  for(let i=0;i<4;i++){const a=i*Math.PI/2;const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),a);const pts=[[.011,.009,.002],[.014,.009,.002],[.016,.007,.002],[.016,.004,.002]].map(v=>new THREE.Vector3(...v).applyQuaternion(q));for(let n=1;n<pts.length;n++)blue.push(...pts[n-1],...pts[n]);}
  const plates=[];
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4+.10,b=a+.38,z=i%2?.002:-.001;
    const p=(r,t)=>[Math.cos(t)*r,Math.sin(t)*r,z];
    plates.push(...p(.012,a),...p(.015,a),...p(.015,b),...p(.012,a),...p(.015,b),...p(.012,b));
  }
  const plateGeometry=new THREE.BufferGeometry();plateGeometry.setAttribute('position',new THREE.Float32BufferAttribute(plates,3));
  const plateMesh=new THREE.Mesh(plateGeometry,new THREE.MeshBasicMaterial({color:'#4cc6e8',opacity:.18,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthWrite:false,depthTest:false,toneMapped:false}));plateMesh.renderOrder=102;barrel.add(plateMesh);
  const opticBlue=new THREE.LineBasicMaterial({color:'#79d5ef',transparent:true,opacity:.74,depthTest:false,depthWrite:false,toneMapped:false});
  lines(blue,opticBlue,barrel).renderOrder=103;
  lines(gold,new THREE.LineBasicMaterial({color:'#ffd29a',transparent:true,opacity:.95,depthTest:false,depthWrite:false}),rotor).renderOrder=104;
  function focusOptic(){opticUntil=performance.now()+1000;document.dispatchEvent(new CustomEvent('hud-center'));wake();}
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),inverse=new THREE.Matrix4(),localRay=new THREE.Ray(),hitPoint=new THREE.Vector3();
  function hit(x,y){if(!visible)return null;if(['suit','suit-left','suit-right'].includes(getHUDTarget?.(x,y)))return null;const r=stage.getBoundingClientRect();mouse.set((x-r.x)/r.width*2-1,1-(y-r.y)/r.height*2);ray.setFromCamera(mouse,camera);inverse.copy(root.matrixWorld).invert();localRay.copy(ray.ray).applyMatrix4(inverse);
    if(localRay.intersectSphere(new THREE.Sphere(optic.position,.017),hitPoint))return 'optic';
    {const found=ray.intersectObject(annulus)[0];if(found){const p=selector.worldToLocal(found.point.clone()),angle=(-Math.atan2(p.y,p.x)+Math.PI/2+Math.PI*2)%(Math.PI*2);return 'place:'+Math.floor(angle/(Math.PI*2)*places.length);}
    if(localRay.intersectSphere(new THREE.Sphere(globe.position,.021),hitPoint))return 'globe';}
    if(localRay.intersectBox(new THREE.Box3(new THREE.Vector3(.057,-.077,.11),new THREE.Vector3(.101,-.011,.19)),hitPoint))return 'suit';return null;}
  stage.addEventListener('pointermove',e=>{const target=hit(e.clientX,e.clientY);if(target!==hover){const old=hover;hover=target;if(old?.startsWith('place:')||target?.startsWith('place:'))paintPlaces();opticBlue.opacity=target==='optic'?.95:.64;wake();}if(target)e.hudContentCursor=target==='globe'||target==='suit'?'grab':'pointer';
    if(down&&e.buttons){
      const now=performance.now(),dx=e.clientX-down.x,dy=e.clientY-down.y,dt=Math.max(.008,(now-down.at)/1000);
      down.moved=down.moved||Math.hypot(e.clientX-down.startX,e.clientY-down.startY)>3;
      const vx=THREE.MathUtils.clamp(dx*.012/dt,-3,3),vy=THREE.MathUtils.clamp(dy*.009/dt,-2,2);
      if(down.target==='globe'){ty=yaw+=dx*.012;tp=pitch=Math.max(-1.4,Math.min(1.4,pitch+dy*.009));globeVX=vx;globeVY=vy;}
      else if(down.target==='suit'){suitYaw+=dx*.012;suitVelocity=vx;}
      down.x=e.clientX;down.y=e.clientY;down.at=now;wake();
    }
  },{capture:true});
  stage.addEventListener('pointerdown',e=>{const target=hit(e.clientX,e.clientY);if(target&&e.button===0){
    globeVX=globeVY=suitVelocity=0;coastUntil=0;
    down={target,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,at:performance.now()};
    stage.setPointerCapture(e.pointerId);e.stopImmediatePropagation();
  }},{capture:true});
  stage.addEventListener('pointerup',e=>{if(!down)return;
    if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
    if(down.moved){const recent=performance.now()-down.at<150;if(reduced||!recent)globeVX=globeVY=suitVelocity=0;coastUntil=!reduced&&recent?performance.now()+1100:0;down=null;wake();}
  },{capture:true});
  stage.addEventListener('pointercancel',()=>{down=null;globeVX=globeVY=suitVelocity=0;coastUntil=0;});
  stage.addEventListener('click',e=>{if(!down)return;const d=down;down=null;e.stopImmediatePropagation();if(!d.moved){if(d.target==='globe')onPlace(places[selected]);else if(d.target==='optic')focusOptic();else if(d.target.startsWith('place:')){const index=Number(d.target.slice(6));if(index===selected)onPlace(places[index]);else select(index);}else{targetExplode=targetExplode?0:1;if(reduced)explode=targetExplode;wake();}}},{capture:true});
  stage.addEventListener('wheel',e=>{const target=hit(e.clientX,e.clientY);if(target==='globe'||target?.startsWith('place:')){e.preventDefault();e.stopImmediatePropagation();const now=performance.now();if(now-lastWheel>170){lastWheel=now;select(selected+Math.sign(e.deltaY));}}},{capture:true,passive:false});
  function tick(x=0,y=0){root.matrix.copy(getFrame());root.updateMatrixWorld(true);root.visible=visible;globe.visible=true;optic.visible=visible;
    const now=performance.now(),dt=Math.min(.05,(now-opticLast)/1000);opticLast=now;
    if(!reduced){opticPhase+=dt*(now<opticUntil?1.4:.12);rotor.rotation.z=opticPhase;rotor.position.z=now<opticUntil?Math.sin((opticUntil-now)/1000*Math.PI)*.0015:0;}
    if(!down&&now<coastUntil){
      const decay=Math.exp(-4.5*dt);yaw+=globeVX*dt;pitch=THREE.MathUtils.clamp(pitch+globeVY*dt,-1.4,1.4);
      if(Math.abs(globeVX)+Math.abs(globeVY)>.001){ty=yaw;tp=pitch;}
      suitYaw+=suitVelocity*dt;globeVX*=decay;globeVY*=decay;suitVelocity*=decay;
    }else if(!down){globeVX=globeVY=suitVelocity=0;}
    const moving=Math.abs(yaw-ty)+Math.abs(pitch-tp)>.0005||Math.abs(explode-targetExplode)>.001;
    yaw+=(ty-yaw)*.15;pitch+=(tp-pitch)*.15;explode+=(targetExplode-explode)*.13;
    qy.setFromAxisAngle(yAxis,yaw);qx.setFromAxisAngle(xAxis,pitch);earth.quaternion.multiplyQuaternions(qx,qy);suit.rotation.y=suitYaw;
    if(armor)armor.material.uniforms.explode.value=explode;
    stage.dataset.volumeMoving=String(moving);stage.dataset.suitExploded=String(targetExplode===1);stage.dataset.globeRotation=JSON.stringify({yaw,pitch});stage.dataset.suitYaw=String(suitYaw);stage.dataset.coasting=String(!down&&now<coastUntil);stage.dataset.visorDepth=String(optic.position.z);stage.dataset.globeVisible=String(globe.visible);stage.dataset.annulusFacing=JSON.stringify(selector.quaternion.toArray());
    const r=stage.getBoundingClientRect(),project=v=>{v.applyMatrix4(root.matrixWorld).project(camera);return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};};stage.dataset.volumeTargets=JSON.stringify({globe:project(globe.position.clone()),suit:project(suit.position.clone()),places:places.map((p,i)=>{const a=Math.PI/2-(i+.5)*Math.PI*2/places.length;const v=new THREE.Vector3(Math.cos(a)*.0275,Math.sin(a)*.0275,0).applyMatrix4(selector.matrixWorld).project(camera);return {label:p.label,x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};}),optic:(()=>{const v=optic.position.clone().applyMatrix4(root.matrixWorld).project(camera);return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};})()});
  }
  select(selected);
  return {tick,select,focusOptic,turnSuit:delta=>{suitYaw+=delta;wake();},step:delta=>select(selected+delta),open:()=>onPlace(places[selected]),explode:()=>{targetExplode=targetExplode?0:1;wake();},setContentOpen:value=>{contentOpen=value;},setVisible:value=>{visible=value;wake();},get needsFrame(){return (!reduced&&performance.now()<opticUntil)||(!down&&performance.now()<coastUntil)||Math.abs(yaw-ty)+Math.abs(pitch-tp)>.0005||Math.abs(explode-targetExplode)>.001;}};
}
