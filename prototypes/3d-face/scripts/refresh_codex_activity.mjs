#!/usr/bin/env node
// Owner-run collector. No browser credentials, task content or identifiers are read.
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateCodexActivity} from '../codex-activity.js';
const output=process.argv[2]||fileURLToPath(new URL('../assets/codex-public.json',import.meta.url));
async function collect(){
 return new Promise((resolve,reject)=>{
  const child=spawn('codex',['app-server','--stdio'],{stdio:['pipe','pipe','ignore']});
  const reader=createInterface({input:child.stdout});let settled=false;
  const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);reader.close();child.stdin.end();child.kill();error?reject(error):resolve(result);};
  const timer=setTimeout(()=>finish(new Error('Codex statistics request timed out')),20000);
  const send=value=>child.stdin.write(JSON.stringify(value)+'\n');
  child.on('error',()=>finish(new Error('Codex app-server unavailable')));
  child.on('exit',()=>{if(!settled)finish(new Error('Codex app-server closed before returning statistics'));});
  reader.on('line',line=>{let message;try{message=JSON.parse(line);}catch{return;}
   if(message.id===1){if(message.error)return finish(new Error('Codex initialization failed'));send({method:'initialized',params:{}});send({id:2,method:'account/usage/read',params:{}});}
   if(message.id===2){if(message.error)return finish(new Error('Codex statistics unavailable'));finish(null,message.result);}
  });
  send({id:1,method:'initialize',params:{clientInfo:{name:'hud_statistics',title:'HUD Statistics',version:'1.0'},capabilities:{experimentalApi:true}}});
 });
}
try{
 const result=await collect(),summary=result.summary||{};
 const snapshot=validateCodexActivity({schemaVersion:1,fetchedAt:new Date().toISOString(),lifetimeTokens:summary.lifetimeTokens??null,currentStreakDays:summary.currentStreakDays??null,
  days:(result.dailyUsageBuckets||[]).map(d=>({date:d.startDate,tokens:d.tokens})).sort((a,b)=>a.date.localeCompare(b.date)).slice(-30)});
 const temporary=output+'.'+process.pid+'.tmp';await writeFile(temporary,JSON.stringify(snapshot)+'\n');await rename(temporary,output);
 console.log(JSON.stringify({status:'fresh',lifetimeTokens:snapshot.lifetimeTokens,currentStreakDays:snapshot.currentStreakDays,days:snapshot.days.length}));
}catch(error){console.error(error.message+'; the previous public snapshot is retained.');process.exitCode=1;}
