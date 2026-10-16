// The approved recessed button row is the default. Explicit selector queries
// retain the historical A/B review routes; normal visits have no trial bar.
import {fromReference} from './hud-reference-model.js?v=selector-3';
const params=new URLSearchParams(location.search);
export const selectorPrototype=params.has('selector');
export const selectorButtons=params.get('selector')!=='arc';
export function buttonRowPoint(i){return fromReference(240-i*42,475+(i-2.5)**2*2.4);}
export const selectorRegions=[];
let stateLabel,links;
if(selectorPrototype){
  const bar=document.createElement('nav');bar.dataset.ui='';bar.setAttribute('aria-label','Selector prototype comparison');
  bar.style.cssText='position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:1000;display:flex;align-items:center;gap:14px;padding:10px 16px;background:#152026;border:1px solid #53707a;border-radius:24px;color:#e3f4f6;font:13px Arial;white-space:nowrap';
  const title=document.createElement('span');title.textContent='Selector trial';bar.append(title);
  links=['arc','buttons'].map((kind,i)=>{const a=document.createElement('a');const url=new URL(location.href);url.searchParams.set('selector',kind);a.href=url.href;a.textContent=i?'B · Button row':'A · Current arc';a.style.cssText=`color:${kind===(selectorButtons?'buttons':'arc')?'#f5c58b':'#b4cbd0'};text-decoration:none;padding:3px`;if(kind===(selectorButtons?'buttons':'arc'))a.setAttribute('aria-current','page');bar.append(a);return a;});
  stateLabel=document.createElement('output');stateLabel.style.cssText='font-size:11px;color:#9bb1b7';bar.append(stateLabel);
  bar.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();links[selectorButtons?0:1].click();}});document.body.append(bar);
}
export function updateSelectorTrial(state){if(!selectorPrototype)return;const item=state.entries[state.selected];stateLabel.textContent=`Left: ${item.label} · Right: ${state.expandedId||'none'}`;for(const a of links){const u=new URL(a.href);u.searchParams.set('sample',item.id);a.href=u.href;}}
