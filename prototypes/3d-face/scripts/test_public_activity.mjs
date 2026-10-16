import assert from 'node:assert/strict';
import {GITHUB_SOURCE, refreshSnapshot, normalizeGithubCalendar, validateSnapshot,
  activityView, createPublicActivity} from '../public-activity.js';

const now = new Date('2026-10-13T12:00:00Z');
const day = 86400000;
const days = Array.from({length: 365}, (_, i) => ({
  date: new Date(now.getTime() - (364 - i) * day).toISOString().slice(0, 10),
  count: i >= 360 && i < 364 ? 2 : 0,
  privateTask: 'DO_NOT_PUBLISH'
}));
const input = {total: {lastYear: 8}, contributions: days, token: 'DO_NOT_PUBLISH'};
let calls = 0;
const first = await refreshSnapshot({now, collect: async () => { calls++; return input; }});
assert.equal(first.snapshot.refreshStatus, 'ok');
assert.equal(calls, 1);
assert.equal(JSON.stringify(first).includes('DO_NOT_PUBLISH'), false);
const view = activityView(first.snapshot, now);
assert.equal(view.total, 8);
assert.equal(view.week, 8);
assert.equal(view.activeDays14, 4);
assert.equal(view.streak, 4);
assert.equal(view.today, 0);
assert.equal(view.calendarStatus, 'fresh');
assert.match(view.statusLabel, /2026-10-13/);
const repeated = await refreshSnapshot({previous: first.snapshot, now, collect: () => { throw Error('must not fetch'); }});
assert.equal(repeated.refreshed, false);
const tomorrow = new Date(now.getTime() + day);
const failed = await refreshSnapshot({previous: first.snapshot, now: tomorrow, collect: () => { throw Error('DO_NOT_PUBLISH'); }});
assert.equal(failed.snapshot.refreshStatus, 'failed');
assert.deepEqual(failed.snapshot.lastSuccessful, first.snapshot.lastSuccessful);
assert.equal(activityView(failed.snapshot, tomorrow).calendarStatus, 'stale');
assert.equal(activityView(first.snapshot, tomorrow).calendarStatus, 'stale');
assert.equal(activityView(failed.snapshot, tomorrow).total, 8);
assert.equal(JSON.stringify(failed).includes('DO_NOT_PUBLISH'), false);
assert.equal((await refreshSnapshot({previous: failed.snapshot, now: tomorrow, collect: () => { throw Error('must not retry'); }})).refreshed, false);
const unavailable = await refreshSnapshot({now, collect: () => { throw Error('offline'); }});
assert.equal(activityView(unavailable.snapshot, now).calendarStatus, 'unavailable');
assert.equal(activityView(unavailable.snapshot, now).total, null);
assert.equal(activityView(unavailable.snapshot, now).activeDays14, null);
const zero = await refreshSnapshot({now, collect: () => ({total: {lastYear: 0}, contributions: days.map(d => ({...d, count: 0}))})});
assert.equal(activityView(zero.snapshot, now).total, 0);
assert.equal(activityView(zero.snapshot, now).calendarStatus, 'fresh');
assert.equal(activityView(zero.snapshot, now).streak, 0);
const clone = value => structuredClone(value);
const malformed = [null, {}, {...input, contributions: []}, {...input, total: {}}, {...input, total: {lastYear: 9}}];
for (const edit of [d => d.contributions.pop(), d => d.contributions[2].count = -1,
  d => d.contributions[2].count = '2', d => d.contributions[2].count = 1.2,
  d => d.contributions[2].date = d.contributions[1].date,
  d => d.contributions[2].date = '2026-02-30', d => d.contributions.splice(40, 1),
  d => d.contributions[2].count = Number.MAX_SAFE_INTEGER]) {
  const value = clone(input); edit(value); malformed.push(value);
}
for (const value of malformed) {
  assert.throws(() => normalizeGithubCalendar(value, now.toISOString()));
  const result = await refreshSnapshot({previous: first.snapshot, now: tomorrow, collect: () => value});
  assert.deepEqual(result.snapshot.lastSuccessful, first.snapshot.lastSuccessful);
}
assert.throws(() => normalizeGithubCalendar(input, new Date(now.getTime() + 3 * day).toISOString()));
assert.throws(() => normalizeGithubCalendar(input, '2026-02-30T12:00:00Z'));
assert.throws(() => validateSnapshot({...first.snapshot, source: 'https://evil.example'}, now));
assert.throws(() => validateSnapshot({...first.snapshot, refreshAttemptedAt: tomorrow.toISOString()}, now));
assert.equal(validateSnapshot({...first.snapshot, privateTask: 'DO_NOT_PUBLISH'}, now).privateTask, undefined);
const recovered = await refreshSnapshot({previous: failed.snapshot, now: tomorrow, force: true, collect: () => ({total: {lastYear: 8}, contributions: [...days.slice(1), {date: '2026-10-14', count: 0}]})});
assert.equal(recovered.snapshot.refreshStatus, 'ok');
assert.equal(activityView(recovered.snapshot, tomorrow).streak, 0); // Yesterday's zero breaks it.

const cache = new Map();
const storage = {getItem: key => cache.get(key), setItem: (key, value) => cache.set(key, value)};
const requests = [];
let client = createPublicActivity(() => {}, {now: () => now, storage, fetchImpl: async (url, options) => {
  requests.push({url, options}); return {ok: true, json: async () => first.snapshot};
}});
await client.ready;
assert.equal(client.value.total, 8);
client.dispose();
assert.equal(requests.length, 1);
assert.equal(requests[0].url, './assets/github-public.json');
assert.equal(requests[0].options.headers, undefined);
assert.equal(JSON.stringify([...cache.values()]).includes('DO_NOT_PUBLISH'), false);
for (const fetchImpl of [async () => { throw Error('offline'); }, async () => ({ok: false}),
  async () => ({ok: true, json: async () => ({bad: true})}),
  async () => ({ok: true, json: async () => unavailable.snapshot})]) {
  client = createPublicActivity(() => {}, {now: () => tomorrow, storage, fetchImpl});
  await client.ready;
  assert.equal(client.value.total, 8);
  assert.equal(client.value.calendarStatus, 'stale');
  assert.equal(client.value.fetchedAt, first.snapshot.lastSuccessful.fetchedAt);
  client.dispose();
}
client = createPublicActivity(() => {}, {now: () => now, storage: null, fetchImpl: async () => { throw Error('offline'); }});
await client.ready;
assert.equal(client.value.calendarStatus, 'unavailable');
client.dispose();
assert.equal(GITHUB_SOURCE.startsWith('https://'), true);
console.log('Public activity contract: daily collection, normalization, zero/unavailable/stale, recovery, original-date fallback, static-only client and public projection pass.');
