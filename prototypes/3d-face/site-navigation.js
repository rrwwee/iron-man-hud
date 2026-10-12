// Disposable interaction trial. The entries below are explicitly sample content.
const entries=[
  {id:'about',label:'About',kind:'Text',title:'A little about me',paragraphs:['This is a placeholder for your introduction. It could be a short hello, what you work on, and what you are curious about.','The point of this trial is the experience of opening, reading and closing content inside the HUD. The biography and section names are still yours to choose.']},
  {id:'work',label:'Selected work',kind:'Text',title:'Selected work',paragraphs:['A place for two or three things you have made, with a short description and links to explore them.','These are sample sections, not a finished content plan. We can replace this Panel with project previews or individual pages once you choose what belongs here.']},
  {id:'video',label:'Watch',kind:'Video',title:'Video sample'},
  {id:'audio',label:'Listen',kind:'Audio',title:'Audio sample'},
  {id:'notes',label:'Notes',kind:'Text',title:'Notes and ideas',paragraphs:['Short writing can live here without sending visitors out of the scene. A longer piece could have its own scrollable Panel.','For now, this is sample text so you can judge the reading width, contrast, and how much of the Face remains visible.']},
  {id:'source',label:'Source code',kind:'External',href:'https://github.com/rrwwee/iron-man-hud'},
];
const svgNS='http://www.w3.org/2000/svg';
function svg(tag,attributes){const n=document.createElementNS(svgNS,tag);Object.entries(attributes).forEach(([k,v])=>n.setAttribute(k,v));return n;}

