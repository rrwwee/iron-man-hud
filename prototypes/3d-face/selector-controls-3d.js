// Disposable 3D selector study: six shallow recessed optics, batched in two draws.
import * as THREE from 'three';
import {instrumentInk as ink} from './hud-instrument-style.js?v=rory-29f';
import {drawIcon} from './hud-icons.js?v=selector-3';
import {canvasToVisor,diagnosticDepth} from './hud-reference-model.js?v=selector-3';
import {buttonRowPoint} from './hud-selector-layout.js?v=single-hud-1';
import {transferPhase,flightPoint,rowSlot} from './hud-transfer.js?v=rory-29f';
const ids=['suit','globe','video','cv','about','links'];
export function createSelectorControls3D(parent){
  const carrier=new THREE.Group();parent.add(carrier);
  const positions=[],colors=[],iconPositions=[],iconUV=[],ranges=[],centres=[],normals=[];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elevations=new Float32Array(6),destinations=new Float32Array(6);
  const atlas=document.createElement('canvas');atlas.width=384;atlas.height=64;const ctx=atlas.getContext('2d');
  const texture=new THREE.CanvasTexture(atlas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
  const color=new THREE.Color(),segments=32,r=.0051;
  for(let i=0;i<6;i++){
    const p=buttonRowPoint(i),[x,y]=canvasToVisor(p.x,p.y),z=diagnosticDepth(x,y)+.001;
    const origin=new THREE.Vector3(x,y,z),normal=new THREE.Vector3(x,y,z-.025).normalize();
    normals.push(normal);
    const right=new THREE.Vector3(0,1,0).cross(normal).normalize(),up=new THREE.Vector3().crossVectors(normal,right).normalize();
    const world=(radius,angle,depth)=>origin.clone().addScaledVector(right,radius*Math.cos(angle)).addScaledVector(up,radius*Math.sin(angle)).addScaledVector(normal,depth);
    const start=positions.length/3;
    function v(p,shade,alpha){positions.push(p.x,p.y,p.z);colors.push(shade,shade,shade,alpha);}
    // Back flange, angled bevel, bright lip, then the recessed face.
    const profile=[[r, -.0013],[r*.93,.0017],[r*.84,.0017],[r*.80,.00045]];
    for(let j=0;j<segments;j++){
      const a=j*Math.PI*2/segments,b=(j+1)*Math.PI*2/segments;
      for(let band=0;band<profile.length-1;band++){
        const [ra,za]=profile[band],[rb,zb]=profile[band+1];
        const pa=world(ra,a,za),pb=world(ra,b,za),pc=world(rb,b,zb),pd=world(rb,a,zb);
        const shade=band===0?.14+.12*(1+Math.sin(a))/2:band===1?(j%8===0?.32:.90):.18;
        for(const q of [pa,pb,pc,pa,pc,pd])v(q,shade,band===1?.82:.32);
      }
      for(const q of [world(0,0,.00045),world(r*.80,a,.00045),world(r*.80,b,.00045)])v(q,.10,.12);
    }
    ranges.push([start,positions.length/3]);centres.push(origin.clone().addScaledVector(normal,.0018));
    const corners=[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];
    for(const [a,b] of corners){const p=origin.clone().addScaledVector(right,a*r*.62).addScaledVector(up,b*r*.62).addScaledVector(normal,.0006);iconPositions.push(p.x,p.y,p.z);iconUV.push((i+(a+1)/2)/6,(b+1)/2);}
  }
  const baseColors=new Float32Array(colors);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));
  const body=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false}));body.renderOrder=103;carrier.add(body);
  const iconGeometry=new THREE.BufferGeometry();iconGeometry.setAttribute('position',new THREE.Float32BufferAttribute(iconPositions,3));iconGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(iconUV,2));
  const icons=new THREE.Mesh(iconGeometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false}));icons.renderOrder=104;carrier.add(icons);
  const basePositions=new Float32Array(positions),baseIconPositions=new Float32Array(iconPositions);
  const originalCentres=centres.map(p=>p.clone()),anchor=originalCentres.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).multiplyScalar(1/centres.length);
  let viewportKey='',fitScale=1,stateValue=null,transfer=null,flightSources=null,expandedAnchor=new THREE.Vector3(.09,-.09,.14);
  const expandedPosition=new THREE.Vector3(),rowPosition=new THREE.Vector3();
  function targetPosition(id){
    if(id===stateValue?.expandedId)return expandedPosition.copy(expandedAnchor);
    const available=stateValue?.entries.map(e=>e.id)||ids,index=available.indexOf(id);
    const p=buttonRowPoint(rowSlot(Math.max(0,index),available.length)),[x,y]=canvasToVisor(p.x,p.y);
    return rowPosition.set(x,y,diagnosticDepth(x,y)+.0028).sub(anchor).multiplyScalar(fitScale).add(anchor);
  }
  let previous='',lastTick=0,settling=false;
  return {centres,ids,setExpandedAnchor(point){if(point&&point.distanceToSquared(expandedAnchor)>1e-12){expandedAnchor.copy(point);settling=true;}},beginTransfer(value){transfer=value;flightSources=centres.map(p=>p.clone());settling=true;},get needsFrame(){return settling||!!transfer;},tick(now){
    const blend=reduced?1:1-Math.exp(-Math.min(40,now-(lastTick||now-16))/42);lastTick=now;
    const phase=transferPhase(reduced?Infinity:now,transfer);
    if(!settling&&!transfer)return;
    settling=false;
    ids.forEach((id,i)=>{
      const difference=destinations[i]-elevations[i];
      elevations[i]=Math.abs(difference)<.00001?destinations[i]:elevations[i]+difference*blend;
      if(elevations[i]!==destinations[i])settling=true;
      const target=targetPosition(id).clone();
      if(transfer){
        const travelling=id===transfer.moved||id===transfer.returned;
        if(travelling)centres[i].fromArray(flightPoint(flightSources[i].toArray(),target.toArray(),phase,transfer.moved&&id===transfer.returned?.041:.018));
        else centres[i].lerpVectors(flightSources[i],target,phase.row);
      }else centres[i].copy(target);
      const orientation=new THREE.Quaternion().setFromUnitVectors(normals[i],new THREE.Vector3(centres[i].x*.65,centres[i].y*.65,centres[i].z-.025).normalize()),delta=new THREE.Vector3();
      const n=normals[i].clone().applyQuaternion(orientation),offset=elevations[i],scale=fitScale*(transfer&&(id===transfer.moved||id===transfer.returned)?1-.10*Math.sin(Math.PI*phase.travel):1);
      for(const [attribute,base,start,end] of [[geometry.attributes.position,basePositions,...ranges[i]],[iconGeometry.attributes.position,baseIconPositions,i*6,(i+1)*6]])for(let j=start;j<end;j++){
        delta.set(base[j*3]-originalCentres[i].x,base[j*3+1]-originalCentres[i].y,base[j*3+2]-originalCentres[i].z).applyQuaternion(orientation).multiplyScalar(scale).addScaledVector(n,offset).add(centres[i]);
        attribute.setXYZ(j,delta.x,delta.y,delta.z);
      }
    });
    if(phase.done)transfer=null;
    geometry.attributes.position.needsUpdate=iconGeometry.attributes.position.needsUpdate=true;
    geometry.computeBoundingSphere();iconGeometry.computeBoundingSphere();
  },fitTargets(camera,stage){
    const key=stage.clientWidth+':'+stage.clientHeight;if(key===viewportKey)return;viewportKey=key;
    const projected=originalCentres.map(p=>{const q=p.clone().applyMatrix4(parent.matrixWorld).project(camera);return {x:q.x*stage.clientWidth/2,y:q.y*stage.clientHeight/2};});
    const spacing=Math.min(...projected.slice(1).map((p,i)=>Math.hypot(p.x-projected[i].x,p.y-projected[i].y)));
    fitScale=THREE.MathUtils.clamp(48/spacing,1,1.6);settling=true;
  },update(state,hover,focused){
    stateValue=state;settling=true;
    const selected=state.entries[state.selected].id,available=new Set([...state.entries.map(e=>e.id),state.expandedId]),key=[selected,state.expandedId,...available,hover,focused].join('|');if(key===previous)return;previous=key;
    ctx.clearRect(0,0,atlas.width,atlas.height);
    ids.forEach((id,i)=>{const visible=available.has(id),active=selected===id||state.expandedId===id,hot=hover==='select:'+id||focused==='select:'+id;
      destinations[i]=active?-.00025:hot?.00065:0;
      if(destinations[i]!==elevations[i])settling=true;
      color.set(active?ink.red:hot?ink.white:ink.dim);
      for(let j=ranges[i][0];j<ranges[i][1];j++){const k=j*4,s=baseColors[k];colors[k]=color.r*s;colors[k+1]=color.g*s;colors[k+2]=color.b*s;colors[k+3]=visible?baseColors[k+3]:0;}
      if(visible)drawIcon(ctx,id,i*64+32,32,48,active||hot?ink.white:ink.dim);
    });
    geometry.attributes.color.array.set(colors);geometry.attributes.color.needsUpdate=true;texture.needsUpdate=true;
  }};
}
