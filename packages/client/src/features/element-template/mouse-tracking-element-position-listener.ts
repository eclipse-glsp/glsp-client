/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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

import { Action, Dimension, GModelElement, MoveAction, Point, isBoundsAware, isMoveable } from '@eclipse-glsp/sprotty';
import { DragAwareMouseListener } from '../../base/drag-aware-mouse-listener';
import { CSS_HIDDEN, ModifyCSSFeedbackAction } from '../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../base/feedback/feeback-emitter';
import { getAbsolutePosition } from '../../utils';
import { ChangeBoundsManager, ChangeBoundsTracker, FeedbackAwareTool, MoveFinishedEventAction, TrackedElementMove } from '../tools';

export interface PositioningTool extends FeedbackAwareTool {
    readonly changeBoundsManager: ChangeBoundsManager;
}

export class MouseTrackingElementPositionListener extends DragAwareMouseListener {
    protected moveGhostFeedback: FeedbackEmitter;
    protected tracker: ChangeBoundsTracker;

    constructor(
        protected elementId: string,
        protected tool: PositioningTool,
        protected cursorPosition: 'top-left' | 'middle' = 'top-left'
    ) {
        super();
        this.tracker = this.tool.changeBoundsManager.createTracker();
        this.moveGhostFeedback = this.tool.createFeedbackEmitter();
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseMove(target, event);
        const element = target.root.index.getById(this.elementId);
        if (!element || !isMoveable(element)) {
            return [];
        }
        if (!this.tracker.isTracking()) {
            this.tracker.startTracking();
            const mousePosition = getAbsolutePosition(target, event);
            element.position =
                this.cursorPosition === 'middle' && isBoundsAware(element)
                    ? Point.subtract(mousePosition, Dimension.center(element.bounds))
                    : mousePosition;
        }
        // we only validate if we use the position already as a target, otherwise we need to re-evaluate after moving to the center anyway
        const move = this.tracker.moveElements([element], { snap: event, restrict: event, validate: true });
        const elementMove = move.elementMoves[0];
        if (!elementMove) {
            return [];
        }
        this.addMoveFeeback(elementMove);
        // since we are moving a ghost element that is feedback-only and will be removed anyway,
        // we just send a MoveFinishedEventAction instead of reseting the position with a MoveAction and the finished flag set to true.
        this.moveGhostFeedback
            .add(
                MoveAction.create([{ elementId: this.elementId, toPosition: elementMove.toPosition }], { animate: false }),
                MoveFinishedEventAction.create()
            )
            .submit();
        this.tracker.updateTrackingPosition(elementMove.moveVector);
        return [];
    }

    protected addMoveFeeback(move: TrackedElementMove): void {
        this.tool.changeBoundsManager.addRestrictionFeedback(this.moveGhostFeedback, move);
        this.moveGhostFeedback.add(ModifyCSSFeedbackAction.create({ elements: [move.element.id], remove: [CSS_HIDDEN] }));
    }

    override dispose(): void {
        this.moveGhostFeedback.dispose();
        super.dispose();
    }
}
