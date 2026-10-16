// Only the owner's approved public projection crosses this boundary.
export function validateCodexActivity(input){
  const integer=n=>Number.isSafeInteger(n)&&n>=0;
  if(input?.schemaVersion!==1||!Number.isFinite(Date.parse(input.fetchedAt))||!Array.isArray(input.days)||input.days.length>30)throw new Error('Invalid Codex snapshot');
  if(input.lifetimeTokens!==null&&!integer(input.lifetimeTokens))throw new Error('Invalid token total');
  if(input.currentStreakDays!==null&&!integer(input.currentStreakDays))throw new Error('Invalid streak');
  const days=input.days.map(d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(Date.parse(d.date+'T00:00:00Z'))||new Date(d.date+'T00:00:00Z').toISOString().slice(0,10)!==d.date||!integer(d.tokens))throw new Error('Invalid daily tokens');return {date:d.date,tokens:d.tokens};}).sort((a,b)=>a.date.localeCompare(b.date));
  if(new Set(days.map(d=>d.date)).size!==days.length)throw new Error('Duplicate token day');
  return {schemaVersion:1,fetchedAt:input.fetchedAt,lifetimeTokens:input.lifetimeTokens,currentStreakDays:input.currentStreakDays,days:days.filter(d=>d.date>=new Date(Date.parse(input.fetchedAt.slice(0,10)+'T00:00:00Z')-29*86400000).toISOString().slice(0,10)&&d.date<=input.fetchedAt.slice(0,10))};
}
export function createCodexActivity(changed=()=>{}){
  let value={status:'unavailable',days:[],lifetimeTokens:null,currentStreakDays:null,fetchedAt:null};
  fetch('./assets/codex-public.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Unavailable');return r.json();}).then(raw=>{const data=validateCodexActivity(raw);value={...data,status:data.fetchedAt.slice(0,10)<new Date().toISOString().slice(0,10)?'stale':'fresh'};changed();}).catch(()=>changed());
  return {get value(){return value.fetchedAt?{...value,status:value.fetchedAt.slice(0,10)<new Date().toISOString().slice(0,10)?'stale':'fresh'}:value;}};
}
