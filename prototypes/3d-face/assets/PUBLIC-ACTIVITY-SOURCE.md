# Public activity sources

GitHub activity for [rrwwee](https://github.com/rrwwee) is collected by
`scripts/refresh_github_activity.mjs`. The HUD reads only the same-origin
`assets/github-public.json`; it never calls GitHub or the calendar mirror, sends
credentials, or submits visitor coordinates. Cursor X/Y/radius/angle remain
local pointer measurements. The old hourly browser mirror/cache is no longer used.

## Source and public contract

The source is [GitHub Contributions API](https://github.com/grubersjoe/github-contributions-api),
`https://github-contributions-api.jogruber.de/v4/rrwwee?y=last`. This third-party
service scrapes the public GitHub contribution calendar and caches it for an
hour. It is not an official GitHub API. Counts mean profile contributions, not
commits, work hours, or lifetime activity. The calendar may include anonymized
private contribution counts if the owner has already made those public on GitHub;
no repository contents or authenticated account data are requested.

`public-activity.js` is the source/normalization boundary shared by the collector
and browser. The version-1 public file has only these fields:

- `schemaVersion`, the fixed `source` URL and public `profile` URL;
- `refreshAttemptedAt` (UTC) and `refreshStatus` (`ok` or `failed`);
- `lastSuccessful`: null, or `{fetchedAt, throughDate, days: [{date, count}]}`.

Every source day must have a real ISO calendar date and a bounded nonnegative
integer count. The full last-year calendar must contain 365–371 consecutive,
unique dates; its sum must equal `total.lastYear`. Its final day must be the UTC
collection date or the preceding date. Gaps, duplicates, malformed fields,
invalid dates, future days and outdated responses fail the refresh. The
collector limits request time to 15 seconds and the JSON body to 200 KB. Unknown
fields, source error text and unrelated profile counters are not published.
The browser validates the public file again and rebuilds the allowlisted shape.

## Refresh and failure policy

Run from the repository root with Node 22 or later:

```sh
node prototypes/3d-face/scripts/refresh_github_activity.mjs
```

There is at most one attempt per UTC date, including a failed attempt. `--force`
permits an explicit retry. Writes use a temporary file and atomic rename.
A failed refresh updates only attempt metadata and retains the entire previous
successful calendar and its original `fetchedAt`/`throughDate`. The command
returns exit code 1 on source failure, including a same-day skipped failed
attempt; it never writes raw errors to the public file.

`.github/workflows/github-activity.yml` prepares the daily run at 08:23 UTC
(01:23 PDT / 00:23 PST) and manual dispatch. It validates the contract, refreshes,
commits only the public snapshot (including failure metadata), and reports
source failure after preserving the fallback. It uses the repository's normal
Actions token solely for that commit; collection needs no account token or new
secret. No hosting/deployment step is included.

The workflow is local source until merged into the default branch. Scheduled
execution has not been activated or verified remotely in this task. Actions
must be enabled and repository policy must permit its snapshot commit; branch
protection can require adapting that commit to the repository's review policy.
[GitHub documents](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
that scheduled workflows run from the default branch and may be delayed or
removed from the queue under high load. A missed run leaves dated stale data.

## Instrument meaning

The existing GitHub trace uses the latest 14 recorded daily contribution counts.
The two existing rails show active days in that 14-day window and current streak
(capped visually at 30; the underlying value is not capped). Seven-day and
calendar-total aggregates are also available to the display. These are distinct
measurements derived from the same validated history. The streak is calculated
as of the recorded calendar, allowing an unfinished collection-day zero; an
earlier zero breaks it. No missing day becomes an invented zero.

A valid all-zero calendar draws a real zero trace. No successful data produces
an empty instrument with `UNAVAILABLE`. A failed refresh, failed browser file
request, or success from an earlier UTC collection day keeps the real values
with their original date and `STALE`. The date appears inside the existing
activity area; frame geometry and selectors are unchanged. The browser reads
one static file on load and retains a validated public fallback in localStorage
when available. Storage denial does not prevent a fresh load. A midnight timer
updates freshness without polling the source; reopening/reloading reads the
latest published file.

Codex collection is intentionally absent (ticket #19). Its existing unavailable
lane is retained; no token statistics or synthetic traces were added.

## Validation — 13 October 2026

```sh
node prototypes/3d-face/scripts/test_public_activity.mjs
node prototypes/3d-face/scripts/test_instruments.mjs
node prototypes/3d-face/scripts/test_hud_reference.mjs
node prototypes/3d-face/scripts/test_hud_selection.mjs
```

The contract checks valid/zero/missing/malformed source data, date gaps,
duplicates, future timestamps, stale source rejection, once-daily attempts,
forced recovery, original-date fallback, public field projection, static-only
browser requests, storage fallback and unavailable first loads.

Live collection at `2026-10-13T23:26:29.743Z` returned 367 days through
`2026-10-13`, 144 contributions, 4 active days in the latest 14, and streak 4.
A repeat command made no upstream request. A forced simulated failure against
a temporary copy returned exit 1 and retained all 367 days and the same success
timestamp. Reproduce without replacing the real snapshot:

```sh
cp prototypes/3d-face/assets/github-public.json /tmp/hud-github-failure.json
node prototypes/3d-face/scripts/refresh_github_activity.mjs --output /tmp/hud-github-failure.json --force --simulate-failure
```

A single temporary native Arc tab on the current laptop showed the real trace
with `2026-10-13`, then the identical trace with amber `2026-10-13 · STALE` when
a localhost-only preview served that simulated failure file. The production
snapshot stayed successful. The temporary tab and preview server were closed.
This verifies data display/fallback, not visual acceptance of the overall HUD;
that remains ticket #12. Provider availability and freshness within its public
calendar/cache remain external limitations.
