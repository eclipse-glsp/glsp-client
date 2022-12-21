# Eclipse GLSP Client Changelog

## v1.1.0 - upcoming

### Changes

-   [layout] Improve Layouter to support more dynamic layouts and complex parent/children node structures [#187](https://github.com/eclipse-glsp/glsp-client/pull/187) - Contributed on behalf of STMicroelectronics
-   [diagram] Fixed SVG export for nested root elements e.g. `GLSPProjectionView` [#196](https://github.com/eclipse-glsp/glsp-client/pull/196)
-   [diagram] scope the styles to not break existing application layout [#209](https://github.com/eclipse-glsp/glsp-client/pull/209)
-   [routing] Ensured that routes are properly re-calculated when moving a routing point [#198](https://github.com/eclipse-glsp/glsp-client/pull/198)
-   [diagram] Fixed a bug in the `EditLabelUIExtension` where the diagram becomes dirt wihtout an acual change. [#766](https://github.com/eclipse-glsp/glsp/issues/766)
-   [diagram] Extends `ComputedBoundsAction` definition with routing information. This enables proper forwarding of client-side computed routes to the server. [#201](https://github.com/eclipse-glsp/glsp-client/pull/201/)

### Breaking Changes

-   [DI] Injecting an `IButtonHandler` constructor is now deprecated. Please use `configureButtonHandler()` instead. [#195](https://github.com/eclipse-glsp/glsp-client/pull/195) - Contributed on behalf of STMicroelectronics
-   [node] Update minimum requirements for Node to >=16.11.0 [#210](https://github.com/eclipse-glsp/glsp-client/pull/210)
-   [protocol] Renamed `UndoOperation` and `RedoOperation` to `UndoAction` and `RedoAction` to match operation specification [#216](https://github.com/eclipse-glsp/glsp-client/pull/216)
-   [protocol] Remove dependency to `vscode-ws-jsonrpc`. The protocol package now directly offers functions to create a websocket rpc connections [#215](https://github.com/eclipse-glsp/glsp-client/pull/215)

## [v1.0.0 - 30/06/2022](https://github.com/eclipse-glsp/glsp-client/releases/tag/v1.0.0)

### Changes

-   [diagram] Fixed a bug where the edge creation tool would select the wrong child when used inside of a nested node [#158](https://github.com/eclipse-glsp/glsp-client/pull/158/)
-   [example] Improved and modernized styling of the GLSP workflow example [#160](https://github.com/eclipse-glsp/glsp-client/pull/160)
-   [contextMenu] Ensured that closing the context menu correctly restores the diagram focus. [#469](https://github.com/eclipse-glsp/glsp-client/pull/161)
-   [build] Updated Typescript to version 4.5.5 and enforced `noImplicitOverride` [#167](https://github.com/eclipse-glsp/glsp-client/pull/167)
-   [diagram] Added support for snapping edges (routing points) similar to how its done for moving/resizing elements. [#170](https://github.com/eclipse-glsp/glsp-client/pull/170)
-   [layout] Implemented a custom layouter for HBox that supports nested compartments. [#174](https://github.com/eclipse-glsp/glsp-client/pull/174)
-   [diagram] Disable tool execution on focus loss and reactive the default tools. [#175](https://github.com/eclipse-glsp/glsp-client/pull/175)
-   [routing] Routing handles are now properly snapped if an `ISnapper` implementation is bound. [#177](https://github.com/eclipse-glsp/glsp-client/pull/177)
-   [routing] Fixed a bug that caused short animation flickering whenever a routing point was moved. [#182](https://github.com/eclipse-glsp/glsp-client/pull/182)
-   [context] Properly integrated the browser context menu listeners -> Context menus now also work on Mac OS [#183](https://github.com/eclipse-glsp/glsp-client/pull/183)

### Breaking Changes

-   [protocol] Updated to sprotty >=0.11.0. With the new sprotty version the action declaration approach has been reworked from ES6 classes to plain interfaces + namespaces. To keep action declaration and creation consistent all action definitions of the protocol and client package have been updated as well. The old class based definitions are no longer available. This mainly affects construction calls
    which have to be changed from `new SomeAction()` to using the create function of the corresponding namespace `SomeAction.create()`. In addition, typeguard functions have been included in the action namespaces as well and can now be used with `SomeAction.is()` instead of using a dedicated `isSomeAction()` function.
    <br>[#472](https://github.com/eclipse-glsp/glsp-client/pull/171) - Contributed on behalf of STMicroelectronics
-   [DI] Unified the sprotty `TYPE` and `GLSP_TYPE` service identifier constants. They are reexported from the client main index as `TYPE`. The old `GLSP_TYPE` constant definition has been
    deprecated will potentially be removed in the future. [#472](https://github.com/eclipse-glsp/glsp-client/pull/171)
-   [protocol] Rename `ModelSourceChangedAction` to `SourceModelChangedAction` including handlers etc [#655](https://github.com/eclipse-glsp/glsp-client/pull/184)
-   [diagram] Cleanup/refactor various commands and action handlers. [#176](https://github.com/eclipse-glsp/glsp-client/pull/176)
    -   Rename `layoutCommandsModule` to `layoutModule`
    -   Change handling of `ResizeElement` and `AlignElement` actions to pure action handlers instead of commands.
    -   Change handling of `NavigateToMarkersAction` to a pure action handler instead of commands
    -   Refactor handler for `SetMarkersAction` to a standalone action handler instead of an command

## [v0.9.0- 09/12/2021](https://github.com/eclipse-glsp/glsp-client/releases/tag/v0.9.0)

### Changes

-   [feature] Improve external navigation support through dedicated action. [#95](https://github.com/eclipse-glsp/glsp-client/pull/95)
-   [build] Added a download script to download the latest workflow-glsp-server JAR from maven artifactory [#99](https://github.com/eclipse-glsp/glsp-client/pull/99)
-   [diagram] Fixed a bug that kept the hover feedback visible after the diagram widget becomes inactive [#102](https://github.com/eclipse-glsp/glsp-client/pull/102)
-   [diagram] Extended the `ModifyCssFeedbackAction` to support both `string[]` and `SModelElement[]` as input [#103](https://github.com/eclipse-glsp/glsp-client/pull/103)
-   [diagram] Improved extensibility of `AutoCompleteWidget` by enabling changing of settings without having to re-instantiate the entire widget [#104](https://github.com/eclipse-glsp/glsp-client/pull/104)
-   [model] Added `SArgumentable` interface for denoting `SModelElement`s that contain an arbitrary arguments map [#106](https://github.com/eclipse-glsp/glsp-client/pull/106)
-   [diagram] Implemented a marquee selection tool to select multiple elements at once by drawing a rectangle. [#108](https://github.com/eclipse-glsp/glsp-client/pull/108) [#120](https://github.com/eclipse-glsp/glsp-client/pull/120)
-   [protocol] Added `fileUri` property to `SaveModelAction`. This can be used to implement save-as functionality [#109](https://github.com/eclipse-glsp/glsp-client/pull/109)
-   [protocol] Implemented missing typeguard functions for all protocol operations [#110](https://github.com/eclipse-glsp/glsp-client/pull/110)
-   [diagram] Implemented a reusable utility function (`configureDefaultModelElements`) that handles configuration of default model elements and views.
    Introduced reusable view for rounded corner nodes and and improved edge view that supports custom padding for easer mouse handling. Adapted the workflow example to make use of these new views [#113](https://github.com/eclipse-glsp/glsp-client/pull/113)
-   [example] Cleaned up and reworked the workflow example. Additional css classes are now applied directly to the `SModelElement` instead of using custom views. Removed now obsolete classes `TaskNodeView` and `WeightedEdgeView` [#116](https://github.com/eclipse-glsp/glsp-client/pull/116)
-   [diagram] Fixed a bug in the connection tool regarding the feedback edge snapping computation for nested elements. [#123](https://github.com/eclipse-glsp/glsp-client/pull/123)
-   [diagram] Fixed a bug in the copy& paste behavior. [#124](https://github.com/eclipse-glsp/glsp-client/pull/124)
-   [protocol] Fixed the definition of `ChangeContainerOperation`. [#115](eclipse-glsp/glsp-server#115)
-   [protocol] Remove the `name` property from `GLSPClient`. [#130](https://github.com/eclipse-glsp/glsp-client/pull/130)
-   [diagram] Fixed a bug in Firefox that required elements to be selected before they can be moved. [#134](https://github.com/eclipse-glsp/glsp-client/pull/134)
-   [build] Upgrade to Snabbdom3 and ES2017 [#137](https://github.com/eclipse-glsp/glsp-client/pull/137)
-   [protocol] Extract action message protocol and action definitions from `@eclipse-glsp/client` and move to `@eclipse-glsp/protocol` [#141](https://github.com/eclipse-glsp/glsp-client/pull/141) - Contributed on behalf of STMicroelectronics
-   [diagram] Fixed a bug that occurred when moving nested elements. [#135](https://github.com/eclipse-glsp/glsp-client/pull/135)
-   [example] Added support for structured nodes (categories) in workflow-example. [#136](https://github.com/eclipse-glsp/glsp-client/pull/136)
-   [diagram] Fixed a bug related to the mouse cursor position on resize. [#144](https://github.com/eclipse-glsp/glsp-client/pull/144)
-   [model] Add a convenience method to create a container with default modules. [#145](https://github.com/eclipse-glsp/glsp-client/pull/145)

### Breaking Changes

-   [diagram] Introduced `glspViewportModule`. This module contains a custom `ScrollMouseListener` that gets disabled if the `MarqueeTool` is active. This module should be used instead of the `viewportModule` provided by sprotty [#108](https://github.com/eclipse-glsp/glsp-client/pull/108)
-   [protocol] Fixed the definition of `ChangeContainerOperation`. The type of the `location` property has been changed from `string` to `Point`. [#115](eclipse-glsp/glsp-server#115)
-   [protocol] Remove the `name` property from `GLSPClient`. [#130](https://github.com/eclipse-glsp/glsp-client/pull/130)
-   [build] Upgrade to Snabbdom3 and ES2017. Depended packages should upgrade to ES2017 as well. [#137](https://github.com/eclipse-glsp/glsp-client/pull/137)

## [v0.8.0 - 20/10/2020](https://github.com/eclipse-glsp/glsp-client/releases/tag/0.8.0)

This is the first release of Eclipse GLSP since it is hosted at the Eclipse Foundation.
The 0.8.0 release includes new protocol message types and respective framework support for several new features, such as copy-paste, diagram navigation, etc. It also contains several clean-ups of the protocol and refactorings to simplify and streamline the API.
The Eclipse Theia integration of GLSP features many improvements, such as problem marker integration, native context menu items and keybindings. Finally, several bug fixes and minor are part of this release as well.
