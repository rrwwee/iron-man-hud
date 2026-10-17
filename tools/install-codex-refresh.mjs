// Install an ordinary per-user macOS job. It runs the deterministic publisher,
// not a model, and never requires the Codex desktop app to remain open.
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir, writeFile, rename, rm} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const label='dev.rrwwee.hud-codex-stats';
const repository=fileURLToPath(new URL('../',import.meta.url));
const defaultNode=['/opt/homebrew/bin/node','/usr/local/bin/node'].find(existsSync)||process.execPath;
const xml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function buildLaunchAgent({root=repository,node=defaultNode,home=homedir()}={}){
  const log=path.join(home,'Library/Logs/hud-codex-stats');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array><string>${xml(node)}</string><string>${xml(path.join(root,'tools/publish-codex-activity.mjs'))}</string></array>
  <key>WorkingDirectory</key><string>${xml(root)}</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
  <key>ProcessType</key><string>Background</string>
  <key>LowPriorityIO</key><true/>
  <key>ThrottleInterval</key><integer>300</integer>
  <key>StandardOutPath</key><string>${xml(log+'.log')}</string>
  <key>StandardErrorPath</key><string>${xml(log+'.error.log')}</string>
</dict></plist>\n`;
}
async function install(remove=false){
  if(process.platform!=='darwin')throw new Error('This scheduler requires macOS');
  const domain=`gui/${process.getuid()}`,file=path.join(homedir(),'Library/LaunchAgents',label+'.plist');
  try{execFileSync('launchctl',['bootout',domain+'/'+label],{stdio:'ignore'});}catch{}
  if(remove){await rm(file,{force:true});console.log('Removed '+label);return;}
  await mkdir(path.dirname(file),{recursive:true});
  await mkdir(path.join(homedir(),'Library/Logs'),{recursive:true});
  await writeFile(file+'.tmp',buildLaunchAgent(),{mode:0o644});await rename(file+'.tmp',file);
  execFileSync('plutil',['-lint',file],{stdio:'inherit'});
  execFileSync('launchctl',['bootstrap',domain,file],{stdio:'inherit'});
  console.log('Installed '+label+': daily at 09:00 local time, and when loaded.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  install(process.argv.includes('--uninstall')).catch(error=>{console.error(error.message);process.exitCode=1;});
}
