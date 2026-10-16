import * as THREE from 'three';

// A closed, chamfered ribbon swept along a 2D contour, then lifted onto the
// owning instrument's surface. One mesh batches all of an instrument's rims.
export function createHUDRelief(parent,project,rails,{order=102,dynamic=false}={}){
  const positions=[],colors=[],samples=[],color=new THREE.Color();
  for(const {points,width,depth=.0012,closed=false,tint='#b8bab3',opacity=.7} of rails){
    const path=points.map(p=>Array.isArray(p)?p:[p.x,p.y]).filter((p,i,all)=>!i||Math.hypot(p[0]-all[i-1][0],p[1]-all[i-1][1])>1e-7);
    if(path.length>2&&Math.hypot(path[0][0]-path.at(-1)[0],path[0][1]-path.at(-1)[1])<1e-7)path.pop();
    if(path.length<2)continue;
    color.set(tint);
    const profile=[[-.5,-depth*.55],[-.5,0],[-.30,depth],[.30,depth],[.5,0],[.5,-depth*.55]];
    const sections=path.map((p,i)=>{
      const prev=path[i?i-1:closed?path.length-1:0],next=path[i<path.length-1?i+1:closed?0:i];
      const unit=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]);return d>1e-8?[(b[0]-a[0])/d,(b[1]-a[1])/d]:null;};
      const incoming=unit(prev,p),outgoing=unit(p,next),a=incoming||outgoing,b=outgoing||incoming;
      let nx=-a[1]-b[1],ny=a[0]+b[0];const length=Math.hypot(nx,ny)||1;nx/=length;ny/=length;
      const miter=1/Math.max(.5,nx*-b[1]+ny*b[0]);
      return profile.map(([offset,z])=>[p[0]+nx*offset*width*miter,p[1]+ny*offset*width*miter,z]);
    });
    const vertex=(p,shade)=>{positions.push(...project(...p));if(dynamic)samples.push(...p);colors.push(color.r*shade,color.g*shade,color.b*shade,opacity);};
    const quad=(a,b,c,d,shade)=>{for(const p of [a,b,c,a,c,d])vertex(p,shade);};
    for(let i=0;i<(closed?path.length:path.length-1);i++){
      const j=(i+1)%path.length,dx=path[j][0]-path[i][0],dy=path[j][1]-path[i][1];
      const light=.5+.5*(dx-dy)/Math.max(1e-8,Math.hypot(dx,dy)*Math.SQRT2);
      const shades=[.12,.32+light*.42,.65,.25+(1-light)*.22,.10,.07];
      for(let k=0;k<profile.length;k++)quad(sections[i][k],sections[j][k],sections[j][(k+1)%6],sections[i][(k+1)%6],shades[k]);
    }
    if(!closed)for(const index of [0,path.length-1])for(let k=1;k<5;k++)for(const p of [sections[index][0],sections[index][k],sections[index][k+1]])vertex(p,.2);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));
  geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false}));
  mesh.renderOrder=order;parent.add(mesh);
  return {mesh,updateProjection(){
    if(!dynamic)return;
    const attribute=geometry.attributes.position;
    for(let i=0;i<samples.length;i+=3)attribute.setXYZ(i/3,...project(samples[i],samples[i+1],samples[i+2]));
    attribute.needsUpdate=true;geometry.computeBoundingSphere();
  }};
}

export function reliefArc(radius,start=0,end=Math.PI*2,count=Math.ceil(Math.abs(end-start)*48)){
  return Array.from({length:count+1},(_,i)=>{const a=start+(end-start)*i/count;return [Math.cos(a)*radius,Math.sin(a)*radius];});
}
