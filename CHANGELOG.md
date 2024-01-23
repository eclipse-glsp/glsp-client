# Eclipse GLSP Client Changelog

## v2.1.0 - active

### Changes

-   [diagram] Fix a bug that prevented correct rendering of projection bars when using `GLSPProjectionView` [#298](https://github.com/eclipse-glsp/glsp-client/pull/298)
-   [a11y] Improved responsibility and feedback when resizing or moving diagram elements with keyboard-only commands [#295](https://github.com/eclipse-glsp/glsp-client/pull/295)
-   [diagram] Extends `configureDiagramOptions` function to also allow partial configuration of `ViewerOptions` [#296](https://github.com/eclipse-glsp/glsp-client/pull/296)
-   [diagram] Remove unused handleSetContextActions from ToolPalette [#301](https://github.com/eclipse-glsp/glsp-client/pull/301)
-   [diagram] Deprecate `ISModelRootListener` API in favor of `IGModelRootListener` [#303](https://github.com/eclipse-glsp/glsp-client/pull/303)
-   [diagram] Ensure that the suggestion container position of the `AutoCompleteWidget` is rendered correctly [#304](https://github.com/eclipse-glsp/glsp-client/pull/304)
-   [feature] Extend `ToolPalette`/`CreateOperation` API to support rendering of preview/ghost elements when creating new nodes [#301](https://github.com/eclipse-glsp/glsp-client/pull/301)
-   [protocol] Fix a bug in `BaseJsonRpcClient` to ensure that it can handle multiple open diagram sessions [#307](https://github.com/eclipse-glsp/glsp-client/pull/307)
-   [diagram] Restructure some tools to have a more common infrastructure and support helper lines [#306](https://github.com/eclipse-glsp/glsp-client/pull/306)
-   [diagram] Fix a bug in `SelectionService` that caused issues with inversify when injecting certain services (e.g. `ActionDispatcher`) in `SelectionChangeListener` implementations [#305](https://github.com/eclipse-glsp/glsp-client/pull/305)
-   [diagram] Ensure that the `SelectionService` does not trigger a change event if the selection did not change on model update [#313](https://github.com/eclipse-glsp/glsp-client/pull/313)

## [v2.0.0 - 14/10/2023](https://github.com/eclipse-glsp/glsp-client/releases/tag/v2.0.0)

### Changes

-   [layout] Improve Layouter to support more dynamic layouts and complex parent/children node structures [#187](https://github.com/eclipse-glsp/glsp-client/pull/187) - Contributed on behalf of STMicroelectronics
-   [diagram] Fix SVG export for nested root elements e.g. `GLSPProjectionView` [#196](https://github.com/eclipse-glsp/glsp-client/pull/196)
-   [diagram] Scope the styles to not break existing application layout [#209](https://github.com/eclipse-glsp/glsp-client/pull/209)
-   [routing] Ensure that routes are properly re-calculated when moving a routing point [#198](https://github.com/eclipse-glsp/glsp-client/pull/198)
-   [diagram] Fix a bug in the `EditLabelUIExtension` where the diagram becomes dirty without an actual change. [#766](https://github.com/eclipse-glsp/glsp/issues/766)
-   [diagram] Extend `ComputedBoundsAction` definition with routing information. This enables proper forwarding of client-side computed routes to the server [#201](https://github.com/eclipse-glsp/glsp-client/pull/201/)
-   [DI] The `createClientContainer` function is now deprecated. Please use `initializeDiagramContainer` instead. This new function can also be used with `ModuleConfigurations` which allow a more fine granular configuration by adding new modules and/or removing default modules. [#218](https://github.com/eclipse-glsp/glsp-client/pull/218) [#231](https://github.com/eclipse-glsp/glsp-client/pull/231) [#236](https://github.com/eclipse-glsp/glsp-client/pull/236)
-   [diagram] Fix incorrect calculation of decorator popup positions for edges. [#221](https://github.com/eclipse-glsp/glsp-client/pull/221)
-   [protocol] Introduce a reusable `Disposable` type [#222](https://github.com/eclipse-glsp/glsp-client/pull/222)
-   [protocol] Introduce reusable utility functions for DI configuration [#236](https://github.com/eclipse-glsp/glsp-client/pull/236)[#237](https://github.com/eclipse-glsp/glsp-client/pull/237)
-   [diagram] Augment diagram SVG with additional model metadata to enable easier integration tests and accessibility [#239](https://github.com/eclipse-glsp/glsp-client/pull/239)
-   [validation] Add and track reason for validation markers (e.g. batch and live validation) [#243](https://github.com/eclipse-glsp/glsp-client/pull/243)
-   [protocol] Introduce optional `deselectAll` flag for `SelectAction`s [#257](https://github.com/eclipse-glsp/glsp-client/pull/257)
-   [protocol] Provide the common interfaces and type definitions for TS-based GLSP servers [#245](https://github.com/eclipse-glsp/glsp-client/pull/245) - Contributed on behalf of STMicroelectronics
-   [diagram] Introduce a new set of accessability features for disability-aware conceptual modeling and keyboard-only diagram interactions. (experimental) [#240](https://github.com/eclipse-glsp/glsp-client/pull/240) [#241](https://github.com/eclipse-glsp/glsp-client/pull/241) [#242](https://github.com/eclipse-glsp/glsp-client/pull/242) [#254](https://github.com/eclipse-glsp/glsp-client/pull/254) [#276](https://github.com/eclipse-glsp/glsp-client/pull/276) [#279](https://github.com/eclipse-glsp/glsp-client/pull/279)
-   [API] Re-work tool and feedback structure [#264](https://github.com/eclipse-glsp/glsp-client/pull/264) [#274](https://github.com/eclipse-glsp/glsp-client/pull/274)
    -   Introduce `registerListener` method on GLSP mouse and key tool to return a disposable for de-registration
    -   Adapt `registerFeedback` method from feedback dispatcher to return a disposable for de-registration
    -   Introduce dedicated `BaseGLSPCreationTool` for tools based on trigger actions
    -   Introduce `toDisposeOnDisable` collection in `BaseGLSPTool` to register disable handling during enablement
-   [DI] Introduce and consistently use `FeatureModule`s instead of plain inversify `ContainerModule`s [#267](https://github.com/eclipse-glsp/glsp-client/pull/267)
-   [diagram] Introduce `statusModule` that binds UI extension to handle & render `GLSPStatusMessages`. [#272](https://github.com/eclipse-glsp/glsp-client/pull/272)
-   [diagram] Provide generic dirty state handling in `EditorContextService` [#272](https://github.com/eclipse-glsp/glsp-client/pull/272)
-   [diagram] Fix bug that broke edge edit (routing) in certain cases [#273](https://github.com/eclipse-glsp/glsp-client/pull/273)
-   [API] Introduce `DiagramLoader` component + life cycle management [#274](https://github.com/eclipse-glsp/glsp-client/pull/274) [#282](https://github.com/eclipse-glsp/glsp-client/pull/282)
    -   Integration projects no longer need to manually implement the initial diagram loading. Instead a set of configurations`IDiagramOptions` and then the diagram loader
        is invoked and initializes the diagram.
    -   Add a `onServerInitialized` event to the `GLSPClientAPI`.
    -   Introduce `IDiagramStartup` service. Adopters can multi bind this service to hook into the diagram loading lifecycle and provide additional logic. i.e. dispatching of initial actions.
-   [diagram] Fix a bug that broke edge intersection detection when using the `GLSPProjectionView` [#275](https://github.com/eclipse-glsp/glsp-client/pull/275/)
-   [diagram] Fix a bug regarding focus handling when integrated in an application frame like Theia [#278](https://github.com/eclipse-glsp/glsp-client/pull/278)

### Breaking Changes

-   [DI] Injecting an `IButtonHandler` constructor is now deprecated. Please use `configureButtonHandler()` instead. [#195](https://github.com/eclipse-glsp/glsp-client/pull/195) - Contributed on behalf of STMicroelectronics
-   [node] Update minimum requirements for Node to >=16.11.0 [#210](https://github.com/eclipse-glsp/glsp-client/pull/210)
-   [protocol] Renamed `UndoOperation` and `RedoOperation` to `UndoAction` and `RedoAction` to match operation specification [#216](https://github.com/eclipse-glsp/glsp-client/pull/216)
-   [protocol] Remove dependency to `vscode-ws-jsonrpc`. The protocol package now directly offers functions to create a websocket rpc connections [#215](https://github.com/eclipse-glsp/glsp-client/pull/215)
-   [protocol] The `elementIds` property of `LayoutOperation` is now optional. If `undefined` the entire model will be layouted [#232](https://github.com/eclipse-glsp/glsp-client/pull/232)
-   [API] Refactored base API [#259](https://github.com/eclipse-glsp/glsp-client/pull/#259)
    -   Removed the `TYPES.SelectionService` service identifier. Please directly use the `SelectionService` class as service identifier instead
    -   The `SelectionService` binding is now part of the `defaultGLSPModule`. This means the `SelectionService` remains available even if the `selectModule` is not configured
    -   `RootModelChangeListener`s are no longer tied to the `FeedbackawareUpdateModelCommand` instead they are managed by the `GLSPCommandStack`
    -   `IMouseTool` and `TYPES.IMouseTool` are no longer available. Directly inject and use `MouseTool` instead
    -   Refactored rank utility functions
        -   `isRanked()` -> `Ranked.is()`
        -   `getRank()` -> `Ranked.getRank()`
        -   `DEFAULT_RANK` -> `Ranked.DEFAULT_RANK`
-   [API] Introduce Event API to replace the old listener/notifier pattern [#261](https://github.com/eclipse-glsp/glsp-client/pull/#261)
    -   Reworked `SelectionService`, `GlspCommandStack` & `EditorContextService` to make use of this new API
    -   Removed explicit (de)registration methods for listeners. Use the corresponding event property (e.g. `SelectionService.onSelectionChanged`) instead
    -   Aligned naming of injectable interfaces & service identifiers to consistently use the `I` prefix
-   [API] Re-work tool and feedback structure [#264](https://github.com/eclipse-glsp/glsp-client/pull/264)
    -   Remove generic `toolsModule` and `toolFeedbackModule` in favor of individual tool modules
    -   Rename `dispatchFeedback` in `BaseGLSPTool` to `registerFeedback` to align with feedback dispatcher
    -   Switch arguments in `deregisterFeedback` in `BaseGLSPTool` for easier de-registration and clean up actions
-   [protocol] Add messages for server-side progress reporting and remove timeout in `ServerMessageAction` [#265](https://github.com/eclipse-glsp/glsp-client/pull/265)
-   [DI] Renamed and aligned prefixes of DI modules. [#266](https://github.com/eclipse-glsp/glsp-client/pull/266)
    -   Removed `glsp` prefix from all modules (e.g. `glspSelectModule`-> `selectModule`)
    -   In addition, the following modules have been renamed
        -   `defaultGLSPModule`-> `baseModule`
        -   `modelHintsModule` -> `typeHintsModule`
        -   `enableDefaultToolsOnFocusLossModule` -> `toolFocusLossModule`
        -   `glspEditLabelModule` -> `labelEditModule`
-   [websocket] Introduce a reusable `GLSPWebSocketProvider` class that supports reconnect on connection loss [#269](https://github.com/eclipse-glsp/glsp-client/pull/269)
-   [API] Introduce `GLSPModelSource` as default implementation for sprotty's `ModelSource`API [#272](https://github.com/eclipse-glsp/glsp-client/pull/272) [#287](https://github.com/eclipse-glsp/glsp-client/pull/287)
    -   `GLSPDiagramServer` has been deprecated and is no longer available
    -   `SelectionServiceAwareContextMenuMouseListener` renamed to `GLSPContextMenuMouseListener`
    -   `SourceURIAware` interface has been removed. No longe required since we only have one `GLSPModelSource` binding now.
-   [protocol] Revise TypeHints API and introduce possibility to dynamically query the server for complex connection conditions [#285](https://github.com/eclipse-glsp/glsp-client/pull/285)
    -   `EdgeTypeHint`
        -   `sourceElementTypeIds` and `targetElementTypeIds` are now optional. If not provided all connection targets are allowed
        -   Introduce `dynamic` flag. If a hint has this flag enabled connection tools know that the have to query there server in addition
            to checking the default `Connectable.canConnect` method.
    -   Introduce `RequestCheckEdgeAction` & `CheckEdgeResultAction` used to query the server wether the provide edge information is valid.
        Used in combination with dynamic type hints.
-   [protocol] Refactor base protocol & actions [#287](https://github.com/eclipse-glsp/glsp-client/pull/287)
    -   Rename `ServerStatusAction` -> `StatusAction`
    -   Rename `ServerMessageAction` -> `MessageAction`
    -   Extend `InitializeClientSessionParams` with a `clientActions` property. This is used by the server to now which action kinds are (also) handled by the client.
-   [API] Update to sprotty 1.0.0 and consistently use `GModel` naming scheme on client side [#291(https://github.com/eclipse-glsp/glsp-client/pull/291)]
-   Move augmented GLSP reexport of sprotty into dedicated package `@eclipse-glsp/sprotty`
-   With sprotty 1.0.0 the `SModel` classes haven been renamed by adding an Impl suffix (`SModelElement`->`SModelElementImpl`). We took this opportunity and aliased all sprotty model elements to consistently use `GModel`
    -   `SModelElement` -> `GModelElement`
    -   `SNode`-> `GNode`
    -   `SShapeElement`->`GShapeElement` etc.

## [v1.0.0 - 30/06/2022](https://github.com/eclipse-glsp/glsp-client/releases/tag/v1.0.0)

### Changes

-   [diagram] Fix a bug where the edge creation tool would select the wrong child when used inside of a nested node [#158](https://github.com/eclipse-glsp/glsp-client/pull/158/)
-   [example] Improved and modernized styling of the GLSP workflow example [#160](https://github.com/eclipse-glsp/glsp-client/pull/160)
-   [contextMenu] Ensured that closing the context menu correctly restores the diagram focus. [#469](https://github.com/eclipse-glsp/glsp-client/pull/161)
-   [build] Updated Typescript to version 4.5.5 and enforced `noImplicitOverride` [#167](https://github.com/eclipse-glsp/glsp-client/pull/167)
-   [diagram] Added support for snapping edges (routing points) similar to how its done for moving/resizing elements. [#170](https://github.com/eclipse-glsp/glsp-client/pull/170)
-   [layout] Implemented a custom layouter for HBox that supports nested compartments. [#174](https://github.com/eclipse-glsp/glsp-client/pull/174)
-   [diagram] Disable tool execution on focus loss and reactive the default tools. [#175](https://github.com/eclipse-glsp/glsp-client/pull/175)
-   [routing] Routing handles are now properly snapped if an `ISnapper` implementation is bound. [#177](https://github.com/eclipse-glsp/glsp-client/pull/177)
-   [routing] Fix a bug that caused short animation flickering whenever a routing point was moved. [#182](https://github.com/eclipse-glsp/glsp-client/pull/182)
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
-   [diagram] Fix a bug that kept the hover feedback visible after the diagram widget becomes inactive [#102](https://github.com/eclipse-glsp/glsp-client/pull/102)
-   [diagram] Extended the `ModifyCssFeedbackAction` to support both `string[]` and `SModelElement[]` as input [#103](https://github.com/eclipse-glsp/glsp-client/pull/103)
-   [diagram] Improved extensibility of `AutoCompleteWidget` by enabling changing of settings without having to re-instantiate the entire widget [#104](https://github.com/eclipse-glsp/glsp-client/pull/104)
-   [model] Added `SArgumentable` interface for denoting `SModelElement`s that contain an arbitrary arguments map [#106](https://github.com/eclipse-glsp/glsp-client/pull/106)
-   [diagram] Implemented a marquee selection tool to select multiple elements at once by drawing a rectangle. [#108](https://github.com/eclipse-glsp/glsp-client/pull/108) [#120](https://github.com/eclipse-glsp/glsp-client/pull/120)
-   [protocol] Added `fileUri` property to `SaveModelAction`. This can be used to implement save-as functionality [#109](https://github.com/eclipse-glsp/glsp-client/pull/109)
-   [protocol] Implemented missing typeguard functions for all protocol operations [#110](https://github.com/eclipse-glsp/glsp-client/pull/110)
-   [diagram] Implemented a reusable utility function (`configureDefaultModelElements`) that handles configuration of default model elements and views.
    Introduce reusable view for rounded corner nodes and and improved edge view that supports custom padding for easer mouse handling. Adapted the workflow example to make use of these new views [#113](https://github.com/eclipse-glsp/glsp-client/pull/113)
-   [example] Cleaned up and reworked the workflow example. Additional css classes are now applied directly to the `SModelElement` instead of using custom views. Removed now obsolete classes `TaskNodeView` and `WeightedEdgeView` [#116](https://github.com/eclipse-glsp/glsp-client/pull/116)
-   [diagram] Fix a bug in the connection tool regarding the feedback edge snapping computation for nested elements. [#123](https://github.com/eclipse-glsp/glsp-client/pull/123)
-   [diagram] Fix a bug in the copy& paste behavior. [#124](https://github.com/eclipse-glsp/glsp-client/pull/124)
-   [protocol] Fix the definition of `ChangeContainerOperation`. [#115](eclipse-glsp/glsp-server#115)
-   [protocol] Remove the `name` property from `GLSPClient`. [#130](https://github.com/eclipse-glsp/glsp-client/pull/130)
-   [diagram] Fix a bug in Firefox that required elements to be selected before they can be moved. [#134](https://github.com/eclipse-glsp/glsp-client/pull/134)
-   [build] Upgrade to Snabbdom3 and ES2017 [#137](https://github.com/eclipse-glsp/glsp-client/pull/137)
-   [protocol] Extract action message protocol and action definitions from `@eclipse-glsp/client` and move to `@eclipse-glsp/protocol` [#141](https://github.com/eclipse-glsp/glsp-client/pull/141) - Contributed on behalf of STMicroelectronics
-   [diagram] Fix a bug that occurred when moving nested elements. [#135](https://github.com/eclipse-glsp/glsp-client/pull/135)
-   [example] Added support for structured nodes (categories) in workflow-example. [#136](https://github.com/eclipse-glsp/glsp-client/pull/136)
-   [diagram] Fix a bug related to the mouse cursor position on resize. [#144](https://github.com/eclipse-glsp/glsp-client/pull/144)
-   [model] Add a convenience method to create a container with default modules. [#145](https://github.com/eclipse-glsp/glsp-client/pull/145)

### Breaking Changes

-   [diagram] Introduce `glspViewportModule`. This module contains a custom `ScrollMouseListener` that gets disabled if the `MarqueeTool` is active. This module should be used instead of the `viewportModule` provided by sprotty [#108](https://github.com/eclipse-glsp/glsp-client/pull/108)
-   [protocol] Fix the definition of `ChangeContainerOperation`. The type of the `location` property has been changed from `string` to `Point`. [#115](eclipse-glsp/glsp-server#115)
-   [protocol] Remove the `name` property from `GLSPClient`. [#130](https://github.com/eclipse-glsp/glsp-client/pull/130)
-   [build] Upgrade to Snabbdom3 and ES2017. Depended packages should upgrade to ES2017 as well. [#137](https://github.com/eclipse-glsp/glsp-client/pull/137)

## [v0.8.0 - 20/10/2020](https://github.com/eclipse-glsp/glsp-client/releases/tag/0.8.0)

This is the first release of Eclipse GLSP since it is hosted at the Eclipse Foundation.
The 0.8.0 release includes new protocol message types and respective framework support for several new features, such as copy-paste, diagram navigation, etc. It also contains several clean-ups of the protocol and refactorings to simplify and streamline the API.
The Eclipse Theia integration of GLSP features many improvements, such as problem marker integration, native context menu items and keybindings. Finally, several bug fixes and minor are part of this release as well.
