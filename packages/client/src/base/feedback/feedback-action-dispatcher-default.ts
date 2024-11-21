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
import {
    Action,
    ActionHandlerRegistry,
    Command,
    CommandActionHandler,
    CommandExecutionContext,
    Disposable,
    GModelElement,
    IActionDispatcher,
    ICommand,
    ILogger,
    TYPES,
    toTypeGuard
} from '@eclipse-glsp/sprotty';
import { inject, injectable, preDestroy } from 'inversify';
import { IFeedbackActionDispatcher, IFeedbackEmitter, MaybeActions } from './feedback-action-dispatcher';
import { getFeedbackRank } from './feedback-command';
import { FeedbackEmitter } from './feedback-emitter';

@injectable()
export class FeedbackActionDispatcher implements IFeedbackActionDispatcher, Disposable {
    protected registeredFeedback: Map<IFeedbackEmitter, Action[]> = new Map();

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;

    @inject(TYPES.ILogger) protected logger: ILogger;

    @inject(ActionHandlerRegistry) protected actionHandlerRegistry: ActionHandlerRegistry;

    protected isDisposed = false;

    registerFeedback(feedbackEmitter: IFeedbackEmitter, feedbackActions: Action[], cleanupActions?: MaybeActions): Disposable {
        if (feedbackEmitter instanceof GModelElement) {
            this.logger.log(
                this,
                // eslint-disable-next-line max-len
                'GModelElements as feedback emitters are discouraged, as they usually change between model updates and are considered unstable.'
            );
        }
        if (feedbackActions.length > 0) {
            this.registeredFeedback.set(feedbackEmitter, feedbackActions);
            this.dispatchFeedback(feedbackActions, feedbackEmitter);
        }
        return Disposable.create(() => this.deregisterFeedback(feedbackEmitter, cleanupActions));
    }

    deregisterFeedback(feedbackEmitter: IFeedbackEmitter, cleanupActions?: MaybeActions): void {
        this.registeredFeedback.delete(feedbackEmitter);
        const actions = MaybeActions.asArray(cleanupActions);
        if (actions.length > 0) {
            this.dispatchFeedback(actions, feedbackEmitter);
        }
    }

    getRegisteredFeedback(): Action[] {
        const result: Action[] = [];
        this.registeredFeedback.forEach(actions => result.push(...actions));
        return result;
    }

    getRegisteredFeedbackEmitters(action: Action): IFeedbackEmitter[] {
        const result: IFeedbackEmitter[] = [];
        this.registeredFeedback.forEach((actions, emitter) => {
            if (actions.includes(action)) {
                result.push(emitter);
            }
        });
        return result;
    }

    getFeedbackCommands(): Command[] {
        return this.getRegisteredFeedback()
            .flatMap(action => this.actionToCommands(action))
            .sort((left, right) => getFeedbackRank(left) - getFeedbackRank(right));
    }

    async applyFeedbackCommands(context: CommandExecutionContext): Promise<void> {
        const feedbackCommands = this.getFeedbackCommands() ?? [];
        if (feedbackCommands?.length > 0) {
            const results = feedbackCommands.map(command => command.execute(context));
            await Promise.all(results);
        }
    }

    protected actionToCommands(action: Action): ICommand[] {
        return (
            this.actionHandlerRegistry
                .get(action.kind)
                .filter(toTypeGuard(CommandActionHandler))
                .map(handler => handler.handle(action)) ?? []
        );
    }

    createEmitter(): FeedbackEmitter {
        return new FeedbackEmitter(this);
    }

    protected async dispatchFeedback(actions: Action[], feedbackEmitter: IFeedbackEmitter): Promise<void> {
        try {
            if (this.isDisposed) {
                return;
            }
            await this.actionDispatcher.dispatchAll(actions);
            this.logger.info(this, `Dispatched feedback actions for ${feedbackEmitter}`);
        } catch (reason) {
            this.logger.error(this, 'Failed to dispatch feedback actions', reason);
        }
    }

    @preDestroy()
    dispose(): void {
        this.registeredFeedback.clear();
        this.isDisposed = true;
    }
}
