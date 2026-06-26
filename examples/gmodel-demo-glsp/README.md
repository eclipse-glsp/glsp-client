# gmodel-demo-glsp

This package contains the configuration for the GLSP diagrams of the `gmodel-demo` example language.
It contains the base code that is independent from the actual application framework and integration variant, so it can be reused across integration variants (Standalone, Theia, VS Code, ...).

`gmodel-demo` is a minimal example language whose `.gm` files contain a directly serialized GModel (rather than a separate domain model).
It serves as a playground for demonstrating and testing individual GLSP features, and is deliberately kept simple, without advanced customizations, custom model types or specialized views.

If you are interested in a more complete domain-specific example, check out the [Workflow Diagram Example](https://github.com/eclipse-glsp/glsp-client#workflow-diagram-example).

## Building

This package is built with `pnpm` and is available from npm via [@eclipse-glsp-examples/gmodel-demo-glsp](https://www.npmjs.com/package/@eclipse-glsp-examples/gmodel-demo-glsp).

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
