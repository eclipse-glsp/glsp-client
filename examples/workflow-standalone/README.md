# Workflow Standalone Example

Standalone browser application for the GLSP Workflow example diagram.
This package supports two modes: a **Node** mode that connects to an external GLSP server via WebSocket (Node.js or Java), and a **Browser** mode that runs the GLSP server entirely in-browser as a Web Worker.

## Prerequisites

Build the GLSP client packages from the repository root:

```bash
yarn
```

## Node Mode (WebSocket)

In this mode the client connects to an external GLSP server over a WebSocket. By default a pre-built Node.js server is downloaded and started, but this mode can also be used with a [Java-based GLSP server](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example).

**Start the server and client together (recommended):**

```bash
# from the repo root
yarn dev
```

This compiles the TypeScript sources in watch mode, downloads and starts the GLSP server, and launches the webpack dev server on port **8082**.

**Or start them separately:**

```bash
# Terminal 1 – start the GLSP server (downloads from npm on first run)
yarn start:exampleServer

# Terminal 2 – start the webpack dev server
yarn start
```

The application opens at `http://localhost:8082/diagram.html`.

## Browser Mode (Web Worker)

In this mode the GLSP server is bundled as a Web Worker and runs directly in the browser. No external server process is needed.

**Start the dev server:**

```bash
# from the repo root
yarn dev:browser
```

This compiles in watch mode and launches the webpack dev server on port **8083**.

**Or without watch mode:**

```bash
yarn start:browser
```

The application opens at `http://localhost:8083/diagram.html`.

## Building

```bash
# Node bundle (default)
yarn build

# Browser bundle
yarn build:browser
```

Both produce a `bundle.js` in the `app/` directory. The browser build additionally copies the Web Worker server script.

## Development (Watch Mode)

For active development, the `dev` scripts compile TypeScript in watch mode and start the webpack dev server with hot reloading:

```bash
# Node mode – watches sources, starts GLSP server, starts webpack dev server
yarn dev

# Browser mode – watches sources, starts webpack dev server
yarn dev:browser
```

Changes to TypeScript sources are recompiled automatically. Reload the browser to pick up changes.

## Legacy

The root-level scripts `yarn start` and `yarn start:exampleServer` continue to work as before for the Node mode. T
