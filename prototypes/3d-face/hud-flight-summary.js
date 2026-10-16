import {drawIcon} from './hud-icons.js?v=rory-29f';
import * as THREE from 'three';
import {instrumentInk as ink} from './hud-instrument-style.js?v=rory-29f';
// Open typography follows the globe's scale and travel without rotating with Earth.
export function createFlightSummary({scene,stage}){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
  const c=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);mesh.renderOrder=115;mesh.visible=false;scene.add(mesh);
  const access=document.createElement('div');access.setAttribute('role','img');access.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';stage.append(access);
  let previous='';
  return {update(globe,radius,data,visible,expansion=1){
    mesh.visible=visible&&globe.visible&&!!data;access.hidden=!mesh.visible;if(!mesh.visible)return;
    mesh.position.copy(globe.position);mesh.position.z+=radius*.8;mesh.scale.setScalar(radius*2.85);material.opacity=globe.userData.alpha??1;
    const key=JSON.stringify([data,Math.round(expansion*1000)]);if(key===previous)return;previous=key;
    c.clearRect(0,0,1024,1024);c.textAlign='center';c.textBaseline='alphabetic';
    const metrics=[[data.flights,'FLIGHTS'],['≈'+Intl.NumberFormat('en').format(data.miles),'ROUTE MILES'],[data.airports,'AIRPORTS']];
    metrics.forEach(([value,label],i)=>{
      const x=184+i*328;
      c.save();c.globalAlpha=expansion;c.strokeStyle=ink.dim;c.lineWidth=2;c.beginPath();c.moveTo(x-130,886);c.lineTo(x+130,886);c.stroke();
      c.fillStyle=i===1?ink.gold:ink.white;c.font='52px Arial';c.fillText(String(value),x,952);
      c.fillStyle=ink.dim;c.font='27px Arial';c.fillText(label,x,996);c.restore();
      c.save();c.globalAlpha=1-expansion;
      const [px,py]=[[170,865],[700,105],[760,975]][i];
      c.strokeStyle=ink.faint;c.lineWidth=2;c.beginPath();c.moveTo(px-95,py-65);c.lineTo(px+80,py-65);c.stroke();
      drawIcon(c,['flight','radius','globe'][i],px-95,py-20,56,ink.dim);
      c.textAlign='left';c.fillStyle=i===1?ink.gold:ink.white;c.font='72px Arial';
      c.fillText(i===1?Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(data.miles).toLowerCase():String(value),px-44,py);c.restore();
    });texture.needsUpdate=true;
    access.setAttribute('aria-label',`${data.flights} completed flights, ${data.airports} airports, approximately ${data.miles.toLocaleString('en')} great-circle route miles. Actual flown distance may differ.`);
    stage.dataset.flightSummary=JSON.stringify(data);
  }};
}
