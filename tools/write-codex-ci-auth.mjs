// Runner-only bootstrap. Never print or return credential contents.
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function writeCIAuth({secret,home}){
  if(!home||!secret)throw new Error('Missing CI authentication configuration');
  let auth;
  try{auth=JSON.parse(secret);}catch{throw new Error('Invalid CI authentication configuration');}
  if(!auth||typeof auth!=='object'||Array.isArray(auth)||!auth.tokens||typeof auth.tokens.access_token!=='string'||typeof auth.tokens.refresh_token!=='string')throw new Error('Expected a Codex ChatGPT sign-in credential');
  await mkdir(home,{recursive:true,mode:0o700});
  await writeFile(path.join(home,'auth.json'),JSON.stringify(auth),{mode:0o600});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  writeCIAuth({secret:process.env.CODEX_AUTH_JSON,home:process.env.CODEX_HOME}).catch(()=>{
    console.error('Could not prepare the encrypted CI sign-in credential. Previous public stats are retained.');process.exitCode=1;
  });
}
