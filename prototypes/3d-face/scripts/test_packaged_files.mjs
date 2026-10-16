import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=new URL('../',import.meta.url);
async function walk(dir){const out=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){if(entry.name==='__pycache__')continue;const url=new URL(entry.name+(entry.isDirectory()?'/':''),dir);out.push(...(entry.isDirectory()?await walk(url):[url]));}return out;}
const files=await walk(root);
for(const file of files){
 assert.ok(!/\/(?:local-preview|source-assets)\//.test(file.pathname),'Private authoring directories are not served');
 assert.ok(!/\.(mov|blend|zip)$/i.test(file.pathname),'Raw captures/authoring bundles are not served');
 if(!/\.(?:m?js)$/.test(file.pathname))continue;
 const text=await fs.readFile(file,'utf8');
 for(const match of text.matchAll(/(?:from\s*|import\s*\(?)["'](\.[^"']+)["']/g)){
  const dependency=new URL(match[1].split('?')[0],file);
  await fs.access(dependency).catch(()=>assert.fail(`Missing module: ${path.basename(file.pathname)} -> ${match[1]}`));
 }
}
console.log('Packaged module imports resolve and raw authoring assets are excluded.');
