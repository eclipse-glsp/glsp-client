---
name: fix
description: Auto-fix all lint, formatting, and copyright header issues across the workspace. Use when validation (`/verify`) fails or when explicitly requested.
---

Run the full auto-fix suite for the GLSP Client monorepo from the repository root:

```bash
yarn lint:fix && yarn format && yarn headers:fix
```

After fixing, report what changed. If any issues remain that couldn't be auto-fixed, list them and suggest manual fixes.
