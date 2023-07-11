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
import { GLSPKeyTool } from '../../base/view/glsp-key-tool';
import { GLSPMouseTool } from '../../base/view/glsp-mouse-tool';

@injectable()
export abstract class BaseGLSPTool implements GLSPTool {
    @inject(TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher;
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(GLSPMouseTool) protected mouseTool: GLSPMouseTool;
    @inject(GLSPKeyTool) protected keyTool: GLSPKeyTool;
    @inject(EditorContextService) protected readonly editorContext: EditorContextService;

    protected onDisable = new DisposableCollection();

    abstract enable(): void;

    disable(): void {
        this.onDisable.dispose();
    }

    abstract id: string;

    get isEditTool(): boolean {
        return true;
    }

    dispatchActions(actions: Action[]): void {
        this.actionDispatcher.dispatchAll(actions);
    }

    registerFeedback(actions: Action[], feedbackEmitter?: IFeedbackEmitter, cleanupActions?: Action[]): Disposable {
        return this.feedbackDispatcher.registerFeedback(feedbackEmitter ?? this, actions, cleanupActions);
    }

    deregisterFeedback(actions?: Action[], feedbackEmitter?: IFeedbackEmitter): void {
        this.feedbackDispatcher.deregisterFeedback(feedbackEmitter ?? this, actions);
    }
}
