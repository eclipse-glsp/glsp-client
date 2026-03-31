# Documentation Backlog

**Origin:** [exploration: 2026-03-31]
**Baseline HEAD:** `d60eef8` (2026-03-04)

---

## Priority 1 — One of each type (for skill evaluation)

### 1. Architecture Overview

-   **Category:** Architecture
-   **Priority:** High
-   **Complexity:** Large (multi-section)
-   **Audience:** New contributors, adopters, integrators
-   **Summary:** High-level architecture of the GLSP client framework: the 3-package structure (protocol → sprotty → client), how they layer, the action-command pipeline, server-driven model, DI container composition, and the relationship to sprotty. This is the "map" everything else references.
-   **Dependencies:** None (foundational)
-   **Status:** Pending

### 2. Dependency Injection & Module System

-   **Category:** Concept Deep Dive
-   **Priority:** High
-   **Complexity:** Medium
-   **Audience:** Adopters building custom diagram editors
-   **Summary:** How Inversify DI works in GLSP: `FeatureModule` composition, `DEFAULT_MODULES`, `initializeDiagramContainer()`, binding patterns (`configureActionHandler`, `configureCommand`, `configureModelElement`), the `LazyInjector` pattern for circular deps, and how to add/remove/override modules. This is the #1 thing adopters need to understand.
-   **Dependencies:** Architecture Overview
-   **Status:** Pending

### 3. Configuring Model Elements (Recipe)

-   **Category:** Recipe
-   **Priority:** High
-   **Complexity:** Small
-   **Audience:** Adopters building custom diagram editors
-   **Summary:** Extending `GNode`/`GEdge`, adding custom properties, enabling features (`deletableFeature`, `editLabelFeature`, etc.), `Nameable`/`WithEditableLabel` mixins, and registering elements via `configureModelElement()`. Self-contained with code snippets; references workflow example.
-   **Dependencies:** DI & Module System
-   **Status:** Pending

### 4. Client-Server Protocol Reference

-   **Category:** Reference
-   **Priority:** High
-   **Complexity:** Medium
-   **Audience:** Server implementors, advanced adopters
-   **Summary:** All action kinds organized by domain (model data, element creation, selection, clipboard, navigation, validation, etc.), the `GLSPClient` interface, `ClientState` lifecycle, JSON-RPC transport layer (`BaseJsonrpcGLSPClient`, `GLSPWebSocketProvider`), and protocol versioning.
-   **Dependencies:** Architecture Overview
-   **Status:** Pending

---

## Priority 2 — Remaining architecture & concepts

### 5. Package Guide

-   **Category:** Architecture
-   **Priority:** Medium
-   **Complexity:** Medium
-   **Audience:** New contributors, adopters
-   **Summary:** What each package (`@eclipse-glsp/protocol`, `@eclipse-glsp/sprotty`, `@eclipse-glsp/client`) provides, its public API surface, and when to import from which. Covers the G-prefix aliasing convention (SNodeImpl → GNode), the re-export strategy, and the TYPES service identifiers.
-   **Dependencies:** Architecture Overview
-   **Status:** Pending

### 6. Action-Command Pipeline

-   **Category:** Concept Deep Dive
-   **Priority:** Medium
-   **Complexity:** Medium
-   **Audience:** Contributors, adopters extending behavior
-   **Summary:** How actions flow: `GLSPActionDispatcher` → `ActionHandlerRegistry` → handlers/commands → `GLSPCommandStack`. Covers server vs client actions, the `ServerAction` marker, request/response pattern with `RequestAction`/`ResponseAction`, `Operation` vs `Action`, and the feedback re-dispatch mechanism.
-   **Dependencies:** Architecture Overview
-   **Status:** Pending

### 7. Diagram Lifecycle & Initialization

