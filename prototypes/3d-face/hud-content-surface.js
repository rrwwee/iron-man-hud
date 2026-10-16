import {scrollDocumentKey} from './document-navigation.js';
import {loadVideoMetadata} from './video-metadata.js?v=rory-29f';
import {sectionLayouts,sectionPreviewPoint} from './hud-section-layouts.js?v=rory-29f';
// Curved content framed inside the preview section or the larger right display.
// The hidden native document supplies text layout, semantics, links and scrolling.
import * as THREE from 'three';
import {transferPhase} from './hud-transfer.js?v=rory-29f';
import {instrumentInk as ink} from './hud-instrument-style.js?v=rory-29f';
import {projectControl,targetSize,viewportShift} from './hud-control-targets.js?v=rory-29f';
import {visorDepth} from './visor-space.js?v=selector-3';
import {layout} from './hud-layouts.js?v=selector-3';
import {drawIcon} from './hud-icons.js?v=rory-29f';
import {createHUDYouTube} from './hud-youtube.js?v=rory-29f';
import {createHUDRelief} from './hud-relief.js?v=rory-29f';
import {hudLayout,previewHousingPoint,documentAspect,diagnosticDepth,documentChapters} from './hud-reference-model.js?v=rory-29f';

export function createHUDContentSurface({scene,stage,camera,wake,getFrame,getRightBoundary=()=>Infinity,onClose,id='hudContent'}){
  const root=document.createElement('section');root.id=id;root.dataset.ui='';root.className='hud-content-access';root.hidden=true;root.setAttribute('role','region');
  root.innerHTML='<div class="hud-native-content"></div><div class="hud-content-actions"></div>';
  stage.append(root);
  const body=root.firstElementChild,actions=root.lastElementChild;
  // Keep GPU storage fixed when changing media kinds; crop shorter content with UVs.
  const canvas=document.createElement('canvas');canvas.width=704;canvas.height=820;
  const c=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
  const columns=16,rows=12,geometry=new THREE.BufferGeometry(),positions=new Float32Array((columns+1)*(rows+1)*3),uv=[],indices=[];
  for(let row=0;row<=rows;row++)for(let i=0;i<=columns;i++){uv.push(i/columns,1-row/rows);if(row<rows&&i<columns){const a=row*(columns+1)+i,b=a+1,d=a+columns+2;indices.push(a,a+columns+1,b,b,a+columns+1,d);}}
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,forceSinglePass:true,depthWrite:false,depthTest:false,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=105;mesh.frustumCulled=false;mesh.visible=false;mesh.matrixAutoUpdate=false;scene.add(mesh);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),point=new THREE.Vector3();
  let item=null,media=null,context=null,analyser=null,signal=null,article=null,links=[],hot=null,down=null,sections=[];
  let previewPresence=1,presented=true;
  let animation=null,amount=0,closing=false,dirty=true,h=360,previewHeight=360,contentWidth=.095,serial=0,paints=0,documentRuns=[],documentLinks=[],documentMarks=[],renderedHeight=300,dock='preview',dockBlend=0,docking=null,controlTargets=[];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapterSlot=i=>110+i*88;
  const destination=new THREE.Vector3();
  const fitOffset=new THREE.Vector3(),inverseFrame=new THREE.Matrix4();
  const framePoint=(u,v,z)=>surfacePoint(u,v).clone().add(new THREE.Vector3(0,0,z)).toArray();
  const expandedFrame=createHUDRelief(scene,framePoint,[
    {points:[[.025,0],[.975,0],[1,.035],[1,.965],[.975,1],[.025,1],[0,.965],[0,.035]],width:.0035,depth:.0008,closed:true},
  ],{order:104,dynamic:true});
  const expandedGutter=createHUDRelief(scene,framePoint,[
    {points:[[.914,.10],[.914,.92]],width:.002,depth:.0005,tint:ink.dim},
  ],{order:104,dynamic:true});
  const frameParts=[expandedFrame,expandedGutter];
  for(const part of frameParts){part.mesh.visible=false;part.mesh.matrixAutoUpdate=false;}

  const changed=()=>{dirty=true;wake();};
  const expandedHeight=()=>({cv:650,links:600,about:670}[item?.id]??488);
  function visibleWidth(){return item?.id==='cv'&&dock==='expanded'?canvas.width:640;}
  function updateUV(){for(let row=0;row<=rows;row++)for(let i=0;i<=columns;i++)geometry.attributes.uv.setXY(row*(columns+1)+i,i/columns*visibleWidth()/canvas.width,1-row/rows*h/canvas.height);geometry.attributes.uv.needsUpdate=true;}
  let youtube=null,videoMetadata=[],mediaPoints=[];
  // Local audio is tiny and initialized on demand; no background media preload.
  function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.append(b);return b;}
  const playButton=button('Play audio',()=>toggleMedia());
  const pdfButton=button('Open original CV',()=>article?.querySelector('.cv-download a')?.click());pdfButton.hidden=true;pdfButton.dataset.control='cv:pdf';
  playButton.dataset.control='play';
  const readingSlider=document.createElement('input');readingSlider.type='range';readingSlider.min='0';readingSlider.max='100';readingSlider.step='1';readingSlider.hidden=true;readingSlider.setAttribute('aria-label','CV reading position');readingSlider.oninput=()=>{if(article)scrollTo(Number(readingSlider.value)/100*Math.max(0,article.scrollHeight-article.clientHeight));};actions.append(readingSlider);
  body.addEventListener('focusin',changed);body.addEventListener('focusout',changed);
  actions.addEventListener('focusin',changed);actions.addEventListener('focusout',changed);
  actions.addEventListener('keydown',e=>{
    if(e.target.dataset.chapter===undefined||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
    const choices=[...actions.querySelectorAll('button[data-chapter]')],index=choices.indexOf(e.target);
    const next=e.key==='Home'?0:e.key==='End'?choices.length-1:(index+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+choices.length)%choices.length;
    e.preventDefault();e.stopPropagation();choices[next].focus({preventScroll:true});
  });
  function release(){
    media?.pause();youtube?.close();
    if(media){media.removeAttribute('src');media.load();media.remove();}
    if(context){context.close().catch(()=>{});context=null;}
    media=context=analyser=signal=article=null;readingSlider.hidden=pdfButton.hidden=true;sections=[];actions.querySelectorAll('[data-chapter]').forEach(b=>b.remove());documentRuns=[];documentLinks=[];documentMarks=[];links=[];body.replaceChildren();
  }
  function animateTo(to){if(reduced){amount=to;animation=null;}else animation={at:performance.now(),from:amount,to};wake();}
  function close(notify=true){if(!item||closing)return;if(notify!==false&&dock==='expanded'){onClose();return;}closing=true;media?.pause();youtube?.close();animateTo(0);if(notify!==false)onClose();}
  function clear(){release();item=null;closing=false;animation=docking=null;amount=0;mesh.visible=expandedFrame.mesh.visible=expandedGutter.mesh.visible=false;root.hidden=true;root.dataset.open='false';root.dataset.mediaPlaying='false';}
  function toggleMedia(){if(!media)return;context?.resume().catch(()=>{});if(media.paused){if(media.ended)media.currentTime=0;media.play().catch(changed);}else media.pause();changed();}
  root.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&dock==='expanded'){e.preventDefault();e.stopPropagation();close();}
  });
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&item&&!closing&&dock==='expanded'){e.preventDefault();close();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){media?.pause();youtube?.pause();}else changed();});

  window.addEventListener('blur',()=>{media?.pause();});
  function audio(autoplay=true){
    const a=document.createElement('audio');a.src=item.src;a.preload='auto';a.hidden=true;body.append(a);media=a;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(AudioContext){context=new AudioContext();analyser=context.createAnalyser();analyser.fftSize=512;signal=new Uint8Array(analyser.fftSize);context.createMediaElementSource(a).connect(analyser);analyser.connect(context.destination);context.resume().catch(()=>{});}
    a.onplay=a.onpause=a.onended=changed;a.onerror=()=>{root.dataset.mediaError='Audio unavailable';changed();};if(autoplay)a.play().catch(changed);
  }
  function open(next,_anchor,placement='preview'){
    release();item=next;closing=false;root.hidden=false;root.setAttribute('aria-label',next.title||next.label);
    root.dataset.kind=next.kind.toLowerCase();root.dataset.item=next.id;root.dataset.open='true';root.dataset.curved='true';root.dataset.expansion='0.000';
    amount=0;
    const isVideo=next.kind==='Video',isAudio=next.kind==='Audio';
    h=placement==='preview'&&sectionLayouts[next.id]?sectionLayouts[next.id].height:next.kind==='Model'?700:isAudio?156:isVideo?488:placement==='preview'?Math.round(640*documentAspect):468;
    dock=placement;updateUV();dockBlend=placement==='expanded'?1:0;const position=placement==='preview'?layout.preview:layout.content;contentWidth=position[2];
    destination.set(position[0],position[1],.115);root.dataset.placement=dock;
    material.blending=isVideo||isAudio?THREE.CustomBlending:THREE.NormalBlending;
    material.premultipliedAlpha=isVideo||isAudio;material.blendSrc=THREE.OneFactor;material.blendDst=THREE.OneMinusSrcColorFactor;
    material.blendSrcAlpha=THREE.OneFactor;material.blendDstAlpha=THREE.OneMinusSrcAlphaFactor;material.needsUpdate=true;
    playButton.hidden=!isAudio;root.dataset.scrollTop='0';root.dataset.scrollMax='0';delete root.dataset.mediaError;
    readingSlider.hidden=next.id!=='cv'||placement!=='preview';
    pdfButton.hidden=next.id!=='cv'||placement!=='preview';
    if(isVideo){youtube??=createHUDYouTube({root,changed});youtube.open(next.videos);loadVideoMetadata().then(data=>{videoMetadata=data;youtube?.setMetadata(data);changed();});}
    else if(isAudio)audio();
    else if(next.kind==='Model'){}
    else if(next.kind==='Links')updateLinks(next.links);
    else{
      article=document.createElement('article');article.className=next.id==='cv'?'hud-document hud-cv':'hud-document';article.style.height=`${h}px`;article.tabIndex=0;
      // Authored local HTML fixture only; this is not an arbitrary HTML renderer.
      if(next.html)article.innerHTML=next.html;
      else{const heading=document.createElement('h1');heading.textContent=next.title;article.append(heading);next.paragraphs.forEach(text=>{const p=document.createElement('p');p.textContent=text;article.append(p);});}
      body.append(article);
      article.addEventListener('keydown',event=>scrollDocumentKey(event,article,scrollTo));
      // Short documents occupy only the space their content needs.
      const bottom=article.lastElementChild.getBoundingClientRect().bottom-article.getBoundingClientRect().top+28;
      if(!sectionLayouts[next.id])h=Math.min(h,Math.max(180,Math.ceil(bottom)));article.style.height=`${h}px`;destination.y=dock==='preview'?layout.preview[1]:layout.content[1];
      updateUV();
      article.addEventListener('scroll',changed,{passive:true});article.addEventListener('focusin',changed);layoutDocument();
      const base=article.getBoundingClientRect();
      sections=next.id==='cv'?[...article.querySelectorAll('h2')].map((node,i)=>({...documentChapters[i],label:node.textContent,y:node.getBoundingClientRect().top-base.top+article.scrollTop-20})):[];
      sections.forEach((section,i)=>{const b=button('Jump to '+section.label,()=>scrollTo(section.y));b.dataset.chapter=String(i);b.dataset.control=section.key;});
    }
    previewHeight=h;
    root.dataset.surfaceTriangles=String(columns*rows*2);root.dataset.textureBytes=String(canvas.width*canvas.height*4);root.dataset.openSerial=String(++serial);
    dirty=true;animateTo(1);
  }
  function updateLinks(value){
    if(item?.kind!=='Links')return;
    item={...item,links:value};body.replaceChildren();
    for(const link of value){const a=document.createElement('a');a.href=link.href;a.textContent=[link.name,link.label,link.bio,link.detail].filter(Boolean).join('. ');a.target='_blank';a.rel='noopener noreferrer';body.append(a);}
    changed();
  }
  function wrappedText(text,x,y,width,size=34,color=ink.white,lineHeight=size*1.3){
    c.font=`${size}px Arial`;c.fillStyle=color;c.textAlign='left';c.textBaseline='alphabetic';
    let lineText='';for(const word of text.split(/\s+/)){
      const next=lineText?lineText+' '+word:word;
      if(lineText&&c.measureText(next).width>width){c.fillText(lineText,x,y);y+=lineHeight;lineText=word;}else lineText=next;
    }
    if(lineText)c.fillText(lineText,x,y);return y+lineHeight;
  }
  function drawProfilePreview(){
    const focused=Array.from(body.children).indexOf(document.activeElement);
    const selected=item.links.findIndex(link=>link.href===hot);
    const index=focused>=0?focused:selected>=0?selected:Math.max(0,item.links.findIndex(link=>link.icon==='github'));
    const profile=item.links[index],nodes=sectionLayouts.links.nodes;
    drawIcon(c,profile.icon,270,158,48,ink.white);
    c.font='38px Arial';c.fillStyle=ink.white;c.textAlign='left';c.fillText(profile.name,310,158);
    c.font='27px Arial';c.fillStyle=ink.dim;c.fillText(profile.label,310,197);
    wrappedText(profile.bio||'',90,320,350,38,ink.white,46);
    if(profile.metrics){profile.metrics.forEach((metric,i)=>{const x=110+i*180;drawIcon(c,metric.icon,x,490,30,ink.dim);c.fillStyle=ink.gold;c.font='38px Arial';c.fillText(String(metric.value),x+28,503);c.fillStyle=ink.dim;c.font='22px Arial';c.fillText(metric.label,x-10,542);});}
    else if(profile.detail)wrappedText(profile.detail,90,490,340,30,ink.gold,38);
    line(95,555,195,555,ink.dim);line(195,555,nodes[index][0]-44,nodes[index][1],ink.faint);
    links=item.links.map((link,i)=>{
      const [x,y]=nodes[i],active=i===index;
      c.strokeStyle=active?ink.gold:ink.dim;c.lineWidth=active?2:1;c.beginPath();c.arc(x,y,34,0,Math.PI*2);c.stroke();
      drawIcon(c,link.icon,x,y,36,active?ink.white:ink.dim);
      if(active)line(x-14,y+47,x+14,y+47,ink.gold,3);
      return {x:x-56,y:y-52,w:112,h:104,node:link.href};
    });
    root.dataset.previewProfile=profile.icon;
  }
  function drawAboutPreview(){
    c.fillStyle=ink.white;c.font='40px Arial';c.textAlign='left';c.fillText('About this HUD',245,145);
    wrappedText(article.querySelector('p').textContent,80,300,460,36,ink.white,44);
    const sourceLinks=Array.from(article.querySelectorAll('a'));
    const icons=['github','about','suit','audio'],names=['Source','Face','Armor','Audio'],nodes=sectionLayouts.about.nodes;
    for(let i=1;i<nodes.length;i++)line(...nodes[i-1],...nodes[i],ink.faint);
    links=sourceLinks.map((node,i)=>{
      const [x,y]=nodes[i],active=hot===node||document.activeElement===node;
      c.strokeStyle=active?ink.gold:ink.dim;c.beginPath();c.arc(x,y,29,0,Math.PI*2);c.stroke();
      drawIcon(c,icons[i],x,y,32,active?ink.gold:ink.white);
      c.font='23px Arial';c.fillStyle=ink.dim;c.textAlign='center';c.fillText(names[i],x,y+52);
      return {x:x-56,y:y-45,w:112,h:104,node};
    });c.textAlign='left';
  }
  function drawProfiles(){
    if(dock==='preview'){drawProfilePreview();return;}
    const row=(h-48)/4;
    c.textAlign='left';c.textBaseline='alphabetic';
    links=item.links.map((link,i)=>{
      const y=24+i*row,active=hot===link.href||document.activeElement===body.children[i];
      c.fillStyle=active?'rgba(242,163,83,.10)':'rgba(2,10,14,.58)';c.fillRect(20,y,600,row-10);
      line(22,y+row-10,616,y+row-10,active?ink.gold:ink.faint);
      line(22,y+16,22,y+row-26,active?ink.gold:ink.dim,2);
      drawIcon(c,link.icon,65,y+(row-10)/2,40,active?ink.gold:ink.white);
      c.fillStyle=ink.dim;c.font='17px Arial';c.fillText(link.name+(link.status==='live'?' · live':link.status?' · saved':''),108,y+24);
      c.fillStyle=ink.white;c.font='28px Arial';c.fillText(link.label,108,y+56);
      c.fillStyle=ink.dim;c.font='19px Arial';
      let text=link.bio||'';while(text.length&&c.measureText(text).width>465)text=text.slice(0,-2)+'…';
      c.fillText(text,108,y+84);
      if(link.detail){c.fillStyle=ink.gold;c.font='18px Arial';c.fillText(link.detail,108,y+112);}
      // A single outward stroke identifies the whole row as an external link.
      line(586,y+26,600,y+12,active?ink.gold:ink.dim);line(589,y+12,600,y+12);line(600,y+12,600,y+23);
      return {x:20,y,w:600,h:row-10,node:link.href};
    });
    c.textAlign='left';
  }
  function glyph(value,x,y,size=20){c.fillStyle=ink.white;c.font=`${size}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(value,x,y);c.textAlign='left';c.textBaseline='alphabetic';}
  function line(x1,y1,x2,y2,color=ink.dim,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function fade(){
    c.save();c.globalCompositeOperation='destination-in';let g=c.createLinearGradient(0,0,640,0);g.addColorStop(0,'transparent');g.addColorStop(.045,'black');g.addColorStop(.955,'black');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,640,h);
    g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'transparent');g.addColorStop(.045,'black');g.addColorStop(.955,'black');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,640,h);c.restore();
  }
  function layoutDocument(){
    documentRuns=[];documentLinks=[];documentMarks=[];
    const base=article.getBoundingClientRect(),top=article.scrollTop;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode,style=getComputedStyle(node.parentElement),range=document.createRange();
      const font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const append=(text,r)=>documentRuns.push({text,font,color:style.color,x:r.x-base.x,y:r.y-base.y+top,height:r.height,width:r.width,baseline:parseFloat(style.fontSize)*.89,link:!!node.parentElement.closest('a')});
      for(const word of node.textContent.matchAll(/\S+/g)){
        range.setStart(node,word.index);range.setEnd(node,word.index+word[0].length);
        const rects=[...range.getClientRects()];
        if(rects.length===1){append(word[0],rects[0]);continue;}
        // A hyphenated word may wrap. Paint only the characters belonging to
        // each native line, rather than repainting the complete word per rect.
        let run=null;
        for(let i=0;i<word[0].length;i++){
          range.setStart(node,word.index+i);range.setEnd(node,word.index+i+1);
          const r=range.getBoundingClientRect();
          if(!run||Math.abs(r.y-run.y)>.5){if(run)append(run.text,run);run={text:'',x:r.x,y:r.y,height:r.height,width:0};}
          run.text+=word[0][i];run.width=r.right-run.x;
        }
        if(run)append(run.text,run);
      }
    }
    for(const a of article.querySelectorAll('a'))for(const r of a.getClientRects())documentLinks.push({x:r.x-base.x,y:r.y-base.y+top,w:r.width,h:r.height,node:a});
    for(const q of article.querySelectorAll('blockquote')){const r=q.getBoundingClientRect();documentMarks.push({x:r.x-base.x,y:r.y-base.y+top,h:r.height,quote:true});}
    for(const li of article.querySelectorAll('li')){const r=li.getBoundingClientRect();documentMarks.push({x:r.x-base.x-14,y:r.y-base.y+top+parseFloat(getComputedStyle(li).fontSize)*.55,hollow:item.id==='cv'});}
    if(item.id==='cv')for(const heading of article.querySelectorAll('h1,h2')){const r=heading.getBoundingClientRect();documentMarks.push({x:r.x-base.x,y:r.bottom-base.y+top-3,w:r.width,rule:true});}
  }
  function drawDocument(){
    const top=article.scrollTop;links=documentLinks.map(l=>({...l,y:l.y-top}));
    c.textAlign='left';c.textBaseline='alphabetic';
    for(const run of documentRuns){
      const y=run.y-top;if(y+run.height<0||y>h)continue;
      c.font=run.font;c.fillStyle=run.color;c.fillText(run.text,run.x,y+run.baseline);
      if(run.link)line(run.x,y+run.height,run.x+run.width,y+run.height,run.color);
    }
    for(const l of links)if(document.activeElement===l.node){c.strokeStyle=ink.white;c.strokeRect(l.x-2,l.y-2,l.w+4,l.h+4);}
    for(const mark of documentMarks){const y=mark.y-top;if(mark.rule){if(y>=0&&y<=h)line(mark.x,y,mark.x+mark.w,y,ink.dim,1.3);}else if(mark.quote)line(mark.x,y,mark.x,y+mark.h,ink.gold,2);else if(y>=0&&y<=h){if(mark.hollow){c.beginPath();c.arc(mark.x,y,4,0,Math.PI*2);c.strokeStyle=ink.dim;c.lineWidth=1.5;c.stroke();}else glyph('•',mark.x,y,18);}}

    const max=article.scrollHeight-article.clientHeight;
    readingSlider.value=String(Math.round(top/Math.max(1,max)*100));
    if(max>0&&!(item.id==='cv'&&dock==='preview')){const thumb=Math.max(36,h*article.clientHeight/article.scrollHeight),y=top/max*(h-thumb);line(635,6,635,h-6,ink.faint,4);line(635,y+3,635,y+thumb-3,ink.white,5);}
    root.dataset.scrollTop=top.toFixed(1);root.dataset.scrollMax=String(max);
  }
  function drawChapters(){
    if(!article||(item.id==='cv'&&dock==='preview'))return;const top=article.scrollTop;
    sections.forEach((section,i)=>{const sy=chapterSlot(i),selected=top>=section.y-2&&(i===sections.length-1||top<sections[i+1].y-2),focused=document.activeElement?.dataset.chapter===String(i);c.strokeStyle=selected?ink.gold:hot==='chapter:'+i||focused?ink.white:ink.dim;c.lineWidth=selected?2:1;c.beginPath();c.arc(675,sy,24,0,Math.PI*2);c.stroke();drawIcon(c,section.icon,675,sy,28,c.strokeStyle);});
  }
  function scrollTo(value){if(!article)return;article.scrollTop=Math.max(0,Math.min(article.scrollHeight-article.clientHeight,value));changed();}
  function dragScrollbar(p){
    if(!article||!p)return;
    const max=article.scrollHeight-article.clientHeight,thumb=Math.max(36,h*article.clientHeight/article.scrollHeight);
    scrollTo((p.y-(down?.scrollOffset??thumb/2))/(h-thumb)*max);
  }
  function drawMediaMetadata(){
    const presentations=youtube?.titles||[];
    const compact=n=>Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(n).toLowerCase();
    function draw(placement,alpha,sourceHeight=h){
      c.save();c.scale(1,h/sourceHeight);c.globalAlpha=alpha;
      for(const presentation of presentations){
        const itemData=item.videos.find(v=>v.id===presentation.id),data=videoMetadata.find(v=>v.id===presentation.id);
        const entries=itemData?.kind==='Audio'?[{icon:'audio',text:'1.5 s'}]:data?[
          {icon:'views',text:compact(data.views)},...(data.likes===null?[]:[{icon:'like',text:compact(data.likes)}]),
          {icon:'clock',text:`${Math.floor(data.duration/60)}:${String(data.duration%60).padStart(2,'0')}`},
        ]:itemData?.duration?[{icon:'clock',text:`${Math.floor(itemData.duration/60)}:${String(Math.floor(itemData.duration%60)).padStart(2,'0')}`}]:[];
        c.save();c.globalAlpha*=presentation.alpha;
        entries.forEach((entry,i)=>{
          const positions=placement==='preview'?[[280,150],[475,210],[120,650]]:[[95,450],[325,450],[525,450]];
          const [x,y]=positions[i];drawIcon(c,entry.icon,x,y,26,ink.dim);c.font='30px Arial';c.fillStyle=i===1?ink.gold:ink.white;c.textAlign='left';c.fillText(entry.text,x+24,y+10);
        });c.restore();
      }c.restore();
    }
    if(docking){const t=transferPhase(performance.now(),docking).travel;draw(docking.from.blend<.5?'preview':'expanded',Math.max(0,1-t/.3),docking.from.height);draw(dock,Math.max(0,(t-.7)/.3));}
    else draw(dock,1);
  }
  function paint(){
    c.clearRect(0,0,canvas.width,canvas.height);
    // A quiet tinted backing preserves contrast over the illuminated cheek.
    // Keep the Face visible around the content and through the frame itself.
    if(article&&item.id==='cv'&&(dock==='expanded'||docking)){const weight=docking?THREE.MathUtils.lerp(docking.from.blend,dockBlend,transferPhase(performance.now(),docking).travel):1;c.fillStyle=`rgba(2,10,14,${.82*weight})`;c.fillRect(0,0,canvas.width,h);}
    if(item.kind==='Links'){
      drawProfiles();
    }else if(item.kind==='Video'){
      drawMediaMetadata();
    }else if(item.kind==='Audio'){
      const mid=h/2;line(24,mid,620,mid,ink.faint);
      if(analyser){analyser.getByteTimeDomainData(signal);c.strokeStyle=ink.white;c.lineWidth=2;c.beginPath();signal.forEach((value,i)=>{const x=24+i/(signal.length-1)*596,y=mid+(value-128)/128*h*1.8;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();}
      if(media.paused)glyph('▶',320,mid,24);
      const progress=Number.isFinite(media.duration)?media.currentTime/media.duration:0;line(24,h-20,24+596*progress,h-20,ink.gold,2);fade();
    }else if(article){if(item.id==='about'&&dock==='preview')drawAboutPreview();else{drawDocument();fade();}}
    drawChapters();
    if(dock==='expanded'&&item.id==='cv'){drawIcon(c,'cv',675,h-66,28,ink.white);c.strokeStyle=ink.dim;c.beginPath();c.arc(675,h-66,24,0,Math.PI*2);c.stroke();}
    if(dock==='expanded'&&item.id==='cv'){line(6,22,6,5);line(6,5,65,5);line(573,h-5,634,h-5);line(634,h-5,634,h-22);}
    if(document.activeElement===playButton){c.strokeStyle=ink.white;c.strokeRect(13,h-39,30,32);}

    playButton.textContent=`${media?.paused?'Play':'Pause'} ${item.kind==='Video'?'movie dialogue':item.kind.toLowerCase()}`;
    if(item.kind!=='Video')root.dataset.mediaPlaying=String(!!media&&!media.paused);if(item.kind!=='Video')root.dataset.mediaTime=media?media.currentTime.toFixed(3):'0';
    texture.needsUpdate=true;dirty=false;root.dataset.texturePaints=String(++paints);
  }
  function hitAt(x,y){
    if(!item||closing||docking||!mesh.visible||(dock==='preview'&&previewPresence<.98))return null;
    const r=stage.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2);ray.setFromCamera(pointer,camera);
    // UVs address the fixed texture, including when the visible content is shorter.
    const hit=ray.intersectObject(mesh)[0];return hit?{x:hit.uv.x*canvas.width,y:(1-hit.uv.y)*canvas.height}:null;
  }
  function target(p){
    if(!p||item.kind==='Model')return null;if(article&&!(item.id==='cv'&&dock==='preview')&&p.x>650&&p.x<700){const i=Math.round((p.y-chapterSlot(0))/88);if(i>=0&&i<sections.length&&Math.abs(p.y-chapterSlot(i))<28)return 'chapter:'+i;}if(article&&!(item.id==='cv'&&dock==='preview')&&p.x>622&&p.x<648&&article.scrollHeight>article.clientHeight)return 'scrollbar';if(p.x>=640)return null;
    if(item.kind==='Video')return null;
    if(item.kind==='Audio')return 'play';return links.find(link=>p.x>=link.x&&p.x<=link.x+link.w&&p.y>=link.y&&p.y<=link.y+link.h)?.node||(article&&!(item.id==='about'&&dock==='preview')?'document':null);
  }
  stage.addEventListener('pointermove',e=>{if(e.target.closest('[data-ui]'))return;const position=hitAt(e.clientX,e.clientY);if(down?.target==='scrollbar'&&e.buttons)dragScrollbar(position||{y:down.py+(e.clientY-down.y)*h/renderedHeight});const next=target(position);if(next!==hot){hot=next;dirty=true;wake();}if(next)e.hudContentCursor=next==='document'?'text':'pointer';},{capture:true});
  stage.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('[data-ui]'))return;const p=hitAt(e.clientX,e.clientY),t=target(p);if(t){down={target:t,at:performance.now(),x:e.clientX,y:e.clientY};if(t==='scrollbar'){const thumb=Math.max(36,h*article.clientHeight/article.scrollHeight),top=article.scrollTop/(article.scrollHeight-article.clientHeight)*(h-thumb);down.scrollOffset=p.y>=top&&p.y<=top+thumb?p.y-top:thumb/2;down.py=p.y;dragScrollbar(p);stage.setPointerCapture(e.pointerId);}e.stopImmediatePropagation();}},{capture:true});
  stage.addEventListener('click',e=>{
    if(e.target.closest('[data-ui]'))return;
    const p=hitAt(e.clientX,e.clientY),current=target(p),t=down&&performance.now()-down.at<1200&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<12?down.target:current;down=null;
    if(!t)return;e.preventDefault();e.stopImmediatePropagation();
    if(typeof t==='string'&&t.startsWith('chapter:'))scrollTo(sections[Number(t.slice(8))].y);else if(t==='scrollbar'){}else if(t==='play')toggleMedia();
    else if(t==='document')article.focus({preventScroll:true});else if(typeof t==='string')window.open(t,'_blank','noopener,noreferrer');else t.click();
  },{capture:true});
  stage.addEventListener('pointerup',e=>{if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);},{capture:true});
  stage.addEventListener('wheel',e=>{
    if(item?.kind==='Video'&&hitAt(e.clientX,e.clientY)){e.preventDefault();e.stopImmediatePropagation();youtube?.scroll(e.deltaY*(e.deltaMode===1?24:1));return;}
    if(article&&!(item.id==='about'&&dock==='preview')&&hitAt(e.clientX,e.clientY)){
      e.preventDefault();e.stopImmediatePropagation();
      const units=e.deltaMode===1?32:e.deltaMode===2?h:e.deltaY===0?0:1;
      const delta=e.deltaY*units/Math.max(.25,renderedHeight/h);scrollTo(article.scrollTop+Math.sign(delta)*Math.min(Math.abs(delta),h*.45));
    }
  },{capture:true,passive:false});
  function formPoint(u,v,form){
    const {width,height,position,blend}=form;
    const x=position.x+(u*(form.textureWidth??640)/640-.5)*width,y=position.y+(.5-v)*width*height/640;
    const destinationPoint=new THREE.Vector3(x,y,.166-(x*x+y*y)/.8);
    const p=sectionPreviewPoint(item?.id,u,v,height/640),bounds=layout.menuBounds;
    const sx=THREE.MathUtils.lerp(bounds[0],bounds[1],p.x/hudLayout.width),sy=THREE.MathUtils.lerp(bounds[3],bounds[2],p.y/hudLayout.height)-1.619;
    const result=new THREE.Vector3(sx,sy,diagnosticDepth(sx,sy)+.004).lerp(destinationPoint,blend);
    if(form.presence!==undefined&&form.presence<1){const centre=formPoint(.5,.5,{...form,presence:1});result.sub(centre).multiplyScalar(.94+.06*form.presence).add(centre);result.y-=.003*(1-form.presence);result.z-=.006*(1-form.presence);}
    if(form.offset)result.add(form.offset);return result;
  }
  function mediaRect(){const r=dock==='preview'?sectionLayouts.video.player:{left:0,top:0,width:640,height:404};return {x:r.left/visibleWidth(),y:r.top/h,w:r.width/visibleWidth(),h:r.height/h};}
  function currentForm(){return {mediaRect:mediaRect(),width:contentWidth,height:h,textureWidth:visibleWidth(),position:destination,blend:dockBlend,presence:dock==='preview'&&!docking?previewPresence:1};}
  function surfacePoint(u,v,final=false,sourceUV=null){
    const form=currentForm(),to=formPoint(u,v,form);
    if(docking&&!final){
      const t=transferPhase(performance.now(),docking).travel;
      const center=formPoint(.5,.5,docking.from).lerp(formPoint(.5,.5,form),t);
      to.copy(formPoint(sourceUV?.[0]??u,sourceUV?.[1]??v,docking.from).lerp(to,t)).sub(center).multiplyScalar(1-(docking.kind==='swap'?.30:.12)*Math.sin(Math.PI*t)).add(center);
      to.y+=(dock==='expanded'?.012:-.014)*Math.sin(Math.PI*t);
    }
    return point.copy(to).add(fitOffset);
  }
  function tick(){
    if(!item)return;
    youtube?.tick();
    if(docking&&transferPhase(performance.now(),docking).done)docking=null;
    if(animation){const t=Math.max(0,Math.min(1,(performance.now()-animation.at)/280));amount=animation.from+(animation.to-animation.from)*(1-Math.pow(1-t,3));if(t===1)animation=null;}
    if(closing&&amount<=0){release();root.hidden=true;mesh.visible=expandedFrame.mesh.visible=expandedGutter.mesh.visible=false;root.dataset.open='false';root.dataset.mediaPlaying='false';item=null;return;}
    const presence=dock==='preview'&&!docking?previewPresence:1;
    if(presence<=.001){material.opacity=0;mesh.visible=expandedFrame.mesh.visible=expandedGutter.mesh.visible=false;root.hidden=true;if(presented){media?.pause();youtube?.pause();}youtube?.setPresentation(0);presented=false;return;}
    root.hidden=false;presented=true;
    const r=stage.getBoundingClientRect();fitOffset.set(0,0,0);
    // Keep the entire expanded surface (including its control gutter) inset
    // from the viewport. The same correction drives pixels and hit targets.
    if(dockBlend>0)for(let pass=0;pass<2;pass++){
      mediaPoints=[];
      const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>{const p=surfacePoint(u,v).clone().applyMatrix4(getFrame()).project(camera);return {x:(p.x+1)*r.width/2,y:(1-p.y)*r.height/2};});
      const button=surfacePoint(.5,1).clone();button.y-=.012;button.applyMatrix4(getFrame()).project(camera);
      corners.push({x:(button.x+1)*r.width/2,y:(1-button.y)*r.height/2+24});
      root.dataset.screenBounds=JSON.stringify({left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x))});
      const shift=viewportShift(corners,Math.min(r.width,getRightBoundary()+30),r.height);
      // Portrait layouts put the last left-menu target below the right panel.
      // Keep content above that row while its return button can sit beside it.
      if(r.width<900&&item.kind!=='Model'){
        const menu=[...stage.querySelectorAll('#instrumentControls button:not([aria-expanded="true"])')].filter(b=>!b.hidden).map(b=>b.getBoundingClientRect().top-r.top);
        if(menu.length)shift.y=Math.min(shift.y,Math.min(...menu)-14-Math.max(...corners.slice(0,4).map(p=>p.y)));
      }
      if(!shift.x&&!shift.y)break;
      const center=surfacePoint(.5,.5).clone(),adjusted=center.clone().applyMatrix4(getFrame()).project(camera);
      adjusted.x+=shift.x*2/r.width*dockBlend;adjusted.y-=shift.y*2/r.height*dockBlend;
      adjusted.unproject(camera).applyMatrix4(inverseFrame.copy(getFrame()).invert());fitOffset.add(adjusted.sub(center));
    }
    for(let row=0;row<=rows;row++)for(let i=0;i<=columns;i++)surfacePoint(i/columns,row/rows).toArray(positions,(row*(columns+1)+i)*3);
    geometry.attributes.position.needsUpdate=true;geometry.computeBoundingSphere();mesh.matrix.identity();mesh.updateMatrixWorld(true);mesh.visible=item.kind!=='Model';material.opacity=amount*(docking?THREE.MathUtils.lerp(docking.from.opacity??1,1,transferPhase(performance.now(),docking).travel):presence);
    expandedFrame.mesh.visible=item.id==='cv'&&(dockBlend>0||!!docking);
    expandedGutter.mesh.visible=expandedFrame.mesh.visible&&item.id==='cv';
    for(const part of frameParts)if(part.mesh.visible){part.updateProjection();part.mesh.matrix.identity();part.mesh.updateMatrixWorld(true);part.mesh.material.opacity=amount*(docking?THREE.MathUtils.lerp(docking.from.blend,dockBlend,transferPhase(performance.now(),docking).travel):dockBlend);}

    if(dirty||docking||youtube?.needsFrame||(media&&!media.paused))paint();
    root.dataset.expansion=amount.toFixed(3);root.dataset.surfaceShape=dockBlend<.5?'visor-aligned-document':'curved-display';
    root.dataset.docking=String(!!docking);root.dataset.dockBlend=dockBlend.toFixed(3);
    const project=(u,v)=>{surfacePoint(u,v).applyMatrix4(getFrame()).project(camera);return {x:Math.round(r.left+(point.x+1)*r.width/2),y:Math.round(r.top+(1-point.y)*r.height/2)};};
    renderedHeight=Math.abs(project(.5,1).y-project(.5,0).y);
    const vw=visibleWidth();
    youtube?.setPresentation(material.opacity,!docking&&presence>.98);
    if(youtube?.visible){
      const rect=mediaRect(),source=docking?.from.mediaRect??rect;
      mediaPoints=[];
      const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>{
        surfacePoint(rect.x+u*rect.w,rect.y+v*rect.h,false,[source.x+u*source.w,source.y+v*source.h]);
        mediaPoints.push(point.x,point.y,point.z);
        point.applyMatrix4(getFrame()).project(camera);
        return {x:r.left+(point.x+1)*r.width/2,y:r.top+(1-point.y)*r.height/2};
      });
      youtube.position(corners);
      root.dataset.mediaCorners=JSON.stringify(corners);

    }
    root.dataset.chapterTargets=JSON.stringify(item.id==='cv'&&dock==='preview'?[]:sections.map((s,i)=>({...project(675/vw,chapterSlot(i)/h),label:s.label})));
    root.dataset.linkTargets=JSON.stringify(links.filter(link=>link.y>=0&&link.y+link.h<=h).map(link=>({...project((link.x+link.w/2)/vw,(link.y+link.h/2)/h),href:typeof link.node==='string'?link.node:link.node.href})));
    root.dataset.targets=JSON.stringify({play:project(28/vw,(h-23)/h),center:project(320/vw,.5),scroll:project(400/vw,.5),scrollbar:project(635/vw,.5),seek:project(315/vw,(h-23)/h),mute:project(610/vw,(h-23)/h)});
    const nativeTargets=dock==='preview'?[...controlTargets]:[...sections.map((section,i)=>({...project(675/vw,chapterSlot(i)/h),key:section.key}))];
    if(item.id==='cv'&&dock==='expanded')nativeTargets.push({...project(675/vw,(h-66)/h),key:'cv:pdf'});
    if(media)nativeTargets.push({...project((item.kind==='Video'?(dock==='preview'?385:320):28)/vw,(item.kind==='Video'?(dock==='preview'?sectionLayouts.video.audioY:450):h-23)/h),size:item.kind==='Video'?24:44,key:'play'});
    actions.querySelectorAll('button[data-control]').forEach(b=>{b.disabled=!!docking||presence<.98;const target=nativeTargets.find(t=>t.key===b.dataset.control);projectControl(b,target?{...target,size:target.size??targetSize(target,nativeTargets)}:null);});
  }
  function setPlacement(next,transfer){
    if(!item)return;
    const from={...currentForm(),position:destination.clone(),offset:fitOffset.clone(),opacity:material.opacity};
    const progress=article?article.scrollTop/Math.max(1,article.scrollHeight-article.clientHeight):0;
    let chapter=-1;sections.forEach((section,i)=>{if(article.scrollTop>=section.y-2)chapter=i;});
    const anchor=chapter<0?null:{chapter,fraction:(article.scrollTop-sections[chapter].y)/Math.max(1,(sections[chapter+1]?.y??article.scrollHeight-article.clientHeight)-sections[chapter].y)};
    dock=next;root.dataset.placement=next;
    readingSlider.hidden=item.id!=='cv'||next!=='preview';
    pdfButton.hidden=item.id!=='cv';
    if(article){
      h=next==='preview'?previewHeight:expandedHeight();article.style.height=`${h}px`;
      updateUV();
      article.scrollTop=progress*Math.max(0,article.scrollHeight-article.clientHeight);layoutDocument();
      const base=article.getBoundingClientRect();
      sections.forEach((section,i)=>{const node=article.querySelectorAll('h2')[i];section.y=node.getBoundingClientRect().top-base.top+article.scrollTop-20;});
      if(anchor){const start=sections[anchor.chapter].y,end=sections[anchor.chapter+1]?.y??article.scrollHeight-article.clientHeight;article.scrollTop=progress>=.999?article.scrollHeight-article.clientHeight:start+anchor.fraction*Math.max(1,end-start);}
    }
    if(!article&&item.kind!=='Model')h=next==='preview'?previewHeight:expandedHeight();
    updateUV();
    const p=item.kind==='Model'&&next==='expanded'?[.095,-.006,.095]:(next==='preview'?layout.preview:layout.content);
    destination.set(p[0],p[1],.115);contentWidth=p[2];dockBlend=next==='expanded'?1:0;
    docking=reduced?null:{at:transfer?.at??performance.now(),kind:transfer?.kind??'expand',from};
    dirty=true;wake();
  }
  return {get motionSamples(){return item?[{id:'panel:'+item.id,visible:mesh.visible&&material.opacity>.05,opacity:material.opacity,points:[0,columns,rows*(columns+1),(rows+1)*(columns+1)-1].flatMap(i=>Array.from(positions.slice(i*3,i*3+3)))},...(youtube?.visible?[{id:'player:video',visible:material.opacity>.05,points:mediaPoints}]:[])]:[];},open,close,clear,tick,setPlacement,updateLinks,revealAfter(at){if(!reduced){amount=0;animation={at,from:0,to:1};wake();}},
    get glowSource(){return item&&mesh.visible&&material.opacity>.001?{id:'content:'+item.id,position:surfacePoint(.5,.5).applyMatrix4(getFrame()),color:0xc3e2ff,power:item.id==='cv'?.024:.012,strength:material.opacity}:null;},
    get layoutOffset(){return fitOffset;},
    get buttonAnchor(){if(!item||dock!=='expanded')return null;const p=surfacePoint(.5,1,true).clone();p.y-=.012;return p;},
    setPreviewPresence(value){previewPresence=value;},suspend(){media?.pause();youtube?.pause();},
    setControlTargets(value){controlTargets=value;},
    scrollToProgress(value){if(article)scrollTo(value*Math.max(0,article.scrollHeight-article.clientHeight));},
    jumpToChapter(index){if(sections[index])scrollTo(sections[index].y);},
    openOriginal(){article?.querySelector('.cv-download a')?.click();},
    get readingState(){if(item?.id!=='cv'||!article||closing)return null;const max=Math.max(1,article.scrollHeight-article.clientHeight),progress=article.scrollTop/max;let chapter=0;sections.forEach((s,i)=>{if(article.scrollTop>=s.y-2)chapter=i;});if(max-article.scrollTop<=1&&sections.length)chapter=sections.length-1;const active=document.activeElement,focus=active===readingSlider?'cv:progress':active?.dataset.chapter!==undefined?'cv:chapter:'+active.dataset.chapter:null;return {progress,chapter,focus};},
    scrollBy:delta=>scrollTo((article?.scrollTop||0)+Math.sign(delta)*Math.min(Math.abs(delta)/Math.max(.25,renderedHeight/h),h*.45)),nextVideo:delta=>youtube?.scroll(delta),toggleMedia,get itemId(){return item?.id;},get isOpen(){return !!item&&!closing;},get needsFrame(){return !!animation||!!docking||!!youtube?.needsFrame||!!(media&&!media.paused);}};
}
