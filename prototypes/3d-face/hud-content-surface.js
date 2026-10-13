// Disposable CSS3D content surface. Uses the HUD's world transform and camera;
// native HTML/video stay interactive without a second WebGL renderer or text rasterizer.
import * as THREE from 'three';

export function createHUDContentSurface({stage,camera,wake,getFrame,onClose}){
  const root=document.createElement('section');root.id='hudContent';root.className='hud-content-surface';root.dataset.ui='';root.hidden=true;root.setAttribute('role','region');
  root.innerHTML='<div class="hud-content-body"></div><button class="hud-content-close" aria-label="Close content" title="Close">×</button>';
  stage.append(root);
  const body=root.querySelector('.hud-content-body'),closeButton=root.querySelector('.hud-content-close');
  const matrix=new THREE.Matrix4(),local=new THREE.Matrix4(),translation=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),position=new THREE.Vector3();
  let item=null,media=null,context=null,analyser=null,signal=null,wave=null,animation=null,amount=0,closing=false;
  let w=800,h=450,origin=new THREE.Vector3(.07,.027,.095);
  const destination=new THREE.Vector3(.012,-.006,.135);

  function release(){
    if(media){media.pause();media.removeAttribute('src');media.load();media=null;}
    if(context){context.close().catch(()=>{});context=null;}
    analyser=signal=wave=null;
    body.replaceChildren();
  }
  function animateTo(to){animation={at:performance.now(),from:amount,to};wake();}
  function close(){
    if(!item||closing)return;closing=true;media?.pause();root.style.pointerEvents='none';animateTo(0);onClose();
  }
  closeButton.onclick=close;
  root.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
  });
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&item&&!closing){e.preventDefault();close();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)media?.pause();else wake();
  });

  function drawWave(){
    if(!wave||!media)return;
    const c=wave.getContext('2d'),width=wave.width,height=wave.height,t=Number.isFinite(media.duration)?media.currentTime/media.duration:0;
    c.clearRect(0,0,width,height);
    const mid=height/2,pad=24;
    c.strokeStyle='#5a929b';c.lineWidth=1;c.beginPath();c.moveTo(pad,mid);c.lineTo(width-pad,mid);c.stroke();
    if(analyser){
      analyser.getByteTimeDomainData(signal);
      c.save();c.strokeStyle='#b5f5ff';c.lineWidth=2;c.shadowColor='#6ac4df';c.shadowBlur=8;c.beginPath();
      for(let i=0;i<signal.length;i++){
        const x=pad+i/(signal.length-1)*(width-2*pad),y=mid+(signal[i]-128)/128*height*1.8;
        if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.stroke();c.restore();
    }
    c.fillStyle='#e1b479';c.fillRect(pad,height-22,(width-pad*2)*Math.min(1,t),2);
    if(media.paused){
      c.fillStyle='#c6eef2';c.beginPath();c.moveTo(width/2-9,mid-15);c.lineTo(width/2+15,mid);c.lineTo(width/2-9,mid+15);c.fill();
    }
    wave.setAttribute('aria-label',media.paused?'Play audio':'Pause audio');
    root.dataset.mediaTime=media.currentTime.toFixed(3);root.dataset.mediaPlaying=String(!media.paused);
  }
  function audio(){
    const a=document.createElement('audio');a.src='./assets/menu-audio-sample.wav';a.preload='auto';a.hidden=true;body.append(a);media=a;
    wave=document.createElement('canvas');wave.width=800;wave.height=210;wave.className='hud-audio-wave';wave.tabIndex=0;wave.setAttribute('role','button');wave.setAttribute('aria-label','Pause audio');body.append(wave);
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(AudioContext){
      context=new AudioContext();analyser=context.createAnalyser();analyser.fftSize=512;signal=new Uint8Array(analyser.fftSize);
      const source=context.createMediaElementSource(a);source.connect(analyser);analyser.connect(context.destination);context.resume().catch(()=>{});
    }
    const play=()=>{context?.resume().catch(()=>{});if(a.ended)a.currentTime=0;return a.play().catch(()=>{drawWave();wake();});};
    wave.onclick=()=>{if(a.paused)play();else a.pause();};
    wave.onkeydown=e=>{
      if(e.key===' '||e.key==='Enter'){e.preventDefault();wave.onclick();}
      if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&Number.isFinite(a.duration)){e.preventDefault();a.currentTime=Math.max(0,Math.min(a.duration,a.currentTime+(e.key==='ArrowLeft'?-.2:.2)));drawWave();}
    };
    a.onplay=a.onpause=a.onended=()=>{drawWave();wake();};a.ontimeupdate=drawWave;
    play();drawWave();
  }
  function open(next,anchor){
    release();item=next;closing=false;root.hidden=false;root.style.opacity='0';root.style.pointerEvents='auto';root.dataset.kind=next.kind.toLowerCase();root.setAttribute('aria-label',next.title||next.label);
    origin.copy(anchor||new THREE.Vector3(.07,.027,.095));amount=0;root.dataset.expansion='0.000';
    w=800;h=next.kind==='Audio'?210:next.kind==='Video'?450:460;
    root.style.width=`${w}px`;root.style.height=`${h}px`;
    if(next.kind==='Video'){
      const v=document.createElement('video');v.controls=true;v.playsInline=true;v.preload='auto';v.src='https://developer.mozilla.org/shared-assets/videos/flower.mp4';v.setAttribute('aria-label','Video');body.append(v);media=v;
      v.onloadeddata=()=>{if(v.currentTime===0)v.currentTime=.01;};
      v.onplay=v.onpause=v.onended=()=>{root.dataset.mediaPlaying=String(!v.paused);};
    }else if(next.kind==='Audio')audio();
    else{
      const article=document.createElement('article');article.className='hud-document';article.tabIndex=0;
      // Authored local fixture only. Future external HTML needs an explicit sanitizer.
      if(next.html)article.innerHTML=next.html;
      else{const heading=document.createElement('h1');heading.textContent=next.title;article.append(heading);next.paragraphs.forEach(text=>{const p=document.createElement('p');p.textContent=text;article.append(p);});}
      body.append(article);
      article.addEventListener('scroll',()=>{root.dataset.scrollTop=String(article.scrollTop);},{passive:true});
    }
    root.dataset.scrollTop='0';root.dataset.item=next.id;root.dataset.open='true';root.dataset.mediaPlaying=String(next.kind==='Audio');
    animateTo(1);closeButton.focus();
  }
  function tick(){
    if(!item)return;
    if(animation){
      const t=Math.min(1,(performance.now()-animation.at)/280),ease=1-Math.pow(1-t,3);
      amount=animation.from+(animation.to-animation.from)*ease;
      if(t===1)animation=null;
    }
    if(closing&&amount<=0){release();root.hidden=true;root.dataset.open='false';root.dataset.mediaPlaying='false';item=null;return;}
    root.style.opacity=String(Math.min(1,amount*2));
    // Native element coordinates -> HUD local plane -> world -> clip coordinates.
    // Convert clip x/y/w to a CSS projective matrix; the browser handles hit testing.
    if(camera&&getFrame()){
      position.copy(origin).lerp(destination,amount);const expansion=.08+.92*amount,worldWidth=.145*expansion,worldHeight=worldWidth*h/w;
      scale.set(worldWidth/w,-worldHeight/h,1);
      local.compose(position,rotation,scale).multiply(translation.makeTranslation(-w/2,-h/2,0));
      camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(getFrame()).multiply(local);
      const e=matrix.elements,sx=stage.clientWidth/2,sy=stage.clientHeight/2;
      root.style.transform=`matrix3d(${[
        sx*(e[0]+e[3]),sy*(-e[1]+e[3]),0,e[3],
        sx*(e[4]+e[7]),sy*(-e[5]+e[7]),0,e[7],
        0,0,1,0,
        sx*(e[12]+e[15]),sy*(-e[13]+e[15]),0,e[15],
      ].join(',')})`;
    }else root.style.transform=`translate(${stage.clientWidth/2-w/2}px,${stage.clientHeight/2-h/2}px)`;
    root.dataset.expansion=amount.toFixed(3);
    if(wave)drawWave();
  }
  return {open,close,tick,get isOpen(){return !!item&&!closing;},get needsFrame(){return !!animation||!!(wave&&media&&!media.paused);}};
}
