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
import { IGridManager } from '../../grid/grid-manager';
import { IHelperLineManager } from '../../helper-lines/helper-line-manager';
import { InsertIndicator } from '../node-creation/insert-indicator';
import { ChangeBoundsTracker, TrackedElementMove, TrackedElementResize, TrackedMove, TrackedResize } from './change-bounds-tracker';

export const CSS_RESIZE_MODE = 'resize-mode';
export const CSS_RESTRICTED_RESIZE = 'resize-not-allowed';
export const CSS_ACTIVE_HANDLE = 'active';

export interface IChangeBoundsManager {
    /**
     * Unsnap the modifier used for changing bounds.
     * @returns The unsnapped keyboard modifier, or undefined if no modifier was snapped.
     */
    unsnapModifier(): KeyboardModifier | undefined;

    /**
     * Determine whether to use position snap for changing bounds.
     * @param arg - The event argument.
     * @returns True if position snap should be used, false otherwise.
     */
    usePositionSnap(arg: MouseEvent | KeyboardEvent | any): boolean;

    /**
     * Snap the position of an element.
     * @param element - The element to snap.
     * @param position - The position to snap.
     * @returns The snapped position.
     */
    snapPosition(element: GModelElement, position: Point): Point;

    /**
     * Check if an element is valid for changing bounds.
     * @param element - The element to check.
     * @returns True if the element is valid, false otherwise.
     */
    isValid(element: GModelElement): boolean;

    /**
     * Check if an element has a valid position for changing bounds.
     * @param element - The element to check.
     * @param position - The position to check.
     * @returns True if the element has a valid position, false otherwise.
     */
    hasValidPosition(element: GModelElement, position?: Point): boolean;

    /**
     * Check if an element has a valid size for changing bounds.
     * @param element - The element to check.
     * @param size - The size to check.
     * @returns True if the element has a valid size, false otherwise.
     */
    hasValidSize(element: GModelElement, size?: Dimension): boolean;

    /**
     * Get the minimum size of an element for changing bounds.
     * @param element - The element to get the minimum size for.
     * @returns The minimum size of the element.
     */
    getMinimumSize(element: GModelElement): Dimension;

    /**
     * Determine whether to use movement restriction for changing bounds.
     * @param arg - The event argument.
     * @returns True if movement restriction should be used, false otherwise.
     */
    useMovementRestriction(arg: MouseEvent | KeyboardEvent | any): boolean;

    /**
     * Restrict the movement of an element.
     * @param element - The element to restrict movement for.
     * @param movement - The movement to restrict.
     * @returns The restricted movement.
     */
    restrictMovement(element: GModelElement, movement: Movement): Movement;

    /**
     * Add move feedback for changing bounds.
     * @param feedback - The feedback emitter.
     * @param trackedMove - The tracked move.
     * @param ctx - The context element. (optional)
     * @param event - The mouse event. (optional)
     * @returns The feedback emitter.
     */
    addMoveFeedback(feedback: FeedbackEmitter, trackedMove: TrackedMove, ctx?: GModelElement, event?: MouseEvent): FeedbackEmitter;

    /**
     * Add resize feedback for changing bounds.
     * @param feedback - The feedback emitter.
     * @param resize - The tracked resize.
     * @param ctx - The context element. (optional)
     * @param event - The mouse event. (optional)
     * @returns The feedback emitter.
     */
    addResizeFeedback(feedback: FeedbackEmitter, resize: TrackedResize, ctx?: GModelElement, event?: MouseEvent): FeedbackEmitter;

    /**
     * Add move restriction feedback for changing bounds.
     * @param feedback - The feedback emitter.
     * @param change - The tracked element resize or move.
     * @param ctx - The context element. (optional)
     * @param event - The mouse event. (optional)
     * @returns The feedback emitter.
     */
    addMoveRestrictionFeedback(
        feedback: FeedbackEmitter,
        change: TrackedElementResize | TrackedElementMove,
        ctx?: GModelElement,
        event?: MouseEvent
    ): FeedbackEmitter;

    /**
     * Get the default resize locations for changing bounds.
     * @returns The default resize handle locations.
     */
    defaultResizeLocations(): ResizeHandleLocation[];

    /**
     * Determine whether to use symmetric resize for changing bounds.
     * @param arg - The event argument.
     * @returns True if symmetric resize should be used, false otherwise.
     */
    useSymmetricResize(arg: MouseEvent | KeyboardEvent | any): boolean;

    /**
     * Create a tracker for changing bounds.
     * @returns The change bounds tracker.
     */
    createTracker(): ChangeBoundsTracker;
}

/**
 * The default {@link IChangeBoundsManager} implementation. It is responsible for managing
 * the change of bounds for {@link GModelElement}s.
 */
@injectable()
export class ChangeBoundsManager implements IChangeBoundsManager {
    constructor(
        @inject(MousePositionTracker) readonly positionTracker: MousePositionTracker,
        @optional() @inject(TYPES.IMovementRestrictor) readonly movementRestrictor?: IMovementRestrictor,
        @optional() @inject(TYPES.ISnapper) readonly snapper?: ISnapper,
        @optional() @inject(TYPES.IHelperLineManager) readonly helperLineManager?: IHelperLineManager,
        @optional() @inject(TYPES.IGridManager) protected gridManager?: IGridManager
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
