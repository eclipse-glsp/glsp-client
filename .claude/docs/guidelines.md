# Repo-Specific Documentation Guidelines

Guidelines accumulated from documentation sessions. These apply only to this repository and are read by doc-generate, doc-maintain, and doc-retrospective skills.

## Code Exploration

- **Sprotty sources matter.** The GLSP client heavily reuses modules and concepts from sprotty. During code exploration, also look at sprotty sources in `node_modules/sprotty/src/` and `node_modules/sprotty-protocol/src/` when understanding base classes, interfaces, or patterns that GLSP extends or overrides. This is especially important for documenting architecture, the action-command pipeline, DI modules, and view rendering.

- **Cross-boundary concepts with glsp-server.** Some architectural concepts (e.g., action protocol, operations, model schema, client-server handshake) span both the client and server. When documenting these cross-boundary topics, ask the user to point you to the server sources for additional input rather than guessing at the server side.
