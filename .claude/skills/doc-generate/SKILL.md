---
name: doc-generate
description: Generate developer documentation artifacts from codebases. Use when the user wants to create technical documentation, architecture guides, onboarding docs, implementation recipes, or API references for a codebase. Triggers on requests like "document this module", "write architecture docs", "create developer guide", "explain how X works as a doc", or any request to produce structured documentation from code. Also use when the user wants to document design decisions, key flows, or patterns in a repository.
---

# Documentation Artifact Generator

Create high-quality developer documentation by exploring a codebase and synthesizing findings into a structured, readable artifact. The documentation serves both human developers (onboarding, reference) and LLMs (context feeding, codebase understanding).

## Workflow Overview

```
1. SCOPE  →  2. EXPLORE  →  3. DRAFT  →  4. REVIEW LOOP
(user input)  (codebase)     (generate)    (iterate with user)
```

## Output Location

All documentation artifacts are written to the `docs/` folder at the repository root unless the user specifies a different location. Within `docs/`, create subfolders to group artifacts that semantically belong together (e.g., `docs/architecture/`, `docs/guides/`, `docs/patterns/`). Use flat structure when there's only one or two docs — don't create a subfolder for a single file.

### Documentation Index

Maintain a `docs/index.md` file that serves as a registry of all documentation artifacts. This index is critical for LLM consumption — it allows an LLM to understand the full documentation landscape and navigate to the right artifact without reading every file.

When creating or updating a documentation artifact, always update `docs/index.md`. If the file doesn't exist yet, create it.

**Index format:**

```markdown
# Documentation Index

> This index catalogs all developer documentation artifacts in this repository.
> Each entry includes a brief description and path to help both humans and LLMs
> locate relevant documentation quickly.

## [Category Name]

- **[Document Title](relative/path/to/doc.md)** — One-line description of what this document covers, including key topics and the primary audience.

## [Another Category]

- **[Another Doc](path/to/doc.md)** — Description.
```

Group entries by category (matching the subfolder structure). Keep descriptions concise but specific enough that a reader (human or LLM) can decide whether to open the document without reading it.

## Repository Guidelines

This skill is generic and reusable across projects. Repo-specific customizations — terminology, style preferences, structural conventions, audience assumptions, design decisions about documentation — live in a separate file: `.claude/docs/guidelines.md`.

Before starting any documentation session, check if `.claude/docs/guidelines.md` exists. If it does, read it and apply its guidance alongside the generic instructions in this skill. Repo-specific guidelines take precedence over generic defaults when they conflict.

The guidelines file is freeform Markdown — each repo shapes it to their needs. Typical contents include:

- **Terminology** — project-specific terms and how to use them ("use 'adopter' not 'consumer'", "GLSP always uppercase")
- **Style** — writing preferences learned over time ("keep code examples under 15 lines", "avoid bullet-list-heavy sections")
- **Structure** — repo-specific conventions ("always include a 'For Adopters' section", "group by package not by concept")
- **Audience** — default assumptions ("readers are Java developers familiar with LSP but not EMF")
- **Scope** — what to document vs. skip ("internal utilities don't need docs", "all public extension points do")
- **Design decisions** — repo-level documentation choices ("we use one doc per package, not per concept")

If the file doesn't exist, proceed with the generic defaults from this skill. Don't create it proactively — it gets populated through the retrospective skill as repo-specific patterns emerge.

## Stage 1: Scope

The user provides a short prompt describing what to document. This might be as minimal as "document the DI container" or as detailed as a list of concepts and boundaries.

Extract from the user's prompt:
- **Subject** — what module, pattern, flow, or concept to document
- **Audience** — who will read this (new contributors, adopters, LLM agents). Default: developers new to this part of the codebase
- **Depth** — high-level overview vs. deep dive. Default: enough to orient and enable, not exhaustive API docs
- **Location** — where to write the output. Default: `docs/` with an appropriate subfolder

If the prompt is clear enough to proceed, move straight to exploration. Only ask clarifying questions when the scope is genuinely ambiguous — e.g., the user says "document the server" but the repo has three server packages. Prefer to make reasonable assumptions and note them at the top of the draft rather than blocking on questions.

### When the Input Is a Backlog Item

If the user's prompt comes from `.claude/docs/backlog.md` (or clearly mirrors one), treat its fields as constraints rather than suggestions. The backlog item went through a refinement step with the user during maintenance/exploration — the scope was already agreed upon.

