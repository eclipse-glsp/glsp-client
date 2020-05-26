/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import defaultGLSPModule from "./base/di.config";
import glspCommandPaletteModule from "./features/command-palette/di.config";
import glspContextMenuModule from "./features/context-menu/di.config";
import { copyPasteContextMenuModule, glspServerCopyPasteModule } from "./features/copy-paste/di.config";
import glspDecorationModule from "./features/decoration/di.config";
import glspEditLabelValidationModule from "./features/edit-label-validation/di.config";
import executeCommandModule from "./features/execute/di.config";
import modelHintsModule from "./features/hints/di.config";
import glspHoverModule from "./features/hover/di.config";
import layoutCommandsModule from "./features/layout/di.config";
import glspMouseToolModule from "./features/mouse-tool/di.config";
import { navigationModule } from "./features/navigation/di.config";
import saveModule from "./features/save/di.config";
import glspSelectModule from "./features/select/di.config";
import toolFeedbackModule from "./features/tool-feedback/di.config";
import paletteModule from "./features/tool-palette/di.config";
import toolsModule from "./features/tools/di.config";
import { markerNavigatorContextMenuModule, markerNavigatorModule, validationModule } from "./features/validation/di.config";

export * from 'sprotty';

export * from './base/args';
export * from './base/model/update-model-command';
export * from './base/operations/operation';
export * from './base/command-stack';
export * from './base/action-dispatcher';
export * from './base/model-initialization-constraint';
export * from './base/editor-context';
export * from './base/selection-clearing-mouse-listener';
export * from './base/source-uri-aware';
export * from './base/actions/context-actions';
export * from './features/change-bounds/model';
export * from './features/change-bounds/movement-restrictor';
export * from './features/change-bounds/snap';
export * from './features/tool-palette/palette-item';
export * from './features/context-menu/delete-element-context-menu';
export * from './features/command-palette/server-command-palette-provider';
export * from './features/copy-paste/copy-paste-handler';
export * from './features/decoration/decoration-placer';
export * from './features/decoration/view';
export * from './features/edit-label-validation/edit-label-validator';
export * from './features/execute/execute-command';
export * from './features/execute/model';
export * from './features/hints/request-type-hints-action';
export * from './features/hints/type-hints';
export * from './features/hints/model';
export * from './features/hover/hover';
export * from './features/layout/layout-commands';
export * from './features/mouse-tool/mouse-tool';
export * from './features/navigation/external-navigate-to-target-handler';
export * from './features/navigation/navigation-action-handler';
export * from './features/navigation/navigation-target-resolver';
export * from './features/rank/model';
export * from './features/reconnect/model';
export * from './features/save/model';
export * from './features/save/save';
export * from './features/tool-feedback/change-bounds-tool-feedback';
export * from './features/tool-feedback/creation-tool-feedback';
export * from './features/tool-feedback/css-feedback';
export * from './features/tool-feedback/edge-edit-tool-feedback';
export * from './features/tool-feedback/feedback-action-dispatcher';
export * from './features/tool-feedback/model';
export * from './features/tool-feedback/model';
export * from './features/tool-palette/tool-palette';
export * from './features/tools/change-bounds-tool';
export * from './features/tools/creation-tool';
export * from './features/tools/delete-tool';
export * from './features/tools/drag-aware-mouse-listener';
export * from './features/tools/edge-edit-tool';

export * from './features/undo-redo/model';
export * from './features/validation/validate';
export * from './lib/model';
export * from './base/auto-complete/auto-complete-actions';
export * from './base/auto-complete/auto-complete-widget';
export * from './base/auto-complete/validation-decorator';
export * from './base/actions/edit-validation-actions';
export * from './base/types';
export * from './utils/array-utils';
export * from './utils/marker';
export * from './utils/smodel-util';
export * from './utils/viewpoint-util';
export * from './model-source/websocket-diagram-server';
export * from './model-source/glsp-server-status';
export {
    validationModule, saveModule, executeCommandModule, paletteModule, toolFeedbackModule, defaultGLSPModule, modelHintsModule, glspCommandPaletteModule, //
    glspContextMenuModule, glspServerCopyPasteModule, copyPasteContextMenuModule, glspSelectModule, glspMouseToolModule, layoutCommandsModule, glspEditLabelValidationModule, //
    glspHoverModule, toolsModule, navigationModule, markerNavigatorModule, markerNavigatorContextMenuModule, glspDecorationModule
};
