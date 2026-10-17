# Codex activity projection

Collected on 14 October 2026 with the signed-in owner's authorization, through the documented read-only [`account/usage/read`](https://learn.chatgpt.com/docs/app-server#7-token-usage-chatgpt) method. The browser reads only the same-origin `codex-public.json` artifact. No browser credentials or account access are needed by visitors.

The publication allowlist remains the fields approved in HUD decision Q13: lifetime token total, current streak, and daily token totals for the latest 30 calendar days. Missing days remain gaps; they are not invented zero-usage days. Task text, project names, account identifiers, detailed activity times, other summary metrics and credentials are omitted.

Refresh locally using the authenticated Codex CLI:

```sh
node prototypes/3d-face/scripts/refresh_codex_activity.mjs
```

The collector opens a temporary stdio app-server connection, requests only usage data and closes it. It never starts a model turn. Failed collection leaves the previous artifact intact; the displayed snapshot becomes stale after its UTC collection date. This is a snapshot, not a live usage meter.

## Automatic publication

The owner authorised automatic public-stat updates on 16 October 2026. A daily local Codex automation runs `node tools/publish-codex-activity.mjs` at 9 AM, using the existing Codex and `gh` logins on the Mac. The helper collects into a temporary file, validates the publication allowlist and updates only `prototypes/3d-face/assets/codex-public.json` on `main`. The resulting commit triggers GitHub Pages. It does not change the checkout or push unrelated work. Same-day unchanged data and older snapshots are skipped; incomplete data or failed collection leaves the existing public snapshot intact.

This requires the local automation host to be available. No Codex credential is installed in GitHub Actions or delivered to the browser. The public site still reads a static JSON artifact, and open pages see updates on reload.
