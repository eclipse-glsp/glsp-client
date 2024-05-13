/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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

import { Action, Disposable, arrayOf } from '@eclipse-glsp/sprotty';
import { IFeedbackActionDispatcher, IFeedbackEmitter, MaybeActions } from './feedback-action-dispatcher';

/**
 * A helper object to collect, submit and undo feedback consisting of several actions.
 */
export class FeedbackEmitter implements IFeedbackEmitter, Disposable {
    protected feedbackActions: (Action | undefined)[] = [];
    protected cleanupActions: MaybeActions[] = [];
    protected deregistration?: Disposable;

    constructor(protected feedbackDispatcher: IFeedbackActionDispatcher) {}

    /**
     * Adds an action as part of this emitters feedback. Please note that the action is only applied as feedback
     * once the {@link submit} method is called.
     *
     * @param action feedback action
     * @param cleanupAction action that undoes the feedback action. This is only triggered when {@link revert} is called.
     */
    add(action: Action, cleanupAction?: MaybeActions): this {
        const idx = this.feedbackActions.length;
        this.feedbackActions[idx] = action;
        if (cleanupAction) {
            this.cleanupActions[idx] = cleanupAction;
        }
        return this;
    }

    /**
     * Removes the action as part of this emitters feedback. If the action cannot be found, this is a no-op.
     * Please note that this also removed the corresponding cleanup action.
     * If the feedback has already been submitted as part of the {@link submit} method, the whole feedback must be de-registered
     * or a new feedback without the given action needs to be registered.
     *
     * @param action feedback action
     */
    remove(action: Action): this {
        const idx = this.feedbackActions.indexOf(action);
        if (idx) {
            delete this.feedbackActions[idx];
            delete this.cleanupActions[idx];
        }
        return this;
    }

    /**
     * Clears any, not yet registered feedback actions and their corresponding cleanup actions.
     */
    clear(): this {
        this.feedbackActions = [];
        this.cleanupActions = [];
        return this;
    }

    /**
     * Registers any pending actions as feedback. Any previously submitted feedback becomes invalid.
     */
    submit(): this {
        // with 'arrayOf' we skip undefined entries that are created for non-cleanup actions
        const actions = arrayOf(...this.feedbackActions);
        const cleanupActions = arrayOf(...this.cleanupActions);
        this.deregistration = this.feedbackDispatcher.registerFeedback(this, actions, () => cleanupActions.flatMap(MaybeActions.asArray));
        this.clear();
        return this;
    }

    /**
     * Removes the registered feedback WITHOUT calling any potential cleanup actions
     * Any pending actions can still be registerd with the {@link submit} method.
     */
    discard(): this {
        this.feedbackDispatcher.deregisterFeedback(this);
        this.deregistration = undefined;
        return this;
    }

    /**
     * Removes the registered feedback and calls the registered cleanup actions.
     * Any pending actions can still be registerd with the {@link submit} method.
     */
    revert(): this {
        this.deregistration?.dispose();
        this.deregistration = undefined;
        return this;
    }

    /**
     * Disposes any registered feedback and any pending, not yet registered feedback actions.
     */
    dispose(): this {
        this.revert();
        this.clear();
        return this;
    }
}