Specifically:
- **Subject, audience, depth** — follow what the backlog item specifies
- **Exclusions** — if the item says "don't cover X", respect that boundary even if exploration reveals X is related
- **Dependencies** — if the item lists prerequisite docs, verify they exist before proceeding

Do a brief scope confirmation only when something in the backlog item is ambiguous or conflicts with what you find in the code (e.g., the referenced module was renamed). Otherwise, proceed directly.

## Stage 2: Explore

Systematically investigate the codebase to build understanding before writing anything. This is the most important stage — documentation quality depends on exploration quality.

### Exploration Strategy

1. **Sample existing docs** — if `docs/` already contains documentation artifacts, read 1-2 of them to understand the local conventions: heading style, section ordering, level of detail, code example patterns, tone. Mirror these conventions in your draft rather than relying solely on the generic template. This matters most for the first few docs in a repo when `.claude/docs/guidelines.md` doesn't exist yet.
2. **Orient** — find the entry points: package.json, main exports, index files, README fragments. Understand the module boundary.
3. **Map structure** — identify key files, classes, interfaces, and their relationships. Note the dependency graph.
4. **Trace flows** — follow the primary execution paths. How does data enter, transform, and exit? What are the key decision points?
5. **Identify patterns** — look for recurring architectural patterns, design decisions, extension points, and conventions.
6. **Find the non-obvious** — look for things that would surprise or trip up a newcomer: implicit contracts, naming that doesn't match behavior, historical quirks, workarounds.

For larger scopes covering multiple packages, consider exploring independent subsystems in parallel when subagents are available.

### What to Look For

- Architecture and layering (what depends on what, and why)
- Key abstractions and their responsibilities
- Extension points and how adopters customize behavior
- Configuration and its effects
- Error handling patterns and failure modes
- Lifecycle and initialization order
- Non-obvious constraints or invariants

### Exploration Boundaries

Stay within the scope the user defined. If you discover something outside scope that is critical context (e.g., a cross-cutting concern), note it briefly and suggest it as a follow-up doc topic rather than expanding the current artifact.

## Stage 3: Draft

Generate the documentation artifact as a single Markdown file.

### Writing Principles

These principles reflect what makes developer documentation actually useful, drawing from the best technical writing (think React docs — explain concepts through the lens of what the reader is trying to accomplish, not just what the code does):

1. **Lead with the "why"** — before explaining how something works, explain why it exists and what problem it solves. Developers who understand the motivation can reason about edge cases on their own.

2. **Concept-first, API-second** — introduce mental models before showing code. A reader who grasps the concept can look up the API; a reader who only sees the API cannot reconstruct the concept.

3. **One idea per section** — each section should teach exactly one thing. If you find yourself writing "additionally" or "also" repeatedly, split the section.

4. **Show, don't just tell** — use short, focused code examples that illustrate exactly the point being made. Strip examples to the minimum that demonstrates the concept. Annotate with comments only where the code isn't self-explanatory.

5. **Be honest about complexity** — don't pretend something simple is complex (over-documenting) or something complex is simple (hand-waving). Call out where things get tricky and why.

6. **Write for scanning** — developers rarely read docs linearly. Use clear headings, keep paragraphs short, and front-load the key information in each section.

### Document Structure

Use this structure as a starting point and adapt it to the subject:

```markdown
# [Title]

> One-paragraph summary: what this is, why it exists, and when you'd interact with it.

## Overview

High-level explanation of the concept/module/pattern. Include a Mermaid diagram
if the subject involves components, flows, or relationships.

## Core Concepts

Explain each key concept the reader needs to understand. One subsection per concept.
Order from foundational to advanced — each concept should build on the previous ones.

### [Concept A]
### [Concept B]

## How It Works

Walk through the primary flow or mechanism. This is where you trace execution,
show how pieces connect, and explain the "machinery."

Include Mermaid sequence or flow diagrams for non-trivial interactions.

## Usage / How To

Practical guidance: how to use, extend, or modify. Code examples go here.

## Key Design Decisions

Document the important "why" choices — things a reader might question or
that constrain future changes. Format:

- **Decision**: what was chosen
- **Rationale**: why this approach over alternatives
- **Implication**: what this means for adopters/contributors

## Glossary (optional)

Only include if the subject introduces domain-specific terms not obvious from context.
```

### Mermaid Diagrams

Use Mermaid syntax for all visual elements. Diagrams are not decoration — include them when they communicate relationships or flows more clearly than prose.

