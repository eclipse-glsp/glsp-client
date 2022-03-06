/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { ElementAndRoutingPoints } from '@eclipse-glsp/protocol';
import {
    BoundsAware,
    ElementAndBounds,
    isBoundsAware,
    isMoveable,
    isSelectable,
    isSelected,
    Selectable,
    SModelElement,
    SModelElementSchema,
    SModelIndex,
    SRoutableElement,
    SRoutingHandle
} from 'sprotty';
import { FluentIterable } from 'sprotty/lib/utils/iterable';

/**
 * Helper type to represent a filter predicate for {@link SModelElement}s. This is used to retrieve
 * elements from the {@link SModelIndex} that also conform to a second type `T`. Its mainly used for
 * retrieving elements that also implement a certain model features (e.g. selectable)
 */
export type ModelFilterPredicate<T> = (modelElement: SModelElement) => modelElement is SModelElement & T;

/**
 * Retrieves all elements from the given {@link SModelIndex} that match the given {@link ModelFilterPredicate}
 * @param index The {@link SModelIndex}.
 * @param predicate The {@link ModelFilterPredicate} that should be used.
 * @returns A {@link FluentIterable} of all indexed element that match the predicate
 * (correctly casted to also include the additional type of the predicate).
 */
export function filter<T>(index: SModelIndex<SModelElement>, predicate: ModelFilterPredicate<T>): FluentIterable<SModelElement & T> {
    return index.all().filter(predicate) as FluentIterable<SModelElement & T>;
}

/**
 * Retrieves all elements from the given {@link SModelIndex} that match the given {@link ModelFilterPredicate} and executes
 * the given runnable for each element of the result set.
 * @param index The {@link SModelIndex}.
 * @param predicate The {@link ModelFilterPredicate} that should be used.
 * @param runnable The runnable that should be executed for each matching element.
 */
export function forEachElement<T>(
    index: SModelIndex<SModelElement>,
    predicate: ModelFilterPredicate<T>,
    runnable: (modelElement: SModelElement & T) => void
): void {
    filter(index, predicate).forEach(runnable);
}

/**
 * Retrieves an array of all elements that match the given {@link ModelFilterPredicate} from the given {@link SModelIndex}.
 * @param index The {@link SModelIndex}.
 * @param predicate The {@link ModelFilterPredicate} that should be used.
 * @returns An array of all indexed element that match the predicate
 * (correctly casted to also include the additional type of the predicate).
 */
export function getMatchingElements<T>(index: SModelIndex<SModelElement>, predicate: ModelFilterPredicate<T>): (SModelElement & T)[] {
    return Array.from(filter(index, predicate));
}

/**
 * Retrieves the amount of currently selected elements in the given {@link SModelIndex}.
 * @param index The {@link SModelIndex}.
 * @returns The amount of selected elements.
 */
export function getSelectedElementCount(index: SModelIndex<SModelElement>): number {
    let selected = 0;
    forEachElement(index, isSelected, element => selected++);
    return selected;
}

/**
 * Helper function to check wether an any element is selected in the given {@link SModelIndex}.
 * @param index The {@link SModelIndex}.
 * @returns `true` if at least one element is selected, `false` otherwise.
 */
export function hasSelectedElements(index: SModelIndex<SModelElement>): boolean {
    return getSelectedElementCount(index) > 0;
}

/**
 * Helper function to check wether an element is defined. Can be used as {@link ModelFilterPredicate}.
 * @param element The element that should be checked.
 * @returns the type predicate for `T`
 */
export function isNotUndefined<T>(element: T | undefined): element is T {
    return element !== undefined;
}

export function addCssClasses(root: SModelElement, cssClasses: string[]): void {
    if (root.cssClasses === undefined) {
        root.cssClasses = [];
    }
    for (const cssClass of cssClasses) {
        if (root.cssClasses.indexOf(cssClass) < 0) {
            root.cssClasses.push(cssClass);
        }
    }
}

export function removeCssClasses(root: SModelElement, cssClasses: string[]): void {
    if (root.cssClasses === undefined || root.cssClasses.length === 0) {
        return;
    }
    for (const cssClass of cssClasses) {
        const index = root.cssClasses.indexOf(cssClass);
        if (index !== -1) {
            root.cssClasses.splice(root.cssClasses.indexOf(cssClass), 1);
        }
    }
}

export function isNonRoutableSelectedMovableBoundsAware(element: SModelElement): element is SelectableBoundsAware {
    return isNonRoutableSelectedBoundsAware(element) && isMoveable(element);
}

export function isNonRoutableSelectedBoundsAware(element: SModelElement): element is SelectableBoundsAware {
    return isBoundsAware(element) && isSelected(element) && !isRoutable(element);
}

export function isRoutable<T extends SModelElement>(element: T): element is T & SRoutableElement {
    return element instanceof SRoutableElement && (element as any).routingPoints !== undefined;
}

export function isRoutingHandle(element: SModelElement | undefined): element is SRoutingHandle {
    return element !== undefined && element instanceof SRoutingHandle;
}

export function isSelectableAndBoundsAware(element: SModelElement): element is BoundsAware & Selectable & SModelElement {
    return isSelectable(element) && isBoundsAware(element);
}

export type SelectableBoundsAware = SModelElement & BoundsAware & Selectable;

export type BoundsAwareModelElement = SModelElement & BoundsAware;

export function toElementAndBounds(element: SModelElement & BoundsAware): ElementAndBounds {
    return {
        elementId: element.id,
        newPosition: {
            x: element.bounds.x,
            y: element.bounds.y
        },
        newSize: {
            width: element.bounds.width,
            height: element.bounds.height
        }
    };
}

export function toElementAndRoutingPoints(element: SRoutableElement): ElementAndRoutingPoints {
    return {
        elementId: element.id,
        newRoutingPoints: element.routingPoints
    };
}

/**
 * Checks if the model is compatible with the passed type string.
 * (either has the same type or a subtype of this type)
 */
export function hasCompatibleType(input: SModelElement | SModelElementSchema | string, type: string): boolean {
    const inputType = getElementTypeId(input);
    return inputType === type ? true : inputType.split(':').includes(type);
}

export function getElementTypeId(input: SModelElement | SModelElementSchema | string): string {
    if (typeof input === 'string') {
        return input as string;
    } else {
        return (input as any)['type'] as string;
    }
}
