# CLAUDE.md

## Project Overview

Eclipse GLSP Client monorepo. Provides the sprotty-based client framework for the Graphical Language Server Platform (GLSP). Contains the core client packages and example applications. Uses pnpm workspaces.

## Build & Development

- **Package manager**: pnpm — do not use yarn or npm
- **Build**: `pnpm build` from root compiles everything
- **Clean**: `pnpm clean`

## Validation

- **Tests**: `pnpm test` (Vitest), single test: `pnpm test -t 'test name'`
- After completing any code changes, always run the `/fix` skill before reporting completion. It auto-fixes lint/format/header issues and runs the tests; manually resolve anything it could not auto-fix (remaining lint errors, test failures) and re-run it.

## Commenting Style

- **TSDoc (`/** ... \*/`) on the public API\*\*: document exported interfaces, types, classes, methods, and notable properties/getters. Describe intent and behavior, not the obvious signature.
- **Cross-reference with `{@link Symbol}`** instead of writing bare type/method names in prose.
- **Document non-trivial methods** with `@param`/`@returns` (and `@throws` where relevant). Skip them for self-explanatory one-liners.
- **Deprecations** use the fixed form `/** @deprecated Use {@link Replacement} instead */`.
- **Inline `//` comments explain _why_, not _what_** — keep them short and lowercase, and reserve them for non-obvious decisions or rationale.
- **Mark known limitations** with `// FIXME:` / `// TODO:`, and justify suppressions with `// eslint-disable-next-line <rule>`.
- Don't restate code in comments; let clear naming carry the _what_.
- Copyright headers are required on every file but are handled by `/fix` — don't add them manually.

## Inter-Package Import Rules

These are enforced by ESLint and are easy to get wrong:

- **Never use relative imports** like `../` or `../index` — use package names
- **`@eclipse-glsp/protocol`**: Must NOT import from `sprotty`, `sprotty-protocol`, or `@eclipse-glsp/client`
- **`@eclipse-glsp/sprotty`**: Must NOT import directly from `sprotty-protocol` — use `sprotty` reexports instead
- **`@eclipse-glsp/client`**: Must NOT import directly from `sprotty` or `sprotty-protocol` — use `@eclipse-glsp/sprotty` reexports instead
