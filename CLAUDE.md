# CLAUDE.md

## Project Overview

Eclipse GLSP Client monorepo. Provides the sprotty-based client framework for the Graphical Language Server Platform (GLSP). Contains the core client packages and example applications. Uses Lerna with Yarn workspaces.

## Build & Development

-   **Package manager**: Yarn 1.x (classic) — do not use Yarn 2+/Berry or npm
-   **Build**: `yarn` from root installs and compiles everything
-   **Clean**: `yarn clean`

## Validation

-   **Tests**: `yarn test` (Mocha), single test: `yarn test --grep 'test name'`
-   After completing any code changes, always run the `/verify` skill before reporting completion
-   If verification fails, run the `/fix` skill to auto-fix issues, then re-run `/verify`

## Commenting Style

-   **TSDoc (`/** ... \*/`) on the public API\*\*: document exported interfaces, types, classes, methods, and notable properties/getters. Describe intent and behavior, not the obvious signature.
-   **Cross-reference with `{@link Symbol}`** instead of writing bare type/method names in prose.
-   **Document non-trivial methods** with `@param`/`@returns` (and `@throws` where relevant). Skip them for self-explanatory one-liners.
-   **Deprecations** use the fixed form `/** @deprecated Use {@link Replacement} instead */`.
-   **Inline `//` comments explain _why_, not _what_** — keep them short and lowercase, and reserve them for non-obvious decisions or rationale.
-   **Mark known limitations** with `// FIXME:` / `// TODO:`, and justify suppressions with `// eslint-disable-next-line <rule>`.
-   Don't restate code in comments; let clear naming carry the _what_.
-   Copyright headers are required on every file but are handled by `/verify` + `/fix` — don't add them manually.

## Inter-Package Import Rules

These are enforced by ESLint and are easy to get wrong:

-   **Never use relative imports** like `../` or `../index` — use package names
-   **`@eclipse-glsp/protocol`**: Must NOT import from `sprotty`, `sprotty-protocol`, or `@eclipse-glsp/client`
-   **`@eclipse-glsp/sprotty`**: Must NOT import directly from `sprotty-protocol` — use `sprotty` reexports instead
-   **`@eclipse-glsp/client`**: Must NOT import directly from `sprotty` or `sprotty-protocol` — use `@eclipse-glsp/sprotty` reexports instead
