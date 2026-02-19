# Repository Guidelines

## Project Structure & Module Organization

This repository is a Yarn workspaces/Lerna monorepo.

-   `packages/client`: main GLSP client framework (`src/`, `css/`, unit tests as `*.spec.ts`).
-   `packages/protocol`: client-server protocol types and JSON-RPC helpers.
-   `packages/glsp-sprotty`: GLSP-specific sprotty re-exports/overrides.
-   `examples/workflow-standalone`: browser demo app and example server launcher.
-   `examples/workflow-glsp`: workflow diagram example package used by the standalone app.

Keep new code inside the relevant package `src/` folder and colocate tests with implementation.

## Build, Test, and Development Commands

Use Node `>=20` and Yarn `>=1.7.0 <2`.

-   `yarn install`: install all workspace dependencies.
-   `yarn build`: compile TypeScript and bundle the standalone example.
-   `yarn compile`: run TypeScript project builds only.
-   `yarn lint`: run ESLint on `.ts/.tsx` sources.
-   `yarn test`: run package test suites via Lerna.
-   `yarn test:coverage`: generate coverage with `nyc` per package.
-   `yarn watch`: run TypeScript/watch build flows.
-   `yarn start:exampleServer`: download/start workflow example server.

## Coding Style & Naming Conventions

Code is TypeScript-first, formatted by Prettier (`@eclipse-glsp/prettier-config`) and linted by ESLint (`@eclipse-glsp`).

-   Follow existing formatting (4-space indentation, semicolons, single quotes).
-   Use `PascalCase` for classes/types, `camelCase` for functions/variables.
-   Use descriptive module filenames in kebab-case where established (e.g., `command-palette-tool.ts`).
-   Prefer GLSP re-exports (`@eclipse-glsp/client`) instead of direct `sprotty` imports.

## Testing Guidelines

-   Framework: Mocha with `ts-node` (`.mocharc` at repo root).
-   Test files: `*.spec.ts` or `*.spec.tsx`, typically next to source files.
-   Run targeted tests from a package, e.g. `yarn --cwd packages/client test`.
-   Run `yarn test` and `yarn test:coverage` before opening a PR.

## Commit & Pull Request Guidelines

-   Open/track an issue first in `https://github.com/eclipse-glsp/glsp`.
-   Branch naming: `issues/<issue_number>` (for committers).
-   Commit messages should be imperative and focused; reference the issue using an absolute URL (for auto-close).
-   PRs should include: problem statement, solution summary, linked issue, and screenshots/GIFs for UI-visible changes.
-   Before requesting review, run `yarn check:all`.
