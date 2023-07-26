# Eclipse GLSP - Client [![Build Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-client/job/master/badge/icon)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-client/job/master/)

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

![Workflow Diagram](/documentation/standalone-diagram.gif)

### How to start the Workflow Diagram example?

Clone this repository and build the glsp-client packages:

```bash
yarn install
```

Next, download and start a pre-built version of the Workflow Example Node Diagram Server with:

```bash
yarn start:exampleServer
```

Once the server is running, open the `glsp-client/examples/workflow-standalone/app/diagram.html` file in your favorite browser.

### How to start the Workflow Diagram example server from the sources

If you want to explore or change the Workflow Diagram Server too, you can clone, build and start the Java or Node variant of the `workflow example glsp-server` from your IDE instead of using the pre-built version of the Workflow Diagram Server.
Checkout the [`glsp-server`](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) or [`glsp-server-node`](https://github.com/eclipse-glsp/glsp-server-node#workflow-diagram-example) repo for instructions on building and running the Workflow Diagram Server example.

### Where to find the sources?

In addition to this repository, the source code of the Workflow Diagram server example can be found here: <https://github.com/eclipse-glsp/glsp-server/tree/master/examples/org.eclipse.glsp.example.workflow>

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
