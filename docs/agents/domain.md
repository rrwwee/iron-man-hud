# Domain Docs

Use the single-context layout: `CONTEXT.md` at the repo root and architecture decision records (ADRs) in `docs/adr/`.

## Before exploring

Read `CONTEXT.md` and ADRs in `docs/adr/` that touch the area you are about to work in.

If these files do not exist, proceed silently. The `domain-modeling` skill creates them lazily when terms or decisions get resolved.

## Use the glossary's vocabulary

When naming a domain concept in an issue, proposal, hypothesis, or test, use the term defined in `CONTEXT.md`.

If a needed concept is missing, reconsider whether it belongs to the project or note the gap for `domain-modeling`.

## Flag ADR conflicts

If a proposal contradicts an existing ADR, name the ADR and explain why the decision should be reopened.
