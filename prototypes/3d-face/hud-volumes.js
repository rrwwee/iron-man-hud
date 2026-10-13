// Genuine scene geometry for the location globe, armor and offset instrument rims.
import * as THREE from 'three';
import {places} from './places.js?v=optics-2';
const rad=Math.PI/180;
const vector=(lon,lat,r=1)=>new THREE.Vector3(Math.cos(lat*rad)*Math.sin(lon*rad)*r,Math.sin(lat*rad)*r,Math.cos(lat*rad)*Math.cos(lon*rad)*r);
export function createHUDVolumes({scene,camera,stage,wake,getFrame,onPlace,onSelection}){
  const root=new THREE.Group();root.matrixAutoUpdate=false;scene.add(root);
  const globe=new THREE.Group();globe.position.set(.090,.027,.085);root.add(globe);
  const earth=new THREE.Group();earth.scale.setScalar(.0185);globe.add(earth);
  const wireMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{color:{value:new THREE.Color('#8bdde8')},opacity:{value:.85}},vertexShader:'varying float facing;void main(){facing=normalize(normalMatrix*position).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 color;uniform float opacity;varying float facing;void main(){gl_FragColor=vec4(color,opacity*mix(.10,1.,smoothstep(-.15,.45,facing)));}'});
  function lines(points,material,parent=earth){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const m=new THREE.LineSegments(g,material);m.renderOrder=110;parent.add(m);return m;}
  const grid=[];const push=(a,b)=>grid.push(...a,...b);
  for(let lon=-180;lon<180;lon+=30)for(let lat=-90;lat<90;lat+=3)push(vector(lon,lat),vector(lon,lat+3));
  for(let lat=-60;lat<=60;lat+=30)for(let lon=-180;lon<180;lon+=3)push(vector(lon,lat),vector(lon+3,lat));
  const gridMaterial=wireMaterial.clone();gridMaterial.uniforms.opacity.value=.38;lines(grid,gridMaterial);
  fetch('./assets/globe-land.json').then(r=>r.json()).then(rings=>{const p=[];for(const ring of rings)for(let i=1;i<ring.length;i++)p.push(...vector(...ring[i-1]),...vector(...ring[i]));lines(p,wireMaterial);wake();});
  // A shallow, tilted annulus: each wedge is a place, and the center opens its story.
  const selector=new THREE.Group();selector.rotation.set(.28,-.18,.05);globe.add(selector);
  const menuCanvas=document.createElement('canvas');menuCanvas.width=menuCanvas.height=768;
  const menuTexture=new THREE.CanvasTexture(menuCanvas);menuTexture.colorSpace=THREE.SRGBColorSpace;menuTexture.generateMipmaps=false;menuTexture.minFilter=THREE.LinearFilter;
  const annulus=new THREE.Mesh(new THREE.RingGeometry(.0225,.032,112,3),new THREE.MeshBasicMaterial({map:menuTexture,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false}));
  annulus.renderOrder=111;selector.add(annulus);
  const shortNames=['Galway','St Michaels','Winter Harbor','UCSB','Forest City','Edinburgh','SF'];
  function paintPlaces(){
    const c=menuCanvas.getContext('2d'),n=places.length;c.clearRect(0,0,768,768);c.save();c.translate(384,384);
    for(let i=0;i<n;i++){
      const a=-Math.PI/2+i*Math.PI*2/n,b=a+Math.PI*2/n,chosen=i===selected,hot=hover==='place:'+i;
      c.beginPath();c.arc(0,0,381,a+.018,b-.018);c.arc(0,0,270,b-.018,a+.018,true);c.closePath();c.fillStyle=hot?'#548ca16a':chosen?'#c08a4240':'#15364248';c.fill();c.strokeStyle=chosen?'#f4cb90':'#6998a9';c.lineWidth=chosen?3:1;c.stroke();
      c.save();c.rotate((a+b)/2);c.translate(329,0);c.rotate(Math.PI/2+(((a+b)/2+Math.PI/2)%(Math.PI*2)>Math.PI/2&&((a+b)/2+Math.PI/2)%(Math.PI*2)<Math.PI*1.5?Math.PI:0));c.fillStyle=chosen?'#ffdda5':'#add9e4';c.textAlign='center';c.textBaseline='middle';c.font=(chosen?'bold ':'')+'26px Arial';c.fillText(shortNames[i],0,0);c.restore();
    }
    c.restore();menuTexture.needsUpdate=true;
  }
  const markerGeo=new THREE.BufferGeometry();markerGeo.setAttribute('position',new THREE.Float32BufferAttribute(places.flatMap(p=>vector(p.lon,p.lat,1.018).toArray()),3));
  const markerMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{selected:{value:places.length-1}},vertexShader:'attribute float index;uniform float selected;varying float chosen;varying float facing;void main(){chosen=1.-step(.1,abs(index-selected));facing=normalize(normalMatrix*position).z;gl_PointSize=mix(4.,8.,chosen);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying float chosen;varying float facing;void main(){if(length(gl_PointCoord-.5)>.5||facing<0.)discard;gl_FragColor=vec4(mix(vec3(.45,.8,.9),vec3(1.,.72,.38),chosen),.9);}'});
  markerGeo.setAttribute('index',new THREE.Float32BufferAttribute(places.map((_,i)=>i),1));const markers=new THREE.Points(markerGeo,markerMaterial);markers.renderOrder=114;earth.add(markers);
  const markerRingPoints=[];for(let i=0;i<40;i++){for(const a of [i/40*Math.PI*2,(i+1)/40*Math.PI*2])markerRingPoints.push(Math.cos(a)*.07,Math.sin(a)*.07,0);}
  const ring=lines(markerRingPoints,new THREE.LineBasicMaterial({color:'#ffd399',transparent:true,opacity:.9,depthTest:false}),earth);
  const suit=new THREE.Group();suit.position.set(.093,-.038,.092);suit.scale.setScalar(.040);root.add(suit);
  let opticUntil=performance.now()+1800,opticPhase=0,opticLast=performance.now(),armor=null,selected=places.length-1,yaw=-places[selected].lon*rad,pitch=places[selected].lat*rad,ty=yaw,tp=pitch,suitYaw=-.25,explode=0,targetExplode=0,down=null,hover=null,visible=true,contentOpen=false,lastWheel=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qy=new THREE.Quaternion(),qx=new THREE.Quaternion(),yAxis=new THREE.Vector3(0,1,0),xAxis=new THREE.Vector3(1,0,0),zAxis=new THREE.Vector3(0,0,1);
  function select(index){selected=(index+places.length)%places.length;const p=places[selected];ty=yaw+Math.atan2(Math.sin(-p.lon*rad-yaw),Math.cos(-p.lon*rad-yaw));tp=p.lat*rad;if(reduced){yaw=ty;pitch=tp;}markerMaterial.uniforms.selected.value=selected;ring.position.copy(vector(p.lon,p.lat,1.019));ring.quaternion.setFromUnitVectors(zAxis,ring.position.clone().normalize());paintPlaces();onSelection?.(selected,places);stage.dataset.place=p.id;wake();}
  fetch('./assets/mark7-wireframe.json').then(r=>r.json()).then(data=>{
    const pos=[],off=[],colors=[],normals=[];
    for(const part of data.parts){
      // Split mirrored islands only for the displacement vector; geometry stays one batched draw.
      const neighbors=part.vertices.map(()=>[]);for(let e=0;e<part.edges.length;e+=2){const a=part.edges[e],b=part.edges[e+1];neighbors[a].push(b);neighbors[b].push(a);}
      const offsets=new Array(part.vertices.length);
      for(let start=0;start<offsets.length;start++)if(!offsets[start]){
        const ids=[start],center=new THREE.Vector3();offsets[start]=true;
        for(let n=0;n<ids.length;n++){const i=ids[n];center.add(new THREE.Vector3(...part.vertices[i]));for(const j of neighbors[i])if(!offsets[j]){offsets[j]=true;ids.push(j);}}
        center.divideScalar(ids.length);const direction=new THREE.Vector3(center.x*1.7,center.y*.5,center.z*2);
        if(direction.length()<.01)direction.set(0,0,.1);direction.normalize().multiplyScalar(.24);
        for(const i of ids)offsets[i]=direction;
      }
      for(const i of part.edges){pos.push(...part.vertices[i]);off.push(...offsets[i]);normals.push(...part.normals[i]);colors.push(.47,.74,.81);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('offset',new THREE.Float32BufferAttribute(off,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,vertexColors:true,uniforms:{explode:{value:0}},vertexShader:'attribute vec3 offset;varying vec3 tint;varying float facing;uniform float explode;void main(){tint=color;facing=(normalMatrix*normal).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position+offset*explode,1.);}',fragmentShader:'varying vec3 tint;varying float facing;void main(){gl_FragColor=vec4(tint,mix(.08,.65,smoothstep(-.1,.5,facing)));}'});
    armor=lines([],material,suit);armor.geometry.dispose();armor.geometry=g;stage.dataset.suitSegments=String(pos.length/6);wake();
  });
  // Raised optical barrel. Its center stays clear; rings and struts have real depth.
  const optic=new THREE.Group();scene.add(optic);
  const barrel=new THREE.Group();barrel.rotation.set(.24,-.58,0);optic.add(barrel);
  const rotor=new THREE.Group();barrel.add(rotor);
  const blue=[],gold=[];
  const arc=(out,r,z,start,end,count=60)=>{for(let i=0;i<count;i++)for(const a of [start+(end-start)*i/count,start+(end-start)*(i+1)/count])out.push(Math.cos(a)*r,Math.sin(a)*r,z);};
  arc(blue,.0108,0,0,Math.PI*2);arc(blue,.0125,-.012,0,Math.PI*2);arc(blue,.0085,.004,.3,5.2);arc(gold,.0118,.002,-.9,.8);
  for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%3===0?.0125:.0118;blue.push(Math.cos(a)*.011,Math.sin(a)*.011,.001,Math.cos(a)*r,Math.sin(a)*r,.001);if(i%6===0)blue.push(Math.cos(a)*.0108,Math.sin(a)*.0108,0,Math.cos(a)*.0125,Math.sin(a)*.0125,-.012);}
  const opticBlue=new THREE.LineBasicMaterial({color:'#9de4ed',transparent:true,opacity:.64,depthTest:false,depthWrite:false});
  lines(blue,opticBlue,barrel).renderOrder=103;
  lines(gold,new THREE.LineBasicMaterial({color:'#ffd29a',transparent:true,opacity:.9,depthTest:false,depthWrite:false}),rotor).renderOrder=104;
  const facePivot=new THREE.Vector3(0,1.619,.025),eyeAnchor=new THREE.Vector3(.0303,1.6252,.073),faceRotation=new THREE.Quaternion();
  function focusOptic(){opticUntil=performance.now()+1500;document.dispatchEvent(new CustomEvent('hud-center'));wake();}
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),inverse=new THREE.Matrix4(),localRay=new THREE.Ray(),hitPoint=new THREE.Vector3();
  function hit(x,y){if(!visible)return null;const r=stage.getBoundingClientRect();mouse.set((x-r.x)/r.width*2-1,1-(y-r.y)/r.height*2);ray.setFromCamera(mouse,camera);inverse.copy(root.matrixWorld).invert();localRay.copy(ray.ray).applyMatrix4(inverse);
    if(!contentOpen&&ray.ray.intersectSphere(new THREE.Sphere(optic.position,.014),hitPoint))return 'optic';
    if(!contentOpen){const found=ray.intersectObject(annulus)[0];if(found){const p=selector.worldToLocal(found.point.clone()),angle=(-Math.atan2(p.y,p.x)+Math.PI/2+Math.PI*2)%(Math.PI*2);return 'place:'+Math.floor(angle/(Math.PI*2)*places.length);}
    if(localRay.intersectSphere(new THREE.Sphere(globe.position,.021),hitPoint))return 'globe';}
    if(localRay.intersectBox(new THREE.Box3(new THREE.Vector3(.071,-.069,.06),new THREE.Vector3(.12,-.009,.13)),hitPoint))return 'suit';return null;}
  stage.addEventListener('pointermove',e=>{const target=hit(e.clientX,e.clientY);if(target!==hover){const old=hover;hover=target;if(old?.startsWith('place:')||target?.startsWith('place:'))paintPlaces();opticBlue.opacity=target==='optic'?.95:.64;wake();}if(target)e.hudContentCursor=target==='globe'||target==='suit'?'grab':'pointer';
    if(down&&e.buttons){const dx=e.clientX-down.x,dy=e.clientY-down.y;down.moved=down.moved||Math.hypot(e.clientX-down.startX,e.clientY-down.startY)>3;if(down.target==='globe'){ty=yaw+=dx*.012;tp=pitch=Math.max(-1.4,Math.min(1.4,pitch+dy*.009));}else if(down.target==='suit')suitYaw+=dx*.012;down.x=e.clientX;down.y=e.clientY;wake();}
  },{capture:true});
  stage.addEventListener('pointerdown',e=>{const target=hit(e.clientX,e.clientY);if(target&&e.button===0){down={target,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};e.stopImmediatePropagation();}},{capture:true});
  stage.addEventListener('click',e=>{if(!down)return;const d=down;down=null;e.stopImmediatePropagation();if(!d.moved){if(d.target==='globe')onPlace(places[selected]);else if(d.target==='optic')focusOptic();else if(d.target.startsWith('place:')){const index=Number(d.target.slice(6));if(index===selected)onPlace(places[index]);else select(index);}else{targetExplode=targetExplode?0:1;if(reduced)explode=targetExplode;wake();}}},{capture:true});
  stage.addEventListener('wheel',e=>{const target=hit(e.clientX,e.clientY);if(target==='globe'||target?.startsWith('place:')){e.preventDefault();e.stopImmediatePropagation();const now=performance.now();if(now-lastWheel>170){lastWheel=now;select(selected+Math.sign(e.deltaY));}}},{capture:true,passive:false});
  function tick(x=0,y=0){root.matrix.copy(getFrame());root.updateMatrixWorld(true);root.visible=visible;globe.visible=!contentOpen;optic.visible=visible&&!contentOpen;
    const now=performance.now(),dt=Math.min(.05,(now-opticLast)/1000);opticLast=now;
    faceRotation.setFromEuler(new THREE.Euler(y*.12,x*.61,0,'YXZ'));
    optic.position.copy(eyeAnchor).sub(facePivot).applyQuaternion(faceRotation).add(facePivot);optic.position.z+=.047;optic.position.x+=.001;optic.quaternion.copy(faceRotation);
    if(!reduced){opticPhase+=dt*(now<opticUntil?1.8:.16);rotor.rotation.z=opticPhase;barrel.position.z=now<opticUntil?Math.sin((opticUntil-now)/1500*Math.PI)*.002:0;}
    optic.updateMatrixWorld(true);
    const moving=Math.abs(yaw-ty)+Math.abs(pitch-tp)>.0005||Math.abs(explode-targetExplode)>.001;
    yaw+=(ty-yaw)*.15;pitch+=(tp-pitch)*.15;explode+=(targetExplode-explode)*.13;
    qy.setFromAxisAngle(yAxis,yaw);qx.setFromAxisAngle(xAxis,pitch);earth.quaternion.multiplyQuaternions(qx,qy);suit.rotation.y=suitYaw;
    if(armor)armor.material.uniforms.explode.value=explode;
    stage.dataset.volumeMoving=String(moving);stage.dataset.suitExploded=String(targetExplode===1);stage.dataset.globeRotation=JSON.stringify({yaw,pitch});
    const r=stage.getBoundingClientRect(),project=v=>{v.applyMatrix4(root.matrixWorld).project(camera);return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};};stage.dataset.volumeTargets=JSON.stringify({globe:project(globe.position.clone()),suit:project(suit.position.clone()),places:places.map((p,i)=>{const a=Math.PI/2-(i+.5)*Math.PI*2/places.length;const v=new THREE.Vector3(Math.cos(a)*.0275,Math.sin(a)*.0275,0).applyMatrix4(selector.matrixWorld).project(camera);return {label:p.label,x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};}),optic:(()=>{const v=optic.position.clone().project(camera);return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};})()});
  }
  select(selected);
  return {tick,select,focusOptic,turnSuit:delta=>{suitYaw+=delta;wake();},step:delta=>select(selected+delta),open:()=>onPlace(places[selected]),explode:()=>{targetExplode=targetExplode?0:1;wake();},setContentOpen:value=>{contentOpen=value;},setVisible:value=>{visible=value;wake();},get needsFrame(){return (!reduced&&performance.now()<opticUntil)||Math.abs(yaw-ty)+Math.abs(pitch-tp)>.0005||Math.abs(explode-targetExplode)>.001;}};
}
