# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eclipse GLSP Client monorepo. Provides the sprotty-based client framework for the Graphical Language Server Platform (GLSP). Contains the core client packages and example applications. Uses pnpm workspaces.

## Build & Development

- **Package manager**: pnpm — do not use yarn or npm
- **Build**: `pnpm build` from root compiles everything
- **Clean**: `pnpm clean`

## Validation

- **Tests**: `pnpm test` (Vitest), single test: `pnpm test -t 'test name'`

## Inter-Package Import Rules

These are enforced by ESLint and are easy to get wrong:

- **Never use relative imports** like `../` or `../index` — use package names
- **`@eclipse-glsp/protocol`**: Must NOT import from `sprotty`, `sprotty-protocol`, or `@eclipse-glsp/client`
- **`@eclipse-glsp/sprotty`**: Must NOT import directly from `sprotty-protocol` — use `sprotty` reexports instead
- **`@eclipse-glsp/client`**: Must NOT import directly from `sprotty` or `sprotty-protocol` — use `@eclipse-glsp/sprotty` reexports instead
