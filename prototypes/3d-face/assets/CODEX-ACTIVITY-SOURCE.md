# Codex activity projection

Collected on 14 October 2026 with the signed-in owner's authorization, through the documented read-only [`account/usage/read`](https://learn.chatgpt.com/docs/app-server#7-token-usage-chatgpt) method. The browser reads only the same-origin `codex-public.json` artifact. No browser credentials or account access are needed by visitors.

The publication allowlist remains the fields approved in HUD decision Q13: lifetime token total, current streak, and daily token totals for the latest 30 calendar days. Missing days remain gaps; they are not invented zero-usage days. Task text, project names, account identifiers, detailed activity times, other summary metrics and credentials are omitted.

Refresh locally using the authenticated Codex CLI:

```sh
node prototypes/3d-face/scripts/refresh_codex_activity.mjs
```

The collector opens a temporary stdio app-server connection, requests only usage data and closes it. It never starts a model turn. Failed collection leaves the previous artifact intact; the displayed snapshot becomes stale after its UTC collection date. This is a snapshot, not a live usage meter.
