import assert from 'node:assert/strict';
import {buildLaunchAgent,label} from '../../../tools/install-codex-refresh.mjs';
const config=buildLaunchAgent({root:'/project with & spaces',node:'/opt/node',home:'/Users/test'});
assert.ok(config.includes(`<key>Label</key><string>${label}</string>`));
assert.ok(config.includes('<string>/opt/node</string><string>/project with &amp; spaces/tools/publish-codex-activity.mjs</string>'));
assert.ok(config.includes('<key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer>'));
assert.ok(config.includes('<key>RunAtLoad</key><true/>'));
assert.ok(!config.includes('codex exec'));assert.ok(!config.includes('KeepAlive'));
console.log('Direct macOS schedule: argument-safe paths, daily refresh, no persistent process or model turn.');
