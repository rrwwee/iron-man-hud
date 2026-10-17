// Run locally with the owner's existing Codex and GitHub logins. Only the
// validated public statistics are sent to GitHub; the working tree is untouched.
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {validateCodexActivity} from '../prototypes/3d-face/codex-activity.js';

const endpoint='repos/rrwwee/iron-man-hud/contents/prototypes/3d-face/assets/codex-public.json';
const collector=fileURLToPath(new URL('../prototypes/3d-face/scripts/refresh_codex_activity.mjs',import.meta.url));
function github(method, payload){
  const args=['api',endpoint,'--method',method];
  if(payload)args.push('--input','-');
  return JSON.parse(execFileSync('gh',args,{input:payload?JSON.stringify(payload):undefined,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']}));
}
export async function publishSnapshot(raw, api=github){
  const snapshot=validateCodexActivity(raw);
  if(snapshot.lifetimeTokens===null||!snapshot.days.length)throw new Error('Incomplete usage response; keeping the published snapshot');
  const remote=await api('GET');
  const current=validateCodexActivity(JSON.parse(Buffer.from(remote.content,'base64').toString('utf8')));
  if(Date.parse(snapshot.fetchedAt)<Date.parse(current.fetchedAt))return {status:'skipped',reason:'newer snapshot already published'};
  const sameDay=snapshot.fetchedAt.slice(0,10)===current.fetchedAt.slice(0,10);
  const sameUsage=JSON.stringify({...snapshot,fetchedAt:null})===JSON.stringify({...current,fetchedAt:null});
  if(sameDay&&sameUsage)return {status:'unchanged'};
  const result=await api('PUT',{
    message:'Refresh public Codex activity snapshot',branch:'main',sha:remote.sha,
    content:Buffer.from(JSON.stringify(snapshot)+'\n').toString('base64'),
  });
  return {status:'published',commit:result.commit.sha,fetchedAt:snapshot.fetchedAt};
}
export async function refreshAndPublish(){
  const temporary=await mkdtemp(path.join(tmpdir(),'hud-codex-'));
  try{
    const output=path.join(temporary,'snapshot.json');
    execFileSync(process.execPath,[collector,output],{timeout:30000,stdio:['ignore','pipe','pipe']});
    return await publishSnapshot(JSON.parse(await readFile(output,'utf8')));
  }finally{await rm(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(await refreshAndPublish()));}
  catch{console.error('Codex statistics refresh failed. The published snapshot was preserved. Check the local Codex and GitHub logins before retrying.');process.exitCode=1;}
}
