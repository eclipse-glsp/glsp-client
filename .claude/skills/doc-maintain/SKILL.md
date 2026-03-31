---
name: doc-maintain
description: Review recent changes to the codebase and identify documentation that needs updating or new documentation that needs to be created. Use when the user wants to check if docs are still current, catch up documentation after a batch of PRs, do a periodic documentation maintenance pass, or perform a full codebase exploration for documentation gaps. Triggers on "update docs", "are docs still current" or similar requests about keeping documentation in sync with code changes.
---

# Documentation Maintenance

Identify what documentation needs to be created, updated, or restructured — and produce a prioritized backlog of actionable items for `/doc-generate`.

This skill operates in two modes:

1. **Incremental (default)** — review changes made since the last documentation checkpoint and assess their impact on existing docs
2. **Full exploration** — survey the entire codebase to identify documentation gaps from scratch

Use incremental mode by default. Switch to full exploration only when the user explicitly asks for it (e.g., "explore the whole codebase for doc gaps", "what needs documenting", "do a full doc audit") or when no baseline exists and the user confirms a full scan.

### Repo-Specific Guidelines

Before starting, check if `.claude/docs/guidelines.md` exists. If it does, read it and apply its guidance — it contains repo-specific conventions for code exploration, terminology, audience assumptions, and other preferences accumulated from previous sessions.

---

## Mode 1: Incremental

### Determining the Baseline

Figure out "since when" to scan. Sources in order of preference:

**1. Session History Branch**

The `doc-sessions` orphan branch (maintained by doc-retrospective) stores session summaries with commit hashes. Always fetch the latest remote state first, since sessions may have been archived from other machines or conversations:

```bash
git fetch origin doc-sessions
git branch -f doc-sessions origin/doc-sessions
git ls-tree --name-only doc-sessions | sort -r | head -1
git show doc-sessions:<filename>
```

Extract the `Commit:` field — that's the codebase state docs were last verified against.

**2. Documentation Index Timestamp**

If no session history exists, fall back to the last git commit on `docs/index.md`:

```bash
git log -1 --format="%H %ai" -- docs/index.md
```

**3. User-Provided Reference**

Ask the user for a commit hash, tag, date, or version number. Convert to a commit hash.

**4. No Baseline Available**

If no reference point exists, suggest switching to full exploration mode instead — incremental mode without a baseline is just a less thorough version of a full scan.

Confirm the baseline with the user before proceeding.

### Gather Changes

Start with git history — this works regardless of hosting platform, merge strategy, or branch naming:

```bash
# Detect default branch
git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'

# All commits since baseline (works with merge commits, squash merges, and rebases)
git log --oneline [baseline-hash]..HEAD

# Files changed since baseline
git diff --name-only [baseline-hash]..HEAD

# Commit messages often contain the "why" — scan them for context
git log --format="%h %s" [baseline-hash]..HEAD
```

**Optional GitHub enrichment:** If `gh` is available, enrich the git history with PR metadata (titles, descriptions, labels). This provides better context but is not required — the skill works without it:

```bash
gh pr list --state merged --search "merged:>=[baseline-date]" --limit 100 --json number,title,body,labels,files
```

**Batch processing:** For repos with many commits, process in batches. Start with the file-change summary and commit messages, then read actual code only for changes that look documentation-relevant.

**Relevance filter — skip:**
- Dependency bumps with no API changes
- Pure CI/CD pipeline changes
- Typo fixes or cosmetic refactors that don't change behavior
- Test-only changes (unless they reveal undocumented behavior)

**Flag but don't skip:**
- Commits/PRs mentioning "breaking change", "new feature", "API change"
- Changes that touch files referenced in existing documentation
- Large diffs or many files changed (may indicate architectural shifts)

### Evaluate Impact

For each relevant change, determine its documentation impact:

**Outdated existing docs** — the change altered behavior that an existing doc describes.

Note: which doc, which section(s), what changed, and severity:
- *Cosmetic* — naming, minor detail
- *Misleading* — doc describes wrong behavior
- *Breaking* — following the doc would cause errors

**New documentation needed** — the change introduced something worth documenting that isn't covered.

Note: what needs documenting, why, which category (architecture/concept/recipe/design decision), and whether it extends an existing doc or warrants a new one.

**Structural changes** — module splits, package renames, reorganizations that affect doc structure.

### Cross-Reference with Existing Docs

Read `docs/index.md` to understand what exists. Check whether changed files overlap with code referenced in existing docs:

```bash
git diff --name-only [baseline-hash]..HEAD
```

Verify that code references in docs still resolve — renamed or moved code is a common source of broken docs.

---

## Mode 2: Full Exploration

Survey the entire codebase to identify documentation gaps. Use this for initial documentation efforts or periodic audits.

### Survey Existing Documentation

1. Check for `docs/` folder and `docs/index.md`
2. Look for README files at every level (`**/README.md`)
3. Find inline documentation patterns — JSDoc/TSDoc coverage, code comments explaining "why"
4. Check for architecture decision records (ADRs), design docs, or similar
5. Look at CLAUDE.md and similar AI context files

