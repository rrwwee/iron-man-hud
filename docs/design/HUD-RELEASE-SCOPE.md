# Reviewed personal HUD snapshot

## Accepted scope

- Preserve the six-section visor layout, animated selection/transfer, original CV reading controls and personal links.
- Show Rory’s fitted face with bounded cursor gaze, natural blinking and dark reddish HUD illumination.
- Use original reference-guided black O’Neill Epic 5370 wetsuit and navy/mint Mystic Warrior geometry. The hook curves downward; 20 actual garment panel groups separate on scroll, with rear harness parts moving back and front hardware moving forward.
- Show completed flight routes and aggregate great-circle miles; exclude future/cancelled routes and raw itinerary details.
- Show GitHub/Codex snapshots without claiming unsupported live updates. Keep Media empty until appropriate content is selected. WOO plots remain pending a shared session/data source.
- Keep the cursor instrument spherical, visible and at 64% scale above an expanded panel; keep the pitch ladder independent.
- Let both models coast gradually after a flick, for up to 30 seconds; grabbing cancels inertia and reduced motion suppresses it.
- Preserve runnable source and required runtime assets while excluding raw face inputs, product photos, legacy character assets and private studies.

## Validation and non-goals

Run `npm test` and `npm run test:python`. Check a clean checkout over HTTP for asset failures, shader errors, both model layouts, transfer, blinking, cursor tracking and coasting. Review against `origin/main` for standards and this scope before pushing.

No site deployment, Pages enablement, merge, history rewriting, new external messaging, WOO login or automated data collection is authorized by this PR. The static portrait is intentionally tracked; its private fitting inputs are not. Existing older branches are untouched.

## Publication update — 16 October 2026

The owner subsequently authorised publishing the current site to GitHub Pages, including public YouTube embeds for `aNNdVZ-mVy4` (original 2008 Iron Man press conference) followed by `2gA-3T-95YQ` (The Shape of Speed). Embed availability was tested; uploader authorisation remains unverified. Joseph remains omitted because tested full-film uploads block embedding. No film media is rehosted. This replaces the earlier no-deployment and empty-Media constraints above.

Deployment packages tracked runtime files only. The existing daily GitHub snapshot workflow triggers a Pages redeployment; Codex usage remains an owner-refreshed snapshot.
