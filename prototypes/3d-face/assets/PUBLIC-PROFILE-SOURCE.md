# Public profile source

`github-profile.json` is an allowlisted fallback from https://api.github.com/users/rrwwee, retrieved 2026-10-14. It contains only login, public name, public biography, follower count and public repository count.

The browser refreshes from that same anonymous endpoint, caches valid results for one hour and falls back to the cache or this file if unavailable. No API key is needed. Rendering treats all profile text as plain text. API reference: https://docs.github.com/en/rest/users/users#get-a-user.

X and LinkedIn descriptions are authored profile context. No live follower counts are claimed for those services. Codex totals come from the separately documented approved snapshot.
