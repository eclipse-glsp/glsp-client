# Eclipse GLSP - Client [![build-status](https://img.shields.io/jenkins/build?jobUrl=https%3A%2F%2Fci.eclipse.org%2Fglsp%2Fjob%2Feclipse-glsp%2Fjob%2Fglsp-client%2Fjob%2Fmaster%2F)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-client/job/master)

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

Next, download a pre-built version of the Workflow Example Diagram Server and start it (replace X.X.X with the current version, the download script will print out the correct command on the console):

```bash
yarn download:exampleServer
java -jar org.eclipse.glsp.example.workflow-X.X.X-SNAPSHOT-glsp.jar org.eclipse.glsp.example.workflow.launch.ExampleServerLauncher --port=8081 --websocket
```

Once the server is running, open the `glsp-client/examples/workflow-standalone/app/diagram.html` file in your favorite browser.

### How to start the Workflow Diagram example server from the sources

If you want to explore or change the Workflow Diagram Server too, you can clone, build and start the [`workflow example glsp-server`](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) from your IDE instead of using the pre-built version of the Workflow Diagram Server.
See [`workflow example glsp-server`](https://github.com/eclipse-glsp/glsp-server#workflow-diagram-example) for instructions on building and running the Workflow Diagram Server example.

### Where to find the sources?

In addition to this repository, the source code of the Workflow Diagram server example can be found here: <https://github.com/eclipse-glsp/glsp-server/tree/master/examples/org.eclipse.glsp.example.workflow>

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
