// Public data boundary, shared by the maintainer collector and the browser.
export const GITHUB_SOURCE = 'https://github-contributions-api.jogruber.de/v4/rrwwee?y=last';
export const GITHUB_PROFILE = 'https://github.com/rrwwee';
const DAY = 86400000;
const invalid = () => { throw new Error('Invalid public activity snapshot'); };
const integer = value => Number.isSafeInteger(value) && value >= 0 && value <= 100000;
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalid();
  const time = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return invalid();
  return time;
}
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return invalid();
  date(value.slice(0, 10));
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 19) !== value.slice(0, 19)) return invalid();
  return time;
}
function calendar(input) {
  // A complete last-year calendar, never silently turn a gap into zero activity.
  if (!Array.isArray(input) || input.length < 365 || input.length > 371) return invalid();
  const days = input.map(day => {
    date(day?.date);
    if (!integer(day.count)) return invalid();
    return {date: day.date, count: day.count};
  }).sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < days.length; i++) {
    if (date(days[i].date) - date(days[i - 1].date) !== DAY) return invalid();
  }
  return days;
}
export function summarizeActivity(data) {
  const days = [...(data?.days || [])].sort((a, b) => a.date.localeCompare(b.date));
  const end = days.at(-1)?.date;
  const cutoff = end ? date(end) - 6 * DAY : Infinity;
  let streak = 0, i = days.length - 1;
  if (i >= 0 && days[i].count === 0 && (!data.fetchedAt || end === data.fetchedAt.slice(0, 10))) i--;
  for (; i >= 0 && days[i].count > 0; i--) {
    streak++;
    if (i > 0 && date(days[i].date) - date(days[i - 1].date) !== DAY) break;
  }
  return {total: days.length ? days.reduce((n, day) => n + day.count, 0) : null,
    today: days.at(-1)?.count ?? null,
    week: days.filter(day => date(day.date) >= cutoff).reduce((n, day) => n + day.count, 0),
    activeDays14: days.slice(-14).filter(day => day.count > 0).length, streak, days};
}
export function normalizeGithubCalendar(input, fetchedAt) {
  timestamp(fetchedAt);
  const days = calendar(input?.contributions);
  const total = days.reduce((n, day) => n + day.count, 0);
  if (!Number.isSafeInteger(input?.total?.lastYear) || input.total.lastYear !== total) return invalid();
  const throughDate = days.at(-1).date;
  // A stale mirror response must not acquire a fresh successful date.
  const lag = date(fetchedAt.slice(0, 10)) - date(throughDate);
  if (lag < 0 || lag > DAY) return invalid();
  return {fetchedAt, throughDate, days};
}
export function validateSnapshot(input, now = new Date()) {
  if (input?.schemaVersion !== 1 || input.source !== GITHUB_SOURCE || input.profile !== GITHUB_PROFILE ||
      !['ok', 'failed'].includes(input.refreshStatus)) return invalid();
  const attempted = timestamp(input.refreshAttemptedAt);
  if (attempted > now.getTime() + 60000) return invalid();
  let lastSuccessful = null;
  if (input.lastSuccessful !== null) {
    const success = input.lastSuccessful;
    const fetched = timestamp(success?.fetchedAt);
    const days = calendar(success?.days);
    const lag = date(success.fetchedAt.slice(0, 10)) - date(success.throughDate);
    if (fetched > attempted || success.throughDate !== days.at(-1).date || lag < 0 || lag > DAY) return invalid();
    lastSuccessful = {fetchedAt: success.fetchedAt, throughDate: success.throughDate, days};
  }
  if (input.refreshStatus === 'ok' && !lastSuccessful) return invalid();
  // Rebuild the public projection; upstream extras, errors and credentials never cross it.
  return {schemaVersion: 1, source: GITHUB_SOURCE, profile: GITHUB_PROFILE,
    refreshAttemptedAt: input.refreshAttemptedAt, refreshStatus: input.refreshStatus, lastSuccessful};
}
export async function refreshSnapshot({previous, collect, now = new Date(), force = false}) {
  let valid = null;
  try { valid = validateSnapshot(previous, now); } catch { /* A corrupt previous file is not data. */ }
  const attemptedAt = now.toISOString();
  if (!force && valid?.refreshAttemptedAt.slice(0, 10) === attemptedAt.slice(0, 10)) {
    return {snapshot: valid, refreshed: false};
  }
  const snapshot = {schemaVersion: 1, source: GITHUB_SOURCE, profile: GITHUB_PROFILE,
    refreshAttemptedAt: attemptedAt, refreshStatus: 'failed', lastSuccessful: valid?.lastSuccessful ?? null};
  try {
    snapshot.lastSuccessful = normalizeGithubCalendar(await collect(), attemptedAt);
    snapshot.refreshStatus = 'ok';
  } catch { /* Keep the original success and its date; publish no raw error text. */ }
  return {snapshot, refreshed: true};
}
export function activityView(snapshot, now = new Date()) {
  const success = snapshot?.lastSuccessful;
  if (!success) return {calendarStatus: 'unavailable', days: [], total: null, today: null,
    week: null, activeDays14: null, streak: null, fetchedAt: null, throughDate: null,
    statusLabel: 'GITHUB · UNAVAILABLE'};
  const calendarStatus = snapshot.refreshStatus === 'failed' ||
    success.fetchedAt.slice(0, 10) < now.toISOString().slice(0, 10) ? 'stale' : 'fresh';
  return {...summarizeActivity(success), fetchedAt: success.fetchedAt, throughDate: success.throughDate,
    calendarStatus, statusLabel: `GITHUB · ${success.throughDate}${calendarStatus === 'stale' ? ' · STALE' : ''}`};
}
export function createPublicActivity(onChange = () => {}, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const now = options.now ?? (() => new Date());
  const key = 'hud-public-github-snapshot-v1';
  let storage = options.storage;
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch {} }
  let snapshot = null;
  try { snapshot = validateSnapshot(JSON.parse(storage?.getItem(key) || 'null'), now()); } catch {}
  const emit = () => onChange(activityView(snapshot, now()));
  let midnightTimer;
  function scheduleFreshness() {
    const time = now();
    const next = Date.parse(time.toISOString().slice(0, 10) + 'T00:00:00Z') + DAY;
    midnightTimer = setTimeout(() => { emit(); scheduleFreshness(); }, Math.max(1, next - time.getTime()));
    midnightTimer.unref?.();
  }
  scheduleFreshness(); // Repaint freshness on an open page; never poll the source.
  // Only a same-origin static file. Visitors never refresh the upstream calendar.
  const ready = Promise.resolve().then(async () => {
    try {
      const response = await fetchImpl('./assets/github-public.json', {cache: 'no-cache', signal: AbortSignal.timeout(6000)});
      if (!response.ok) throw new Error('Snapshot unavailable');
      const incoming = validateSnapshot(await response.json(), now());
      // A stale deployment/CDN must not replace a newer last success in this browser.
      if (snapshot?.lastSuccessful && (!incoming.lastSuccessful ||
          incoming.lastSuccessful.fetchedAt < snapshot.lastSuccessful.fetchedAt)) {
        snapshot = {...snapshot, refreshStatus: 'failed'};
      } else snapshot = incoming;
      try { storage?.setItem(key, JSON.stringify(snapshot)); } catch {}
    } catch {
      if (snapshot) snapshot = {...snapshot, refreshStatus: 'failed'};
    }
    emit();
    return activityView(snapshot, now());
  });
  return {get value() { return activityView(snapshot, now()); }, ready,
    dispose() { clearTimeout(midnightTimer); }};
}