export function createSiteNavigation({wake,invalidate}){
  const stage=document.getElementById('stage'),canvas=document.getElementById('hologram');
  const layer=document.createElement('div');layer.className='hud-follow-layer';stage.insertBefore(layer,canvas);layer.append(canvas);
  const nav=document.createElement('nav');nav.className='radial-menu';nav.dataset.ui='';nav.setAttribute('aria-label','Site sections');
  nav.innerHTML='<div class="radial-scroll-zone" aria-hidden="true"></div><div class="radial-orbit" aria-hidden="true"></div><div class="radial-core" aria-hidden="true">J<span>ARVIS</span></div><p class="radial-caption">Explore<span>Scroll to browse</span></p><div class="radial-items"></div><output class="radial-position"></output>';
  layer.append(nav);
  const ocular=svg('svg',{viewBox:'0 0 80 80','aria-hidden':'true'});ocular.classList.add('ocular-tracker');
  ocular.append(svg('path',{d:'M8 40 A32 32 0 0 1 65 20 M71 32 A32 32 0 0 1 20 65 M16 40 A24 24 0 0 1 40 16 M40 64 A24 24 0 0 0 64 40 M2 40H11 M69 40H78 M40 2V11 M40 69V78 M35 40H45 M40 35V45'}));layer.append(ocular);
  const buttons=Array.from({length:5},()=>{const b=document.createElement('button');b.className='radial-item';nav.querySelector('.radial-items').append(b);return b;});
  const suit=document.createElement('button');suit.className='suit-schematic';suit.dataset.ui='';suit.setAttribute('aria-label','Rotate suit schematic');
  suit.innerHTML='<span>Mark III</span><small>Suit schematic</small>';const wire=svg('svg',{viewBox:'0 0 150 245','aria-hidden':'true'});
  const paths=[
    'M62 12 88 12 96 29 90 48 60 48 54 29Z M60 27 67 23 75 28 83 23 90 27 86 40 64 40Z M61 29 68 30 M82 30 89 29 M70 43 80 43',
    'M58 53 92 53 106 69 97 106 89 121 61 121 53 106 44 69Z M58 53 64 70 86 70 92 53 M53 106 69 100 81 100 97 106 M61 121 67 107 83 107 89 121 M44 69 59 76 M106 69 91 76',
    'M44 58 28 63 21 87 34 93 46 79 M106 58 122 63 129 87 116 93 104 79 M25 92 18 122 21 137 32 136 38 112 34 94 M125 92 132 122 129 137 118 136 112 112 116 94 M20 137 17 148 21 154 30 152 33 138 M130 137 133 148 129 154 120 152 117 138',
    'M60 125 90 125 93 143 83 152 67 152 57 143Z M61 148 56 180 67 188 74 165 76 165 83 188 94 180 89 148 M56 180 53 213 63 226 70 219 68 191 M94 180 97 213 87 226 80 219 82 191 M53 213 45 227 46 234 66 234 70 222 M97 213 105 227 104 234 84 234 80 222',
    'M58 63 50 76 57 95 68 100 M92 63 100 76 93 95 82 100 M61 130 74 138 89 130 M56 185 66 190 M84 190 94 185 M56 198 66 201 M84 201 94 198',
  ];
  const rear=svg('g',{transform:'translate(4,-3)',opacity:'.24'});paths.forEach(d=>rear.append(svg('path',{d})));wire.append(rear);
  paths.forEach(d=>wire.append(svg('path',{d})));wire.append(svg('circle',{cx:75,cy:84,r:10}));wire.append(svg('path',{d:'M69 79 81 79 75 89Z M62 12 66 9 92 9 M106 69 110 66 M89 121 93 118 M46 234 50 231'}));suit.append(wire);
  suit.onclick=()=>{suit.classList.toggle('turned');suit.setAttribute('aria-pressed',String(suit.classList.contains('turned')));};layer.append(suit);

  const dialog=document.createElement('section');dialog.id='contentPanel';dialog.className='content-panel';dialog.hidden=true;dialog.dataset.ui='';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','contentTitle');
  dialog.innerHTML='<div class="content-panel-head"><div><small id="contentKind"></small><h1 id="contentTitle"></h1></div><button id="closeContent" aria-label="Close content">×</button></div><div id="contentBody" class="content-panel-body"></div><p class="content-sample">Sample content · section names and media are still to be chosen</p>';
  stage.append(dialog);
  let selected=0,active=true,opened=null,modal=false,previousFocus=null,lastWheel=0,follow='subtle',lastTransform='',lastPose=[0,0];
  const followControl=document.getElementById('hudFollow');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){follow='fixed';followControl.value='fixed';}
  const modeButton=document.getElementById('hudMode');
  followControl.onchange=()=>{follow=followControl.value;setPose(...lastPose);};
  function refresh(){
    buttons.forEach((button,i)=>{
      const offset=i-2,index=(selected+offset+entries.length)%entries.length,item=entries[index],angle=offset*.49;
      button.style.setProperty('--dx',String(Math.cos(angle)));button.style.setProperty('--dy',String(Math.sin(angle)));
      button.dataset.offset=String(offset);button.dataset.entry=item.id;button.setAttribute('aria-label',`${item.label}, ${item.kind}`);button.setAttribute('aria-current',String(offset===0));
      button.innerHTML=`<span class="radial-node" aria-hidden="true"></span><span class="radial-label">${item.label}<small>${item.kind}${item.kind==='External'?' ↗':''}</small></span>`;
      button.onclick=()=>{selected=index;refresh();open(item,buttons.find(b=>b.dataset.entry===item.id));};
    });
    nav.querySelector('.radial-position').textContent=`${String(selected+1).padStart(2,'0')} / ${String(entries.length).padStart(2,'0')}`;
    nav.dataset.selected=entries[selected].id;
  }
  function rotate(delta){selected=(selected+delta+entries.length)%entries.length;refresh();}
  nav.addEventListener('wheel',event=>{event.preventDefault();const now=performance.now();if(Math.abs(event.deltaY)<2||now-lastWheel<160)return;lastWheel=now;rotate(Math.sign(event.deltaY));},{passive:false});
  function setPose(x,y,eye){
    eye=eye||lastPose[2];lastPose=[x,y,eye];const strength=active&&!modal?({fixed:0,subtle:1,close:2.6}[follow]):0;
    const transform=`translate3d(${(x*16*strength).toFixed(1)}px,${(y*9*strength).toFixed(1)}px,0) rotate(${(x*.5*strength).toFixed(2)}deg)`;
    if(transform!==lastTransform){canvas.style.transform=transform;nav.style.transform=`translate3d(${(x*8*strength).toFixed(1)}px,${(y*4*strength).toFixed(1)}px,0)`;suit.style.transform=`translate3d(${(x*3*strength).toFixed(1)}px,${(y*2*strength).toFixed(1)}px,0)`;lastTransform=transform;layer.dataset.poseUpdates=String(Number(layer.dataset.poseUpdates||0)+1);}
    if(eye){const gain=strength===0?0:Math.min(1,strength*.45),ex=eye.restX+(eye.x-eye.restX)*gain,ey=eye.restY+(eye.y-eye.restY)*gain;
      ocular.style.transform=`translate3d(${(ex-36).toFixed(1)}px,${(ey-36).toFixed(1)}px,0)`;}
    layer.dataset.follow=follow;
  }
  function close(){
    dialog.querySelectorAll('video,audio').forEach(media=>media.pause());dialog.hidden=true;opened=null;modal=false;document.body.classList.remove('panel-open','audio-open');
    layer.inert=false;document.getElementById('hudComparison').inert=false;document.querySelector('header').inert=false;dialog.querySelector('#contentBody').replaceChildren();
    setPose(...lastPose);previousFocus?.focus();document.dispatchEvent(new CustomEvent('hud-panel',{detail:{open:false}}));
  }
  function open(item,button){
    if(item.href){window.open(item.href,'_blank','noopener,noreferrer');return;}
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
    if(!active||modal||e.target.closest('input,select,textarea,audio,video,[contenteditable]'))return;
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();rotate(e.key==='ArrowUp'?-1:1);}
    if(e.key==='Enter'&&e.target===nav){e.preventDefault();open(entries[selected],nav);}
  });
  nav.tabIndex=0;
  function setActive(value){
    active=value;nav.hidden=suit.hidden=!active;ocular.style.display=active?'':'none';document.body.dataset.navigation=active?'radial':'visual';followControl.closest('label').hidden=!active;
    modeButton.textContent=active?'Visuals only':'Try the menu';if(!active&&opened)close();setPose(...lastPose);invalidate();wake();
  }
  modeButton.onclick=()=>{setActive(!active);const u=new URL(location.href);u.searchParams.set('mode',active?'menu':'visual');history.replaceState(null,'',u);};
  refresh();setActive(new URLSearchParams(location.search).get('mode')!=='visual');
  return {setPose,get active(){return active;},get isOpen(){return modal;}};
}
