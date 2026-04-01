# Doc Session: Dependency Injection & Module System

**Date:** 2026-04-01
**Type:** generation
**Commit:** `7e20900` (7e20900e00c061bd513d8ae4fd009ea96e7b1a53)
**Output:** `docs/dependency-injection.md`
**Scope:** Inversify DI in GLSP: FeatureModule, container configuration, binding helpers, LazyInjector

## Stats

- Review rounds: 6
- Feedback items: 8
- Feedback categories: Style (4), Depth (2), Structure (2)

## What Was Done

Generated a concept doc covering the GLSP client's dependency injection and module system. The initial draft was too detailed and had several style issues. Through six review rounds the doc was trimmed from a comprehensive reference to a focused conceptual overview, with usage recipes deferred to a future doc (backlog item 9).

## Key Feedback Themes

- **Depth calibration**: the draft was consistently too detailed for a concept doc. Both Core Concepts and Default Modules sections needed significant trimming. User preference is "what and why" over exhaustive API detail.
- **Anti-enumeration**: counts ("37 modules") and exhaustive module listings don't add value. Prose characterization preferred.
- **Style naturalness**: em dashes (`--`), implementation const names as concept names (`DEFAULT_MODULES`), and inconsistent bullet formatting all flagged. Output should read like human-written documentation.
- **Prose over structure**: design rationale works better woven into explanations than isolated in formal Decision/Rationale/Implication blocks.
- **Scope discipline**: usage examples (add/remove/replace modules) belong in recipe docs, not concept docs.

## Skill Improvements Applied

- **doc-generate (generic)**: annotated "Usage / How To" template section as recipe/reference scope only; annotated "Key Design Decisions" as architecture scope only with guidance to use inline prose for concept docs
- **guidelines.md (repo-specific)**: added Style section (no em dashes, no counts/enumerations, concept names over const names, consistent formatting) and Structure section (concept docs stay high-level, prose over formal structures)

## Notes

- First documentation session for this repo. Backlog item 2 is now marked done.
- The Architecture Overview (backlog item 1) does not exist yet. This doc is self-contained but will benefit from cross-linking once item 1 is written.
- Backlog item 9 (Configuring a Diagram Module recipe) is the natural companion for the usage examples removed from this doc.
