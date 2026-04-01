# CLAUDE.md

## Project Overview

Eclipse GLSP Client monorepo. Provides the sprotty-based client framework for the Graphical Language Server Platform (GLSP). Contains the core client packages and example applications. Uses Lerna with Yarn workspaces.

## Build & Development

-   **Package manager**: Yarn 1.x (classic) — do not use Yarn 2+/Berry or npm
-   **Build**: `yarn` from root installs and compiles everything

## Validation

-   After completing any code changes, always run the `/verify` skill before reporting completion
-   If verification fails, run the `/fix` skill to auto-fix issues, then re-run `/verify`

## Inter-Package Import Rules

These are enforced by ESLint and are easy to get wrong:

-   **Never use relative imports** like `../` or `../index` — use package names
-   **`@eclipse-glsp/protocol`**: Must NOT import from `sprotty`, `sprotty-protocol`, or `@eclipse-glsp/client`
-   **`@eclipse-glsp/sprotty`**: Must NOT import directly from `sprotty-protocol` — use `sprotty` reexports instead
-   **`@eclipse-glsp/client`**: Must NOT import directly from `sprotty` or `sprotty-protocol` — use `@eclipse-glsp/sprotty` reexports instead
