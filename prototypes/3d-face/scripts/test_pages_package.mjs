import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readdir, rm, symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {buildPages, isRuntimeFile} from '../../../tools/build-pages.mjs';

for (const file of ['.private-assets/head.mov','prototypes/3d-face/local-preview/media.json','prototypes/3d-face/scripts/refresh_codex_activity.mjs','prototypes/3d-face/assets/../local-preview/media.json']) {
  assert.equal(isRuntimeFile(file), false, file);
}
const root = await mkdtemp(path.join(os.tmpdir(), 'hud-pages-'));
try {
  const base = 'prototypes/3d-face/';
  await mkdir(path.join(root, base, 'assets'), {recursive:true});
  await writeFile(path.join(root, base, 'index.html'), '<html>HUD</html>');
  await writeFile(path.join(root, base, 'app.js'), 'export {};');
  await writeFile(path.join(root, base, 'assets/approved.json'), '{}');
  await writeFile(path.join(root, base, 'assets/untracked.json'), 'private');
  const output = path.join(root, 'output');
  await buildPages({root, output, files:[base+'index.html',base+'app.js',base+'assets/approved.json',base+'local-preview/media.json']});
  assert.deepEqual((await readdir(output)).sort(), ['app.js','assets','index.html']);
  assert.deepEqual(await readdir(path.join(output,'assets')), ['approved.json']);
  await symlink(path.join(root, base, 'app.js'),path.join(root,base,'assets/link.json'));
  await assert.rejects(buildPages({root,output,files:[base+'index.html',base+'assets/link.json']}), /regular files/);
} finally { await rm(root, {recursive:true,force:true}); }
console.log('Pages package includes tracked runtime files only; local media, tooling and symlinks excluded.');
