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
import { inject, injectable, multiInject, optional } from 'inversify';
import {
    Action,
    ActionHandlerRegistry,
    Animation,
    Command,
    CommandActionHandler,
    CommandExecutionContext,
    CommandReturn,
    IActionHandler,
    ILogger,
    MorphEdgesAnimation,
    SModelRoot,
    SetModelAction,
    TYPES,
    UpdateAnimationData,
    UpdateModelAction,
    UpdateModelCommand,
    toTypeGuard
} from '~glsp-sprotty';
import { IFeedbackActionDispatcher } from '../../features/tool-feedback/feedback-action-dispatcher';
import { FeedbackCommand } from '../../features/tool-feedback/model';

/**
 * ActionHandler that transforms a {@link SetModelAction} into an {@link UpdateModelAction} that can be handled
 * by the {@link FeedbackAwareUpdateModelCommand}. This can be done because in sprotty an {@link UpdateModelCommand} and
 * a {@link SetModelCommand} have the same behavior of no model is present yet.
 */
@injectable()
export class SetModelActionHandler implements IActionHandler {
    handle(action: Action): Action | void {
        if (SetModelAction.is(action)) {
            return UpdateModelAction.create(action.newRoot, { animate: false });
        }
    }
}

export interface SModelRootListener {
    modelRootChanged(root: Readonly<SModelRoot>): void;
}

/**
 * A special {@link UpdateModelCommand} that retrieves all registered {@link Action}s from the {@link IFeedbackActionDispatcher}
 * (if present) and applies their feedback to the `newRoot` before performing the update. This enables persistent client-side feedback
 * across model updates initiated by the GLSP server.
 */
@injectable()
export class FeedbackAwareUpdateModelCommand extends UpdateModelCommand {
    @inject(TYPES.ILogger)
    protected logger: ILogger;

    @inject(TYPES.IFeedbackActionDispatcher)
    @optional()
    protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    @multiInject(TYPES.SModelRootListener)
    @optional()
    protected modelRootListeners: SModelRootListener[] = [];

    protected actionHandlerRegistry?: ActionHandlerRegistry;

    constructor(
        @inject(TYPES.Action) action: UpdateModelAction,
        @inject(TYPES.ActionHandlerRegistryProvider)
        actionHandlerRegistryProvider: () => Promise<ActionHandlerRegistry>
    ) {
        super({ animate: true, ...action });
        actionHandlerRegistryProvider().then(registry => (this.actionHandlerRegistry = registry));
    }

    protected override performUpdate(oldRoot: SModelRoot, newRoot: SModelRoot, context: CommandExecutionContext): CommandReturn {
        if (this.feedbackActionDispatcher && this.actionHandlerRegistry) {
            // Create a temporary context which defines the `newRoot` as `root`
            // This way we do not corrupt the redo/undo behavior of the super class
            const tempContext: CommandExecutionContext = {
                ...context,
                root: newRoot
            };

            const feedbackCommands = this.getFeedbackCommands(this.actionHandlerRegistry);
            feedbackCommands.forEach(command => command.execute(tempContext));
        }

        this.modelRootListeners.forEach(listener => listener.modelRootChanged(newRoot));
        return super.performUpdate(oldRoot, newRoot, context);
    }

    protected getFeedbackCommands(registry: ActionHandlerRegistry): Command[] {
        const result: Command[] = [];
        this.feedbackActionDispatcher.getRegisteredFeedback().forEach(action => {
            const commands = registry
                .get(action.kind)
                .filter<CommandActionHandler>(toTypeGuard(CommandActionHandler))
                .map(handler => handler.handle(action));
            result.push(...commands);
        });
        // sort commands descanting by priority
        return result.sort((a, b) => this.getPriority(b) - this.getPriority(a));
    }

    protected getPriority(command: Partial<FeedbackCommand>): number {
        return command.priority ?? 0;
    }

    // Override the `createAnimations` implementation and remove the animation for edge morphing. Otherwise routing & reconnect
    // handles flicker after each server update.
    protected override createAnimations(data: UpdateAnimationData, root: SModelRoot, context: CommandExecutionContext): Animation[] {
        const animations = super.createAnimations(data, root, context);
        return animations.filter(animation => !(animation instanceof MorphEdgesAnimation));
    }
}
