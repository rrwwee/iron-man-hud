import * as THREE from 'three';
import {referenceToVisor,diagnosticDepth} from './hud-reference-model.js?v=selector-3';
import {loadPublicProfile} from './public-profile.js?v=rory-29f';
import {createHUDVolumes} from './hud-volumes.js?v=local-media-1';
import {createHUDContentSurface} from './hud-content-surface.js?v=profile-list-3';
import {createVisorMenu} from './visor-menu-3d.js?v=single-hud-1';
import {createHUDAttitude} from './hud-attitude.js?v=tracking-sphere-1';
import {createHUDSelection} from './hud-selection.js?v=rory-29f';
import {transferPhase,transferDuration} from './hud-transfer.js?v=rory-29f';
import {entries as content} from './site-content.js?v=public-release-1';
import {createMotionAudit} from './hud-motion-audit.js?v=rory-29f';
import {createPreviewTransition} from './hud-preview-transition.js?v=rory-29f';
import {projectControl} from './hud-control-targets.js?v=rory-29f';

const social=[
 {icon:'x',name:'X',label:'@rrwwe_e',bio:'Notes, ideas and conversations',href:'https://x.com/rrwwe_e'},
 {icon:'linkedin',name:'LinkedIn',label:'Rory Collins',bio:'AI · Physics · Software development',href:'https://www.linkedin.com/in/roryfcollins/'},
 {icon:'github',name:'GitHub',label:'rrwwee',bio:'Open source and personal projects',href:'https://github.com/rrwwee'},
 {icon:'codex',name:'Codex',label:'rrwwee',bio:'Building with Codex',href:'https://chatgpt.com/u/rrwwee'},
];
const entries=[
 {id:'suit',label:'Activity',kind:'Model'},
 {id:'globe',label:'Flight history',kind:'Model'},
 {...content.find(v=>v.id==='video'),label:'Media'},
 content.find(v=>v.id==='cv'),content.find(v=>v.id==='about'),
 {id:'links',label:'Personal links',kind:'Links',links:social},
];
export function createSiteNavigation({wake,invalidate,scene,camera}){
 const stage=document.getElementById('stage');document.body.classList.add('spatial-hud');document.body.dataset.navigation='radial';
 const slots=createHUDSelection(entries.map(v=>v.id));
 let spatial,volumes,previewSurface=null,expandedSurface=null,attitude,lastWheel=0,visible=true,transfer=null;
 const surfaces=new Map(),previewMotion=createPreviewTransition(slots.selected);let shownSection=null;
 const audit=new URLSearchParams(location.search).has('motionAudit')?createMotionAudit(stage,()=>[...volumes.motionSamples,...[...surfaces.values()].flatMap(view=>view.motionSamples),...spatial.motionSamples]):null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const moving=()=>transfer&&!transferPhase(performance.now(),transfer).done;
 function beginTransfer(moved,returned,kind){transfer={at:performance.now(),moved,returned,kind};if(reduced)transfer.at-=transferDuration;spatial.beginTransfer(transfer);volumes.beginTransfer(transfer);stage.dataset.transferring='true';audit?.start(transfer);}
 const controls=document.createElement('nav');controls.className='spatial-shortcuts';controls.id='instrumentControls';controls.dataset.ui='';controls.setAttribute('aria-label','HUD');stage.append(controls);
 function button(label,fn,key){const b=document.createElement('button');b.textContent=label;b.dataset.control=key;b.onclick=fn;b.onfocus=()=>spatial?.focus(key);b.onblur=()=>spatial?.focus(null);controls.append(b);return b;}
 const buttons=entries.map(item=>button(item.label,()=>activate(item.id),'select:'+item.id));
 controls.addEventListener('keydown',e=>{
   if(!e.target.dataset.control?.startsWith('select:')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   const choices=buttons.filter(b=>b.dataset.control!=='select:'+slots.expanded),index=choices.indexOf(e.target);
   const next=e.key==='Home'?0:e.key==='End'?choices.length-1:(index+(e.key==='ArrowRight'?1:-1)+choices.length)%choices.length;
   e.preventDefault();e.stopPropagation();choices[next].focus({preventScroll:true});
 });
 let profile=null,profileKey='';
 loadPublicProfile().then(value=>{profile=value;wake();});
 function itemFor(id){
   if(id!=='links')return entries.find(x=>x.id===id);
   const codex=spatial?.activity?.codex;
   return {...entries.find(x=>x.id===id),links:social.map(link=>{
     if(link.icon==='github'&&profile)return {...link,bio:profile.bio||link.bio,metrics:[{icon:'about',value:profile.followers,label:'followers'},{icon:'cv',value:profile.public_repos,label:'repositories'}],detail:`${profile.followers} followers · ${profile.public_repos} repositories`,status:profile.status};
     if(link.icon==='codex'&&Number.isFinite(codex?.lifetimeTokens))return {...link,detail:`${Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(codex.lifetimeTokens)} tokens · ${codex.currentStreakDays} day streak`,status:'snapshot'};
     return link;
   })};
 }

 function refresh(){
   const list=slots.available.map(id=>entries.find(v=>v.id===id));
   buttons.forEach(b=>{const id=b.dataset.control.slice(7);b.hidden=false;b.textContent=id===slots.expanded?'Return '+entries.find(v=>v.id===id).label+' to the menu':entries.find(v=>v.id===id).label;b.setAttribute('aria-current',String(id===slots.selected||id===slots.expanded));b.setAttribute('aria-expanded',String(id===slots.expanded));if(id===slots.selected)b.setAttribute('aria-description','Activate again to move this window to the right');else b.removeAttribute('aria-description');});
   spatial.update({entries:list,selected:list.findIndex(v=>v.id===slots.selected),expandedId:slots.expanded});
   spatial.setExpanded(!!slots.expanded);volumes?.setMode(slots.selected);volumes?.setExpanded(['suit','globe'].includes(slots.expanded),slots.expanded);
   Object.assign(stage.dataset,{selectedSection:slots.selected,expandedSection:slots.expanded||'',availableSections:slots.available.join(',')});wake();
 }
 function viewFor(id){
   let view=surfaces.get(id);
   if(!view){view=surface('hud-'+id);surfaces.set(id,view);}
   if(!view.isOpen)view.open(itemFor(id),spatial.contentAnchor(),'preview');
   return view;
 }
 function showLeft(){
   const id=slots.selected;
   if(shownSection&&shownSection!==id&&!moving())audit?.start({at:performance.now(),kind:'preview',moved:id,returned:shownSection,duration:440});
   shownSection=id;
   previewMotion.select(id,performance.now(),transfer,reduced);
   previewSurface=['suit','globe'].includes(id)?surfaces.get(id)||null:viewFor(id);
   expandedSurface=slots.expanded?surfaces.get(slots.expanded)||null:null;
   refresh();
 }
 function activate(id){if(moving())return;if(id===slots.expanded)closeExpanded();else if(id===slots.selected)expand();else if(slots.select(id))showLeft();}
 function browse(delta){if(moving())return;const now=performance.now();if(Math.abs(delta)<2||now-lastWheel<180)return;lastWheel=now;slots.browse(Math.sign(delta));showLeft();}
 function closeExpanded(){
   if(!slots.expanded||moving())return;
   const returned=slots.expanded;beginTransfer(null,returned,'return');slots.close();
   viewFor(returned).setPlacement('preview',transfer);showLeft();
 }
 function expand(){
   if(moving())return;
   const id=slots.selected,returned=slots.expanded;
   beginTransfer(id,returned,returned?'swap':'expand');slots.expand();
   viewFor(id).setPlacement('expanded',transfer);
   if(returned)viewFor(returned).setPlacement('preview',transfer);
   showLeft();
 }
 function previewScroll(delta){
   if(moving())return;
   if(slots.selected==='suit')volumes.adjustExplosion(delta);
   else if(slots.selected==='globe'){const now=performance.now();if(now-lastWheel>180){lastWheel=now;volumes.step(Math.sign(delta));}}
   else if(slots.selected==='video')previewSurface?.nextVideo(delta);
   else previewSurface?.scrollBy(delta);
 }
 function choose(key){
   if(moving())return;
   if(key.startsWith('select:'))activate(key.slice(7));
   else if(key.startsWith('cv:chapter:'))previewSurface?.jumpToChapter(Number(key.slice(11)));
   else if(key==='cv:pdf')previewSurface?.openOriginal();
   else if(key.startsWith('cv:progress:'))previewSurface?.scrollToProgress(Number(key.slice(12)));
   else if(key==='data:github'||key==='data:codex')window.open(social.find(x=>x.icon===key.slice(5)).href,'_blank','noopener,noreferrer');
 }
 spatial=createVisorMenu({scene,camera,stage,wake,onChoose:choose,onBrowse:browse,onPreviewScroll:previewScroll});
 function surface(id){let view;view=createHUDContentSurface({scene,stage,camera,wake,getFrame:()=>spatial.frame,getRightBoundary:()=>attitude?.rightBoundary??Infinity,id,onClose:()=>{if(view===expandedSurface)closeExpanded();}});return view;}
 attitude=createHUDAttitude({scene,camera,stage});
 volumes=createHUDVolumes({scene,camera,stage,wake,getFrame:()=>spatial.frame,getExpandedOffset:()=>expandedSurface?.layoutOffset??{x:0,y:0,z:0},getPreviewWeights:()=>previewMotion.weights,getActivity:()=>spatial.activity,getHUDTarget:(x,y)=>spatial.hitTarget(x,y)});
 window.addEventListener('keydown',e=>{if(moving())return;if(e.defaultPrevented||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key!=='Escape'&&e.target.closest('.hud-document'))return;
   if(e.key==='ArrowLeft'||e.key==='Escape'){e.preventDefault();closeExpanded();}
   else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();slots.browse(e.key==='ArrowUp'?-1:1);showLeft();}
   else if(e.key==='ArrowRight'){e.preventDefault();expand();}
 });
 showLeft();invalidate();
 return {
   get glowSources(){const [x,y]=referenceToVisor(374,239);return visible?[{id:'selector',position:new THREE.Vector3(x,y,diagnosticDepth(x,y)).applyMatrix4(spatial.frame),color:0xff7942,power:.008,strength:1},...volumes.glowSources,...[...surfaces.values()].map(view=>view.glowSource).filter(Boolean)]:[];},
   setPose(x,y,eye){
     if(transfer&&transferPhase(performance.now(),transfer).done){const focus=transfer.moved||transfer.returned;transfer=null;buttons.forEach(b=>b.disabled=false);stage.dataset.transferring='false';buttons.find(b=>b.dataset.control==='select:'+focus)?.focus({preventScroll:true});}
     buttons.forEach(b=>b.disabled=!!transfer);
     const linkData=itemFor('links').links,key=JSON.stringify(linkData);
     if(key!==profileKey){profileKey=key;surfaces.get('links')?.updateLinks(linkData);}
     const weights=previewMotion.sample(performance.now());
     attitude.update(x,y,visible,!!slots.expanded,transfer);
     for(const [id,view] of surfaces){view.setPreviewPresence(weights[id]||0);view.tick();}
     volumes.setEyeAnchor(eye?.world);volumes.tick();spatial.setPreviewWeights(weights);
     spatial.setExpandedAnchor(expandedSurface?.buttonAnchor||volumes.buttonAnchor);
     spatial.setReadingState((weights.cv||0)>0?surfaces.get('cv')?.readingState:null);spatial.setPose();
     const targets=spatial.controlTargets;
     controls.querySelectorAll('button').forEach(b=>projectControl(b,targets.find(t=>t.key===b.dataset.control)));
     previewSurface?.setControlTargets(targets);audit?.sample();
   },
   setVisible(value){visible=value;spatial.setVisible(value);volumes.setVisible(value);if(!value)for(const view of surfaces.values())view.suspend();wake();},
   get needsFrame(){return visible&&(!!transfer||previewMotion.active||spatial.needsFrame||attitude.needsFrame||volumes.needsFrame||[...surfaces.values()].some(view=>view.needsFrame));},get isSpatial(){return true;},get isHovering(){return spatial.hovering;},get active(){return true;},get isOpen(){return false;},
 };
}
