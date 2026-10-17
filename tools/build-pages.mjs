import {execFileSync} from 'node:child_process';
import {cp, mkdir, rm, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const repository = fileURLToPath(new URL('../', import.meta.url));
const prefix = 'prototypes/3d-face/';
export function isRuntimeFile(file) {
  if (!file.startsWith(prefix)) return false;
  const relative = file.slice(prefix.length);
  if (relative.split('/').some(part => part.startsWith('.') || part === '..')) return false;
  return /^[^/]+\.(html|css|js)$/.test(relative)
    || /^assets\/.+\.(json|glb|png|jpe?g|webp|svg|pdf|md|txt)$/.test(relative)
    || /^vendor\/.+\.(js|txt)$/.test(relative);
}
export async function buildPages({root = repository, output = path.join(repository, '_site'), files} = {}) {
  files ??= execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'}).split('\0').filter(Boolean);
  const selected = files.filter(isRuntimeFile);
  if (!selected.includes(prefix + 'index.html')) throw new Error('Tracked site entry point missing');
  await mkdir(output, {recursive: true});
  for (const file of selected) {
    const source = path.join(root, file);
    if (!(await lstat(source)).isFile()) throw new Error('Only regular files may be published: ' + file);
    const destination = path.join(output, file.slice(prefix.length));
    await mkdir(path.dirname(destination), {recursive: true});
    await cp(source, destination);
  }
  return selected.length;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const output = path.join(repository, '_site');
  await rm(output, {recursive: true, force: true});
  console.log(`Packaged ${await buildPages({output})} tracked runtime files in ${output}`);
}