For each existing doc, note what it covers, whether it appears current, and its depth.

### Map Codebase Structure

1. **Packages/modules** — read package.json files, main entry points, export barrels to understand boundaries
2. **Dependency graph** — how packages relate to each other
3. **Key abstractions** — core interfaces, base classes, and patterns a newcomer needs first
4. **Extension points** — where adopters plug in (these need docs most urgently)
5. **Cross-cutting concerns** — DI, logging, error handling, configuration, lifecycle

For multi-package repos, consider exploring independent packages in parallel when subagents are available.

### Identify What's Documentation-Worthy

Focus on things where:
- The code alone isn't enough — architectural patterns, design decisions, implicit contracts
- Newcomers consistently struggle — onboarding bottlenecks
- Adopters need guidance — extension points, integration patterns
- Knowledge is tribal — only in contributors' heads, not derivable from code

Skip things where:
- Code is self-documenting
- JSDoc/TSDoc already covers it
- It changes too frequently to keep docs current

### Gap Analysis

Compare what exists against what should exist. Organize into categories:

- **Architecture & Overview** — high-level architecture, package guide, core concepts
- **Concept Deep Dives** — key abstractions, subsystem internals, cross-cutting patterns
- **How-To Guides & Recipes** — extension walkthroughs, integration patterns, configuration, migration
- **Design Decisions** — architectural choices, constraints, historical context

For each gap, note: what should be documented, who benefits, complexity (small/medium/large), and dependencies on other docs.

---

## Presenting Findings (Both Modes)

Group findings into a structured report and present to the user.

### For updates to existing docs (incremental mode):

Use bulleted list format (`- **Field:** value`) for metadata fields — bare bold lines without separators collapse into a single paragraph in most markdown renderers.

```
### [Existing Doc Title] — needs update
- **Doc:** `docs/path/to/doc.md`
- **Severity:** Breaking / Misleading / Cosmetic
- **Caused by:** [commit short hashes, or PR #numbers if available]
- **What changed:**
  - [Specific change and its impact on the doc]
- **Suggested action:** [Update section X / Add coverage of Y]
```

### For new documentation (both modes):

Use bulleted list format (`- **Field:** value`) for metadata fields — bare bold lines without separators collapse into a single paragraph in most markdown renderers.

```
### [Title]
- **Category:** Architecture / Concept / Recipe / Design Decision
- **Priority:** High / Medium / Low
- **Complexity:** Small (1-2 sections) / Medium (full doc) / Large (multi-part)
- **Audience:** [who benefits]
- **Summary:** [2-3 sentences on what this doc would cover and why]
- **Dependencies:** [other docs that should exist first, if any]
- **Status:** Pending
```

### For structural changes (incremental mode):

```
### [Description] — restructure
- **Caused by:** [commit short hashes, or PR #numbers if available]
- **Impact:** [What moved, was renamed, or was reorganized]
- **Suggested action:** [Update index, rename doc, split doc, etc.]
```

### Prioritization

- **High** — foundational docs everything else builds on, or common adopter pain points; breaking/misleading existing docs
- **Medium** — concept deep dives and recipes for specific workflows; cosmetic doc updates
- **Low** — edge cases, historical context, areas with decent existing coverage

In full exploration mode, also suggest a dependency-based ordering — the architecture overview almost always comes first since other docs reference it. Group items that share enough context to be efficient back-to-back.

When a recipe item would be **Large** complexity, proactively break it down into focused sub-recipes (Small complexity each) rather than presenting it as a single monolithic item. Users find smaller, self-contained recipes easier to digest and review. Present the sub-recipe breakdown in the initial report so the user can adjust the split before it lands in the backlog.

### Summary Statistics

Include at the top:
- Mode: Incremental (since `[hash]`) / Full exploration
- Commits reviewed: N (incremental only)
- Existing docs needing updates: N
- New docs suggested: N
- Structural changes: N

## Refine with User

Present the report and iterate. The user may:

- Dismiss items ("that API change is internal, adopters don't see it")
- Reprioritize based on team needs
- Combine related items into a single doc session
- Add tribal knowledge ("new contributors always struggle with X")
- Defer items ("hold off until the migration is done")

In full exploration mode, ask:
- "Are there concepts that new team members consistently struggle with?"
- "Which extension points do adopters ask about most?"
- "Is there anything even experienced contributors find confusing?"

### Producing Actionable Items

Convert approved items into tasks for `/doc-generate` (new docs) or targeted edits (updates).

For new docs, include: subject, scope, key concepts, audience, depth, exclusions (what not to cover), dependencies (docs that should exist first), and references to the triggering changes.

For updates, include: the doc file, which sections need changes, and what the new content should reflect.

Write the final list to `.claude/docs/backlog.md`, appending to any existing backlog. Tag items with `[maintenance: YYYY-MM-DD]` (incremental) or `[exploration: YYYY-MM-DD]` (full) to track their origin.

## Updating the Baseline

After the maintenance pass is complete:

- Preferred: the user runs `/doc-retrospective` which records the session and commit hash
- Fallback: note the current HEAD as the new checkpoint in `.claude/docs/backlog.md`
