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

```bash
yarn start
```

This downloads the GLSP server (on first run), starts it, and launches the webpack dev server on port **8082**.
The application opens at `http://localhost:8082/diagram.html`.

To use a locally built server bundle:

```bash
yarn start --external-server /path/to/wf-glsp-server-node.js
```

This copies the provided bundle, skips the npm download, and starts the server from it.

To use your own GLSP server running from source (e.g. launched from your IDE), start the client without any built-in server:

```bash
yarn start --external-server
```

You can also configure the server port and host:

```bash
yarn start --port 9090 --host 0.0.0.0
```

## Browser Mode (Web Worker)

In this mode the GLSP server is bundled as a Web Worker and runs directly in the browser. No external server process is needed.

```bash
yarn start:browser
```

This downloads the Web Worker server bundle (on first run) and launches the webpack dev server on port **8083**.
The application opens at `http://localhost:8083/diagram.html`.

To use a locally built Web Worker server bundle instead of the published one:

```bash
yarn start:browser --external-server /path/to/wf-glsp-server-web.js
```

This copies the provided bundle into the `server/` directory and skips the npm download.

## Development (Watch Mode)

For active development, the `dev` scripts compile TypeScript in watch mode and start the webpack dev server with hot reloading:

```bash
# Node mode – watches sources, starts GLSP server, starts webpack dev server
yarn dev

# Browser mode – watches sources, starts webpack dev server
yarn dev:browser
```

Changes to TypeScript sources are recompiled automatically. Reload the browser to pick up changes.

## Building

```bash
# Node bundle (default)
yarn build

# Browser bundle
yarn build:browser
```

Both produce a `bundle.js` in the `app/` directory. The browser build additionally downloads the Web Worker server bundle and copies it into the app directory.

## Additional Options

All `start` and `dev` scripts support the following flags:

-   `--external-server [path]` – Use an external server instead of the default bundled one.
    With a **path**: copies the provided bundle and skips the npm download. In node mode the server is started from the copied bundle; in browser mode it is served as a Web Worker.
    **Without a path** (Node mode only): skips the server download and startup entirely — you run the server yourself.
-   `--no-open` – Don't open the browser automatically
-   `--port <port>` – Set the GLSP server port (Node mode only, default: 8081)
-   `--host <host>` – Set the GLSP server host (Node mode only, default: localhost)
-   `--client-port <port>` – Set the webpack dev server port (default: 8082 in Node mode, 8083 in Browser mode)

The server bundle download can also be skipped by setting the `SKIP_DOWNLOAD=true` environment variable.
