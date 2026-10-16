import * as THREE from 'three';
import {visorDepth} from './visor-space.js?v=selector-3';
import {instrumentInk as ink} from './hud-instrument-style.js?v=rory-29f';
import {createHUDRelief,reliefArc} from './hud-relief.js?v=rory-29f';
import {instrumentFoldProgress} from './hud-transfer.js?v=rory-29f';
import {viewportShift} from './hud-control-targets.js?v=rory-29f';
import {trackingBallPose,trackingSpherePoint,trackingSphereLines} from './tracking-ball-geometry.js?v=tracking-sphere-1';

export function createHUDAttitude({scene,camera,stage}){
  const root=new THREE.Group();scene.add(root);
  const hinge=new THREE.Group();root.add(hinge);
  const initial=trackingBallPose(0);
  const deployed=new THREE.Vector3(initial.x,initial.y,visorDepth(initial.x,initial.y));
  hinge.position.copy(deployed);
  const ball=new THREE.Group();ball.scale.setScalar(.50);hinge.add(ball);
  const radius=.052,TAU=Math.PI*2;
  function lines(points,color,opacity,order=103,parent=ball){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    const mesh=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false,toneMapped:false}));mesh.renderOrder=order;parent.add(mesh);return mesh;
  }
  const backing=new THREE.Mesh(new THREE.CircleGeometry(radius-.001,96),new THREE.MeshBasicMaterial({color:'#080a09',transparent:true,opacity:.26,depthTest:false,depthWrite:false,toneMapped:false}));
  backing.position.z=-.002;backing.renderOrder=100;ball.add(backing);
  const sectors=[[-.1,.62],[.75,1.8],[2,3.55],[3.8,4.7],[4.9,5.95]];
  createHUDRelief(ball,(x,y,z)=>[x,y,z],[
    {points:reliefArc(radius-.001),width:.0013,depth:.0008,closed:true},
    ...sectors.map(([a,b])=>({points:reliefArc(.046,a,b),width:.0026,depth:.0011})),
    ...[0,Math.PI/2,Math.PI,Math.PI*1.5].map(a=>({points:reliefArc(.054,a-.12,a+.12),width:.0012,depth:.0007,tint:ink.dim})),
  ]);
  const bezel=[],bands=[];
  function arc(points,r,a,b,z=0,sx=1,sy=1){const count=Math.ceil((b-a)*r*1800);for(let i=0;i<count;i++){const u=a+(b-a)*i/count,v=a+(b-a)*(i+1)/count;points.push(r*Math.cos(u)*sx,r*Math.sin(u)*sy,z,r*Math.cos(v)*sx,r*Math.sin(v)*sy,z);}}
  for(const r of [radius,radius-.003,.043,.038])arc(bezel,r,0,TAU);
  for(let i=0;i<120;i++){const a=i*TAU/120,inner=radius-(i%5?.0015:.0045);bezel.push(inner*Math.cos(a),inner*Math.sin(a),0,radius*Math.cos(a),radius*Math.sin(a),0);}
  for(const [a,b] of sectors)arc(bands,.0442,a,b);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;bezel.push(.054*Math.cos(a),.054*Math.sin(a),0,.057*Math.cos(a),.057*Math.sin(a),0);}
  const sphere=new THREE.Group();ball.add(sphere);
  const globeLines=lines(trackingSphereLines(),ink.white,.65,103,sphere);
  globeLines.geometry.setAttribute('normal',globeLines.geometry.attributes.position.clone());
  globeLines.material.dispose();
  globeLines.material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,
    uniforms:{color:{value:new THREE.Color(ink.white)}},
    vertexShader:'varying float facing;void main(){facing=normalize(normalMatrix*normal).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 color;varying float facing;void main(){gl_FragColor=vec4(color,mix(.09,.65,smoothstep(-.15,.6,facing)));}'});
  const shell=new THREE.Mesh(new THREE.SphereGeometry(.0368,32,20),new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,
    vertexShader:'varying float facing;void main(){facing=normalize(normalMatrix*normal).z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying float facing;void main(){float rim=pow(1.-max(0.,facing),3.);gl_FragColor=vec4(vec3(.10,.16,.18),.025+.12*rim);}'}));
  shell.renderOrder=101;sphere.add(shell);
  lines(bezel,ink.white,.6);lines(bands,ink.dim,.8);
  lines([-.007,0,.003,-.002,0,.003,.002,0,.003,.007,0,.003,0,-.007,.003,0,-.002,.003,0,.002,.003,0,.007,.003],ink.white,.9,104);
  const target=[];arc(target,.0025,0,TAU,.004);target.push(-.0045,0,.004,-.0025,0,.004,.0025,0,.004,.0045,0,.004);
  const marker=lines(target,ink.red,.95,105);
  const bearing=lines([0,.041,.002,-.002,.037,.002,-.002,.037,.002,.002,.037,.002,.002,.037,.002,0,.041,.002],ink.gold,.9,104);

  // The flight scale is independent of the ball's folding mechanism.
  const pitchRoot=new THREE.Group();scene.add(pitchRoot);
  const ladder=new THREE.Group();pitchRoot.add(ladder);
  const rungs=[];
  for(let degrees=-15;degrees<=15;degrees+=5){const y=degrees*.0024,length=degrees===0?.012:.009;
    for(const side of [-1,1]){const a=side*.003,b=side*length;if(degrees<0){rungs.push(a,y,0,side*.005,y,0,side*.006,y,0,b,y,0);}else rungs.push(a,y,0,b,y,0);rungs.push(b,y,0,b,y+(degrees<0?.0015:-.0015),0);}
  }
  lines(rungs,ink.white,.65,103,ladder);
  lines([-.016,-.002,.001,-.013,0,.001,-.013,0,.001,-.016,.002,.001,.013,0,.001,.016,0,.001],ink.gold,.95,104,pitchRoot);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=800;const c=canvas.getContext('2d');
  c.fillStyle=ink.white;c.font='36px Arial';c.textAlign='left';c.textBaseline='middle';
  for(let d=-15;d<=15;d+=5)c.fillText(String(d),4,400-d*.0024/.080*800);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
  const labels=new THREE.Mesh(new THREE.PlaneGeometry(.010,.080),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));labels.position.set(.020,0,.001);labels.scale.x=1.4;labels.renderOrder=104;ladder.add(labels);

  const history=[],trailPositions=new Float32Array(47*6),trail=lines(trailPositions,ink.white,.78,104);
  trail.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);trail.geometry.setDrawRange(0,0);trail.frustumCulled=false;
  const point=new THREE.Vector3(),bounds=new THREE.Box3(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastSample=0,fold=0,foldAnimation=null,stowed=false,visible=true,rightBoundary=Infinity;
  function projectedBounds(object,r){
    object.updateWorldMatrix(true,true);bounds.setFromObject(object);
    const corners=[];
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      const p=new THREE.Vector3(x,y,z).project(camera);corners.push({x:(p.x+1)*r.width/2,y:(1-p.y)*r.height/2});
    }
    return corners;
  }
  return {get rightBoundary(){return rightBoundary;},get needsFrame(){return visible&&!!foldAnimation;},update(x,y,shown,shouldStow,transfer){
    visible=shown;root.visible=shown;pitchRoot.visible=shown;
    const now=performance.now();
    if(shouldStow!==stowed){stowed=shouldStow;if(reduced){fold=stowed?1:0;foldAnimation=null;}else foldAnimation={at:transfer?.at??now,from:fold,to:stowed?1:0,revealing:!stowed};}
    if(foldAnimation){const t=instrumentFoldProgress(now,foldAnimation.at,foldAnimation.revealing);fold=THREE.MathUtils.lerp(foldAnimation.from,foldAnimation.to,t);if(t===1)foldAnimation=null;}
    const pose=trackingBallPose(fold);
    hinge.position.set(pose.x,pose.y,visorDepth(pose.x,pose.y));hinge.scale.setScalar(pose.scale);
    sphere.rotation.set(.20-y*.35,.35+x*.45,0);
    const pitch=-y*.12*180/Math.PI;ladder.position.y=-pitch*.0024;
    let px=x*.058,py=-y*.052;const length=Math.hypot(px,py),scale=Math.min(1,.035/Math.max(.0001,length));px*=scale;py*=scale;
    marker.position.set(...trackingSpherePoint(px,py));bearing.rotation.z=length>.0001?Math.atan2(py,px)-Math.PI/2:0;
    const last=history.at(-1);
    if(shown&&(!last||(now-lastSample>=80&&Math.hypot(px-last.x,py-last.y)>.00015))){
      history.push({x:px,y:py});if(history.length>48)history.shift();lastSample=now;
      for(let i=1;i<history.length;i++){const a=history[i-1],b=history[i];trailPositions.set([...trackingSpherePoint(a.x,a.y),...trackingSpherePoint(b.x,b.y)],(i-1)*6);}
      trail.geometry.getAttribute('position').array.set(trailPositions);trail.geometry.getAttribute('position').needsUpdate=true;trail.geometry.setDrawRange(0,(history.length-1)*2);
    }
    // Anchor the independent flight tape beside the content area. It remains
    // visor geometry, with a screen-space safety margin at every head pose.
    const r=stage.getBoundingClientRect();
    pitchRoot.scale.set(.7,1,1);
    const anchor=new THREE.Vector3(.13,0,visorDepth(.13)).applyMatrix4(scene.matrixWorld).project(camera);
    anchor.x=1-116/r.width;anchor.y=0;
    pitchRoot.position.copy(scene.worldToLocal(anchor.unproject(camera)));
    let corners=projectedBounds(pitchRoot,r);
    const height=Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y));
    pitchRoot.scale.multiplyScalar(Math.min(1,Math.min(300,r.height*.48)/height));
    corners=projectedBounds(pitchRoot,r);
    const align=r.width-26-Math.max(...corners.map(p=>p.x));
    const center=bounds.getCenter(new THREE.Vector3()),aligned=center.clone().project(camera);
    aligned.x+=align*2/r.width;aligned.unproject(camera);
    pitchRoot.position.add(scene.worldToLocal(aligned).sub(scene.worldToLocal(center)));
    corners=projectedBounds(pitchRoot,r);
    rightBoundary=Math.min(...corners.map(p=>p.x))-24;
    stage.dataset.pitchBounds=JSON.stringify({left:rightBoundary+24,right:Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))});
    stage.dataset.pitchVisible=String(shown);
    // The ball stays readable above the panel; the pitch ladder stays independent.
    const fitScale=THREE.MathUtils.clamp(stage.clientWidth/1024,.75,1);root.scale.setScalar(fitScale);root.position.copy(hinge.position).multiplyScalar(1-fitScale);
    corners=projectedBounds(root,r);
    const shift=viewportShift(corners,r.width,r.height,22);
    if(shift.x||shift.y){
      const center=bounds.getCenter(new THREE.Vector3()),adjusted=center.clone().project(camera);
      adjusted.x+=shift.x*2/r.width;adjusted.y-=shift.y*2/r.height;adjusted.unproject(camera);
      root.position.add(scene.worldToLocal(adjusted).sub(scene.worldToLocal(center)));
      root.updateWorldMatrix(true,true);
    }
    ball.getWorldPosition(point).project(camera);
    stage.dataset.attitudeTarget=JSON.stringify({x:r.x+(point.x+1)*r.width/2,y:r.y+(1-point.y)*r.height/2});
    stage.dataset.attitudeSample=JSON.stringify({yaw:x*.61*180/Math.PI,pitch,samples:history.length});
    stage.dataset.pitchDegrees=pitch.toFixed(2);stage.dataset.attitudeFold=fold.toFixed(3);stage.dataset.attitudeState=foldAnimation?'moving':stowed?'parked':'deployed';stage.dataset.attitudeVisible=String(shown);stage.dataset.attitudeScale=pose.scale.toFixed(3);
  }};
}
