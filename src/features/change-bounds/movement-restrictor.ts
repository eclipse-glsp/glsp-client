/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { injectable } from "inversify";
import { Action, BoundsAware, Point, SModelElement, SNode, SParentElement } from "sprotty";

import { toAbsoluteBounds } from "../../utils/viewpoint-util";
import { ModifyCSSFeedbackAction } from "../tool-feedback/css-feedback";
import { isBoundsAwareMoveable, SResizeHandle } from "./model";

export interface IMovementRestrictor {
    validate(newLocation: Point, element: SModelElement): boolean;
    cssClasses?: string[];
}

export function createMovementRestrictionFeedback(element: SModelElement, movementRestrictor: IMovementRestrictor): Action[] {
    const result: Action[] = [];
    result.push(new ModifyCSSFeedbackAction(element, movementRestrictor.cssClasses));
    if (element instanceof SParentElement) {
        element.children.filter(child => child instanceof SResizeHandle).forEach(child => result.push(new ModifyCSSFeedbackAction(child, movementRestrictor.cssClasses)));
    }
    return result;
}

export function removeMovementRestrictionFeedback(element: SModelElement, movementRestrictor: IMovementRestrictor): Action[] {
    const result: Action[] = [];
    result.push(new ModifyCSSFeedbackAction(element, undefined, movementRestrictor.cssClasses));
    if (element instanceof SParentElement) {
        element.children.filter(child => child instanceof SResizeHandle).
            forEach(child => result.push(new ModifyCSSFeedbackAction(child, undefined, movementRestrictor.cssClasses)));
    }
    return result;
}

@injectable()
export class NoOverlapMovmentRestrictor implements IMovementRestrictor {
    validate(newLocation: Point, element: SModelElement): boolean {
        if (!isBoundsAwareMoveable(element)) {
            return false;
        }
        // Create ghost element at the newLocation;
        const ghostElement = Object.create(element);

        ghostElement.bounds.x = newLocation.x - element.bounds.width / 2;
        ghostElement.bounds.y = newLocation.y - element.bounds.height / 2;
        ghostElement.type = "Ghost";
        ghostElement.id = element.id;
        return !Array.from(element.root.index.all().filter(e => e.id !== ghostElement.id && e !== ghostElement.root && (e instanceof SNode))
            .map(e => e as SModelElement & BoundsAware)).some(e => areOverlapping(e, ghostElement));
    }

    cssClasses = ["movement-not-allowed"];
}

export function areOverlapping(element1: SModelElement & BoundsAware, element2: SModelElement & BoundsAware) {
    const b1 = toAbsoluteBounds(element1);
    const b2 = toAbsoluteBounds(element2);
    const r1TopLeft: Point = b1;
    const r1BottomRight = { x: b1.x + b1.width, y: b1.y + b1.height };
    const r2TopLeft: Point = b2;
    const r2BottomRight = { x: b2.x + b2.width, y: b2.y + b2.height };

    // If one rectangle is on left side of other
    if (r1TopLeft.x > r2BottomRight.x || r2TopLeft.x > r1BottomRight.x)
        return false;

    // If one rectangle is above other
    if (r1BottomRight.y < r2TopLeft.y || r2BottomRight.y < r1TopLeft.y)
        return false;

    return true;

}
