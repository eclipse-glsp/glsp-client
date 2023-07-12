/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import defaultGLSPModule from './base/di.config';
import { glspAccessibilityModule } from './features/accessibility/di.config';
import { glspMoveZoomModule } from './features/accessibility/move-zoom/di.config';
import { glspResizeKeyModule } from './features/accessibility/resize-key-tool/di.config';
import { glspSearchPaletteModule } from './features/accessibility/search/di.config';
import { glspViewKeyToolsModule } from './features/accessibility/view-key-tools/di.config';
import glspCommandPaletteModule from './features/command-palette/di.config';
import glspContextMenuModule from './features/context-menu/di.config';
import { copyPasteContextMenuModule, glspServerCopyPasteModule } from './features/copy-paste/di.config';
import glspDecorationModule from './features/decoration/di.config';
import glspEditLabelModule from './features/edit-label/di.config';
import modelHintsModule from './features/hints/di.config';
import glspHoverModule from './features/hover/di.config';
import layoutModule from './features/layout/di.config';
import navigationModule from './features/navigation/di.config';
import glspRoutingModule from './features/routing/di.config';
import saveModule from './features/save/di.config';
import glspSelectModule from './features/select/di.config';
import sourceModelWatcherModule from './features/source-model-watcher/di.config';
import svgMetadataModule from './features/svg-metadata/di.config';
import paletteModule from './features/tool-palette/di.config';
import changeBoundsToolModule from './features/tools/change-bounds/di.config';
import deletionToolModule from './features/tools/deletion/di.config';
import edgeCreationToolModule from './features/tools/edge-creation/di.config';
import edgeEditToolModule from './features/tools/edge-edit/di.config';
import enableDefaultToolsOnFocusLossModule from './features/tools/enable-default-tools-on-focus-loss';
import marqueeSelectionToolModule from './features/tools/marquee-selection/di.config';
import nodeCreationToolModule from './features/tools/node-creation/di.config';
import { markerNavigatorContextMenuModule, markerNavigatorModule, validationModule } from './features/validation/di.config';
import glspViewportModule from './features/viewport/di.config';

// ------------------ Base ------------------
export * from './base/action-dispatcher';
export * from './base/actions/focus-change-action';
export * from './base/argumentable';
export * from './base/auto-complete/auto-complete-actions';
export * from './base/auto-complete/auto-complete-widget';
export * from './base/auto-complete/validation-decorator';
export * from './base/command-stack';
export { configureServerActions } from './base/di.config';
export * from './base/drag-aware-mouse-listener';
export * from './base/editor-context-service';
export * from './base/feedback/feedback-action-dispatcher';
export * from './base/feedback/feedback-command';
export * from './base/feedback/update-model-command';
export * from './base/focus-tracker';
export * from './base/model-initialization-constraint';
export * from './base/model/model-registry';
export * from './base/ranked';
export * from './base/selection-clearing-mouse-listener';
export * from './base/selection-service';
export * from './base/source-uri-aware';
export * from './base/tool-manager/glsp-tool-manager';
export * from './base/view/mouse-tool';
export * from './base/view/view-registry';
export * from './container-modules';

