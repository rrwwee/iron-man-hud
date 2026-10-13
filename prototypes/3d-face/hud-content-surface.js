// Disposable curved-content trial: one 64-triangle sheet and one small canvas texture.
// The hidden native document supplies text layout, semantics, links and scrolling.
import * as THREE from 'three';

export function createHUDContentSurface({scene,stage,camera,wake,getFrame,onClose}){
  const root=document.createElement('section');root.id='hudContent';root.dataset.ui='';root.className='hud-content-access';root.hidden=true;root.setAttribute('role','region');
  root.innerHTML='<div class="hud-native-content"></div><div class="hud-content-actions"></div>';
  stage.append(root);
  const body=root.firstElementChild,actions=root.lastElementChild;
  // Keep GPU storage fixed when changing media kinds; crop shorter content with UVs.
  const canvas=document.createElement('canvas');canvas.width=704;canvas.height=500;
  const c=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array(66*3),uv=[],indices=[];
  for(let row=0;row<2;row++)for(let i=0;i<=32;i++){uv.push(i/32,1-row);if(row===0&&i<32){const a=i,b=i+1,d=i+34;indices.push(a,i+33,b,b,i+33,d);}}
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthWrite:false,depthTest:false,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=105;mesh.frustumCulled=false;mesh.visible=false;mesh.matrixAutoUpdate=false;scene.add(mesh);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),point=new THREE.Vector3();
  let item=null,media=null,context=null,analyser=null,signal=null,article=null,links=[],hot=null,down=null;
  let animation=null,amount=0,closing=false,dirty=true,h=360,contentWidth=.095,serial=0,paints=0;
  const origin=new THREE.Vector3(),destination=new THREE.Vector3();

  // Start warming the single bounded demo clip before its menu item is opened.
  // Retain its source, buffered data and decoder when a Panel closes.
  const video=document.createElement('video');video.id='hudVideo';video.hidden=true;video.preload='auto';video.playsInline=true;video.crossOrigin='anonymous';
  video.src='https://developer.mozilla.org/shared-assets/videos/flower.mp4';root.append(video);video.load();
  const changed=()=>{dirty=true;wake();};
  for(const event of ['loadeddata','canplaythrough','progress','seeked','play','pause','ended','volumechange'])video.addEventListener(event,()=>{
    root.dataset.videoReady=String(video.readyState);root.dataset.videoBuffered=video.buffered.length?video.buffered.end(video.buffered.length-1).toFixed(3):'0';
    changed();
  });
  function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.append(b);return b;}
  const closeButton=button('Close content',close);
  const playButton=button('Play video',()=>toggleMedia());
  const muteButton=button('Mute video',()=>{video.muted=!video.muted;changed();});
  actions.addEventListener('focusin',changed);actions.addEventListener('focusout',changed);
  const seek=document.createElement('input');seek.type='range';seek.min=0;seek.max=1000;seek.value=0;seek.setAttribute('aria-label','Video position');actions.append(seek);
  seek.oninput=()=>{if(Number.isFinite(video.duration))video.currentTime=Number(seek.value)/1000*video.duration;changed();};
  function release(){
    media?.pause();
    if(media&&media!==video){media.removeAttribute('src');media.load();media.remove();}
    if(context){context.close().catch(()=>{});context=null;}
    media=context=analyser=signal=article=null;links=[];body.replaceChildren();
  }
  function animateTo(to){animation={at:performance.now(),from:amount,to};wake();}
  function close(){if(!item||closing)return;closing=true;media?.pause();animateTo(0);onClose();}
  function toggleMedia(){if(!media)return;context?.resume().catch(()=>{});if(media.paused){if(media.ended)media.currentTime=0;media.play().catch(changed);}else media.pause();changed();}
  root.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
  });
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&item&&!closing){e.preventDefault();close();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)media?.pause();else changed();});

  function audio(){
    const a=document.createElement('audio');a.src='./assets/menu-audio-sample.wav';a.preload='auto';a.hidden=true;body.append(a);media=a;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(AudioContext){context=new AudioContext();analyser=context.createAnalyser();analyser.fftSize=512;signal=new Uint8Array(analyser.fftSize);context.createMediaElementSource(a).connect(analyser);analyser.connect(context.destination);context.resume().catch(()=>{});}
    a.onplay=a.onpause=a.onended=changed;a.play().catch(changed);
  }
  function open(next,anchor){
    release();item=next;closing=false;root.hidden=false;root.setAttribute('aria-label',next.title||next.label);
    root.dataset.kind=next.kind.toLowerCase();root.dataset.item=next.id;root.dataset.open='true';root.dataset.curved='true';root.dataset.expansion='0.000';
    origin.copy(anchor||new THREE.Vector3(.07,.027,.095));amount=0;
    const isVideo=next.kind==='Video',isAudio=next.kind==='Audio';
    h=isAudio ? 168 : isVideo ? 360 : 460;
    for(let row=0;row<2;row++)for(let i=0;i<=32;i++)geometry.attributes.uv.setY(row*33+i,1-row*h/canvas.height);
    geometry.attributes.uv.needsUpdate=true;contentWidth=isVideo||isAudio ? .105 : .098;
    destination.set(.062,isAudio ? -.002 : isVideo ? .014 : .017,.115);
    material.blending=isVideo||isAudio?THREE.CustomBlending:THREE.NormalBlending;
    material.premultipliedAlpha=isVideo||isAudio;material.blendSrc=THREE.OneFactor;material.blendDst=THREE.OneMinusSrcColorFactor;
    material.blendSrcAlpha=THREE.OneFactor;material.blendDstAlpha=THREE.OneMinusSrcAlphaFactor;material.needsUpdate=true;
    playButton.hidden=!(isVideo||isAudio);muteButton.hidden=!isVideo;seek.hidden=!isVideo;
    if(isVideo){media=video;video.currentTime=0;video.play().catch(changed);}
    else if(isAudio)audio();
    else{
      article=document.createElement('article');article.className='hud-document';article.style.height=`${h}px`;article.tabIndex=0;
      // Authored local HTML fixture only; this is not an arbitrary HTML renderer.
      if(next.html)article.innerHTML=next.html;
      else{const heading=document.createElement('h1');heading.textContent=next.title;article.append(heading);next.paragraphs.forEach(text=>{const p=document.createElement('p');p.textContent=text;article.append(p);});}
      body.append(article);article.addEventListener('scroll',changed,{passive:true});article.addEventListener('focusin',changed);
    }
    root.dataset.surfaceTriangles='64';root.dataset.textureBytes=String(canvas.width*canvas.height*4);root.dataset.openSerial=String(++serial);
    dirty=true;animateTo(1);closeButton.focus({preventScroll:true});
  }
  function glyph(value,x,y,size=20){c.fillStyle='#c9f4fc';c.font=`${size}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(value,x,y);c.textAlign='left';c.textBaseline='alphabetic';}
  function line(x1,y1,x2,y2,color='#a4dfeaaa',width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function fade(){
    c.save();c.globalCompositeOperation='destination-in';let g=c.createLinearGradient(0,0,640,0);g.addColorStop(0,'transparent');g.addColorStop(.045,'black');g.addColorStop(.955,'black');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,640,h);
    g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'transparent');g.addColorStop(.045,'black');g.addColorStop(.955,'black');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,640,h);c.restore();
  }
  function drawDocument(){
    const base=article.getBoundingClientRect();links=[];
    // The browser performs HTML wrapping and scrolling; rasterize only its laid-out words.
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode,style=getComputedStyle(node.parentElement),range=document.createRange();
      c.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;c.fillStyle=style.color;c.textAlign='left';c.textBaseline='alphabetic';
      for(const word of node.textContent.matchAll(/\S+/g)){
        range.setStart(node,word.index);range.setEnd(node,word.index+word[0].length);
        for(const rect of range.getClientRects()){
          const x=rect.x-base.x,y=rect.y-base.y;
          if(y+rect.height<0||y>h)continue;
          c.fillText(word[0],x,y+parseFloat(style.fontSize)*.89);
          if(node.parentElement.closest('a'))line(x,y+rect.height,x+rect.width,y+rect.height,style.color);
        }
      }
    }
    for(const a of article.querySelectorAll('a'))for(const rect of a.getClientRects()){
      const link={x:rect.x-base.x,y:rect.y-base.y,w:rect.width,h:rect.height,node:a};links.push(link);
      if(document.activeElement===a){c.strokeStyle='#defaff';c.strokeRect(link.x-2,link.y-2,link.w+4,link.h+4);}
    }
    for(const quote of article.querySelectorAll('blockquote')){const r=quote.getBoundingClientRect();line(r.x-base.x,r.y-base.y,r.x-base.x,r.bottom-base.y,'#d6b98e',2);}
    for(const li of article.querySelectorAll('li')){const r=li.getBoundingClientRect();glyph('•',r.x-base.x-14,r.y-base.y+15,18);}
    const max=article.scrollHeight-article.clientHeight;
    if(max>0){const thumb=Math.max(32,h*article.clientHeight/article.scrollHeight),top=article.scrollTop/max*(h-thumb);line(635,6,635,h-6,'#54879366');line(635,top+3,635,top+thumb-3,'#b3edf4',3);}
    root.dataset.scrollTop=article.scrollTop.toFixed(1);root.dataset.scrollMax=String(max);
  }
  function paint(){
    c.clearRect(0,0,canvas.width,canvas.height);
    if(item.kind==='Video'){
      if(video.readyState>=2){c.globalAlpha=.34;c.drawImage(video,0,0,640,360);c.globalAlpha=1;}
      fade();
      glyph(video.paused?'▶':'Ⅱ',28,h-23,18);glyph(video.muted?'♪':'♫',610,h-23,19);
      const progress=Number.isFinite(video.duration)?video.currentTime/video.duration:0;
      line(53,h-23,578,h-23,'#639aa77a',2);line(53,h-23,53+525*progress,h-23,'#bceef2',3);seek.value=String(Math.round(progress*1000));
    }else if(item.kind==='Audio'){
      const mid=h/2;line(24,mid,620,mid,'#54879388');
      if(analyser){analyser.getByteTimeDomainData(signal);c.strokeStyle='#b5f5ff';c.lineWidth=2;c.beginPath();signal.forEach((value,i)=>{const x=24+i/(signal.length-1)*596,y=mid+(value-128)/128*h*1.8;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();}
      if(media.paused)glyph('▶',320,mid,24);
      const progress=Number.isFinite(media.duration)?media.currentTime/media.duration:0;line(24,h-20,24+596*progress,h-20,'#e1b479',2);fade();
    }else{drawDocument();fade();}
    line(6,22,6,5);line(6,5,65,5);line(573,h-5,634,h-5);line(634,h-5,634,h-22);
    if(document.activeElement===playButton){c.strokeStyle='#defaff';c.strokeRect(13,h-39,30,32);}
    if(document.activeElement===muteButton){c.strokeStyle='#defaff';c.strokeRect(594,h-39,30,32);}
    if(document.activeElement===seek)line(53,h-18,578,h-18,'#defaff',1);
    c.strokeStyle=hot==='close'||document.activeElement===closeButton?'#defaff':'#8cc8d499';c.lineWidth=1;c.beginPath();c.arc(675,23,15,0,Math.PI*2);c.stroke();glyph('×',675,23,23);
    playButton.textContent=`${media?.paused?'Play':'Pause'} ${item.kind.toLowerCase()}`;muteButton.textContent=video.muted?'Unmute video':'Mute video';
    root.dataset.mediaPlaying=String(!!media&&!media.paused);root.dataset.mediaTime=media?media.currentTime.toFixed(3):'0';
    texture.needsUpdate=true;dirty=false;root.dataset.texturePaints=String(++paints);
  }
  function hitAt(x,y){
    if(!item||closing||!mesh.visible)return null;
    const r=stage.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2);ray.setFromCamera(pointer,camera);
    // UVs address the fixed 500px texture, including when the visible content is shorter.
    const hit=ray.intersectObject(mesh)[0];return hit?{x:hit.uv.x*canvas.width,y:(1-hit.uv.y)*canvas.height}:null;
  }
  function target(p){
    if(!p)return null;if(p.x>625&&p.y<70)return 'close';if(p.x>=640)return null;
    if(item.kind==='Video'){if(p.y>h-47&&p.x>590)return 'mute';if(p.y>h-47&&p.x>50&&p.x<580)return 'seek';return 'play';}
    if(item.kind==='Audio')return 'play';return links.find(link=>p.x>=link.x&&p.x<=link.x+link.w&&p.y>=link.y&&p.y<=link.y+link.h)?.node||'document';
  }
  stage.addEventListener('pointermove',e=>{const next=target(hitAt(e.clientX,e.clientY));if(next!==hot){hot=next;dirty=true;wake();}if(next)e.hudContentCursor=next==='document'?'text':'pointer';},{capture:true});
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=hitAt(e.clientX,e.clientY),t=target(p);if(t){down={target:t,at:performance.now(),x:e.clientX,y:e.clientY};e.stopImmediatePropagation();}},{capture:true});
  stage.addEventListener('click',e=>{
    const p=hitAt(e.clientX,e.clientY),current=target(p),t=down&&performance.now()-down.at<1200&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<12?down.target:current;down=null;
    if(!t)return;e.preventDefault();e.stopImmediatePropagation();
    if(t==='close')close();else if(t==='play')toggleMedia();else if(t==='mute'){video.muted=!video.muted;changed();}
    else if(t==='seek'&&p){video.currentTime=Math.max(0,Math.min(1,(p.x-53)/525))*video.duration;changed();}
    else if(t==='document')article.focus({preventScroll:true});else t.click();
  },{capture:true});
  stage.addEventListener('wheel',e=>{if(article&&hitAt(e.clientX,e.clientY)){e.preventDefault();e.stopImmediatePropagation();article.scrollTop+=e.deltaY;changed();}},{capture:true,passive:false});
  function surfacePoint(u,v){
    const expansion=.08+.92*amount,width=contentWidth*expansion;
    const x=destination.x+(u*canvas.width/640-.5)*width,y=destination.y+(0.5-v)*width*h/640;
    const z=.14+Math.sqrt(.225*.225-x*x)-.225-.025;
    return point.set(x,y,z).lerp(origin,1-amount);
  }
  function tick(){
    if(!item)return;
    if(animation){const t=Math.min(1,(performance.now()-animation.at)/280);amount=animation.from+(animation.to-animation.from)*(1-Math.pow(1-t,3));if(t===1)animation=null;}
    if(closing&&amount<=0){release();root.hidden=true;mesh.visible=false;root.dataset.open='false';root.dataset.mediaPlaying='false';item=null;return;}
    for(let row=0;row<2;row++)for(let i=0;i<=32;i++)surfacePoint(i/32,row).toArray(positions,(row*33+i)*3);
    geometry.attributes.position.needsUpdate=true;geometry.computeBoundingSphere();mesh.matrix.copy(getFrame());mesh.updateMatrixWorld(true);mesh.visible=true;material.opacity=Math.min(1,amount*2);
    if(dirty||(media&&!media.paused))paint();
    root.dataset.expansion=amount.toFixed(3);
    const r=stage.getBoundingClientRect(),project=(u,v)=>{surfacePoint(u,v).applyMatrix4(getFrame()).project(camera);return {x:Math.round(r.left+(point.x+1)*r.width/2),y:Math.round(r.top+(1-point.y)*r.height/2)};};
    root.dataset.linkTargets=JSON.stringify(links.filter(link=>link.y>=0&&link.y+link.h<=h).map(link=>({...project((link.x+link.w/2)/704,(link.y+link.h/2)/h),href:link.node.href})));
    root.dataset.targets=JSON.stringify({close:project(675/704,23/h),play:project(28/704,(h-23)/h),center:project(320/704,.5),scroll:project(400/704,.5),seek:project(315/704,(h-23)/h),mute:project(610/704,(h-23)/h)});
  }
  return {open,close,tick,get isOpen(){return !!item&&!closing;},get needsFrame(){return !!animation||!!(media&&!media.paused);}};
}
