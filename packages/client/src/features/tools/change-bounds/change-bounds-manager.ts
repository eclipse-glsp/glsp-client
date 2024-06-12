/********************************************************************************
 * Copyright (c) 2024 Axon Ivy AG and others.
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
    Dimension,
    GModelElement,
    ISnapper,
    KeyboardModifier,
    MousePositionTracker,
    Movement,
    Point,
    TYPES,
    Vector,
    isBoundsAware,
    isLocateable
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';

import {
    CursorCSS,
    ModifyCSSFeedbackAction,
    applyCssClasses,
    cursorFeedbackAction,
    deleteCssClasses,
    toggleCssClasses
} from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { isValidMove, minDimensions } from '../../../utils/layout-utils';
import { LayoutAware } from '../../bounds/layout-data';
import { GResizeHandle, ResizeHandleLocation } from '../../change-bounds/model';
import {
    IMovementRestrictor,
    movementRestrictionFeedback,
    removeMovementRestrictionFeedback
} from '../../change-bounds/movement-restrictor';
import { GridManager } from '../../grid/grid-manager';
import { IHelperLineManager } from '../../helper-lines/helper-line-manager';
import { InsertIndicator } from '../node-creation/insert-indicator';
import { ChangeBoundsTracker, TrackedElementMove, TrackedElementResize, TrackedMove, TrackedResize } from './change-bounds-tracker';

export const CSS_RESIZE_MODE = 'resize-mode';
export const CSS_RESTRICTED_RESIZE = 'resize-not-allowed';
export const CSS_ACTIVE_HANDLE = 'active';

@injectable()
export class ChangeBoundsManager {
    constructor(
        @inject(MousePositionTracker) readonly positionTracker: MousePositionTracker,
        @optional() @inject(TYPES.IMovementRestrictor) readonly movementRestrictor?: IMovementRestrictor,
        @optional() @inject(TYPES.ISnapper) readonly snapper?: ISnapper,
        @optional() @inject(TYPES.IHelperLineManager) readonly helperLineManager?: IHelperLineManager,
        @optional() @inject(GridManager) protected gridManager?: GridManager
    ) {}

    unsnapModifier(): KeyboardModifier | undefined {
        return 'shift';
    }

    usePositionSnap(arg: MouseEvent | KeyboardEvent | any): boolean {
        return typeof arg === 'boolean' ? arg : !(arg as MouseEvent | KeyboardEvent).shiftKey;
    }

    snapPosition(element: GModelElement, position: Point): Point {
        return this.snapper?.snap(position, element) ?? position;
    }

    isValid(element: GModelElement): boolean {
        return this.hasValidPosition(element) && this.hasValidSize(element);
    }

    hasValidPosition(element: GModelElement, position?: Point): boolean {
        return !isLocateable(element) || isValidMove(element, position ?? element.position, this.movementRestrictor);
    }

    hasValidSize(element: GModelElement, size?: Dimension): boolean {
        if (!isBoundsAware(element)) {
            return true;
        }
        const dimension: Dimension = size ?? element.bounds;
        const minimum = this.getMinimumSize(element);
        if (dimension.width < minimum.width || dimension.height < minimum.height) {
            return false;
        }
        return true;
    }

    getMinimumSize(element: GModelElement): Dimension {
        if (!isBoundsAware(element)) {
            return Dimension.EMPTY;
        }
        const definedMinimum = minDimensions(element);
        const computedMinimum = LayoutAware.getComputedDimensions(element);
        return computedMinimum
            ? {
                  width: Math.max(definedMinimum.width, computedMinimum.width),
                  height: Math.max(definedMinimum.height, computedMinimum.height)
              }
            : definedMinimum;
    }

    useMovementRestriction(arg: MouseEvent | KeyboardEvent | any): boolean {
        return this.usePositionSnap(arg);
    }

    restrictMovement(element: GModelElement, movement: Movement): Movement {
        const minimumMovement = this.getMinimumMovement(element, movement);
        if (!minimumMovement) {
            return movement;
        }
        // minimum is given in absolute coordinates
        // if minimum is not reached, reset to original position for that coordinate
        const absVector = Vector.abs(movement.vector);
        const targetPosition: Point = {
            x: absVector.x < minimumMovement.x ? movement.from.x : movement.to.x,
            y: absVector.y < minimumMovement.y ? movement.from.y : movement.to.y
        };
        return Point.move(movement.from, targetPosition);
    }

    protected getMinimumMovement(element: GModelElement, movement: Movement): Vector | undefined {
        return element instanceof InsertIndicator && this.gridManager
            ? this.gridManager.grid
            : this.helperLineManager?.getMinimumMoveVector(element, true, movement.direction);
    }

    addMoveFeedback(feedback: FeedbackEmitter, trackedMove: TrackedMove, ctx?: GModelElement, event?: MouseEvent): FeedbackEmitter {
        // cursor feedback on graph
        feedback.add(cursorFeedbackAction(CursorCSS.MOVE), cursorFeedbackAction(CursorCSS.DEFAULT));

        // restriction feedback on each element
        trackedMove.elementMoves.forEach(move => this.addMoveRestrictionFeedback(feedback, move, ctx, event));

        return feedback;
    }

    addResizeFeedback(feedback: FeedbackEmitter, resize: TrackedResize, ctx?: GModelElement, event?: MouseEvent): FeedbackEmitter {
        // graph feedback
        feedback.add(
            ModifyCSSFeedbackAction.create({ add: [CSS_RESIZE_MODE] }),
            ModifyCSSFeedbackAction.create({ remove: [CSS_RESIZE_MODE] })
        );

        // cursor feedback on graph
        const cursorClass = GResizeHandle.getCursorCss(resize.handleMove.element);
        feedback.add(cursorFeedbackAction(cursorClass), cursorFeedbackAction(CursorCSS.DEFAULT));

        // handle feedback
        const handle = resize.handleMove.element;
        feedback.add(applyCssClasses(handle, CSS_ACTIVE_HANDLE), deleteCssClasses(handle, CSS_ACTIVE_HANDLE));
        feedback.add(toggleCssClasses(handle, !resize.valid.size, CSS_RESTRICTED_RESIZE), deleteCssClasses(handle, CSS_RESTRICTED_RESIZE));

        // restriction feedback on each element
        resize.elementResizes.forEach(elementResize => {
            this.addMoveRestrictionFeedback(feedback, elementResize, ctx, event);
            feedback.add(
                toggleCssClasses(elementResize.element, !elementResize.valid.size, CSS_RESTRICTED_RESIZE),
                deleteCssClasses(elementResize.element, CSS_RESTRICTED_RESIZE)
            );
        });
        return feedback;
    }

    addMoveRestrictionFeedback(
        feedback: FeedbackEmitter,
        change: TrackedElementResize | TrackedElementMove,
        ctx?: GModelElement,
        event?: MouseEvent
    ): FeedbackEmitter {
        if (this.movementRestrictor) {
            const valid = TrackedElementMove.is(change) ? change.valid : change.valid.move;
            feedback.add(
                movementRestrictionFeedback(change.element, this.movementRestrictor, valid),
                removeMovementRestrictionFeedback(change.element, this.movementRestrictor)
            );
        }
        return feedback;
    }

    defaultResizeLocations(): ResizeHandleLocation[] {
        return ResizeHandleLocation.CORNERS;
    }

    useSymmetricResize(arg: MouseEvent | KeyboardEvent | any): boolean {
        return typeof arg === 'boolean' ? arg : (arg as MouseEvent | KeyboardEvent).ctrlKey;
    }

    createTracker(): ChangeBoundsTracker {
        return new ChangeBoundsTracker(this);
    }
}