//
// ------------------ Features ------------------
export * from './base/feedback/css-feedback';
export * from './base/view/mouse-tool';
export * from './features/accessibility/resize-key-tool/resize-key-tool';
export * from './features/accessibility/view-key-tools/deselect-key-tool';
export * from './features/accessibility/view-key-tools/movement-key-tool';
export * from './features/accessibility/view-key-tools/zoom-key-tool';
export * from './features/bounds/freeform-layout';
export * from './features/bounds/glsp-hidden-bounds-updater';
export * from './features/bounds/hbox-layout';
export * from './features/bounds/layouter';
export * from './features/bounds/vbox-layout';
export * from './features/change-bounds/model';
export * from './features/change-bounds/movement-restrictor';
export * from './features/change-bounds/snap';
export * from './features/command-palette/command-palette-tool';
export * from './features/command-palette/server-command-palette-provider';
export * from './features/context-menu/delete-element-context-menu';
export * from './features/context-menu/selection-service-aware-context-menu-mouse-listener';
export * from './features/context-menu/server-context-menu-provider';
export * from './features/copy-paste/copy-paste-context-menu';
export * from './features/copy-paste/copy-paste-handler';
export * from './features/decoration/decoration-placer';
export * from './features/edit-label/edit-label-tool';
export * from './features/edit-label/edit-label-validator';
export * from './features/export/glsp-svg-exporter';
export * from './features/hints/model';
export * from './features/hints/type-hints';
export * from './features/hover/hover';
export * from './features/layout/layout-elements-action';
export * from './features/navigation/navigation-action-handler';
export * from './features/navigation/navigation-target-resolver';
export * from './features/reconnect/model';
export * from './features/routing/glsp-manhattan-edge-router';
export * from './features/save/model';
export * from './features/save/save-keylistener';
export * from './features/select/select-feedback-command';
export * from './features/select/select-mouse-listener';
export * from './features/source-model-watcher/source-model-changed-action-handler';
export * from './features/svg-metadata/metadata-placer';
export * from './features/tool-palette/tool-palette';
export * from './features/tools/base-glsp-tool';
export * from './features/tools/change-bounds/change-bounds-tool';
export * from './features/tools/change-bounds/change-bounds-tool-feedback';
export * from './features/tools/change-bounds/view';
export * from './features/tools/deletion/delete-tool';
export * from './features/tools/edge-creation/edge-creation-tool';
export * from './features/tools/edge-creation/edge-creation-tool-feedback';
export * from './features/tools/edge-creation/view';
export * from './features/tools/edge-edit/edge-edit-tool';
export * from './features/tools/edge-edit/edge-edit-tool-feedback';
export * from './features/tools/enable-default-tools-on-focus-loss';
export * from './features/tools/marquee-selection/marquee-behavior';
export * from './features/tools/marquee-selection/marquee-mouse-tool';
export * from './features/tools/marquee-selection/marquee-tool';
export * from './features/tools/marquee-selection/marquee-tool-feedback';
export * from './features/tools/marquee-selection/model';
export * from './features/tools/marquee-selection/view';
export * from './features/tools/node-creation/node-creation-tool';
export * from './features/validation/issue-marker';
export * from './features/validation/marker-navigator';
export * from './features/validation/validate';
export * from './features/viewport/glsp-scroll-mouse-listener';
export * from './glsp-sprotty';
export * from './glsp-sprotty/types';
//
// ------------------ Misc ------------------
export * from './lib/model';
export * from './model-source/glsp-diagram-server';
export * from './utils/argument-utils';
export * from './utils/html-utils';
export * from './utils/layout-utils';
export * from './utils/marker';
export * from './utils/smodel-util';
export * from './utils/viewpoint-util';
export * from './views';
// ------------------ DI Modules ------------------
export {
    changeBoundsToolModule,
    copyPasteContextMenuModule,
    defaultGLSPModule,
    deletionToolModule,
    edgeCreationToolModule,
    edgeEditToolModule,
    enableDefaultToolsOnFocusLossModule,
    glspAccessibilityModule,
    glspCommandPaletteModule,
    glspContextMenuModule,
    glspDecorationModule,
    glspEditLabelModule,
    glspHoverModule,
    glspMoveZoomModule,
    glspResizeKeyModule,
    glspRoutingModule,
    glspSearchPaletteModule,
    glspSelectModule,
    glspServerCopyPasteModule,
    glspViewKeyToolsModule,
    glspViewportModule,
    layoutModule,
    markerNavigatorContextMenuModule,
    markerNavigatorModule,
    marqueeSelectionToolModule,
    modelHintsModule,
    navigationModule,
    nodeCreationToolModule,
    paletteModule,
    saveModule,
    sourceModelWatcherModule,
    svgMetadataModule,
    validationModule
};
