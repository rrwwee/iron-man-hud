// Disposable depth trial. Two curved surfaces, shared face renderer, no extra frame loop.
import * as THREE from 'three';

export function createVisorMenu({scene,camera,stage,wake,onChoose,onBrowse,onHover}){
  const group=new THREE.Group();group.position.set(0,1.619,.025);scene.add(group);
  // Apply the face vignette before drawing the HUD, so edge graphics stay luminous.
  const vignette=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 vUv;void main(){
      vec2 p=vec2(vUv.x,1.-vUv.y);float d=length((p-vec2(.5,.46))/vec2(.4,.79));
      float radial=mix(0.,.22,smoothstep(.34,.6,d));radial=mix(radial,.93,smoothstep(.6,1.,d));
      float bottom=1.-smoothstep(.0,.24,vUv.y);float top=smoothstep(.85,1.,vUv.y)*.69;
      float a=1.-(1.-radial)*(1.-bottom)*(1.-top);gl_FragColor=vec4(0.,0.,0.,a);
    }`,
  }));vignette.frustumCulled=false;vignette.renderOrder=90;scene.add(vignette);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),projected=new THREE.Vector3();
  let state=null,hover=null,focused=null,enabled=true,visible=true,blocked=false,mouse=null,down=null,paints=0;
  const sheets=[];
  function sheet(width,height,bounds,name){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
    const positions=[],uv=[],indices=[],segments=32;
    for(let row=0;row<2;row++)for(let i=0;i<=segments;i++){
      const u=i/segments,x=THREE.MathUtils.lerp(bounds[0],bounds[1],u),y=row?bounds[2]:bounds[3];
      // The panel wraps around the vertical axis, its edges receding toward the temples.
      positions.push(x,y-1.619,.14+Math.sqrt(.225*.225-x*x)-.225-.025);
      uv.push(u,1-row);
    }
    for(let i=0;i<segments;i++){const a=i,b=i+1,c=i+segments+1,d=c+1;indices.push(a,c,b,b,c,d);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthWrite:false,depthTest:false,toneMapped:false});
    const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.renderOrder=100;group.add(mesh);
    const result={canvas,ctx:canvas.getContext('2d'),texture,mesh,bounds,name};sheets.push(result);return result;
  }
  const left=sheet(512,640,[-.153,-.034,1.548,1.684],'radial');
  const right=sheet(512,512,[.052,.139,1.608,1.686],'preview');
  const cx=62,cy=320,step=.48;
  const colors={cyan:'#a3e7f0',dim:'#4c7a87',white:'#e0faff',amber:'#f2c18f'};
  function stroke(ctx,color,width,draw,glow=0){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.beginPath();draw(ctx);ctx.stroke();ctx.restore();}
  function arc(ctx,x,y,r,a,b,color,width=1,glow=0){stroke(ctx,color,width,c=>c.arc(x,y,r,a,b),glow);}
  function text(ctx,value,x,y,size,color,align='left'){ctx.save();ctx.textAlign=align;ctx.fillStyle=color;ctx.font=`${size}px Arial, sans-serif`;ctx.fillText(value,x,y);ctx.restore();}
  function radialPaint(){
    const c=left.ctx;c.clearRect(0,0,512,640);
    // Concentric marks belong to the scroll/index control, rather than fake telemetry.
    [158,207,267,280,295].forEach((r,i)=>arc(c,cx,cy,r,-1.39,1.39,i===3?colors.cyan:colors.dim,i===3?1.2:.65,i===3?5:0));
    arc(c,cx,cy,304,-1.35,-.3,colors.cyan,2,5);arc(c,cx,cy,304,.15,1.34,colors.dim,1);
    for(let i=0;i<85;i++){
      const a=-1.37+i*2.74/84,r=i%4===0?282:288;
      stroke(c,i%4===0?colors.cyan:colors.dim,.8,p=>{p.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);p.lineTo(cx+Math.cos(a)*295,cy+Math.sin(a)*295);});
    }
    for(let slot=0;slot<5;slot++){
      const a=(slot-2)*step,index=(state.selected+slot-2+state.entries.length)%state.entries.length,item=state.entries[index];
      const hot=hover===slot||focused===slot,chosen=slot===2,tint=hot?colors.white:chosen?colors.amber:colors.cyan;
      c.save();c.beginPath();c.arc(cx,cy,263,a-.215,a+.215);c.arc(cx,cy,207,a+.215,a-.215,true);c.closePath();
      c.fillStyle=hot?'#5bb9cf45':chosen?'#d4a16e24':'#0c2f393a';c.fill();c.strokeStyle=hot?'#ccf9ff':chosen?'#d6ad7990':'#68878e55';c.lineWidth=hot?1.5:.7;c.stroke();c.restore();
      arc(c,cx,cy,269,a-.215,a+.215,tint,hot?3:chosen?2:1,hot?10:chosen?6:0);
      const lx=cx+Math.cos(a)*236,ly=cy+Math.sin(a)*236;
      c.save();c.translate(lx,ly);c.rotate(a*.22);
      text(c,item.label,0,-2,slot===2?19:16,tint,'center');text(c,item.kind==='External'?'VISIT SITE ↗':item.kind.toUpperCase(),0,15,8,hot?colors.white:colors.dim,'center');c.restore();
      if(hot)stroke(c,colors.white,1,p=>{p.moveTo(lx+68,ly);p.lineTo(lx+84,ly);p.lineTo(lx+90,ly-6);},4);
    }
    text(c,'BROWSE',cx-10,cy-26,8,colors.dim);text(c,String(state.selected+1).padStart(2,'0'),cx-13,cy+8,33,colors.white);
    text(c,`/ ${String(state.entries.length).padStart(2,'0')}`,cx-9,cy+26,9,colors.dim);
    text(c,'SCROLL TO SELECT',85,22,8,colors.cyan);text(c,'CLICK TO OPEN',85,37,7,colors.dim);
    left.texture.needsUpdate=true;
  }
  function previewPaint(){
    const c=right.ctx;c.clearRect(0,0,512,512);const item=state.entries[state.selected],hot=hover==='preview'||focused==='preview';
    const tint=hot?colors.white:colors.cyan;
    [211,222,235].forEach((r,i)=>arc(c,256,256,r,0,Math.PI*2,i===1?tint:colors.dim,i===1?1.25:.7,i===1?6:0));
    for(let i=0;i<96;i++){const a=i*Math.PI/48;stroke(c,colors.dim,i%4===0?1:.7,p=>{p.moveTo(256+Math.cos(a)*(i%4===0?222:228),256+Math.sin(a)*(i%4===0?222:228));p.lineTo(256+Math.cos(a)*235,256+Math.sin(a)*235);});}
    arc(c,256,256,241,-Math.PI/2,-Math.PI/2+(state.selected+1)/state.entries.length*Math.PI*2,colors.amber,2,5);
    arc(c,256,256,178,-1.15,1.15,tint,.8);arc(c,256,256,178,2.0,4.3,colors.dim,.8);
    text(c,item.kind==='External'?'EXTERNAL LINK':`${item.kind.toUpperCase()} PANEL`,256,204,10,colors.cyan,'center');
    text(c,item.label,256,254,30,hot?colors.white:colors.cyan,'center');
    const detail=item.paragraphs?`${item.paragraphs.join(' ').split(/\s+/).length} words · sample`:item.kind==='Video'?'Sample clip · 5 sec':item.kind==='Audio'?'Sample audio · 1 sec':'github.com';
    text(c,detail,256,284,10,colors.dim,'center');
    stroke(c,hot?colors.white:colors.dim,.8,p=>{p.moveTo(171,311);p.lineTo(341,311);},hot?7:0);
    text(c,item.kind==='External'?'VISIT SITE ↗':'OPEN TRANSMISSION',256,339,10,hot?colors.white:colors.amber,'center');right.texture.needsUpdate=true;
  }
  function paint(){if(!state)return;radialPaint();previewPaint();paints++;stage.dataset.hudTexturePaints=String(paints);wake();}
  function setHover(next){if(next===hover)return;hover=next;stage.dataset.hudHover=hover===null?'none':String(hover);stage.style.cursor=hover===null?'':'pointer';onHover(hover!==null);paint();}
  function hitAt(x,y){
    if(!enabled||!visible||blocked)return null;
    const r=stage.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2);
    camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);group.updateMatrixWorld(true);
    for(const hit of ray.intersectObjects(sheets.map(s=>s.mesh))){
      if(hit.object===right.mesh){if(Math.hypot(hit.uv.x-.5,hit.uv.y-.5)<.48)return 'preview';continue;}
      const x=hit.uv.x*512-cx,y=(1-hit.uv.y)*640-cy,radius=Math.hypot(x,y),a=Math.atan2(y,x),slot=Math.round(a/step)+2;
      if(radius>=174&&radius<=307&&slot>=0&&slot<5&&Math.abs(a-(slot-2)*step)<.235)return slot;
    }
    return null;
  }
  stage.addEventListener('pointermove',e=>{
    if(e.target.closest('[data-ui]')){mouse=null;setHover(null);return;}
    mouse=[e.clientX,e.clientY];setHover(hitAt(...mouse));
  });
  stage.addEventListener('pointerleave',()=>{mouse=null;setHover(null);});
  stage.addEventListener('pointerdown',e=>{if(e.button===0)down={x:e.clientX,y:e.clientY,target:hitAt(e.clientX,e.clientY)};});
  stage.addEventListener('click',e=>{
    if(e.target.closest('[data-ui]'))return;
    const target=hitAt(e.clientX,e.clientY);
    if(down&&target!==null&&target===down.target&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){e.preventDefault();onChoose(target);}
    down=null;
  });
  stage.addEventListener('wheel',e=>{
    if(e.target.closest('[data-ui]')||hitAt(e.clientX,e.clientY)===null)return;
    e.preventDefault();onBrowse(e.deltaY);
  },{passive:false});
  function project(x,y,s){
    const xx=THREE.MathUtils.lerp(s.bounds[0],s.bounds[1],x/s.canvas.width),yy=THREE.MathUtils.lerp(s.bounds[3],s.bounds[2],y/s.canvas.height);
    projected.set(xx,yy-1.619,.14+Math.sqrt(.225*.225-xx*xx)-.225-.025).applyMatrix4(group.matrixWorld).project(camera);
    const rect=stage.getBoundingClientRect();return {x:Math.round(rect.left+(projected.x+1)*stage.clientWidth/2),y:Math.round(rect.top+(1-projected.y)*stage.clientHeight/2)};
  }
  return {
    update(value){state=value;paint();},
    focus(value){focused=value;paint();},
    setEnabled(value){if(value===enabled)return;enabled=value;group.visible=value&&visible;vignette.visible=value;if(!value)setHover(null);wake();},
    setVisible(value){visible=value;group.visible=enabled&&value;if(!value)setHover(null);wake();},
    setPose(x,y,strength,isBlocked){
      blocked=isBlocked;const gain=strength===0?0:strength>1?1:.65;
      camera.updateMatrixWorld();group.rotation.set(y*.12*gain,x*.61*gain,0,'YXZ');group.updateMatrixWorld(true);
      if(blocked)setHover(null);
      // Readable debug state for inspecting the actual projected targets and workload.
      stage.dataset.hudYaw=(x*35*gain).toFixed(1);stage.dataset.hudDrawCalls=String(group.visible?3:0);stage.dataset.hudTriangles='130';stage.dataset.hudTextureBytes=String((512*640+512*512)*4);
      stage.dataset.hudTargets=JSON.stringify(Array.from({length:5},(_,slot)=>{const a=(slot-2)*step;return {...project(cx+Math.cos(a)*236,cy+Math.sin(a)*236,left),slot,label:state?.entries[(state.selected+slot-2+state.entries.length)%state.entries.length].label};}).concat({...project(256,256,right),slot:'preview',label:state?.entries[state.selected].label}));
    },
    get hovering(){return hover!==null;},
  };
}
