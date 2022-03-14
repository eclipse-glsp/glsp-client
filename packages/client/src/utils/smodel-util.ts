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
import { distinctAdd, ElementAndRoutingPoints, remove } from '@eclipse-glsp/protocol';
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

/**
 * Adds a set of css classes to the given {@link SModelElement}.
 * @param element The element to which the css classes should be added.
 * @param cssClasses The set of css classes as string array.
 */
export function addCssClasses(element: SModelElement, cssClasses: string[]): void {
    const elementCssClasses: string[] = element.cssClasses ?? [];
    distinctAdd(elementCssClasses, ...cssClasses);
    element.cssClasses = elementCssClasses;
}

/**
 * Removes a set of css classes from the given {@link SModelElement}.
 * @param element The element from which the css classes should be removed.
 * @param cssClasses The set of css classes as string array.
 */
export function removeCssClasses(root: SModelElement, cssClasses: string[]): void {
    if (!root.cssClasses || root.cssClasses.length === 0) {
        return;
    }
    remove(root.cssClasses, ...cssClasses);
}

export function isNonRoutableSelectedMovableBoundsAware(element: SModelElement): element is SelectableBoundsAware {
    return isNonRoutableSelectedBoundsAware(element) && isMoveable(element);
}

/**
 * A typeguard function to check wether a given {@link SModelElement} implements the {@link BoundsAware} model feature,
 * the {@link Selectable} model feature and is actually selected. In addition, the element must not be a {@link SRoutableElement}.
 * @param element The element to check.
 * @returns A type predicate indicating wether the element is of type {@link SelectableBoundsAware}.
 */
export function isNonRoutableSelectedBoundsAware(element: SModelElement): element is SelectableBoundsAware {
    return isBoundsAware(element) && isSelected(element) && !isRoutable(element);
}

/**
 * A type guard function to check wether a given {@link SModelElement} is a {@link SRoutableElement}.
 * @param element The element to check.
 * @returns A type predicate indicating wether the element is a {@link SRoutableElement}.
 */
export function isRoutable<T extends SModelElement>(element: T): element is T & SRoutableElement {
    return element instanceof SRoutableElement && (element as any).routingPoints !== undefined;
}

/**
 * A typeguard function to check wether a given {@link SModelElement} is a {@link SRoutingHandle}.
 * @param element The element to check.
 * @returns A type predicate indicating wether the element is a {@link SRoutingHandle}
 */
export function isRoutingHandle(element: SModelElement | undefined): element is SRoutingHandle {
    return element !== undefined && element instanceof SRoutingHandle;
}

/**
 * A typeguard function to check wether a given {@link SModelElement} implements the {@link Selectable} model feature and
 * the {@link BoundsAware} model feature.
 * @returns A type predicate indicating wether the element is of type {@link SelectableBoundsAware}.
 */
export function isSelectableAndBoundsAware(element: SModelElement): element is SelectableBoundsAware {
    return isSelectable(element) && isBoundsAware(element);
}

/**
 * Union type to describe {@link SModelElement}s that implement the {@link Selectable} and {@link BoundsAware} feature.
 */
export type SelectableBoundsAware = SModelElement & BoundsAware & Selectable;

/**
 * Union type to describe {@link SModelElement}s that implement the {@link BoundsAware} feature.
 */
export type BoundsAwareModelElement = SModelElement & BoundsAware;

/**
 * Helper function to translate a given {@link SModelElement} into its corresponding {@link ElementAndBounds} representation.
 * @param element The element to translate.
 * @returns The corresponding {@link ElementAndBounds} for the given element.
 */
export function toElementAndBounds(element: BoundsAwareModelElement): ElementAndBounds {
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

/**
 * Helper function to translate a given {@link SRoutableElement} into its corresponding
 * {@ElementAndRoutingPoints ElementAndBounds} representation.
 * @param element The element to translate.
 * @returns The corresponding {@link ElementAndRoutingPoints} for the given element.
 */
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

/**
 * Convenience function to retrieve the model element type from a given input. The input
 * can either be a {@link SModelElement}, {@link SModelElementSchema} or a string.
 * @param input The type input.
 * @returns The corresponding model type as string.
 */
export function getElementTypeId(input: SModelElement | SModelElementSchema | string): string {
    if (typeof input === 'string') {
        return input as string;
    } else {
        return (input as any)['type'] as string;
    }
}
