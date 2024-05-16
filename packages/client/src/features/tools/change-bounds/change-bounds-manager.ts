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
import { FeedbackEmitter } from '../../../base';
import { isValidMove, minDimensions } from '../../../utils';
import { LayoutAware } from '../../bounds/layout-data';
import {
    IMovementRestrictor,
    ResizeHandleLocation,
    movementRestrictionFeedback,
    removeMovementRestrictionFeedback
} from '../../change-bounds';
import { IHelperLineManager } from '../../helper-lines';
import { ChangeBoundsTracker, TrackedElementMove } from './change-bounds-tracker';

export const CSS_RESIZE_MODE = 'resize-mode';

@injectable()
export class ChangeBoundsManager {
    constructor(
        @inject(MousePositionTracker) readonly positionTracker: MousePositionTracker,
        @optional() @inject(TYPES.IMovementRestrictor) readonly movementRestrictor?: IMovementRestrictor,
        @optional() @inject(TYPES.ISnapper) readonly snapper?: ISnapper,
        @optional() @inject(TYPES.IHelperLineManager) readonly helperLineManager?: IHelperLineManager
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
        const minimumMovement = this.helperLineManager?.getMinimumMoveVector(element, true, movement.direction);
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

    addRestrictionFeedback(feedback: FeedbackEmitter, move: TrackedElementMove): FeedbackEmitter {
        if (this.movementRestrictor) {
            feedback.add(
                movementRestrictionFeedback(move.element, this.movementRestrictor!, move.valid),
                removeMovementRestrictionFeedback(move.element, this.movementRestrictor!)
            );
        }
        return feedback;
    }

    defaultResizeLocations(): ResizeHandleLocation[] {
        return [
            ResizeHandleLocation.TopLeft,
            ResizeHandleLocation.TopRight,
            ResizeHandleLocation.BottomRight,
            ResizeHandleLocation.BottomLeft
        ];
    }

    useSymmetricResize(arg: MouseEvent | KeyboardEvent | any): boolean {
        return typeof arg === 'boolean' ? arg : (arg as MouseEvent | KeyboardEvent).ctrlKey;
    }

    createTracker(): ChangeBoundsTracker {
        return new ChangeBoundsTracker(this);
    }
}
