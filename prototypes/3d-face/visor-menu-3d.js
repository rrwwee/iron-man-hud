// Disposable depth trial. Content instruments share the Face renderer and frame loop.
import * as THREE from 'three';
import {createGlobeInstrument} from './globe-instrument.js?v=purpose-3';

export function createVisorMenu({scene,camera,stage,wake,onChoose,onBrowse}){
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
  let radialOffset=0,radialStart=0,radialFrom=0,radialMoving=false;
  let utilities={sound:true,wide:false,light:false};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const left=sheet(512,640,[-.137,-.025,1.548,1.684],'radial');
  const right=sheet(512,512,[.042,.129,1.608,1.686],'location');
  const channels=sheet(512,320,[.052,.137,1.548,1.6],'channels');
  const cx=62,cy=320,step=.48;
  const globe=createGlobeInstrument({invalidate:()=>{previewPaint();wake();}});
  const colors={cyan:'#a3e7f0',dim:'#548793',white:'#e0faff',amber:'#f2c18f'};
  const glyphs={Text:'T',Video:'▶',Audio:'♫',External:'↗'};
  const itemDetail=item=>item.paragraphs?`${(item.html?item.html.replace(/<[^>]*>/g,' '):item.paragraphs.join(' ')).trim().split(/\s+/).length} words`:item.kind==='Video'?'5 sec':item.kind==='Audio'?'1.1 sec':'github.com';
  function stroke(ctx,color,width,draw,glow=0){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.beginPath();draw(ctx);ctx.stroke();ctx.restore();}
  function arc(ctx,x,y,r,a,b,color,width=1,glow=0){stroke(ctx,color,width,c=>c.arc(x,y,r,a,b),glow);}
  function text(ctx,value,x,y,size,color,align='left'){ctx.save();ctx.textAlign=align;ctx.fillStyle=color;ctx.font=`${size}px Arial, sans-serif`;ctx.fillText(value,x,y);ctx.restore();}
  function radialPaint(){
    const c=left.ctx;c.clearRect(0,0,512,640);
    // Concentric marks belong to the scroll/index control, rather than fake telemetry.
    [158,207,267,280,295].forEach((r,i)=>arc(c,cx,cy,r,-1.39,1.39,i===3?colors.cyan:colors.dim,i===3?1.2:.65,i===3?5:0));
    arc(c,cx,cy,304,-1.35,-.3,colors.cyan,2,5);arc(c,cx,cy,304,.15,1.34,colors.dim,1);
    for(let i=0;i<state.entries.length;i++){
      const a=-1.3+i*2.6/state.entries.length,b=a+2.6/state.entries.length-.05,key=`jump:${i}`,hot=hover===key||focused===key;
      arc(c,cx,cy,178,a,b,i===state.selected?colors.amber:hot?colors.white:colors.dim,hot?5:3,hot?8:0);
      const m=(a+b)/2;text(c,String(i+1).padStart(2,'0'),cx+Math.cos(m)*189,cy+Math.sin(m)*189+3,8,i===state.selected?colors.amber:colors.dim,'center');
    }
    for(let i=0;i<85;i++){
      const a=-1.37+i*2.74/84,r=i%4===0?282:288;
      stroke(c,i%4===0?colors.cyan:colors.dim,.8,p=>{p.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);p.lineTo(cx+Math.cos(a)*295,cy+Math.sin(a)*295);});
    }
    for(let slot=0;slot<5;slot++){
      const a=(slot-2)*step+radialOffset,index=(state.selected+slot-2+state.entries.length)%state.entries.length,item=state.entries[index];
      const hot=hover===slot||focused===slot,chosen=slot===2,tint=hot?colors.white:chosen?colors.amber:colors.cyan;
      c.save();c.beginPath();c.arc(cx,cy,263,a-.215,a+.215);c.arc(cx,cy,207,a+.215,a-.215,true);c.closePath();
      c.fillStyle=hot?'#5bb9cf45':chosen?'#d4a16e24':'#0c2f393a';c.fill();c.strokeStyle=hot?'#ccf9ff':chosen?'#d6ad7990':'#68878e55';c.lineWidth=hot?1.5:.7;c.stroke();c.restore();
      arc(c,cx,cy,269,a-.215,a+.215,tint,hot?3:chosen?2:1,hot?10:chosen?6:0);
      const lx=cx+Math.cos(a)*236,ly=cy+Math.sin(a)*236;
      c.save();c.translate(lx,ly);c.rotate(a*.22);
      text(c,item.label,0,-2,slot===2?19:16,tint,'center');text(c,item.kind==='External'?'VISIT SITE ↗':item.kind.toUpperCase(),0,15,8,hot?colors.white:colors.dim,'center');c.restore();
      const mx=cx+Math.cos(a)*323,my=cy+Math.sin(a)*323;
      stroke(c,chosen?colors.amber:colors.dim,.8,p=>{p.moveTo(cx+Math.cos(a)*273,cy+Math.sin(a)*273);p.lineTo(mx-10,my);p.lineTo(mx+41,my);},chosen?5:0);
      text(c,glyphs[item.kind],mx,my-9,13,tint);text(c,itemDetail(item),mx,my+13,9,colors.cyan);
      if(hot)stroke(c,colors.white,1,p=>{p.moveTo(lx+68,ly);p.lineTo(lx+84,ly);p.lineTo(lx+90,ly-6);},4);
    }
    text(c,'BROWSE',cx-10,cy-26,8,colors.dim);text(c,String(state.selected+1).padStart(2,'0'),cx-13,cy+8,33,colors.white);
    text(c,`/ ${String(state.entries.length).padStart(2,'0')}`,cx-9,cy+26,9,colors.dim);
    if(radialMoving)arc(c,cx,cy,308,-.8+radialOffset,.8+radialOffset,colors.amber,2,5);
    text(c,'SCROLL TO SELECT',85,22,8,colors.cyan);text(c,'CLICK TO OPEN',85,37,7,colors.dim);
    left.texture.needsUpdate=true;
  }
  function previewPaint(){globe.draw(right.ctx);right.texture.needsUpdate=true;}
  function channelPaint(){
    const c=channels.ctx;c.clearRect(0,0,512,320);
    text(c,'Display controls',20,30,18,colors.cyan);
    const rows=[['♫','Sound',utilities.sound?'On':'Muted'],['↔','Motion',utilities.wide?'Wide':'Gentle'],['◐','Lighting',utilities.light?'Inspection':'Cinematic']];
    rows.forEach(([glyph,label,value],i)=>{const y=84+i*83,key=['sound','motion','light'][i],hot=hover===key||focused===key;
      stroke(c,hot?colors.white:colors.dim,hot?1.5:.7,p=>{p.moveTo(20,y+29);p.lineTo(481,y+29);});
      arc(c,39,y-5,24,-Math.PI*.8,Math.PI*.8,hot?colors.white:colors.dim,.8);
      arc(c,39,y-5,28,-Math.PI*.8,-Math.PI*.8+([utilities.sound,utilities.wide,utilities.light][i]?1.6:.7)*Math.PI,colors.cyan,1.8);
      text(c,glyph,39,y+1,17,hot?colors.white:colors.cyan,'center');text(c,label,89,y,20,colors.cyan);text(c,value,474,y,17,hot?colors.white:colors.amber,'right');
    });channels.texture.needsUpdate=true;
  }
  function tick(){
    if(radialMoving){const t=Math.min(1,(performance.now()-radialStart)/300);radialOffset=radialFrom*Math.pow(1-t,3);radialMoving=t<1;radialPaint();}
    if(globe.tick()){previewPaint();}
    stage.dataset.globe=JSON.stringify(globe.state);stage.dataset.menuAnimating=String(radialMoving);
  }
  function paint(){if(!state)return;radialPaint();previewPaint();channelPaint();paints++;stage.dataset.hudTexturePaints=String(paints);wake();}
  function setHover(next){if(next===hover)return;hover=next;stage.dataset.hudHover=hover===null?'none':String(hover);stage.style.cursor=hover===null?'':'pointer';paint();}
  function hitAt(x,y){
    if(!enabled||!visible||blocked)return null;
    const r=stage.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2);
    camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);group.updateMatrixWorld(true);
    for(const hit of ray.intersectObjects(sheets.map(s=>s.mesh).filter(mesh=>mesh.visible))){
      if(hit.object===channels.mesh){
        const y=(1-hit.uv.y)*320;return y>=48&&y<300?['sound','motion','light'][Math.min(2,Math.floor((y-48)/83))]:null;
      }
      if(hit.object===right.mesh){
        const x=hit.uv.x*512,y=(1-hit.uv.y)*512;
        if(y>473)return 'map';
        if(Math.hypot(x-256,y-226)<205)return 'globe';
        return y>410?'globe-home':null;
      }
      const x=hit.uv.x*512-cx,y=(1-hit.uv.y)*640-cy,radius=Math.hypot(x,y),a=Math.atan2(y,x),slot=Math.round((a-radialOffset)/step)+2;
      if(radius>=164&&radius<201&&a>=-1.3&&a<1.3)return `jump:${Math.floor((a+1.3)/2.6*state.entries.length)}`;
      if(radius>=203&&radius<=363&&slot>=0&&slot<5&&Math.abs(a-(slot-2)*step-radialOffset)<.235)return slot;
    }
    return null;
  }
  stage.addEventListener('pointermove',e=>{
    if(down?.target==='globe'&&e.buttons){const dx=e.clientX-down.lx,dy=e.clientY-down.ly;down.dragged=down.dragged||Math.hypot(e.clientX-down.x,e.clientY-down.y)>4;down.lx=e.clientX;down.ly=e.clientY;globe.drag(dx,dy);}
    if(e.hudContentCursor){mouse=null;setHover(null);stage.style.cursor=e.hudContentCursor;return;}
    if(e.target.closest('[data-ui]')){mouse=null;setHover(null);return;}
    mouse=[e.clientX,e.clientY];setHover(hitAt(...mouse));
  });
  stage.addEventListener('pointerleave',()=>{mouse=null;setHover(null);});
  stage.addEventListener('pointerdown',e=>{if(e.button===0)down={x:e.clientX,y:e.clientY,target:hitAt(e.clientX,e.clientY),selected:state?.selected,lx:e.clientX,ly:e.clientY,dragged:false,at:performance.now()};});
  stage.addEventListener('click',e=>{
    if(e.target.closest('[data-ui]'))return;
    if(down?.dragged){down=null;return;}
    if(down&&down.target!==null&&state?.selected===down.selected&&performance.now()-down.at<1200&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<12){e.preventDefault();if(down.target==='globe'||down.target==='globe-home')globe.home();else onChoose(down.target);}
    down=null;
  });
  stage.addEventListener('wheel',e=>{
    if(e.target.closest('[data-ui]')||hitAt(e.clientX,e.clientY)===null)return;
    e.preventDefault();if(hitAt(e.clientX,e.clientY)==='globe')globe.zoom(e.deltaY);else onBrowse(e.deltaY);
  },{passive:false});
  function project(x,y,s){
    const xx=THREE.MathUtils.lerp(s.bounds[0],s.bounds[1],x/s.canvas.width),yy=THREE.MathUtils.lerp(s.bounds[3],s.bounds[2],y/s.canvas.height);
    projected.set(xx,yy-1.619,.14+Math.sqrt(.225*.225-xx*xx)-.225-.025).applyMatrix4(group.matrixWorld).project(camera);
    const rect=stage.getBoundingClientRect();return {x:Math.round(rect.left+(projected.x+1)*stage.clientWidth/2),y:Math.round(rect.top+(1-projected.y)*stage.clientHeight/2)};
  }
  return {
    update(value){if(state&&state.selected!==value.selected){let delta=(value.selected-state.selected+value.entries.length)%value.entries.length;if(delta>value.entries.length/2)delta-=value.entries.length;radialFrom=radialOffset+delta*step;radialOffset=reduced?0:radialFrom;radialMoving=!reduced;radialStart=performance.now();}state=value;paint();},
    setUtilities(value){if(JSON.stringify(value)!==JSON.stringify(utilities)){utilities=value;channelPaint();wake();}},
    action(value){if(value==='globe-home')globe.home();if(value==='globe-left')globe.turn(-.45);if(value==='globe-right')globe.turn(.45);if(value==='globe-zoom')globe.zoom(-150);},
    get needsFrame(){return radialMoving||globe.moving;},
    focus(value){focused=value;paint();},
    setEnabled(value){if(value===enabled)return;enabled=value;group.visible=value&&visible;vignette.visible=value;if(!value)setHover(null);wake();},
    setVisible(value){visible=value;group.visible=enabled&&value;if(!value)setHover(null);wake();},
    setPose(x,y,strength,isBlocked){
      tick();blocked=isBlocked;const gain=strength===0?0:strength>1?1:.45;
      camera.updateMatrixWorld();group.rotation.set(y*.12*gain,x*.61*gain,0,'YXZ');group.updateMatrixWorld(true);
      if(blocked)setHover(null);else if(mouse)setHover(hitAt(...mouse));
      // Readable debug state for inspecting the actual projected targets and workload.
      stage.dataset.hudYaw=(x*35*gain).toFixed(1);stage.dataset.hudFollowGain=String(gain);stage.dataset.hudDrawCalls=String(group.visible?sheets.filter(s=>s.mesh.visible).length+1:0);stage.dataset.hudTriangles=String(group.visible?sheets.filter(s=>s.mesh.visible).length*64+2:0);stage.dataset.hudTextureBytes=String((512*640+512*512+512*320)*4);
      stage.dataset.hudTargets=JSON.stringify(Array.from({length:5},(_,slot)=>{const a=(slot-2)*step+radialOffset;return {...project(cx+Math.cos(a)*236,cy+Math.sin(a)*236,left),slot,label:state?.entries[(state.selected+slot-2+state.entries.length)%state.entries.length].label};}));
      stage.dataset.hudChannelTargets=JSON.stringify(['sound','motion','light'].map((target,i)=>({...project(300,84+i*83,channels),target})));
      stage.dataset.hudGlobeTargets=JSON.stringify({center:project(256,226,right),home:project(256,437,right),map:project(256,493,right)});

    },
    get frame(){return group.matrixWorld;},
    setContentOpen(value){right.mesh.visible=!value;wake();},
    contentAnchor(which){
      const s=which==='preview'?right:left,px=which==='preview'?256:cx+236,py=which==='preview'?256:cy;
      const xx=THREE.MathUtils.lerp(s.bounds[0],s.bounds[1],px/s.canvas.width),yy=THREE.MathUtils.lerp(s.bounds[3],s.bounds[2],py/s.canvas.height);
      return new THREE.Vector3(xx,yy-1.619,.14+Math.sqrt(.225*.225-xx*xx)-.225-.025);
    },
    get hovering(){return hover!==null;},
  };
}
