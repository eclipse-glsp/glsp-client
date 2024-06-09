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
import { Bounds, Dimension, GModelElement, GNode, GParentElement, Point, isBoundsAware, isMoveable } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { ModifyCSSFeedbackAction } from '../../base/feedback/css-feedback';
import { BoundsAwareModelElement } from '../../utils/gmodel-util';
import { toAbsoluteBounds } from '../../utils/viewpoint-util';
import { GResizeHandle } from './model';

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
        if (!isMoveable(element) || !newLocation) {
            return false;
        }
        // Create ghost element at the newLocation
        const dimensions: Dimension = isBoundsAware(element) ? element.bounds : { width: 1, height: 1 };
        const ghostElement = Object.create(element) as BoundsAwareModelElement;
        ghostElement.bounds = { ...dimensions, ...newLocation };
        ghostElement.type = 'Ghost';
        ghostElement.id = element.id;
        return !Array.from(
            element.root.index
                .all()
                .filter(node => node.id !== ghostElement.id && node !== ghostElement.root && node instanceof GNode)
                .map(node => node as BoundsAwareModelElement)
        ).some(e => this.areOverlapping(e, ghostElement));
    }

    protected isBoundsRelevant(element: GModelElement, ghostElement: BoundsAwareModelElement): element is BoundsAwareModelElement {
        return element.id !== ghostElement.id && element !== ghostElement.root && element instanceof GNode && isBoundsAware(element);
    }

    protected areOverlapping(element1: BoundsAwareModelElement, element2: BoundsAwareModelElement): boolean {
        return Bounds.overlap(toAbsoluteBounds(element1), toAbsoluteBounds(element2));
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
        element.children.filter(child => child instanceof GResizeHandle).forEach(e => elements.push(e));
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
        element.children.filter(child => child instanceof GResizeHandle).forEach(e => elements.push(e));
    }

    return ModifyCSSFeedbackAction.create({ elements, remove: movementRestrictor.cssClasses });
}

export function movementRestrictionFeedback(
    element: GModelElement,
    movementRestrictor: IMovementRestrictor,
    valid: boolean
): ModifyCSSFeedbackAction {
    return valid
        ? removeMovementRestrictionFeedback(element, movementRestrictor)
        : createMovementRestrictionFeedback(element, movementRestrictor);
}
