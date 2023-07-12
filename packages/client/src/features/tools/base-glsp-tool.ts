/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { inject, injectable } from 'inversify';
import { Action, Disposable, DisposableCollection, IActionDispatcher, TYPES } from '~glsp-sprotty';
import { EditorContextService } from '../../base/editor-context-service';
import { IFeedbackActionDispatcher, IFeedbackEmitter } from '../../base/feedback/feedback-action-dispatcher';
import { GLSPTool } from '../../base/tool-manager/glsp-tool-manager';
import { GLSPKeyTool } from '../../base/view/key-tool';
import { GLSPMouseTool } from '../../base/view/mouse-tool';

@injectable()
export abstract class BaseGLSPTool implements GLSPTool {
    @inject(TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher;
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(GLSPMouseTool) protected mouseTool: GLSPMouseTool;
    @inject(GLSPKeyTool) protected keyTool: GLSPKeyTool;
    @inject(EditorContextService) protected readonly editorContext: EditorContextService;

    protected readonly toDisposeOnDisable = new DisposableCollection();

    abstract enable(): void;

    disable(): void {
        this.toDisposeOnDisable.dispose();
    }

    abstract id: string;

    get isEditTool(): boolean {
        return true;
    }

    dispatchActions(actions: Action[]): void {
        this.actionDispatcher.dispatchAll(actions);
    }

    /**
     * Registers `actions` to be sent out as feedback, i.e., changes that are re-established whenever the `SModelRoot`
     * has been set or updated.
     *
     * @param feedbackActions the actions to be sent out.
     * @param feedbackEmitter the emitter sending out feedback actions (this tool by default).
     * @param cleanupActions the actions to be sent out when the feedback is de-registered through the returned Disposable.
     * @returns A 'Disposable' that de-registers the feedback and cleans up any pending feedback with the given `cleanupActions`.
     */
    registerFeedback(feedbackActions: Action[], feedbackEmitter?: IFeedbackEmitter, cleanupActions?: Action[]): Disposable {
        return this.feedbackDispatcher.registerFeedback(feedbackEmitter ?? this, feedbackActions, cleanupActions);
    }

    /**
     * De-registers all feedback from the given `feedbackEmitter` (this tool by default) and cleans up any pending feedback with the
     * given `cleanupActions`.
     *
     * @param feedbackEmitter the emitter to be deregistered (this tool by default).
     * @param cleanupActions the actions to be dispatched right after the deregistration to clean up any pending feedback.
     */
    deregisterFeedback(feedbackEmitter?: IFeedbackEmitter, cleanupActions?: Action[]): void {
        this.feedbackDispatcher.deregisterFeedback(feedbackEmitter ?? this, cleanupActions);
    }
}