Appropriate diagram types:
- **Architecture/component relationships** → `graph TD` or `graph LR`
- **Sequence of operations** → `sequenceDiagram`
- **State transitions** → `stateDiagram-v2`
- **Decision flows** → `flowchart TD`
- **Class hierarchies** → `classDiagram`

Keep diagrams focused. A diagram with 20+ nodes is harder to read than two diagrams with 10 nodes each. Label edges — unlabeled arrows are ambiguous.

### Non-Mermaid Visuals

When a visual can't be expressed in Mermaid (screenshots, UI mockups, photos of whiteboard sketches), use a placeholder with a description of what the image should show:

```markdown
![Placeholder: screenshot of the properties view showing the three configuration tabs](figures/properties-view-tabs.png)
```

The alt text serves double duty — it tells a human what image to capture, and it gives LLMs the semantic content of the missing visual. The file path indicates where the image should be placed once captured.

### Context Preface

Every documentation artifact starts with a structured HTML comment block before the title. This metadata lets LLMs quickly assess relevance without reading the full document. Keep it high-level — avoid pointing to specific files, classes, or implementation details that would become stale when code changes.

```markdown
<!--
topic: <kebab-case-identifier>
scope: <architecture | concept | recipe | design-decision | reference>
related:
  - <relative/path/to/other-doc.md>
last-updated: YYYY-MM-DD
-->

# [Title]
```

**Fields:**
- **topic** — kebab-case identifier for the document's subject (e.g., `dependency-injection`, `action-dispatch`)
- **scope** — the category of documentation: `architecture`, `concept`, `recipe`, `design-decision`, or `reference`
- **related** — relative paths to related documentation artifacts. Only list docs, not source files.
- **last-updated** — date of the last substantive content update (YYYY-MM-DD)

Keep it to these four fields. The document body is the right place for specific packages, types, and implementation details — the preface is for navigation and triage only.

### LLM Consumption Considerations

Since these docs will also be fed as context to LLMs:

- Use precise, unambiguous language (LLMs benefit from the same clarity humans do)
- Include full qualified names (package, class, method) when referencing code — this helps LLMs locate the actual source
- Structure with clear Markdown headings so the document can be chunked effectively
- Avoid relative references like "the above" or "as mentioned earlier" — restate briefly instead, since context windows may not include the referenced section
- The glossary section is particularly valuable for LLM consumption as it provides explicit term definitions

### What NOT to Include

- Auto-generated API listings (JSDoc/TSDoc tools do this better)
- Line-by-line code walkthroughs (trust the reader to read code)
- Changelog-style history ("in v2.3 we changed X") — document current state
- Subjective commentary ("this is an elegant solution")
- Placeholder sections with no real content — if a section would be empty, omit it

## Stage 4: Review Loop

After presenting the draft, enter an iterative review cycle. The user reads the document and provides feedback. This phase is collaborative — the user steers while you execute.

### How the Review Works

1. Present the complete draft
2. Ask the user to review and indicate what to change — things like:
   - "Section X is too detailed / not detailed enough"
   - "Missing coverage of [topic]"  
   - "The diagram doesn't show [relationship]"
   - "Rewrite [section] to focus on [angle]"
   - "This isn't accurate — [correction]"
3. Apply the requested changes. For each change, re-explore the codebase if needed to ensure accuracy.
4. Present the updated sections (not the full document — just what changed)
5. Repeat until the user is satisfied

### Handling Feedback

- **Scope expansion** ("also cover X") — if X is closely related, add it. If it's a separate concern, suggest a follow-up document instead.
- **Accuracy corrections** — re-verify against the code before applying. The user knows the codebase; trust their corrections but confirm the details.
- **Style/tone feedback** — apply it and internalize the preference for subsequent sections.
- **"Too much / too little"** — recalibrate depth for the rest of the document, not just the flagged section.

### Completion

When the user signals the document is good:

1. Do a final consistency pass — check that headings, terminology, and depth are consistent throughout
2. Verify all code references still point to real files/classes/methods
3. Confirm the output location with the user and write the final file

## Tips for Quality

- **Re-read the code, not your notes** — when revising a section, go back to the source. Your initial exploration may have missed nuance.
- **Cut aggressively** — if a sentence doesn't teach the reader something they need, remove it. Dense, useful documentation beats comprehensive, skimmable documentation.
- **Test your examples** — if you include code examples, verify they match the actual API signatures and patterns in the codebase.
- **Name things precisely** — use the exact names from the code. If a class is called `ActionDispatcher`, don't call it "the action dispatching component" in prose.
