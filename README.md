# Eclipse GLSP - Client [![CI](https://github.com/eclipse-glsp/glsp-client/actions/workflows/ci.yml/badge.svg?ref=master)](https://github.com/eclipse-glsp/glsp-client/actions/workflows/ci.yml) [![E2E](https://github.com/eclipse-glsp/glsp-client/actions/workflows/e2e.yml/badge.svg)](https://github.com/eclipse-glsp/glsp-client/actions/workflows/e2e.yml)

A web-based diagram client framework for the [Graphical Language Server Platform (GLSP)](https://github.com/eclipse-glsp/glsp) based on [Eclipse Sprotty](https://github.com/eclipse/sprotty).

## Structure

-   `@eclipse-glsp/protocol`: Generic client-server communication protocol
-   `@eclipse-glsp/client`: sprotty-based GLSP client

## Building

This project is built with `yarn` and is available from npm via [@eclipse-glsp/protocol](https://www.npmjs.com/package/@eclipse-glsp/protocol) and [@eclipse-glsp/client](https://www.npmjs.com/package/@eclipse-glsp/client).

## Workflow Diagram Example

The workflow diagram is a consistent example provided by all GLSP components. The example implements a simple flow chart diagram editor with different types of nodes and edges (see screenshot below).
The example can be used to try out different GLSP features, as well as several available integrations with IDE platforms (Theia, VSCode, Eclipse, Standalone).
As the example is fully open source, you can also use it as a blueprint for a custom implementation of a GLSP diagram editor.
See [our project website](https://www.eclipse.org/glsp/documentation/#workflowoverview) for an overview of the workflow example and all components implementing it.

https://github.com/eclipse-glsp/glsp-client/assets/2311075/7436ab37-a68d-448a-8c44-a312760376c3

### How to start the Workflow Diagram example?

The example can be run in two modes:

-   **Browser mode** – The GLSP server runs as a Web Worker directly in the browser. No external server process is needed. This is the quickest way to try out the example.
-   **Node mode** – The client connects to an external GLSP server via WebSocket. By default a pre-built Node.js server is downloaded and started, but this mode can also be used with a [Java-based GLSP server](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example).

Clone this repository and build the glsp-client packages:

```bash
yarn install
```

#### Browser mode (recommended for quick start)

```bash
yarn start:browser
```

This starts the webpack dev server with the bundled Web Worker GLSP server on `http://localhost:8083/diagram.html`.

#### Node mode

Start the GLSP server and the webpack dev server:

```bash
# Terminal 1 – start the GLSP server (downloads from npm on first run)
yarn start:exampleServer

# Terminal 2 – start the webpack dev server
yarn start
```

The application opens at `http://localhost:8082/diagram.html`.

Instead of the pre-built server, you can also run the GLSP server from source — either the [Java](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) or [Node](https://github.com/eclipse-glsp/glsp-server-node#workflow-diagram-example) variant. In that case, skip `yarn start:exampleServer` and start the server from your IDE or terminal instead.

**Legacy:** You can also skip the webpack dev server entirely and open `examples/workflow-standalone/app/diagram.html` directly in your browser after starting the GLSP server.

### Development

For active development, the `dev` scripts compile TypeScript in watch mode and start all necessary processes in parallel:

```bash
# Browser mode – watches sources, starts webpack dev server
yarn dev:browser

# Node mode – watches sources, starts GLSP server, starts webpack dev server
yarn dev
```

### How to start the Workflow Diagram example server from the sources

If you want to explore or change the Workflow Diagram Server too, you can clone, build and start the Java or Node variant of the `workflow example glsp-server` from your IDE instead of using the pre-built version of the Workflow Diagram Server.
Checkout the [`glsp-server`](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) or [`glsp-server-node`](https://github.com/eclipse-glsp/glsp-server-node#workflow-diagram-example) repo for instructions on building and running the Workflow Diagram Server example.

### Where to find the sources?

In addition to this repository, the source code of the Workflow Diagram server example can be found here: <https://github.com/eclipse-glsp/glsp-server/tree/master/examples/org.eclipse.glsp.example.workflow>

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
