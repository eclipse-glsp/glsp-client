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

import { Action, Disposable, GModelElement, ISnapper, MoveAction, Point, isBoundsAware, isMoveable } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { DragAwareMouseListener } from '../../base/drag-aware-mouse-listener';
import { CSS_HIDDEN, ModifyCSSFeedbackAction } from '../../base/feedback/css-feedback';
import { IFeedbackEmitter } from '../../base/feedback/feedback-action-dispatcher';
import { Tool } from '../../base/tool-manager/tool';
import { getAbsolutePosition } from '../../utils/viewpoint-util';
import {
    IMovementRestrictor,
    createMovementRestrictionFeedback,
    removeMovementRestrictionFeedback
} from '../change-bounds/movement-restrictor';

export interface PositioningTool extends Tool {
    readonly snapper?: ISnapper;
    readonly movementRestrictor?: IMovementRestrictor;

    registerFeedback(feedbackActions: Action[], feedbackEmitter?: IFeedbackEmitter, cleanupActions?: Action[]): Disposable;
    deregisterFeedback(feedbackEmitter?: IFeedbackEmitter, cleanupActions?: Action[]): void;
}

@injectable()
export class MouseTrackingElementPositionListener extends DragAwareMouseListener {
    element?: GModelElement;
    currentPosition?: Point;

    constructor(
        protected elementId: string,
        protected tool: PositioningTool,
        protected cursorPosition: 'top-left' | 'middle' = 'top-left'
    ) {
        super();
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseMove(target, event);
        const element = target.root.index.getById(this.elementId);
        this.element = element;
        if (!element) {
            return [];
        }

        let newPosition = getAbsolutePosition(target, event);
        if (this.cursorPosition === 'middle' && isBoundsAware(element)) {
            newPosition = Point.subtract(newPosition, { x: element.bounds.width / 2, y: element.bounds.height / 2 });
        }
        newPosition = this.snap(newPosition, element);

        const finished = false;
        if (isMoveable(element)) {
            newPosition = this.validateMove(this.currentPosition ?? newPosition, newPosition, element, finished);
        }
        this.currentPosition = newPosition;
        const moveGhostElement = MoveAction.create(
            [
                {
                    elementId: element.id,
                    toPosition: newPosition
                }
            ],
            { animate: false, finished }
        );
        this.tool.registerFeedback(
            [moveGhostElement, ModifyCSSFeedbackAction.create({ elements: [element.id], remove: [CSS_HIDDEN] })],
            this.tool
        );
        return [];
    }

    protected snap(position: Point, element: GModelElement, isSnap = true): Point {
        if (isSnap && this.tool.snapper) {
            return this.tool.snapper.snap(position, element);
        } else {
            return position;
        }
    }

    protected validateMove(startPosition: Point, toPosition: Point, element: GModelElement, isFinished: boolean): Point {
        let newPosition = toPosition;
        if (this.tool.movementRestrictor) {
            const valid = this.tool.movementRestrictor.validate(element, toPosition);
            let action;
            if (!valid) {
                action = createMovementRestrictionFeedback(element, this.tool.movementRestrictor);
                if (isFinished) {
                    newPosition = startPosition;
                }
            } else {
                action = removeMovementRestrictionFeedback(element, this.tool.movementRestrictor);
            }
            this.tool.registerFeedback([action], this.tool, [removeMovementRestrictionFeedback(element, this.tool.movementRestrictor)]);
        }
        return newPosition;
    }
}
