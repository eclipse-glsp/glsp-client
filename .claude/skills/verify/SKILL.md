---
name: verify
description: Run full project validation (lint, format, copyright headers) to catch issues before committing. IMPORTANT - Proactively invoke this skill after completing any code changes (new features, bug fixes, refactors) before reporting completion to the user.
---

Run the full validation suite for the GLSP Client monorepo from the repository root:

```bash
yarn check:all
```

In a parallel task, run the test suite to ensure all tests pass:

```bash
yarn test
```

On failure:

1. Report which checks/tests failed and the specific errors
2. If checks failed, auto-fix by invoking the `/fix` skill
3. In case of previous test failures, re-run the `yarn test` command to confirm all tests now pass
4. Re-run `yarn check:all` to confirm everything passes
