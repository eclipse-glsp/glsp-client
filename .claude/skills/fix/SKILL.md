---
name: fix
description: Run the fix-and-verify suite for the workspace (compile, auto-fix lint/format/headers, test). IMPORTANT - Proactively invoke this skill after completing any code changes (new features, bug fixes, refactors) before reporting completion. Re-run it after manually addressing anything it could not auto-fix.
---

Run the auto-fix and validation suite for the GLSP Client monorepo from the repository root.

1. Build first. This is a hard gate: if the build fails, stop immediately, report the build errors, and do not run any of the following steps.
   The build must pass before anything else runs.

```bash
pnpm build
```

2. Auto-fix lint, formatting, and copyright headers. Run all three even if an earlier one reports remaining problems (they are independent):

```bash
pnpm lint:fix
pnpm format
pnpm headers:fix -t changes
```

3. Run the test suite to validate behavior (tests are not auto-fixable):

```bash
pnpm test
```

Then:

- If `pnpm build` failed, fix the compile errors and re-run this skill.
- If `pnpm lint:fix` reported lint errors it could not fix, or `pnpm test` failed, fix them manually and re-run this skill.
- Otherwise everything is clean (compile succeeds, formatting and headers are corrected in place, lint has no remaining errors, tests pass) — report completion.
