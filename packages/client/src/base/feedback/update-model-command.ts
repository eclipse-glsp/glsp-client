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
    Animation,
    CommandExecutionContext,
    CommandReturn,
    GChildElement,
    GModelElement,
    GModelRoot,
    ILogger,
    MorphEdgesAnimation,
    TYPES,
    UpdateAnimationData,
    UpdateModelAction,
    UpdateModelCommand,
    isLocateable
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { IFeedbackActionDispatcher } from './feedback-action-dispatcher';

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

    constructor(@inject(TYPES.Action) action: UpdateModelAction) {
        super({ animate: true, ...action });
    }

    protected override performUpdate(oldRoot: GModelRoot, newRoot: GModelRoot, context: CommandExecutionContext): CommandReturn {
        // Create a temporary context which defines the `newRoot` as `root`
        // This way we do not corrupt the redo/undo behavior of the super class
        const tempContext: CommandExecutionContext = { ...context, root: newRoot };
        this.feedbackActionDispatcher?.applyFeedbackCommands(tempContext);
        return super.performUpdate(oldRoot, newRoot, context);
    }

    protected override updateElement(left: GModelElement, right: GModelElement, animationData: UpdateAnimationData): void {
        // Skip move animation for elements whose parent changed (e.g., change container operations).
        // The old position is relative to the old parent's coordinate system and meaningless in the new parent,
        // so animating between them causes a visual glitch.
        if (isLocateable(left) && isLocateable(right)) {
            const leftParentId = left instanceof GChildElement ? left.parent.id : undefined;
            const rightParentId = right instanceof GChildElement ? right.parent.id : undefined;
            if (leftParentId !== rightParentId) {
                left.position = right.position;
            }
        }
        super.updateElement(left, right, animationData);
    }

    // Override the `createAnimations` implementation and remove the animation for edge morphing. Otherwise routing & reconnect
    // handles flicker after each server update.
    protected override createAnimations(data: UpdateAnimationData, root: GModelRoot, context: CommandExecutionContext): Animation[] {
        const animations = super.createAnimations(data, root, context);
        return animations.filter(animation => !(animation instanceof MorphEdgesAnimation));
    }
}
