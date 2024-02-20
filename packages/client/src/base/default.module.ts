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
import {
    ActionHandlerRegistry,
    FeatureModule,
    KeyTool,
    LocationPostprocessor,
    MouseTool,
    MoveCommand,
    SetDirtyStateAction,
    SetEditModeAction,
    TYPES,
    bindAsService,
    bindOrRebind,
    configureActionHandler,
    configureCommand,
    sprottyDefaultModule
} from '@eclipse-glsp/sprotty';
import '@vscode/codicons/dist/codicon.css';
import '../../css/glsp-sprotty.css';
import { GLSPActionDispatcher } from './action-dispatcher';
import { GLSPActionHandlerRegistry } from './action-handler-registry';
import { GLSPCommandStack } from './command-stack';
import { EditorContextService } from './editor-context-service';
import { ModifyCssFeedbackCommand } from './feedback/css-feedback';
import { FeedbackActionDispatcher } from './feedback/feedback-action-dispatcher';
import { FeedbackAwareUpdateModelCommand } from './feedback/update-model-command';
import { FocusStateChangedAction } from './focus/focus-state-change-action';
import { FocusTracker } from './focus/focus-tracker';
import { DiagramLoader } from './model/diagram-loader';
import { GLSPModelSource } from './model/glsp-model-source';
import { DefaultModelInitializationConstraint, ModelInitializationConstraint } from './model/model-initialization-constraint';
import { GModelRegistry } from './model/model-registry';
import { SelectionClearingMouseListener } from './selection-clearing-mouse-listener';
import { SelectionService } from './selection-service';
import { EnableDefaultToolsAction, EnableToolsAction } from './tool-manager/tool';
import { DefaultToolsEnablingKeyListener, ToolManager, ToolManagerActionHandler } from './tool-manager/tool-manager';
import { GLSPKeyTool } from './view/key-tool';
import { GLSPMouseTool } from './view/mouse-tool';
import { GViewRegistry } from './view/view-registry';

/**
 * The default module provides all of GLSP's base functionality and services.
 * It builds on top of sprotty's default module {@link `sprottyDefaultModule`}.
 */
export const defaultModule = new FeatureModule((bind, unbind, isBound, rebind, ...rest) => {
    // load bindings from sprotty's default module to avoid code duplication
    sprottyDefaultModule.registry(bind, unbind, isBound, rebind, ...rest);
    const context = { bind, unbind, isBound, rebind };

    bind(EditorContextService).toSelf().inSingletonScope();
    bind(TYPES.IEditorContextServiceProvider).toProvider<EditorContextService>(ctx => async () => ctx.container.get(EditorContextService));

    configureActionHandler(context, SetEditModeAction.KIND, EditorContextService);
    configureActionHandler(context, SetDirtyStateAction.KIND, EditorContextService);

    bind(FocusTracker).toSelf().inSingletonScope();
    configureActionHandler(context, FocusStateChangedAction.KIND, FocusTracker);

    // Model update initialization ------------------------------------
    bind(TYPES.IFeedbackActionDispatcher).to(FeedbackActionDispatcher).inSingletonScope();
    configureCommand(context, FeedbackAwareUpdateModelCommand);

    bind(GLSPMouseTool).toSelf().inSingletonScope();
    bindOrRebind(context, MouseTool).toService(GLSPMouseTool);
    bind(GLSPKeyTool).toSelf().inSingletonScope();
    bindOrRebind(context, KeyTool).toService(GLSPKeyTool);

    bindAsService(context, TYPES.MouseListener, SelectionClearingMouseListener);

    bindOrRebind(context, TYPES.ICommandStack).to(GLSPCommandStack).inSingletonScope();
    bind(GLSPActionDispatcher).toSelf().inSingletonScope();
    bindOrRebind(context, TYPES.IActionDispatcher).toService(GLSPActionDispatcher);
    bind(GLSPActionHandlerRegistry).toSelf().inSingletonScope();
    bindOrRebind(context, ActionHandlerRegistry).toService(GLSPActionHandlerRegistry);

    bindAsService(context, TYPES.ModelSource, GLSPModelSource);
    bind(DiagramLoader).toSelf().inSingletonScope();
    bind(ModelInitializationConstraint).to(DefaultModelInitializationConstraint).inSingletonScope();

    // support re-registration of model elements and views
    bindOrRebind(context, TYPES.SModelRegistry).to(GModelRegistry).inSingletonScope();
    bindOrRebind(context, TYPES.ViewRegistry).to(GViewRegistry).inSingletonScope();

    bind(SelectionService).toSelf().inSingletonScope();

    // Feedback Support ------------------------------------
    // Generic re-usable feedback modifying css classes
    configureCommand(context, ModifyCssFeedbackCommand);
    // We support using sprotty's MoveCommand as client-side visual feedback
    configureCommand(context, MoveCommand);

    bindAsService(context, TYPES.IVNodePostprocessor, LocationPostprocessor);
    bind(TYPES.HiddenVNodePostprocessor).toService(LocationPostprocessor);

    // Tool manager initialization ------------------------------------
    bind(TYPES.IToolManager).to(ToolManager).inSingletonScope();
    bind(DefaultToolsEnablingKeyListener).toSelf().inSingletonScope();
    bind(TYPES.KeyListener).toService(DefaultToolsEnablingKeyListener);
    bind(ToolManagerActionHandler).toSelf().inSingletonScope();
    configureActionHandler(context, EnableDefaultToolsAction.KIND, ToolManagerActionHandler);
    configureActionHandler(context, EnableToolsAction.KIND, ToolManagerActionHandler);
});
