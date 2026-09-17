# Eclipse GLSP - Client [![CI](https://github.com/eclipse-glsp/glsp-client/actions/workflows/ci.yml/badge.svg?ref=master)](https://github.com/eclipse-glsp/glsp-client/actions/workflows/ci.yml) [![E2E](https://github.com/eclipse-glsp/glsp-client/actions/workflows/e2e.yml/badge.svg)](https://github.com/eclipse-glsp/glsp-client/actions/workflows/e2e.yml)

> [!IMPORTANT]
> **This repository is deprecated and will be archived soon.**
> Development has moved to the consolidated [`glsp-core`](https://github.com/eclipse-glsp/glsp-core) monorepo.
> Starting with version `2.9.0`, all packages of this repository are developed and published from there.
> Please report issues in the [GLSP umbrella repository](https://github.com/eclipse-glsp/glsp/issues) and open pull requests against `glsp-core`.

A web-based diagram client framework for the [Graphical Language Server Platform (GLSP)](https://github.com/eclipse-glsp/glsp) based on [Eclipse Sprotty](https://github.com/eclipse/sprotty).

## Structure

- `@eclipse-glsp/protocol`: Generic client-server communication protocol
- `@eclipse-glsp/sprotty`: Sprotty integration layer providing base bindings and re-exports
- `@eclipse-glsp/client`: sprotty-based GLSP client
- `@eclipse-glsp-examples/workflow-glsp`: Workflow diagram specific client customizations
- `@eclipse-glsp-examples/workflow-standalone`: Standalone example application (Node & Browser mode)

## Releases

[All available releases](https://github.com/eclipse-glsp/glsp-client/releases) are available on GitHub including changelogs.
Releases from version `2.9.0` on are published from [glsp-core/releases](https://github.com/eclipse-glsp/glsp-core/releases); the npm links below stay valid.

The following packages are published to npm:

- [@eclipse-glsp/protocol](https://www.npmjs.com/package/@eclipse-glsp/protocol)
- [@eclipse-glsp/sprotty](https://www.npmjs.com/package/@eclipse-glsp/sprotty)
- [@eclipse-glsp/client](https://www.npmjs.com/package/@eclipse-glsp/client)
- [@eclipse-glsp-examples/workflow-glsp](https://www.npmjs.com/package/@eclipse-glsp-examples/workflow-glsp)

## Developer Documentation

### First time setup

- Install [node.js](https://nodejs.org/) (requires Node v22+)
- Install pnpm: <https://pnpm.io/installation> (use pnpm 10+); a recent pnpm automatically switches to the version pinned in the `packageManager` field
- Clone this repository
- Install dependencies: `pnpm i` or `pnpm i --frozen-lockfile`

### Build & Testing

- Build (all packages): `pnpm build`
- Test (all packages): `pnpm test`
- Clean (all packages): `pnpm clean`

## Workflow Diagram Example

> **[Try it online](https://eclipse-glsp.github.io/glsp-client/diagram.html)** – a live deployment of the browser example running on GitHub Pages.

The workflow diagram is a consistent example provided by all GLSP components. The example implements a simple flow chart diagram editor with different types of nodes and edges (see screenshot below).
The example can be used to try out different GLSP features, as well as several available integrations with IDE platforms (Theia, VSCode, Eclipse, Standalone).
As the example is fully open source, you can also use it as a blueprint for a custom implementation of a GLSP diagram editor.
See [our project website](https://www.eclipse.org/glsp/documentation/#workflowoverview) for an overview of the workflow example and all components implementing it.

https://github.com/eclipse-glsp/glsp-client/assets/2311075/7436ab37-a68d-448a-8c44-a312760376c3

### How to start the Workflow Diagram example?

The example can be run in two modes:

- **Browser mode** – The GLSP server runs as a Web Worker directly in the browser. No external server process is needed. This is the quickest way to try out the example.
- **Node mode** – The client connects to an external GLSP server via WebSocket. By default a pre-built Node.js server is downloaded and started, but this mode can also be used with a [Java-based GLSP server](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example).

Clone this repository, then install the dependencies and build the glsp-client packages:

```bash
pnpm build
```

#### Browser mode (recommended for quick start)

```bash
pnpm start:browser
```

This downloads the bundled Web Worker GLSP server and starts the webpack dev server on `http://localhost:8083/diagram.html`.

#### Node mode

```bash
pnpm start
```

This downloads and starts the GLSP server and launches the webpack dev server on `http://localhost:8082/diagram.html`.

To use your own GLSP server (e.g. a [Java](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) or [Node](https://github.com/eclipse-glsp/glsp-server-node#workflow-diagram-example) variant running from source), start the server separately and launch the client without the built-in server:

```bash
pnpm start --client-only
```

### Development

For active development, the `dev` scripts compile TypeScript in watch mode and start all necessary processes in parallel:

```bash
# Browser mode – watches sources, starts webpack dev server
pnpm dev:browser

# Node mode – watches sources, starts GLSP server, starts webpack dev server
pnpm dev
```

### How to start the Workflow Diagram example server from the sources

If you want to explore or change the Workflow Diagram Server too, you can clone, build and start the Java or Node variant of the `workflow example glsp-server` from your IDE instead of using the pre-built version of the Workflow Diagram Server.
Checkout the [`glsp-server`](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) or [`glsp-server-node`](https://github.com/eclipse-glsp/glsp-server-node#workflow-diagram-example) repo for instructions on building and running the Workflow Diagram Server example.

### Where to find the sources?

The sources of `@eclipse-glsp/client`, `@eclipse-glsp/protocol`, `@eclipse-glsp/sprotty` and the Workflow Diagram client example have moved to the [`glsp-core`](https://github.com/eclipse-glsp/glsp-core) monorepo (`packages/client/client`, `packages/common/protocol`, `packages/client/glsp-sprotty` and `examples/workflow-glsp`/`examples/workflow-standalone`).
The source code of the Workflow Diagram server example can be found here: <https://github.com/eclipse-glsp/glsp-server/tree/master/examples/org.eclipse.glsp.example.workflow>

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
