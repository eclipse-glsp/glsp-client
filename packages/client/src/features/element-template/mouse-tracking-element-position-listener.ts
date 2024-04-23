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

import {
    Action,
    Dimension,
    Disposable,
    ElementMove,
    GModelElement,
    MoveAction,
    Point,
    isBoundsAware,
    isMoveable
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { DragAwareMouseListener } from '../../base/drag-aware-mouse-listener';
import { CSS_HIDDEN, ModifyCSSFeedbackAction } from '../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../base/feedback/feeback-emitter';
import { IFeedbackEmitter } from '../../base/feedback/feedback-action-dispatcher';
import { Tool } from '../../base/tool-manager/tool';
import { MoveableElement } from '../../utils';
import { getAbsolutePosition } from '../../utils/viewpoint-util';
import {
    IMovementRestrictor,
    createMovementRestrictionFeedback,
    removeMovementRestrictionFeedback
} from '../change-bounds/movement-restrictor';
import { PointPositionUpdater } from '../change-bounds/point-position-updater';
import { PositionSnapper } from '../change-bounds/position-snapper';
import { useSnap } from '../change-bounds/snap';
import { MoveFinishedEventAction } from '../tools';

export interface PositioningTool extends Tool {
    readonly positionSnapper: PositionSnapper;
    readonly movementRestrictor?: IMovementRestrictor;

    createFeedbackEmitter(): FeedbackEmitter;
    /**
     * @deprecated It is recommended to create a {@link createFeedbackEmitter dedicated emitter} per feedback instead of using the tool.
     */
    registerFeedback(feedbackActions: Action[], feedbackEmitter?: IFeedbackEmitter, cleanupActions?: Action[]): Disposable;
    /**
     * @deprecated It is recommended to create a {@link createFeedbackEmitter dedicated emitter} per feedback and dispose it like that.
     */
    deregisterFeedback(feedbackEmitter?: IFeedbackEmitter, cleanupActions?: Action[]): void;
}

@injectable()
export class MouseTrackingElementPositionListener extends DragAwareMouseListener {
    protected positionUpdater: PointPositionUpdater;
    protected moveGhostFeedback: FeedbackEmitter;
    protected currentPosition?: Point;

    constructor(
        protected elementId: string,
        protected tool: PositioningTool,
        protected cursorPosition: 'top-left' | 'middle' = 'top-left'
    ) {
        super();
        this.positionUpdater = new PointPositionUpdater(this.tool.positionSnapper);
        this.moveGhostFeedback = this.tool.createFeedbackEmitter();
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseMove(target, event);
        const element = target.root.index.getById(this.elementId);
        if (!element || !isMoveable(element)) {
            return [];
        }
        if (this.positionUpdater.isLastDragPositionUndefined()) {
            this.positionUpdater.updateLastDragPosition(element.position);
        }
        const mousePosition = getAbsolutePosition(target, event);
        const delta = this.positionUpdater.updatePosition(element, mousePosition, useSnap(event));
        if (!delta) {
            return [];
        }
        const toPosition = this.getElementTargetPosition(mousePosition, element, event);
        const elementMove = { elementId: element.id, toPosition: toPosition };
        this.addMoveFeeback(element, elementMove);
        this.currentPosition = toPosition;
        // since we are moving a ghost element that is feedback-only and will be removed anyway,
        // we just send a MoveFinishedEventAction instead of reseting the position with a MoveAction and the finished flag set to true.
        this.moveGhostFeedback.add(MoveAction.create([elementMove], { animate: false }), MoveFinishedEventAction.create()).submit();
        return [];
    }

    protected getElementTargetPosition(mousePosition: Point, element: MoveableElement, event: MouseEvent): Point {
        const unsnappedPosition =
            this.cursorPosition === 'middle' && isBoundsAware(element)
                ? Point.subtract(mousePosition, Dimension.center(element.bounds))
                : mousePosition;
        return this.tool.positionSnapper.snapPosition(unsnappedPosition, element, useSnap(event));
    }

    protected addMoveFeeback(element: MoveableElement, elementMove: ElementMove): void {
        if (this.tool.movementRestrictor) {
            if (!this.tool.movementRestrictor.validate(element, elementMove.toPosition)) {
                this.moveGhostFeedback.add(
                    createMovementRestrictionFeedback(element, this.tool.movementRestrictor),
                    removeMovementRestrictionFeedback(element, this.tool.movementRestrictor)
                );
            } else {
                this.moveGhostFeedback.add(removeMovementRestrictionFeedback(element, this.tool.movementRestrictor));
            }
        }
        this.moveGhostFeedback.add(ModifyCSSFeedbackAction.create({ elements: [element.id], remove: [CSS_HIDDEN] }));
    }

    override dispose(): void {
        this.moveGhostFeedback.dispose();
        super.dispose();
    }
}
