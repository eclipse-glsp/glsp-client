---
name: doc-retrospective
description: Analyze a documentation workflow session to extract learnings and archive results. Use after completing a doc-generate or doc-maintain session — when the user says "let's do a retro", "analyze this session", "what can we improve", or wants to wrap up and archive a documentation session. Also triggers when the user wants to review past documentation sessions or check session history.
---

# Documentation Session Retrospective

Analyze a completed documentation workflow session to extract actionable learnings, propose skill improvements, and archive the session for future reference.

This skill works with any doc workflow session — doc-generate (drafting), doc-maintain (triage/backlog), or combined sessions. The analysis adapts to the session type.

This skill serves two purposes:
1. **Learn** — identify patterns in the session that reveal systematic issues in the doc skills, so future sessions work better
2. **Archive** — create a structured session summary and commit it to a dedicated history branch, building an institutional memory of documentation work and establishing the baseline commit for future maintenance

## When to Run

Run this at the end of any documentation session. The conversation history contains the full trace — that trace is the input to this skill.

- **After doc-generate:** the trace includes exploration, draft, review rounds, and final output
- **After doc-maintain:** the trace includes change analysis, findings, user refinement, and the resulting backlog
- **After combined sessions:** both triage and generation happened in one conversation

## Step 1: Analyze the Session

Review the full conversation to reconstruct what happened. The analysis adapts to the session type.

### For Generation Sessions

Focus on the review loop — that's where the signal is. For each piece of feedback the user gave during draft review:

- **What was the complaint?** (e.g., "too detailed", "missing X", "diagram wrong")
- **What category does it fall into?**
  - *Scope* — too broad, too narrow, missing topic, unnecessary topic
  - *Depth* — too detailed, too shallow, wrong level for audience
  - *Accuracy* — factual error, outdated info, wrong code reference
  - *Structure* — wrong ordering, missing section, section doesn't fit
  - *Style* — too verbose, too terse, jargon, unclear phrasing
  - *Diagrams* — missing diagram, wrong diagram type, too complex, mislabeled
- **How many review rounds did it take to resolve?**
- **Was it a one-off or does it point to a systematic pattern?**

### For Maintenance Sessions

Focus on the triage and refinement phase. Extract:

- **Dismissed items** — what was flagged but the user considered irrelevant? Why? (reveals over-sensitivity in change filtering)
- **Missing items** — did the user add things the skill missed? (reveals gaps in change analysis)
- **Reprioritizations** — where the skill's priority didn't match the user's. What was the reasoning?
- **Backlog quality** — were the produced items specific enough for `/doc-generate`? Did the user need to rewrite them?

### Pattern Recognition

Look across all feedback items for recurring themes. The valuable insights are the ones that repeat — a single "add more detail here" is situational, but three instances of "the draft always skips error handling patterns" suggests the exploration strategy needs adjustment.

Group findings into:

- **Repeated refinements** — the same kind of fix applied multiple times (e.g., user kept asking for more code examples, or kept removing generic filler paragraphs)
- **Systematic gaps** — things consistently missed (e.g., exploration never looked at test files, maintenance kept flagging irrelevant dependency bumps)
- **First-output quality issues** — predictable problems with the initial output (e.g., diagrams always too complex, backlog items always missing exclusions)

## Step 2: Propose Improvements

Based on the patterns found, draft concrete suggestions. Each suggestion should be:

- **Specific** — not "improve exploration" but "add test files as an exploration source for usage patterns"
- **Grounded** — tied to actual session feedback, not hypothetical improvements

### Classifying Improvements: Generic vs. Repo-Specific

The doc-generate skill is designed to be reusable across projects. Not every improvement belongs in the skill itself — many are specific to this repository's conventions, audience, or domain. Classify each suggestion:

**Generic (update the relevant skill)** — improvements that would help in any codebase. These can target any of the three doc skills:
- **doc-generate:** better exploration strategies, document template improvements, writing principle refinements
- **doc-maintain:** better change relevance filtering, improved backlog item format, triage workflow improvements
- **doc-retrospective:** analysis category adjustments, summary format improvements

**Repo-specific (update `.claude/docs/guidelines.md`)** — preferences tied to this particular project:
- Terminology choices ("use 'adopter' not 'consumer'")
- Audience assumptions ("readers know Java and LSP")
- Style preferences that reflect this team's taste ("shorter code examples", "no bullet-list sections")
- Structural conventions for this repo ("one doc per package")
- Scope decisions ("internal utilities don't need docs")

When in doubt, lean repo-specific. The generic skill should stay lean and broadly applicable — repo-specific guidelines are the right place for accumulated local knowledge.

