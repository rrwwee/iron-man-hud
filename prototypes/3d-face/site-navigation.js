import {createHUDVolumes} from './hud-volumes.js?v=visor-2';
import {createHUDContentSurface} from './hud-content-surface.js?v=visor-2';
import {createVisorMenu} from './visor-menu-3d.js?v=visor-2';
// Disposable interaction trial. The entries below are explicitly sample content.
const entries=[
  {id:'about',label:'About',kind:'Text',title:'A little about me',html:'<h1>About</h1><p>A collection of projects, notes, sound and places.</p><p>Explore the globe for the places I have lived, studied and coached sailing.</p><h2>Behind the HUD</h2><p><a href="https://github.com/rrwwee/iron-man-hud" target="_blank" rel="noopener noreferrer">Source code</a></p><p>Face: Tony Stark by <a href="https://sketchfab.com/3d-models/tony-stark-86c267264a2e4903b8c2bcc1b972cb74" target="_blank" rel="noopener noreferrer">Nathang30</a>, CC BY-NC-SA 4.0.</p><p>Armor: Iron man Mark 7 armors by <a href="https://blendswap.com/blend/6708" target="_blank" rel="noopener noreferrer">2iemniak</a>, CC BY 3.0, noncommercial fan art. Models modified for this HUD.</p><p>Globe outlines: Natural Earth, public domain.</p>',paragraphs:['This is a placeholder for your introduction. It could be a short hello, what you work on, and what you are curious about.','The point of this trial is the experience of opening, reading and closing content inside the HUD. The biography and section names are still yours to choose.']},
  {id:'work',label:'Selected work',kind:'Text',title:'Selected work',paragraphs:['A place for two or three things you have made, with a short description and links to explore them.','These are sample sections, not a finished content plan. We can replace this Panel with project previews or individual pages once you choose what belongs here.']},
  {id:'video',label:'Watch',kind:'Video',title:'Video sample'},
  {id:'audio',label:'Listen',kind:'Audio',title:'Audio sample'},
  {id:'notes',label:'Notes',kind:'Text',title:'Notes and ideas',html:'<h1>Notes and ideas</h1><p>A small collection of experiments in motion, sound and interfaces.</p><h2>Start with the interaction</h2><p>A useful prototype makes a question tangible. Move around, open something, and notice what feels natural.</p><blockquote>Good details make the important action easier to understand.</blockquote><h2>Working notes</h2><ul><li>Keep the face visible around the content.</li><li>Let sound and motion respond to an action.</li><li>Leave room for reading.</li></ul><h2>Next experiments</h2><p>Try a different rhythm, a quieter transition, or a simpler route through the material.</p>',paragraphs:['Short writing can live here without sending visitors out of the scene. A longer piece could have its own scrollable Panel.','For now, this is sample text so you can judge the reading width, contrast, and how much of the Face remains visible.']},
];
const svgNS='http://www.w3.org/2000/svg';
function svg(tag,attributes){const n=document.createElementNS(svgNS,tag);Object.entries(attributes).forEach(([k,v])=>n.setAttribute(k,v));return n;}

