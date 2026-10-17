import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {writeCIAuth} from '../../../tools/write-codex-ci-auth.mjs';
const home=await mkdtemp(path.join(tmpdir(),'hud-ci-auth-test-'));
try{
  await assert.rejects(writeCIAuth({secret:'malformed',home}),/Invalid/);
  await assert.rejects(writeCIAuth({secret:'{}',home}),/Expected/);
  const credential={tokens:{access_token:'synthetic-access-token',refresh_token:'synthetic-refresh-token'}};
  await writeCIAuth({secret:JSON.stringify(credential),home});
  assert.deepEqual(JSON.parse(await readFile(path.join(home,'auth.json'),'utf8')),credential);
  assert.equal((await stat(path.join(home,'auth.json'))).mode&0o777,0o600);
}finally{await rm(home,{recursive:true,force:true});}
console.log('Runner auth bootstrap: invalid inputs rejected and credential file is private.');