Present the suggestions to the user grouped by classification. For approved changes:
- Generic improvements → update the relevant skill's SKILL.md (doc-generate, doc-maintain, or doc-retrospective)
- Repo-specific improvements → append to `.claude/docs/guidelines.md` (create it if it doesn't exist)

Be conservative with generic changes — don't overfit the skill to one session. If a pattern appeared only once, note it but don't change the skill. If it appeared across multiple review rounds or matches feedback from previous sessions (check the history branch), it's worth incorporating. Repo-specific guidelines can be added more freely since they only affect this project.

## Step 3: Create Session Summary

Generate a structured summary of the documentation session.

### Summary Format

```markdown
# Doc Session: [Title]

**Date:** YYYY-MM-DD
**Type:** generation / maintenance / combined
**Commit:** `[short hash]` ([full hash])
**Output:** [relative path to generated doc, or "backlog only" for maintenance-only sessions]
**Scope:** [one-line description of what was covered]

## Stats

- Review rounds: [N]
- Feedback items: [N]
- Feedback categories: [top 2-3 categories with counts]

## What Was Done

[2-3 sentence description of session outcome. For generation: the final document. For maintenance: the backlog produced and key findings. For combined: both.]

## Key Feedback Themes

[Bulleted list of the main patterns from the analysis, each with a brief explanation]

## Skill Improvements Applied

[List of changes made to doc skills based on this session, or "None" if no changes were warranted]

## Notes

[Any additional context]
```

### Capturing the Commit Hash

Record the HEAD commit hash of the working branch at the time the documentation was generated. This anchors the session to a specific codebase state, which matters because:
- The generated doc describes code as it existed at that commit
- Future maintenance can diff against this commit to find what changed
- If the doc becomes outdated, the commit hash shows exactly what state it was accurate for

Get the hash with:
```bash
git rev-parse HEAD
```

## Step 4: Archive to History Branch

Commit the session summary to a dedicated orphan branch that serves as a persistent log of all documentation sessions.

### Branch Setup

The history branch is called `doc-sessions`. All operations on this branch use a temporary git worktree to avoid affecting the current working tree, uncommitted changes, or build artifacts.

**First-time setup** (if `doc-sessions` branch doesn't exist):

```bash
# Create a temporary worktree for the orphan branch setup
git worktree add --detach /tmp/doc-sessions-init
cd /tmp/doc-sessions-init
git checkout --orphan doc-sessions
git rm -rf .
```

Add a README, commit, push, then clean up:

```bash
# Write README, git add, git commit ...
git push origin doc-sessions
cd -
git worktree remove /tmp/doc-sessions-init
```

The `git rm -rf .` is safe here — it runs inside the temporary worktree, so it only affects that isolated copy. The main working tree, uncommitted changes, and gitignored files (node_modules, build output, etc.) are completely untouched.

### Committing a Session

Use a temporary worktree for every commit to the history branch — never switch branches in the main working tree. Always fetch the latest remote state first to avoid conflicts with sessions archived from other machines or conversations.

Each session gets its own file named by date and topic:

```
YYYY-MM-DD-[topic-slug].md
```

For example: `2026-03-31-action-dispatch-pipeline.md`

```bash
# Fetch latest remote state of the doc-sessions branch
git fetch origin doc-sessions

# Reset local branch to match remote (fast-forward)
git branch -f doc-sessions origin/doc-sessions

# Create worktree from the existing doc-sessions branch
git worktree add /tmp/doc-sessions-work doc-sessions

# Write the session summary file into the worktree
# e.g. cp /tmp/session-summary.md /tmp/doc-sessions-work/2026-03-31-action-dispatch-pipeline.md

cd /tmp/doc-sessions-work
git add [session-file]
git commit -m "doc-session: [Document Title] ([short commit hash])"

# Push to remote
git push origin doc-sessions

# Clean up
cd -
git worktree remove /tmp/doc-sessions-work
```

### Reviewing History

When the user asks about past sessions, use `git show` to read files directly from the branch without checking it out:

```bash
# List all session files
git ls-tree --name-only doc-sessions

# Read a specific session
git show doc-sessions:2026-03-31-action-dispatch-pipeline.md
```

This avoids any worktree or branch switching for read-only access. Present findings in the conversation — don't make the user navigate the branch themselves.

Past session data is also useful during the analysis phase: if a pattern in the current session matches patterns from previous sessions, that's strong evidence for a skill improvement.

## Tips

- **Don't over-index on a single session.** One session with heavy feedback might just mean the topic was unusually complex. Look for confirmation across sessions before making big skill changes.
- **Capture the user's own words.** When summarizing feedback themes, use the user's phrasing where possible — it's more precise than paraphrasing and helps future readers understand the actual concern.
- **Keep summaries scannable.** The session history is a reference, not a narrative. Future readers (human or LLM) want to quickly find whether a past session is relevant to their situation.
