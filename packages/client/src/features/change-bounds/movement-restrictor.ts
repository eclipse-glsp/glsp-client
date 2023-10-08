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
import { injectable } from 'inversify';
import { BoundsAware, Point, GModelElement, GNode, GParentElement } from '@eclipse-glsp/sprotty';
import { ModifyCSSFeedbackAction } from '../../base/feedback/css-feedback';
import { toAbsoluteBounds } from '../../utils/viewpoint-util';
import { SResizeHandle, isBoundsAwareMoveable } from './model';

/**
 * A `MovementRestrictor` is an optional service that can be used by tools to validate
 * whether a certain move operation (e.g. `ChangeBoundsOperation`) in the diagram is valid.
 */
export interface IMovementRestrictor {
    /**
     * Validate whether moving the given element to a new given location is allowed.
     * @param element The element that should be moved.
     * @param newLocation The new location of the element.
     * @returns `true` if the the element is movable and moving to the given location is allowed, `false` otherwise.
     *          Should also return `false` if the newLocation is `undefined`:
     */
    validate(element: GModelElement, newLocation?: Point): boolean;
    /**
     * Feedback css-classes. Can be applied to elements that did fail the validation.
     */
    cssClasses?: string[];
}

/**
 *  A `IMovementRestrictor` that checks for overlapping elements. Move operations
 *  are only valid if the element does not collide with another element after moving.
 */
@injectable()
export class NoOverlapMovementRestrictor implements IMovementRestrictor {
    cssClasses = ['movement-not-allowed'];

    validate(element: GModelElement, newLocation?: Point): boolean {
        if (!isBoundsAwareMoveable(element) || !newLocation) {
            return false;
        }
        // Create ghost element at the newLocation
        const ghostElement = Object.create(element) as GModelElement & BoundsAware;
        ghostElement.bounds = {
            x: newLocation.x,
            y: newLocation.y,
            width: element.bounds.width,
            height: element.bounds.height
        };
        ghostElement.type = 'Ghost';
        ghostElement.id = element.id;
        return !Array.from(
            element.root.index
                .all()
                .filter(e => e.id !== ghostElement.id && e !== ghostElement.root && e instanceof GNode)
                .map(e => e as GModelElement & BoundsAware)
        ).some(e => this.areOverlapping(e, ghostElement));
    }

    protected areOverlapping(element1: GModelElement & BoundsAware, element2: GModelElement & BoundsAware): boolean {
        const b1 = toAbsoluteBounds(element1);
        const b2 = toAbsoluteBounds(element2);
        const r1TopLeft: Point = b1;
        const r1BottomRight = { x: b1.x + b1.width, y: b1.y + b1.height };
        const r2TopLeft: Point = b2;
        const r2BottomRight = { x: b2.x + b2.width, y: b2.y + b2.height };

        // If one rectangle is on left side of other
        if (r1TopLeft.x > r2BottomRight.x || r2TopLeft.x > r1BottomRight.x) {
            return false;
        }

        // If one rectangle is above other
        if (r1BottomRight.y < r2TopLeft.y || r2BottomRight.y < r1TopLeft.y) {
            return false;
        }

        return true;
    }
}

/**
 * Utility function to create an action that applies the given {@link IMovementRestrictor.cssClasses} to the given element.
 * @param element The element on which the css classes should be applied.
 * @param movementRestrictor The movement restrictor whose cssClasses should be applied.
 * @returns The corresponding {@link ModifyCSSFeedbackAction}
 */
export function createMovementRestrictionFeedback(
    element: GModelElement,
    movementRestrictor: IMovementRestrictor
): ModifyCSSFeedbackAction {
    const elements: GModelElement[] = [element];
    if (element instanceof GParentElement) {
        element.children.filter(child => child instanceof SResizeHandle).forEach(e => elements.push(e));
    }
    return ModifyCSSFeedbackAction.create({ elements, add: movementRestrictor.cssClasses });
}

/**
 * Utility function to create an action that removes the given {@link IMovementRestrictor.cssClasses} from the given element.
 * @param element The element from which the css classes should be removed.
 * @param movementRestrictor The movement restrictor whose cssClasses should be removed.
 * @returns The corresponding {@link ModifyCSSFeedbackAction}
 */
export function removeMovementRestrictionFeedback(
    element: GModelElement,
    movementRestrictor: IMovementRestrictor
): ModifyCSSFeedbackAction {
    const elements: GModelElement[] = [element];
    if (element instanceof GParentElement) {
        element.children.filter(child => child instanceof SResizeHandle).forEach(e => elements.push(e));
    }

    return ModifyCSSFeedbackAction.create({ elements, remove: movementRestrictor.cssClasses });
}