export function createSiteNavigation({wake,invalidate,scene,camera}){
  const stage=document.getElementById('stage'),canvas=document.getElementById('hologram');
  const layer=document.createElement('div');layer.className='hud-follow-layer';stage.insertBefore(layer,canvas);layer.append(canvas);
  const nav=document.createElement('nav');nav.className='radial-menu';nav.dataset.ui='';nav.setAttribute('aria-label','Site sections');
  nav.innerHTML=`<svg class="navigation-dial" viewBox="0 0 450 560" aria-hidden="false">
    <defs><linearGradient id="dialStroke" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e1f7ef"/><stop offset=".46" stop-color="#65bcc9"/><stop offset="1" stop-color="#d7924c"/></linearGradient></defs>
    <g class="dial-machinery" aria-hidden="true"><path d="M60 25 A255 255 0 0 1 60 535 M60 39 A241 241 0 0 1 60 521 M60 62 A218 218 0 0 1 60 498 M60 118 A162 162 0 0 1 60 442"/>
    <path class="dial-heavy" d="M144 74 A222 222 0 0 1 244 405 M87 499 A221 221 0 0 1 60 501"/>
    <circle cx="60" cy="280" r="116"/><path d="M-50 280H164 M60 165V395" class="dial-cross"/></g>
    <g class="dial-ticks" aria-hidden="true"></g><g class="radial-items"></g>
    <text x="45" y="267" class="dial-caption">INDEX</text><text x="40" y="302" class="dial-selected-number">01</text><text x="45" y="324" class="dial-total">/ 06</text>
    <text x="58" y="18" class="dial-instruction">SCROLL TO SELECT / CLICK TO OPEN</text>
  </svg>`;
  const tickGroup=nav.querySelector('.dial-ticks');
  for(let i=0;i<=76;i++){const a=(-100+i*200/76)*Math.PI/180,r=i%4===0?230:235;tickGroup.append(svg('path',{d:`M${60+Math.cos(a)*r} ${280+Math.sin(a)*r} L${60+Math.cos(a)*241} ${280+Math.sin(a)*241}`}));}
  layer.append(nav);
  const ocular=document.createElement('span');ocular.hidden=true;
  const buttons=Array.from({length:5},()=>{const b=svg('g',{class:'radial-sector',role:'button',tabindex:'0'});nav.querySelector('.radial-items').append(b);return b;});
  const preview=document.createElement('button');preview.className='preview-dial';preview.dataset.ui='';
  preview.innerHTML=`<svg viewBox="0 0 340 340" aria-hidden="true"><defs><linearGradient id="previewStroke" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a0edf4"/><stop offset="1" stop-color="#477986"/></linearGradient></defs><circle cx="170" cy="170" r="154"/><circle cx="170" cy="170" r="141"/><circle class="preview-inner" cx="170" cy="170" r="115"/><g class="preview-ticks"></g><path class="preview-progress"/></svg><span class="preview-type"></span><span class="preview-title"></span><span class="preview-detail"></span><span class="preview-action"></span>`;
  for(let i=0;i<72;i++){const a=i*Math.PI/36,r=i%6===0?144:148;preview.querySelector('.preview-ticks').append(svg('path',{d:`M${170+Math.cos(a)*r} ${170+Math.sin(a)*r} L${170+Math.cos(a)*154} ${170+Math.sin(a)*154}`}));}
  layer.append(preview);

  const dialog=document.createElement('section');dialog.id='contentPanel';dialog.className='content-panel';dialog.hidden=true;dialog.dataset.ui='';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','contentTitle');
  dialog.innerHTML='<div class="content-panel-head"><div><small id="contentKind"></small><h1 id="contentTitle"></h1></div><button id="closeContent" aria-label="Close content">×</button></div><div id="contentBody" class="content-panel-body"></div><p class="content-sample">Sample content · section names and media are still to be chosen</p>';
  stage.append(dialog);
  let selected=0,active=true,opened=null,modal=false,previousFocus=null,lastWheel=0,follow='subtle',lastTransform='',lastPose=[0,0];
  let currentPlace=null,contentSurface=null,spatial=null,volumes=null,accessibleShortcuts=null,spatialMode=!!scene&&new URLSearchParams(location.search).get('hudSpace')!=='flat';
  const followControl=document.getElementById('hudFollow');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){follow='fixed';followControl.value='fixed';}
  const modeButton=document.getElementById('hudMode');
  followControl.onchange=()=>{follow=followControl.value;setPose(...lastPose);};
  function refresh(){
    buttons.forEach((button,i)=>{
      const offset=i-2,index=(selected+offset+entries.length)%entries.length,item=entries[index],angle=offset*.49;
      const toPoint=(r,a)=>[60+Math.cos(a)*r,280+Math.sin(a)*r],a=angle-.235,z=angle+.235;
      const p=toPoint(166,a),q=toPoint(222,a),r=toPoint(222,z),t=toPoint(166,z),label=toPoint(192,angle);
      button.dataset.offset=String(offset);button.dataset.entry=item.id;button.setAttribute('aria-label',`${item.label}, ${item.kind}`);button.setAttribute('aria-current',String(offset===0));
      button.innerHTML=`<path class="sector-hit" d="M${p} L${q} A222 222 0 0 1 ${r} L${t} A166 166 0 0 0 ${p}Z"/><path class="sector-accent" d="M${q} A222 222 0 0 1 ${r}"/><g transform="translate(${label}) rotate(${offset*6})"><text class="sector-label" text-anchor="middle" y="-3">${item.label}</text><text class="sector-type" text-anchor="middle" y="16">${item.kind==='External'?'OPEN LINK ↗':item.kind.toUpperCase()}</text></g>`;
      button.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();button.onclick();}};
      button.onclick=()=>{selected=index;refresh();open(item,buttons.find(b=>b.dataset.entry===item.id));};
    });
    nav.querySelector('.dial-selected-number').textContent=String(selected+1).padStart(2,'0');nav.querySelector('.dial-total').textContent=`/ ${String(entries.length).padStart(2,'0')}`;
    const current=entries[selected];nav.dataset.selected=current.id;
    preview.setAttribute('aria-label',`Open ${current.label}`);preview.querySelector('.preview-type').textContent=current.kind==='External'?'EXTERNAL LINK':current.kind.toUpperCase()+' PANEL';
    preview.querySelector('.preview-title').textContent=current.label;
    preview.querySelector('.preview-detail').textContent=current.kind==='Video'?'Sample clip · 5 sec':current.kind==='Audio'?'Sample audio · 1 sec':current.href?'github.com':`${(current.html?current.html.replace(/<[^>]*>/g,' '):current.paragraphs.join(' ')).trim().split(/\s+/).length} words · sample`;
    preview.querySelector('.preview-action').textContent=current.kind==='Video'?'▶  OPEN VIDEO':current.kind==='Audio'?'▷  OPEN PLAYER':current.href?'↗  VISIT SITE':'OPEN TRANSMISSION';
    const end=-Math.PI/2+Math.min(.9999,(selected+1)/entries.length)*2*Math.PI;
    preview.querySelector('.preview-progress').setAttribute('d',`M170 16 A154 154 0 ${selected>=3?1:0} 1 ${170+Math.cos(end)*154} ${170+Math.sin(end)*154}`);
    preview.onclick=()=>open(current,buttons.find(b=>b.dataset.entry===current.id));
    spatial?.update({entries,selected});
  }
  function rotate(delta){selected=(selected+delta+entries.length)%entries.length;refresh();}
  function browse(delta){const now=performance.now();if(Math.abs(delta)<2||now-lastWheel<160)return;lastWheel=now;rotate(Math.sign(delta));}
  nav.addEventListener('wheel',event=>{event.preventDefault();browse(event.deltaY);},{passive:false});
  function setPose(x,y,eye){
    eye=eye||lastPose[2];lastPose=[x,y,eye];const strength=active&&!modal?({fixed:0,subtle:1,close:2.6}[follow]):0;
    const transform=`translate3d(${(x*16*strength).toFixed(1)}px,${(y*9*strength).toFixed(1)}px,0) rotate(${(x*.5*strength).toFixed(2)}deg)`;
    if(transform!==lastTransform){canvas.style.transform=transform;nav.style.transform=`translate3d(${(x*8*strength).toFixed(1)}px,${(y*4*strength).toFixed(1)}px,0)`;preview.style.transform=`translate3d(${(x*13*strength).toFixed(1)}px,${(y*8*strength).toFixed(1)}px,0)`;lastTransform=transform;layer.dataset.poseUpdates=String(Number(layer.dataset.poseUpdates||0)+1);}
    if(eye){const gain=strength===0?0:Math.min(1,strength*.45),ex=eye.restX+(eye.x-eye.restX)*gain,ey=eye.restY+(eye.y-eye.restY)*gain;
      ocular.style.transform=`translate3d(${(ex-36).toFixed(1)}px,${(ey-36).toFixed(1)}px,0)`;}
    spatial?.setEnabled(active&&spatialMode);spatial?.setPose(x,y,strength,modal);
    volumes?.tick(x,y);spatial?.setSuitState(stage.dataset.suitExploded==='true');contentSurface?.tick();layer.dataset.follow=follow;
  }
  function close(){
    if(contentSurface?.isOpen){contentSurface.close();return;}
    dialog.querySelectorAll('video,audio').forEach(media=>media.pause());dialog.hidden=true;opened=null;modal=false;document.body.classList.remove('panel-open','audio-open');
    layer.inert=false;document.getElementById('hudComparison').inert=false;document.querySelector('header').inert=false;dialog.querySelector('#contentBody').replaceChildren();
    setPose(...lastPose);previousFocus?.focus();document.dispatchEvent(new CustomEvent('hud-panel',{detail:{open:false}}));
  }
  function open(item,button,origin='menu'){
    if(item.href){window.open(item.href,'_blank','noopener,noreferrer');return;}
    if(contentSurface){previousFocus=button||document.activeElement;opened=item.id;spatial.setContentOpen(true);volumes?.setContentOpen(true);contentSurface.open(item,spatial.contentAnchor(origin));return;}
    dialog.querySelectorAll('video,audio').forEach(media=>media.pause());
    previousFocus=button||document.activeElement;opened=item.id;modal=item.kind!=='Audio';dialog.hidden=false;dialog.dataset.kind=item.kind.toLowerCase();dialog.setAttribute('aria-modal',String(modal));
    dialog.querySelector('#contentTitle').textContent=item.title;dialog.querySelector('#contentKind').textContent=item.kind==='Audio'?'Small audio Panel':item.kind+' Panel';
    const body=dialog.querySelector('#contentBody');body.replaceChildren();
    if(item.kind==='Video'){
      const v=document.createElement('video');v.controls=true;v.preload='none';v.playsInline=true;v.src='https://developer.mozilla.org/shared-assets/videos/flower.mp4';v.setAttribute('aria-label','Sample flower video');body.append(v);
      const p=document.createElement('p');p.textContent='A small MDN demonstration clip, standing in for your own video. Press play to load it.';body.append(p);
    }else if(item.kind==='Audio'){
      const a=document.createElement('audio');a.preload='none';a.src='./assets/menu-audio-sample.wav';a.hidden=true;body.append(a);
      const player=document.createElement('div');player.className='audio-player';
      player.innerHTML='<button aria-label="Play audio sample">Play</button><input type="range" aria-label="Audio position" min="0" max="1.1" step="0.01" value="0"><output>0:00</output>';body.append(player);
      const play=player.querySelector('button'),seek=player.querySelector('input'),time=player.querySelector('output');
      play.onclick=()=>{if(a.paused)a.play().catch(()=>{time.textContent='Unable to play';});else a.pause();};
      a.onplay=()=>{play.textContent='Pause';play.setAttribute('aria-label','Pause audio sample');};
      a.onpause=a.onended=()=>{play.textContent='Play';play.setAttribute('aria-label','Play audio sample');};
      a.onloadedmetadata=()=>{seek.max=String(a.duration);};
      a.ontimeupdate=()=>{seek.value=String(a.currentTime);time.textContent=`0:${String(Math.floor(a.currentTime)).padStart(2,'0')}`;};
      seek.oninput=()=>{if(Number.isFinite(a.duration))a.currentTime=Number(seek.value);};
      const p=document.createElement('p');p.textContent='A short original tone for trying the audio controls. Your recordings can live in a small Panel like this.';body.append(p);
    }else item.paragraphs.forEach(value=>{const p=document.createElement('p');p.textContent=value;body.append(p);});
    document.body.classList.toggle('panel-open',modal);document.body.classList.toggle('audio-open',!modal);layer.inert=modal;document.getElementById('hudComparison').inert=modal;document.querySelector('header').inert=modal;
    setPose(...lastPose);dialog.querySelector('#closeContent').focus();document.dispatchEvent(new CustomEvent('hud-panel',{detail:{open:modal}}));
  }
  dialog.querySelector('#closeContent').onclick=close;
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened&&!document.fullscreenElement){e.preventDefault();e.stopPropagation();close();}},true);
  dialog.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
    if(e.key==='Tab'&&modal){
      const list=[...dialog.querySelectorAll('button,a,[controls]')],first=list[0],last=list.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  window.addEventListener('keydown',e=>{
    if(!active||modal||e.target.closest('input,select,textarea,audio,video,[contenteditable],#hudContent,#instrumentControls'))return;
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();rotate(e.key==='ArrowUp'?-1:1);}
    if(e.key==='Enter'&&e.target===nav){e.preventDefault();open(entries[selected],nav);}
  });
  nav.tabIndex=0;
  function setActive(value){
    active=value;nav.hidden=!active;preview.hidden=!active||spatialMode;if(accessibleShortcuts)accessibleShortcuts.hidden=!active||!spatialMode;ocular.style.display=active?'':'none';document.body.dataset.navigation=active?'radial':'visual';followControl.closest('label').hidden=!active;
    modeButton.textContent=active?'Visuals only':'Try the menu';if(!active&&opened)close();setPose(...lastPose);invalidate();wake();
  }
  modeButton.onclick=()=>{setActive(!active);const u=new URL(location.href);u.searchParams.set('mode',active?'menu':'visual');history.replaceState(null,'',u);};
  if(scene){
    function chooseTarget(slot){
      if(slot==='place-prev'){volumes.step(-1);return;}
      if(slot==='place-next'){volumes.step(1);return;}
      if(slot==='place-open'){volumes.open();return;}
      if(typeof slot==='string'&&slot.startsWith('place:')){volumes.select(Number(slot.slice(6)));return;}
      if(slot==='optic'){volumes.focusOptic();return;}
      if(slot==='suit'){volumes.explode();return;}
      if(slot==='suit-left'||slot==='suit-right'){volumes.turnSuit(slot==='suit-left'?-.4:.4);return;}
      if(typeof slot==='string'&&slot.startsWith('kind:')){
        const kind=slot.slice(5);let next=selected;
        for(let i=1;i<=entries.length;i++){const j=(selected+i)%entries.length;if(entries[j].kind===kind){next=j;break;}}
        selected=next;refresh();return;
      }
      if(typeof slot==='string'&&slot.startsWith('jump:')){selected=Number(slot.slice(5));refresh();return;}
      const index=slot==='preview'?selected:(selected+slot-2+entries.length)%entries.length;
      selected=index;refresh();open(entries[index],buttons.find(b=>b.dataset.entry===entries[index].id),slot==='preview'?'preview':'menu');
    }
    spatial=createVisorMenu({scene,camera,stage,wake,onBrowse:browse,onChoose:chooseTarget});
    contentSurface=createHUDContentSurface({scene,stage,camera,wake,getFrame:()=>spatial.frame,onClose:()=>{opened=null;spatial.setContentOpen(false);volumes?.setContentOpen(false);previousFocus?.focus();}});
    volumes=createHUDVolumes({scene,camera,stage,wake,getFrame:()=>spatial.frame,onSelection:(index,places)=>{currentPlace=places[index];spatial.setLocationState(index,places);const output=accessibleShortcuts?.querySelector('output');if(output)output.textContent=currentPlace.label+' — '+currentPlace.role;},onPlace:place=>open({id:'place-'+place.id,kind:'Text',label:place.label,title:place.title,html:`<h1>${place.title}</h1><p>${place.text}</p><p><a href="https://www.openstreetmap.org/#map=12/${place.lat}/${place.lon}" target="_blank" rel="noopener noreferrer">Explore ${place.label} on the map</a></p>`,paragraphs:[place.text]},document.activeElement)});
    accessibleShortcuts=document.createElement('div');accessibleShortcuts.className='spatial-shortcuts';accessibleShortcuts.dataset.ui='';accessibleShortcuts.setAttribute('role','group');accessibleShortcuts.id='instrumentControls';accessibleShortcuts.setAttribute('aria-label','Places and armor');layer.append(accessibleShortcuts);
    [['optic','Focus optic'],['place-prev','Previous place'],['place-next','Next place'],['place-open','Open selected place'],['suit','Separate or assemble armor'],['suit-left','Rotate armor left'],['suit-right','Rotate armor right']].forEach(([key,label])=>{
      const b=document.createElement('button');b.textContent=label;b.dataset.control=key;b.onclick=()=>chooseTarget(key);b.onfocus=()=>spatial.focus(key);b.onblur=()=>spatial.focus(null);accessibleShortcuts.append(b);
    });
    const placeOutput=document.createElement('output');placeOutput.setAttribute('aria-live','polite');placeOutput.textContent=currentPlace?.label+' — '+currentPlace?.role;accessibleShortcuts.append(placeOutput);
    const depthButton=document.createElement('button');depthButton.id='hudDepth';document.querySelector('.hud-choice-buttons').prepend(depthButton);
    function setDepth(value){if(!value&&contentSurface?.isOpen)close();spatialMode=value;preview.hidden=!active||value;accessibleShortcuts.hidden=!active||!value;document.body.classList.toggle('spatial-hud',value);depthButton.textContent=value?'Compare flat HUD':'Try curved 3D';depthButton.setAttribute('aria-pressed',String(value));spatial.setEnabled(active&&value);setPose(...lastPose);invalidate();wake();}
    depthButton.onclick=()=>{setDepth(!spatialMode);const url=new URL(location.href);url.searchParams.set('hudSpace',spatialMode?'curved':'flat');history.replaceState(null,'',url);};
    buttons.forEach((b,i)=>{b.addEventListener('focus',()=>spatial.focus(i));b.addEventListener('blur',()=>spatial.focus(null));});
    preview.addEventListener('focus',()=>spatial.focus('preview'));preview.addEventListener('blur',()=>spatial.focus(null));setDepth(spatialMode);
  }
  refresh();setActive(new URLSearchParams(location.search).get('mode')!=='visual');
  return {setPose,get needsFrame(){return !!contentSurface?.needsFrame||!!spatial?.needsFrame||!!volumes?.needsFrame;},setVisible:value=>{spatial?.setVisible(value);volumes?.setVisible(value);if(!value&&contentSurface?.isOpen)contentSurface.close();},get isSpatial(){return spatialMode;},get isHovering(){return spatialMode&&spatial?.hovering;},get active(){return active;},get isOpen(){return modal;}};
}
