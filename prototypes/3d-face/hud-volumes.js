// Genuine scene geometry for the location globe, armor and offset instrument rims.
import * as THREE from 'three';
import {places} from './places.js?v=volume-5';
const rad=Math.PI/180;
const vector=(lon,lat,r=1)=>new THREE.Vector3(Math.cos(lat*rad)*Math.sin(lon*rad)*r,Math.sin(lat*rad)*r,Math.cos(lat*rad)*Math.cos(lon*rad)*r);
export function createHUDVolumes({scene,camera,stage,wake,getFrame,onPlace,onSelection}){
  const root=new THREE.Group();root.matrixAutoUpdate=false;scene.add(root);
  const globe=new THREE.Group();globe.position.set(.085,.041,.10);root.add(globe);
  const earth=new THREE.Group();earth.scale.setScalar(.022);globe.add(earth);
  const wireMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{color:{value:new THREE.Color('#8bdde8')},opacity:{value:.85}},vertexShader:'varying float facing;void main(){facing=normalize(normalMatrix*position).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 color;uniform float opacity;varying float facing;void main(){gl_FragColor=vec4(color,opacity*mix(.10,1.,smoothstep(-.15,.45,facing)));}'});
  function lines(points,material,parent=earth){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const m=new THREE.LineSegments(g,material);m.renderOrder=110;parent.add(m);return m;}
  const grid=[];const push=(a,b)=>grid.push(...a,...b);
  for(let lon=-180;lon<180;lon+=30)for(let lat=-90;lat<90;lat+=3)push(vector(lon,lat),vector(lon,lat+3));
  for(let lat=-60;lat<=60;lat+=30)for(let lon=-180;lon<180;lon+=3)push(vector(lon,lat),vector(lon+3,lat));
  const gridMaterial=wireMaterial.clone();gridMaterial.uniforms.opacity.value=.38;lines(grid,gridMaterial);
  fetch('./assets/globe-land.json').then(r=>r.json()).then(rings=>{const p=[];for(const ring of rings)for(let i=1;i<ring.length;i++)p.push(...vector(...ring[i-1]),...vector(...ring[i]));lines(p,wireMaterial);wake();});
  const orbitMaterial=new THREE.LineBasicMaterial({color:'#8cb9c6',transparent:true,opacity:.42,depthTest:false,depthWrite:false});
  const orbitPoints=[];
  for(const tilt of [-.55,.6])for(let i=0;i<100;i++){const a=i/100*Math.PI*2,b=(i+1)/100*Math.PI*2;for(const t of [a,b])orbitPoints.push(Math.cos(t)*.026,Math.sin(t)*.026*Math.cos(tilt),Math.sin(t)*.026*Math.sin(tilt));}
  lines(orbitPoints,orbitMaterial,globe);
  const markerGeo=new THREE.BufferGeometry();markerGeo.setAttribute('position',new THREE.Float32BufferAttribute(places.flatMap(p=>vector(p.lon,p.lat,1.018).toArray()),3));
  const markerMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{selected:{value:places.length-1}},vertexShader:'attribute float index;uniform float selected;varying float chosen;varying float facing;void main(){chosen=1.-step(.1,abs(index-selected));facing=normalize(normalMatrix*position).z;gl_PointSize=mix(4.,8.,chosen);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying float chosen;varying float facing;void main(){if(length(gl_PointCoord-.5)>.5||facing<0.)discard;gl_FragColor=vec4(mix(vec3(.45,.8,.9),vec3(1.,.72,.38),chosen),.9);}'});
  markerGeo.setAttribute('index',new THREE.Float32BufferAttribute(places.map((_,i)=>i),1));const markers=new THREE.Points(markerGeo,markerMaterial);markers.renderOrder=114;earth.add(markers);
  const markerRingPoints=[];for(let i=0;i<40;i++){for(const a of [i/40*Math.PI*2,(i+1)/40*Math.PI*2])markerRingPoints.push(Math.cos(a)*.07,Math.sin(a)*.07,0);}
  const ring=lines(markerRingPoints,new THREE.LineBasicMaterial({color:'#ffd399',transparent:true,opacity:.9,depthTest:false}),earth);
  const suit=new THREE.Group();suit.position.set(.091,-.036,.097);suit.scale.setScalar(.044);root.add(suit);
  let armor=null,selected=places.length-1,yaw=-places[selected].lon*rad,pitch=places[selected].lat*rad,ty=yaw,tp=pitch,suitYaw=-.25,explode=0,targetExplode=0,down=null,hover=null,visible=true,contentOpen=false,lastWheel=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qy=new THREE.Quaternion(),qx=new THREE.Quaternion(),yAxis=new THREE.Vector3(0,1,0),xAxis=new THREE.Vector3(1,0,0),zAxis=new THREE.Vector3(0,0,1);
  function select(index){selected=(index+places.length)%places.length;const p=places[selected];ty=yaw+Math.atan2(Math.sin(-p.lon*rad-yaw),Math.cos(-p.lon*rad-yaw));tp=p.lat*rad;if(reduced){yaw=ty;pitch=tp;}markerMaterial.uniforms.selected.value=selected;ring.position.copy(vector(p.lon,p.lat,1.019));ring.quaternion.setFromUnitVectors(zAxis,ring.position.clone().normalize());onSelection?.(selected,places);stage.dataset.place=p.id;wake();}
  fetch('./assets/mark7-wireframe.json').then(r=>r.json()).then(data=>{
    const pos=[],off=[],colors=[],normals=[];
    for(const part of data.parts){const center=new THREE.Vector3(...part.center),offset=center.clone().normalize().multiplyScalar(.09);for(const i of part.edges){pos.push(...part.vertices[i]);off.push(...offset);normals.push(...part.normals[i]);colors.push(.47,.74,.81);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('offset',new THREE.Float32BufferAttribute(off,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,vertexColors:true,uniforms:{explode:{value:0}},vertexShader:'attribute vec3 offset;varying vec3 tint;varying float facing;uniform float explode;void main(){tint=color;facing=(normalMatrix*normal).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position+offset*explode,1.);}',fragmentShader:'varying vec3 tint;varying float facing;void main(){gl_FragColor=vec4(tint,mix(.08,.65,smoothstep(-.1,.5,facing)));}'});
    armor=lines([],material,suit);armor.geometry.dispose();armor.geometry=g;stage.dataset.suitSegments=String(pos.length/6);wake();
  });
  // Separated front/back rails give the radial menu physical depth.
  const rails=[];const rim=(a,z)=>{const x=-.123+Math.cos(a)*.071,y=-.003+Math.sin(a)*.071;return [x,y,.14+Math.sqrt(.225*.225-x*x)-.225-.025+z];};
  for(let i=0;i<80;i++){const a=-1.35+i/80*2.7,b=-1.35+(i+1)/80*2.7;for(const z of [-.004,.003])rails.push(...rim(a,z),...rim(b,z));if(i%8===0)rails.push(...rim(a,-.004),...rim(a,.003));}
  lines(rails,new THREE.LineBasicMaterial({color:'#a3d6e0',transparent:true,opacity:.24,depthTest:false,depthWrite:false}),root);
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),inverse=new THREE.Matrix4(),localRay=new THREE.Ray(),hitPoint=new THREE.Vector3();
  function hit(x,y){if(!visible)return null;const r=stage.getBoundingClientRect();mouse.set((x-r.x)/r.width*2-1,1-(y-r.y)/r.height*2);ray.setFromCamera(mouse,camera);inverse.copy(root.matrixWorld).invert();localRay.copy(ray.ray).applyMatrix4(inverse);
    if(!contentOpen&&localRay.intersectSphere(new THREE.Sphere(globe.position,.028),hitPoint))return 'globe';
    if(localRay.intersectBox(new THREE.Box3(new THREE.Vector3(.073,-.069,.075),new THREE.Vector3(.110,-.015,.12)),hitPoint))return 'suit';return null;}
  stage.addEventListener('pointermove',e=>{const target=hit(e.clientX,e.clientY);if(target){e.hudContentCursor='grab';hover=target;}
    if(down&&e.buttons){const dx=e.clientX-down.x,dy=e.clientY-down.y;down.moved=down.moved||Math.hypot(e.clientX-down.startX,e.clientY-down.startY)>3;if(down.target==='globe'){ty=yaw+=dx*.012;tp=pitch=Math.max(-1.4,Math.min(1.4,pitch+dy*.009));}else suitYaw+=dx*.012;down.x=e.clientX;down.y=e.clientY;wake();}
  },{capture:true});
  stage.addEventListener('pointerdown',e=>{const target=hit(e.clientX,e.clientY);if(target&&e.button===0){down={target,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};e.stopImmediatePropagation();}},{capture:true});
  stage.addEventListener('click',e=>{if(!down)return;const d=down;down=null;e.stopImmediatePropagation();if(!d.moved){if(d.target==='globe')onPlace(places[selected]);else{targetExplode=targetExplode?0:1;if(reduced)explode=targetExplode;wake();}}},{capture:true});
  stage.addEventListener('wheel',e=>{if(hit(e.clientX,e.clientY)==='globe'){e.preventDefault();e.stopImmediatePropagation();const now=performance.now();if(now-lastWheel>170){lastWheel=now;select(selected+Math.sign(e.deltaY));}}},{capture:true,passive:false});
  function tick(){root.matrix.copy(getFrame());root.updateMatrixWorld(true);root.visible=visible;globe.visible=!contentOpen;
    const moving=Math.abs(yaw-ty)+Math.abs(pitch-tp)>.0005||Math.abs(explode-targetExplode)>.001;
    yaw+=(ty-yaw)*.15;pitch+=(tp-pitch)*.15;explode+=(targetExplode-explode)*.13;
    qy.setFromAxisAngle(yAxis,yaw);qx.setFromAxisAngle(xAxis,pitch);earth.quaternion.multiplyQuaternions(qx,qy);suit.rotation.y=suitYaw;
    if(armor)armor.material.uniforms.explode.value=explode;
    stage.dataset.volumeMoving=String(moving);stage.dataset.suitExploded=String(targetExplode===1);stage.dataset.globeRotation=JSON.stringify({yaw,pitch});
    const r=stage.getBoundingClientRect(),project=v=>{v.applyMatrix4(root.matrixWorld).project(camera);return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};};stage.dataset.volumeTargets=JSON.stringify({globe:project(globe.position.clone()),suit:project(suit.position.clone())});
  }
  select(selected);
  return {tick,select,turnSuit:delta=>{suitYaw+=delta;wake();},step:delta=>select(selected+delta),open:()=>onPlace(places[selected]),explode:()=>{targetExplode=targetExplode?0:1;wake();},setContentOpen:value=>{contentOpen=value;},setVisible:value=>{visible=value;wake();},get needsFrame(){return Math.abs(yaw-ty)+Math.abs(pitch-tp)>.0005||Math.abs(explode-targetExplode)>.001;}};
}
