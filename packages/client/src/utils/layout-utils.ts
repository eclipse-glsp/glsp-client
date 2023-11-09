/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
    BoundsAware,
    Dimension,
    ElementAndBounds,
    ElementMove,
    GModelElement,
    ModelLayoutOptions,
    Point,
    Writable
} from '@eclipse-glsp/sprotty';
import { IMovementRestrictor } from '../features/change-bounds/movement-restrictor';

export function minWidth(element: GModelElement): number {
    const layoutOptions = getLayoutOptions(element);
    if (layoutOptions !== undefined && typeof layoutOptions.minWidth === 'number') {
        return layoutOptions.minWidth;
    }
    return 1;
}

export function minHeight(element: GModelElement): number {
    const layoutOptions = getLayoutOptions(element);
    if (layoutOptions !== undefined && typeof layoutOptions.minHeight === 'number') {
        return layoutOptions.minHeight;
    }
    return 1;
}

export function getLayoutOptions(element: GModelElement): ModelLayoutOptions | undefined {
    const layoutOptions = (element as any).layoutOptions;
    if (layoutOptions !== undefined) {
        return layoutOptions as ModelLayoutOptions;
    }
    return undefined;
}

export function isValidSize(element: GModelElement & BoundsAware, size: Dimension): boolean {
    return size.width >= minWidth(element) && size.height >= minHeight(element);
}

export function isValidMove(element: GModelElement, newPosition?: Point, movementRestrictor?: IMovementRestrictor): boolean {
    if (movementRestrictor) {
        return movementRestrictor.validate(element, newPosition);
    }
    return true;
}

export function toValidElementMove(
    element: GModelElement,
    move: ElementMove,
    movementRestrictor?: IMovementRestrictor
): ElementMove | undefined {
    if (!isValidMove(element, move.toPosition, movementRestrictor)) {
        return;
    }
    return move;
}

export function toValidElementAndBounds(
    element: GModelElement,
    bounds: Writable<ElementAndBounds>,
    movementRestrictor?: IMovementRestrictor
): ElementAndBounds | undefined {
    if (!isValidMove(element, bounds.newPosition, movementRestrictor)) {
        return;
    }
    const elementMinWidth = minWidth(element);
    if (bounds.newSize.width < elementMinWidth) {
        bounds.newSize.width = elementMinWidth;
    }
    const elementMinHeight = minHeight(element);
    if (bounds.newSize.height < elementMinHeight) {
        bounds.newSize.height = elementMinHeight;
    }
    return bounds;
}
