#!/usr/bin/env node
import {readFile, writeFile, rename, mkdir} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GITHUB_SOURCE, refreshSnapshot, activityView} from '../public-activity.js';

const args = process.argv.slice(2);
const allowed = new Set(['--output', '--force', '--simulate-failure']);
let output = fileURLToPath(new URL('../assets/github-public.json', import.meta.url));
for (let i = 0; i < args.length; i++) {
  if (!allowed.has(args[i])) throw new Error('Use --output PATH, --force or --simulate-failure');
  if (args[i] === '--output') {
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('--output requires a path');
    output = resolve(args[++i]);
  }
}
let previous = null;
try { previous = JSON.parse(await readFile(output, 'utf8')); }
catch (error) { if (error.code && error.code !== 'ENOENT') throw error; }
const result = await refreshSnapshot({previous, force: args.includes('--force'), collect: async () => {
  if (args.includes('--simulate-failure')) throw new Error('Simulated source outage');
  const response = await fetch(GITHUB_SOURCE, {signal: AbortSignal.timeout(15000), headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error('Source unavailable');
  const body = await response.text();
  if (body.length > 200000) throw new Error('Unexpected source size');
  return JSON.parse(body);
}});
if (result.refreshed) {
  await mkdir(dirname(output), {recursive: true});
  const temporary = output + '.' + process.pid + '.tmp';
  await writeFile(temporary, JSON.stringify(result.snapshot, null, 2) + '\n');
  await rename(temporary, output); // A reader never observes a half-written snapshot.
}
const view = activityView(result.snapshot);
console.log(JSON.stringify({refreshed: result.refreshed, status: view.calendarStatus,
  throughDate: view.throughDate, fetchedAt: view.fetchedAt, total: view.total,
  activeDays14: view.activeDays14, streak: view.streak}));
// The workflow still commits the dated fallback, then reports the failed collection.
if (result.snapshot.refreshStatus === 'failed') process.exitCode = 1;
