import * as THREE from 'three';
import {instrumentInk as ink} from './hud-instrument-style.js?v=rory-29f';
import {drawIcon} from './hud-icons.js?v=rory-29f';
const compact=n=>n===null||n===undefined?'—':Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(n);
export function createSuitActivity({scene,stage,getActivity}){
  const root=new THREE.Group();scene.add(root);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=960;
  const c=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(.096,.090),material);plane.renderOrder=115;root.add(plane);
  const access=document.createElement('div');access.setAttribute('role','img');access.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';stage.append(access);
  let previous='',narrow=false;
  function channel(x,icon,days,total,label,streak,status){
    const values=days.map(d=>d.count??d.tokens),last=days.at(-1)?.date,first=last?Date.parse(last+'T00:00:00Z')-29*86400000:0;
    c.save();c.translate(0,icon==='github'?(narrow?330:190):(narrow?-90:0));
    const width=210,top=275,height=170;
    drawIcon(c,icon,x+26,top-72,36,ink.white);
    c.fillStyle=ink.white;c.font='30px Arial';c.textAlign='left';c.fillText(compact(total),x+58,top-62);
    c.fillStyle=ink.dim;c.font='17px Arial';c.fillText(label,x,top-20);
    const peak=Math.max(1,...values);
    c.strokeStyle=ink.faint;c.lineWidth=1;c.beginPath();c.moveTo(x,top+height);c.lineTo(x+width,top+height);c.stroke();
    for(let i=0;i<values.length;i++){
      const px=x+(Date.parse(days[i].date+'T00:00:00Z')-first)/86400000*width/30,h=values[i]/peak*height;
      c.fillStyle=icon==='codex'?ink.gold:ink.red;c.fillRect(px,top+height-h,Math.max(2,width/30-3),Math.max(2,h));
    }
    c.fillStyle=ink.dim;c.font='16px Arial';c.fillText(status==='unavailable'?'No data':status==='stale'?'Saved snapshot':'Last 30 days',x,top+height+32);
    c.strokeStyle=ink.dim;c.beginPath();c.moveTo(x,top+height+70);c.lineTo(x+width*.75,top+height+70);c.stroke();
    for(let i=0;i<Math.min(streak??0,30);i++){c.fillStyle=icon==='codex'?ink.gold:ink.red;c.fillRect(x+i*7,top+height+88,4,12);}
    c.fillStyle=ink.white;c.font='22px Arial';c.fillText(`${streak??'—'} day streak`,x,top+height+139);c.restore();
  }
  return {update(suit,blend,alpha){
    root.visible=blend*alpha>.001;access.hidden=!root.visible;
    root.position.copy(suit.position);root.position.z+=.044;root.scale.setScalar(suit.scale.x/.1);material.opacity=blend*alpha;
    if(!root.visible)return;
    narrow=stage.clientWidth<900;
    const d=getActivity?.()||{},codex=d.codex||{days:[],status:'unavailable'},key=JSON.stringify([d.fetchedAt,codex.fetchedAt,d.calendarStatus,codex.status,narrow]);
    if(key===previous)return;previous=key;c.clearRect(0,0,1024,960);
    channel(narrow?796:18,'github',(d.days||[]).slice(-30),d.total,'year contributions',d.streak,d.calendarStatus);
    channel(796,'codex',codex.days||[],codex.lifetimeTokens,'lifetime tokens',codex.currentStreakDays,codex.status);
    texture.needsUpdate=true;
    access.setAttribute('aria-label',`GitHub: ${d.total??'unavailable'} yearly contributions, ${d.streak??'unavailable'} day streak. Codex: ${codex.lifetimeTokens??'unavailable'} lifetime tokens, ${codex.currentStreakDays??'unavailable'} day streak. Graphs show daily activity.`);
    stage.dataset.suitActivity=JSON.stringify({githubTotal:d.total,codexLifetimeTokens:codex.lifetimeTokens,codexStreak:codex.currentStreakDays});
  }};
}
