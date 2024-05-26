/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { Action, Command, CommandExecutionContext, Disposable, MaybeFunction, call, asArray as toArray } from '@eclipse-glsp/sprotty';
import { FeedbackEmitter } from './feedback-emitter';

export interface IFeedbackEmitter {}

export const feedbackFeature = Symbol('feedbackFeature');

export type MaybeActions = MaybeFunction<Action[] | Action | undefined>;

export namespace MaybeActions {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    export function asArray(actions?: MaybeActions): Action[] {
        const cleanup = actions ? call(actions) : [];
        return cleanup ? toArray(cleanup) : [];
    }
}

/**
 * Dispatcher for actions that are meant to show visual feedback on
 * the diagram that is not part of the diagram sent from the server
 * after a model update.
 *
 * The purpose of this dispatcher is to re-establish the feedback
 * after the model has been updated or reset by the server, as this would
 * overwrite the already established feedback, in case it is drawn by
 * extending the `GModelRoot`. Therefore, tools can register themselves
 * as feedback emitters with actions they want to place for showing
 * feedback. This dispatcher will then re-establish all feedback actions
 * of the registered emitters, whenever the `GModelRoot` has been set or updated.
 */
export interface IFeedbackActionDispatcher {
    /**
     * Registers `actions` to be sent out by a `feedbackEmitter`.
     * @param feedbackEmitter the emitter sending out feedback actions.
     * @param feedbackActions the actions to be sent out.
     * @param cleanupActions the actions to be sent out when the feedback is de-registered through the returned Disposable.
     * @returns A 'Disposable' that de-registers the feedback and cleans up any pending feedback with the given `cleanupActions`.
     */
    registerFeedback(feedbackEmitter: IFeedbackEmitter, feedbackActions: Action[], cleanupActions?: MaybeActions): Disposable;

    /**
     * Deregisters a `feedbackEmitter` from this dispatcher and thereafter
     * dispatches the provided `actions`.
     * @param feedbackEmitter the emitter to be deregistered.
     * @param cleanupActions the actions to be dispatched right after the deregistration.
     * These actions do not have to be related to the actions sent out by the
     * deregistered `feedbackEmitter`. The purpose of these actions typically is
     * to reset the normal state of the diagram without the feedback (e.g., reset a
     * CSS class that was set by a feedbackEmitter).
     */
    deregisterFeedback(feedbackEmitter: IFeedbackEmitter, cleanupActions?: MaybeActions): void;

    /**
     * Retrieve all `actions` sent out by currently registered `feedbackEmitter`.
     */
    getRegisteredFeedback(): Action[];

    /**
     * Retrieves all commands based on the registered feedback actions, ordered by their rank (lowest rank first).
     */
    getFeedbackCommands(): Command[];

    /**
     * Applies all current feedback commands to the given command execution context.
     */
    applyFeedbackCommands(context: CommandExecutionContext): Promise<void>;

    /**
     * Creates a new feedback emitter helper object. While anything can serve as a feedback emitter,
     * this method ensures that the emitter is stable and does not change between model updates.
     */
    createEmitter(): FeedbackEmitter;
}
