import {createMediaSequence} from './hud-media-sequence.js?v=rory-29f';
// Native video and local audio share one animated sequence. Only the active
// card may play; the outgoing card is retained briefly for the visual handoff.
export function createHUDYouTube({root,changed}){
  const plane=document.createElement('div');plane.className='hud-youtube hud-media-sequence';plane.dataset.ui='';plane.hidden=true;plane.tabIndex=0;
  plane.setAttribute('role','region');plane.setAttribute('aria-roledescription','carousel');plane.setAttribute('aria-label','Media. Scroll or use up and down arrow keys to change item.');
  document.body.append(plane);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let list=[],sequence=null,active=null,outgoing=null,visible=false,serial=0,metadata=[];
  const command=(card,func,args=[])=>card?.iframe?.contentWindow?.postMessage(JSON.stringify({event:'command',func,args}),'https://www.youtube.com');
  function pause(card){if(!card)return;card.media?.pause();command(card,'pauseVideo');card.playing=false;}
  function play(card){
    if(!card||card.item.external)return;card.wantsPlayback=true;
    if(card.media){if(card.media.ended)card.media.currentTime=0;card.media.play().catch(()=>{card.playing=false;changed();});}
    else command(card,'playVideo');
  }
  function toggle(card){if(card.playing){card.wantsPlayback=false;pause(card);}else play(card);changed();}
  function remove(card){if(!card)return;pause(card);card.media?.removeAttribute('src');card.media?.load();card.element.remove();}
  function bindMedia(card,media){
    card.media=media;
    media.onplay=()=>{card.playing=true;changed();};
    media.onpause=media.onended=()=>{card.playing=false;changed();};
    media.ontimeupdate=()=>{if(card===active){root.dataset.mediaTime=String(media.currentTime);root.dataset.mediaPlaying=String(!media.paused);root.dataset.mediaMuted=String(media.muted);changed();}};
    media.onerror=()=>{if(card===active)root.dataset.mediaError=String(media.error?.code||'native');changed();};
  }
  function makeCard(item){
    const element=document.createElement('div');element.className='hud-media-card';plane.append(element);
    const card={element,item,playing:false,wantsPlayback:true,iframe:null,audio:null,media:null,wave:null};
    if(item.kind==='Audio'){
      const image=document.createElement('img');image.src=item.poster;image.alt='Tony Stark revealing that he is Iron Man at the press conference';image.className='hud-media-still';element.append(image);
      const audio=document.createElement('audio');audio.src=item.src;audio.preload='auto';element.append(audio);card.audio=audio;
      const wave=document.createElement('canvas');wave.width=640;wave.height=44;wave.className='hud-media-wave';wave.setAttribute('aria-hidden','true');element.append(wave);card.wave=wave;
      bindMedia(card,audio);
    }else if(item.src){
      const video=document.createElement('video');video.className='hud-media-native';video.src=item.src;video.poster=item.poster||'';video.preload='metadata';video.playsInline=true;video.controls=true;video.tabIndex=0;video.setAttribute('aria-label',item.title);element.append(video);bindMedia(card,video);
    }else{
      const poster=document.createElement('img');poster.className='hud-media-still';poster.alt='';poster.src=`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;element.append(poster);
      if(!item.external){
      const iframe=document.createElement('iframe');iframe.style.opacity='1';iframe.width=640;iframe.height=360;iframe.title=item.title;iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allowFullscreen=true;
      const q=new URLSearchParams({enablejsapi:'1',autoplay:'1',playsinline:'1',rel:'0',mute:'0',controls:'1',origin:location.origin});
      iframe.src=`https://www.youtube.com/embed/${item.id}?${q}`;card.iframe=iframe;element.append(iframe);
      iframe.onload=()=>{iframe.contentWindow?.postMessage(JSON.stringify({event:'listening',id:`hud-media-${++serial}`}),'https://www.youtube.com');if(card!==active||!visible)pause(card);};
      }
    }
    const interaction=document.createElement(item.external?'a':'button');interaction.className='hud-media-play';
    if(item.external){
      interaction.classList.add('hud-media-external');interaction.href=`https://www.youtube.com/watch?v=${item.id}`;interaction.target='_blank';interaction.rel='noopener noreferrer';
      interaction.setAttribute('aria-label',`Watch full film: ${item.title} on YouTube (opens in a new tab)`);interaction.textContent='↗';
    }else{interaction.setAttribute('aria-label',`Play or pause ${item.title}`);interaction.onclick=()=>toggle(card);}
    if(card.iframe||(item.src&&item.kind!=='Audio'))interaction.hidden=true;
    element.append(interaction);card.interaction=interaction;
    const marker=document.createElement('div');marker.className='hud-media-position';marker.setAttribute('aria-hidden','true');list.forEach((_,i)=>{const bar=document.createElement('i');bar.className=i===sequence.index?'current':'';marker.append(bar);});element.append(marker);
    element.setAttribute('aria-label',`${sequence.index+1} of ${list.length}: ${item.title}`);
    return card;
  }
  function describe(card){
    if(!card)return;
    const data=metadata.find(v=>v.id===card.item.id);
    if(data)card.element.setAttribute('aria-description',`${data.views.toLocaleString()} views${data.likes===null?'':`, ${data.likes.toLocaleString()} likes`}. Public counts saved ${new Date(data.fetchedAt).toLocaleDateString()}.`);
  }
  function select(){
    remove(outgoing);outgoing=active;pause(outgoing);
    if(outgoing){outgoing.element.inert=true;outgoing.element.setAttribute('aria-hidden','true');}
    active=makeCard(list[sequence.index]);describe(active);delete root.dataset.mediaError;
    root.dataset.mediaTransition=sequence.sample(performance.now()).active?'moving':'settled';
    root.dataset.videoTitle=active.item.title;root.dataset.videoIndex=String(sequence.index);root.dataset.mediaKind=active.item.kind||'Video';root.dataset.mediaTime='0';root.setAttribute('aria-label',active.item.title);
    root.dataset.mediaPlaying='false';root.dataset.mediaCount=String(list.length);if(active.media)play(active);changed();
  }
  function advance(delta,wheel=false){
    if(!sequence)return;
    if((wheel?sequence.wheel(delta,performance.now()):sequence.step(delta,performance.now())))select();
  }
  plane.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();advance(e.deltaY*(e.deltaMode===1?24:1),true);},{passive:false});
  plane.addEventListener('keydown',e=>{
    if(e.target.tagName==='VIDEO'){e.stopPropagation();return;}
    if(!['ArrowDown','ArrowUp','PageDown','PageUp','ArrowRight','ArrowLeft'].includes(e.key))return;
    e.preventDefault();e.stopPropagation();
    advance(['ArrowUp','PageUp','ArrowLeft'].includes(e.key)?-1:1);
  });
  window.addEventListener('message',e=>{
    if(e.origin!=='https://www.youtube.com')return;
    const card=[active,outgoing].find(c=>c?.iframe?.contentWindow===e.source);if(!card)return;
    let d;try{d=typeof e.data==='string'?JSON.parse(e.data):e.data;}catch{return;}
    if(d?.event==='onReady'||d?.event==='onError')card.iframe.style.opacity='1';
    if(d?.event==='onError'&&!card.error){
      card.error=true;card.interaction.hidden=true;
      if(card===active)root.dataset.mediaError=String(d.info);
    }
    if(d?.event==='onReady'&&card===active&&visible){if(!card.started){card.started=true;command(card,'unMute');}if(card.wantsPlayback)play(card);}
    const state=d?.event==='onStateChange'?d.info:d?.info?.playerState;
    if(state!==undefined)card.iframe.style.opacity='1';
    if(state!==undefined&&!card.started&&card===active){card.started=true;command(card,'unMute');}
    if(state!==undefined){card.playing=state===1;if(card.playing&&(card!==active||!visible))pause(card);}
    if(card===active){if(typeof d?.info?.muted==='boolean')root.dataset.mediaMuted=String(d.info.muted);if(typeof d?.info?.currentTime==='number')root.dataset.mediaTime=d.info.currentTime.toFixed(2);root.dataset.mediaPlaying=String(card.playing);changed();}
  });
  function tick(){
    if(!sequence||!active)return;
    const state=sequence.sample(performance.now()),t=state.progress,d=state.direction;
    active.element.style.transform=`translateY(${d*(1-t)*72}px) scale(${.96+.04*t})`;
    active.element.style.opacity=String(t);
    if(outgoing){outgoing.element.style.transform=`translateY(${-d*t*72}px) scale(${1-.04*t})`;outgoing.element.style.opacity=String(1-t);if(!state.active){remove(outgoing);outgoing=null;}}
    if(!active.item.external){active.interaction.setAttribute('aria-label',`${active.playing?'Pause':'Play'} ${active.item.title}`);
    active.interaction.dataset.playing=String(active.playing);active.interaction.textContent=active.audio&&!active.playing?'▶':'';}
    if(active.audio){root.dataset.mediaTime=String(active.audio.currentTime);root.dataset.mediaPlaying=String(!active.audio.paused);const c=active.wave.getContext('2d');c.clearRect(0,0,640,44);c.strokeStyle='#828582';c.beginPath();c.moveTo(16,22);c.lineTo(624,22);c.stroke();if(active.audio.duration){c.fillStyle='#f2a353';c.fillRect(0,41,640*active.audio.currentTime/active.audio.duration,2);}}
    root.dataset.mediaTransition=state.active?'moving':'settled';root.dataset.mediaTransitionProgress=t.toFixed(3);
  }
  // Project the common native 640×404 card into the HUD's current quadrilateral.
  function position(p){
    const [a,b,c,d]=p,dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x,dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y,den=dx1*dy2-dx2*dy1;
    const g=Math.abs(den)>1e-9?(dx3*dy2-dx2*dy3)/den:0,h=Math.abs(den)>1e-9?(dx1*dy3-dx3*dy1)/den:0;
    const m=[(b.x-a.x+g*b.x)/640,(b.y-a.y+g*b.y)/640,0,g/640,(d.x-a.x+h*d.x)/404,(d.y-a.y+h*d.y)/404,0,h/404,0,0,1,0,a.x,a.y,0,1];plane.style.transform=`matrix3d(${m.join(',')})`;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause(active);pause(outgoing);}});
  window.addEventListener('blur',()=>{pause(active);pause(outgoing);});
  return {
    open(items){list=items;sequence=createMediaSequence(list.length,{duration:reduced?0:560});select();plane.hidden=false;},
    setMetadata(data){metadata=data;describe(active);},
    close(){pause(active);pause(outgoing);plane.hidden=true;visible=false;},
    step:delta=>advance(delta),scroll:delta=>advance(delta,true),tick,position,
    pause(){pause(active);pause(outgoing);},
    setPresentation(alpha,interactive=true){const next=alpha>.001;plane.hidden=!next;plane.style.opacity=String(alpha);plane.style.pointerEvents=interactive?'':'none';plane.inert=!interactive;
      if(visible&&!next){pause(active);pause(outgoing);}if(!visible&&next&&active?.wantsPlayback)play(active);visible=next;},
    get titles(){const s=sequence?.sample(performance.now());return !s?[]:[...(outgoing?[{id:outgoing.item.id,title:outgoing.item.title,alpha:1-s.progress,offset:-s.direction*s.progress*36}]:[]),{id:active.item.id,title:active.item.title,alpha:s.progress,offset:s.direction*(1-s.progress)*36}];},
    get visible(){return visible;},get playing(){return !!active?.playing;},get needsFrame(){return !!sequence?.sample(performance.now()).active||!!active?.playing&&!!active?.audio;},
  };
}