-   **Category:** Concept Deep Dive
-   **Priority:** High
-   **Complexity:** Medium
-   **Audience:** Adopters, contributors working on startup logic
-   **Summary:** The 5-stage `DiagramLoader` lifecycle (`preLoadDiagram` → `postModelInitialization`), `IDiagramStartup` ranked services, `ModelInitializationConstraint`, the client-server handshake, and `GLSPModelSource` action forwarding.
-   **Dependencies:** Architecture Overview, DI & Module System
-   **Status:** Pending

### 8. Tool System & Feedback

-   **Category:** Concept Deep Dive
-   **Priority:** Medium
-   **Complexity:** Medium
-   **Audience:** Adopters building custom editing tools
-   **Summary:** The `Tool` interface, `ToolManager` lifecycle (enable/disable/defaults), `BaseTool` base class, the `FeedbackEmitter` pattern for persistent visual feedback across model updates, and `IFeedbackActionDispatcher`.
-   **Dependencies:** Action-Command Pipeline, DI & Module System
-   **Status:** Pending

---

## Priority 3 — Remaining recipes

### 9. Configuring a Diagram Module (Recipe)

-   **Category:** Recipe
-   **Priority:** Medium
-   **Complexity:** Small
-   **Audience:** Adopters building custom diagram editors
-   **Summary:** Creating a `FeatureModule`, `initializeDiagramContainer()`, adding/removing/overriding default modules. Self-contained with code snippets.
-   **Dependencies:** DI & Module System
-   **Status:** Pending

### 10. Configuring Views (Recipe)

-   **Category:** Recipe
-   **Priority:** Medium
-   **Complexity:** Small
-   **Audience:** Adopters building custom diagram editors
-   **Summary:** Implementing `IView` in TSX, `configureModelElement()` to bind model→view, SVG rendering patterns, CSS styling.
-   **Dependencies:** DI & Module System, Configuring Model Elements
-   **Status:** Pending

### 11. Configuring Action Handlers (Recipe)

-   **Category:** Recipe
-   **Priority:** Medium
-   **Complexity:** Small
-   **Audience:** Adopters extending behavior
-   **Summary:** Implementing `IActionHandler`, `configureActionHandler()`, request/response pairs, handling server vs client actions.
-   **Dependencies:** Action-Command Pipeline, DI & Module System
-   **Status:** Pending

### 12. Configuring Tools (Recipe)

-   **Category:** Recipe
-   **Priority:** Medium
-   **Complexity:** Small
-   **Audience:** Adopters building custom editing tools
-   **Summary:** Extending `BaseTool`, registering with `ToolManager`, using `FeedbackEmitter` for persistent visual feedback, edit vs non-edit tools.
-   **Dependencies:** Tool System & Feedback, DI & Module System
-   **Status:** Pending

### 13. Configuring Operations (Recipe)

-   **Category:** Recipe
-   **Priority:** Low
-   **Complexity:** Small
-   **Audience:** Adopters extending editing capabilities
-   **Summary:** Dispatching `CreateNodeOperation`, `CreateEdgeOperation`, custom `Operation` subclasses, `CompoundOperation`.
-   **Dependencies:** Action-Command Pipeline
-   **Status:** Pending

### 14. Configuring UI Extensions (Recipe)

-   **Category:** Recipe
-   **Priority:** Low
-   **Complexity:** Small
-   **Audience:** Adopters customizing the editor UI
-   **Summary:** Extending `GLSPAbstractUIExtension`, context menu providers, command palette providers, tool palette.
-   **Dependencies:** DI & Module System
-   **Status:** Pending

### 15. Connecting to a GLSP Server (Recipe)

-   **Category:** Recipe
-   **Priority:** Low
-   **Complexity:** Small
-   **Audience:** Adopters setting up a diagram editor
-   **Summary:** `GLSPClient` setup, WebSocket/JSON-RPC transport, `DiagramLoader` options, session lifecycle.
-   **Dependencies:** Architecture Overview, Diagram Lifecycle
-   **Status:** Pending
