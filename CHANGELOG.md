# Eclipse GLSP Client Changelog

## [v0.9.0- 09/12/2021](https://github.com/eclipse-glsp/glsp-client/releases/tag/v0.9.0)

### Changes

-   [feature] Improve external navigation support through dedicated action. [#153](https://github.com/eclipse-glsp/glsp-client/pull/95)
-   [build] Added a download script to download the latest workflow-glsp-server JAR from maven artifactory [#171](https://github.com/eclipse-glsp/glsp-client/pull/99)
-   [diagram] Fixed a bug that kept the hover feedback visible after the diagram widget becomes inactive [#184](https://github.com/eclipse-glsp/glsp-client/pull/102)
-   [diagram] Extended the `ModifyCssFeedbackAction` to support both `string[]` and `SModelElement[]` as input [#103](https://github.com/eclipse-glsp/glsp-client/pull/103)
-   [diagram] Improved extensibility of `AutoCompleteWidget` by enabling changing of settings without having to re-instantiate the entire widget [#104](https://github.com/eclipse-glsp/glsp-client/pull/104)
-   [model] Added `SArgumentable` interface for denoting `SModelElement`s that contain an arbitrary arguments map [#194](https://github.com/eclipse-glsp/glsp-client/pull/106)
-   [diagram] Implemented a marquee selection tool to select multiple elements at once by drawing a rectangle. [#199](https://github.com/eclipse-glsp/glsp-client/pull/108) [#213](https://github.com/eclipse-glsp/glsp-client/pull/120)
-   [protocol] Added `fileUri` property to `SaveModelAction`. This can be used to implement save-as functionality [#208](https://github.com/eclipse-glsp/glsp-client/pull/109)
-   [protocol] Implemented missing typeguard functions for all protocol operations [#212](https://github.com/eclipse-glsp/glsp-client/pull/110)
-   [diagram] Implemented a reusable utility function (`configureDefaultModelElements`) that handles configuration of default model elements and views.
    Introduced reusable view for rounded corner nodes and and improved edge view that supports custom padding for easer mouse handling. Adapted the workflow example to make use of these new views [#180](https://github.com/eclipse-glsp/glsp-client/pull/113)
-   [example] Cleaned up and reworked the workflow example. Additional css classes are now applied directly to the `SModelElement` instead of using custom views. Removed now obsolete classes `TaskNodeView` and `WeightedEdgeView` [#220](https://github.com/eclipse-glsp/glsp-client/pull/116)
-   [diagram] Fixed a bug in the connection tool regarding the feedback edge snapping computation for nested elements. [#224](https://github.com/eclipse-glsp/glsp-client/pull/123)
-   [diagram] Fixed a bug in the copy& paste behavior. [#249](https://github.com/eclipse-glsp/glsp-client/pull/124)
-   [protocol] Fixed the definition of `ChangeContainerOperation`. [#253](eclipse-glsp/glsp-server#115)
-   [protocol] Remove the `name` property from `GLSPClient`. [#258](https://github.com/eclipse-glsp/glsp-client/pull/130/files)
-   [diagram] Fixed a bug in Firefox that required elements to be selected before they can be moved. [#376](https://github.com/eclipse-glsp/glsp-client/pull/134)
-   [build] Upgrade to Snabbdom3 and ES2017 [#137](https://github.com/eclipse-glsp/glsp-client/pull/137)
-   [protocol] Extract action message protocol and action definitions from `@eclipse-glsp/client` and move to `@eclipse-glsp/protocol` [#256](https://github.com/eclipse-glsp/glsp-client/pull/141) - Contributed on behalf of STMicroelectronics
-   [diagram] Fixed a bug that occurred when moving nested elements. [#225](https://github.com/eclipse-glsp/glsp-client/pull/135)
-   [example] Added support for structured nodes (categories) in workflow-example. [#392](https://github.com/eclipse-glsp/glsp-client/pull/136)
-   [diagram] Fixed a bug related to the mouse cursor position on resize. [#400](https://github.com/eclipse-glsp/glsp-client/pull/144)
-   [model] Add a convenience method to create a container with default modules. [#419](https://github.com/eclipse-glsp/glsp-client/pull/145)

### Breaking Changes

-   [diagram] Introduced `glspViewportModule`. This module contains a custom `ScrollMouseListener` that gets disabled if the `MarqueeTool` is active. This module should be used instead of the `viewportModule` provided by sprotty [#199](https://github.com/eclipse-glsp/glsp-client/pull/108)
-   [protocol] Fixed the definition of `ChangeContainerOperation`. The type of the `location` property has been changed from `string` to `Point`. [#253](eclipse-glsp/glsp-server#115)
-   [protocol] Remove the `name` property from `GLSPClient`. [#258](https://github.com/eclipse-glsp/glsp-client/pull/130/files)
-   [build] Upgrade to Snabbdom3 and ES2017. Depended packages should upgrade to ES2017 as well. [#137](https://github.com/eclipse-glsp/glsp-client/pull/137)

## [v0.8.0 - 20/10/2020](https://github.com/eclipse-glsp/glsp-client/releases/tag/0.8.0)

This is the first release of Eclipse GLSP since it is hosted at the Eclipse Foundation.
The 0.8.0 release includes new protocol message types and respective framework support for several new features, such as copy-paste, diagram navigation, etc. It also contains several clean-ups of the protocol and refactorings to simplify and streamline the API.
The Eclipse Theia integration of GLSP features many improvements, such as problem marker integration, native context menu items and keybindings. Finally, several bug fixes and minor are part of this release as well.
