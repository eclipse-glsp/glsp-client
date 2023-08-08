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
import '@vscode/codicons/dist/codicon.css';
import {
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
} from '~glsp-sprotty';
import '../../css/glsp-sprotty.css';
import { GLSPActionDispatcher } from './action-dispatcher';
import { GLSPCommandStack } from './command-stack';
import { EditorContextService } from './editor-context-service';
import { ModifyCssFeedbackCommand } from './feedback/css-feedback';
import { FeedbackActionDispatcher } from './feedback/feedback-action-dispatcher';
import { FeedbackAwareUpdateModelCommand } from './feedback/update-model-command';
import { FocusStateChangedAction } from './focus/focus-state-change-action';
import { FocusTracker } from './focus/focus-tracker';
import { DefaultModelInitializationConstraint, ModelInitializationConstraint } from './model-initialization-constraint';
import { DiagramLoader } from './model/diagram-loader';
import { GLSPModelSource } from './model/glsp-model-source';
import { GLSPModelRegistry } from './model/model-registry';
import { SelectionClearingMouseListener } from './selection-clearing-mouse-listener';
import { SelectionService } from './selection-service';
import { GLSPToolManager } from './tool-manager/glsp-tool-manager';
import { GLSPKeyTool } from './view/key-tool';
import { GLSPMouseTool } from './view/mouse-tool';
import { GLSPViewRegistry } from './view/view-registry';

/**
 * The default module provides all of GLSP's base functionality and services.
 * It builds on top of sprotty's default module {@link `sprottyDefaultModule`}.
 */
export const defaultModule = new FeatureModule((bind, unbind, isBound, rebind, ...rest) => {
    // load bindings from sprotty's default module to avoid code duplication
    sprottyDefaultModule.registry(bind, unbind, isBound, rebind, ...rest);
    const context = { bind, unbind, isBound, rebind };

    bind(EditorContextService).toSelf().inSingletonScope();
    bind(TYPES.IEditorContextServiceProvider).toProvider<EditorContextService>(
        ctx => () =>
            new Promise<EditorContextService>((resolve, reject) => {
                if (ctx.container.isBound(EditorContextService)) {
                    resolve(ctx.container.get<EditorContextService>(EditorContextService));
                } else {
                    reject();
                }
            })
    );

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
    bind(GLSPToolManager).toSelf().inSingletonScope();
    bindOrRebind(context, TYPES.IToolManager).toService(GLSPToolManager);
    bind(GLSPActionDispatcher).toSelf().inSingletonScope();
    bindOrRebind(context, TYPES.IActionDispatcher).toService(GLSPActionDispatcher);

    bindAsService(context, TYPES.ModelSource, GLSPModelSource);
    bind(DiagramLoader).toSelf().inSingletonScope();
    bind(ModelInitializationConstraint).to(DefaultModelInitializationConstraint).inSingletonScope();

    // support re-registration of model elements and views
    bindOrRebind(context, TYPES.SModelRegistry).to(GLSPModelRegistry).inSingletonScope();
    bindOrRebind(context, TYPES.ViewRegistry).to(GLSPViewRegistry).inSingletonScope();

    bind(SelectionService).toSelf().inSingletonScope();
    bind(TYPES.ISModelRootListener).toService(SelectionService);

    // Feedback Support ------------------------------------
    // Generic re-usable feedback modifying css classes
    configureCommand(context, ModifyCssFeedbackCommand);
    // We support using sprotty's MoveCommand as client-side visual feedback
    configureCommand(context, MoveCommand);

    bindAsService(context, TYPES.IVNodePostprocessor, LocationPostprocessor);
    bind(TYPES.HiddenVNodePostprocessor).toService(LocationPostprocessor);
});
