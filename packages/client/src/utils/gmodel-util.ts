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
import {
    BoundsAware,
    EdgeRouterRegistry,
    ElementAndBounds,
    ElementAndRoutingPoints,
    FluentIterable,
    GChildElement,
    GModelElement,
    GModelElementSchema,
    GParentElement,
    GRoutableElement,
    GRoutingHandle,
    Locateable,
    ModelIndexImpl,
    Point,
    RoutedPoint,
    Selectable,
    TypeGuard,
    distinctAdd,
    getAbsoluteBounds,
    getZoom,
    isBoundsAware,
    isMoveable,
    isSelectable,
    isSelected,
    remove
} from '@eclipse-glsp/sprotty';
import { ResizeHandleLocation } from '../features/change-bounds/model';

/**
 * Helper type to represent a filter predicate for {@link GModelElement}s. This is used to retrieve
 * elements from the {@link ModelIndexImpl} that also conform to a second type `T`. Its mainly used for
 * retrieving elements that also implement a certain model features (e.g. selectable)
 */
export type ModelFilterPredicate<T> = (modelElement: GModelElement) => modelElement is GModelElement & T;

/**
 * Retrieves all elements from the given {@link ModelIndexImpl} that match the given {@link ModelFilterPredicate}
 * @param index The {@link ModelIndexImpl}.
 * @param predicate The {@link ModelFilterPredicate} that should be used.
 * @returns A {@link FluentIterable} of all indexed element that match the predicate
 * (correctly casted to also include the additional type of the predicate).
 */
export function filter<T>(index: ModelIndexImpl, predicate: ModelFilterPredicate<T>): FluentIterable<GModelElement & T> {
    return index.all().filter(predicate) as FluentIterable<GModelElement & T>;
}

/**
 * Retrieves all elements from the given {@link ModelIndexImpl} that match the given {@link ModelFilterPredicate} and executes
 * the given runnable for each element of the result set.
 * @param index The {@link ModelIndexImpl}.
 * @param predicate The {@link ModelFilterPredicate} that should be used.
 * @param runnable The runnable that should be executed for each matching element.
 */
export function forEachElement<T>(
    index: ModelIndexImpl,
    predicate: ModelFilterPredicate<T>,
    runnable: (modelElement: GModelElement & T) => void
): void {
    filter(index, predicate).forEach(runnable);
}

/**
 * Retrieves an array of all elements that match the given {@link ModelFilterPredicate} from the given {@link ModelIndexImpl}.
 * @param index The {@link ModelIndexImpl}.
 * @param predicate The {@link ModelFilterPredicate} that should be used.
 * @returns An array of all indexed element that match the predicate
 * (correctly casted to also include the additional type of the predicate).
 */
export function getMatchingElements<T>(index: ModelIndexImpl, predicate: ModelFilterPredicate<T>): (GModelElement & T)[] {
    return Array.from(filter(index, predicate));
}

/**
 * Invokes the given model index to retrieve the corresponding model elements for the given set of ids. Ids that
 * have no corresponding element in the index will be ignored.
 * @param index THe model index.
 * @param elementsIDs The element ids.
 * @param guard Optional typeguard. If defined only elements that match the guard will be returned.
 * @returns An array of the model elements that correspond to the given ids and filter predicate.
 */
export function getElements<S extends GModelElement>(index: ModelIndexImpl, elementsIDs: string[], guard?: TypeGuard<S>): S[] {
    // Internal filter function that filters out undefined model elements and runs an optional typeguard check.
    const filterFn = (element?: GModelElement): element is S => {
        if (element !== undefined) {
            return guard ? guard(element) : true;
        }
        return false;
    };
    return elementsIDs.map(id => index.getById(id)).filter(filterFn);
}
/**
 * Retrieves the amount of currently selected elements in the given {@link ModelIndexImpl}.
 * @param index The {@link ModelIndexImpl}.
 * @returns The amount of selected elements.
 */
export function getSelectedElementCount(index: ModelIndexImpl): number {
    let selected = 0;
    forEachElement(index, isSelected, element => selected++);
    return selected;
}

/**
 * Helper function to check wether an any element is selected in the given {@link ModelIndexImpl}.
 * @param index The {@link ModelIndexImpl}.
 * @returns `true` if at least one element is selected, `false` otherwise.
 */
export function hasSelectedElements(index: ModelIndexImpl): boolean {
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
 * Adds a set of css classes to the given {@link GModelElement}.
 * @param element The element to which the css classes should be added.
 * @param cssClasses The set of css classes as string array.
 */
export function addCssClasses(element: GModelElement, cssClasses: string[]): void;
export function addCssClasses(element: GModelElement, ...cssClasses: string[]): void;
export function addCssClasses(element: GModelElement, ...cssClasses: string[] | [string[]]): void {
    const classes = Array.isArray(cssClasses[0]) ? cssClasses[0] : cssClasses;
    const elementCssClasses: string[] = element.cssClasses ?? [];
    distinctAdd(elementCssClasses, ...classes);
    element.cssClasses = elementCssClasses;
}

/**
 * Removes a set of css classes from the given {@link GModelElement}.
 * @param element The element from which the css classes should be removed.
 * @param cssClasses The set of css classes as string array.
 */
export function removeCssClasses(element: GModelElement, cssClasses: string[]): void;
export function removeCssClasses(element: GModelElement, ...cssClasses: string[]): void;
export function removeCssClasses(element: GModelElement, ...cssClasses: string[] | [string[]]): void {
    if (!element.cssClasses || element.cssClasses.length === 0) {
        return;
    }
    const classes = Array.isArray(cssClasses[0]) ? cssClasses[0] : cssClasses;
    remove(element.cssClasses, ...classes);
}

/**
 * Adds a css classs to a set of {@link GModelElement}s.
 *
 * @param elements The elements to which the css class should be added.
 * @param cssClass The css class to add.
 */
export function addCssClassToElements(elements: GModelElement[], ...cssClasses: string[]): void {
    for (const element of elements) {
        addCssClasses(element, cssClasses);
    }
}

/**
 * Removes a css class from a set of {@link GModelElement}s.
 * @param elements The elements from which the css class should be removed.
 * @param cssClass The css class to remove.
 */
export function removeCssClassOfElements(elements: GModelElement[], ...cssClasses: string[]): void {
    for (const element of elements) {
        removeCssClasses(element, cssClasses);
    }
}

/**
 * Toggles a css class on a {@link GModelElement} based on the given toggle flag.
 */
export function toggleCssClass(element: GModelElement, cssClass: string, toggle: boolean): void {
    return toggle ? addCssClasses(element, cssClass) : removeCssClasses(element, cssClass);
}

export function isNonRoutableSelectedMovableBoundsAware(element: GModelElement): element is SelectableBoundsAware {
    return isNonRoutableSelectedBoundsAware(element) && isMoveable(element);
}

export function isNonRoutableMovableBoundsAware(element: GModelElement): element is BoundsAwareModelElement {
    return isNonRoutableBoundsAware(element) && isMoveable(element);
}

/**
 * A typeguard function to check wether a given {@link GModelElement} implements the {@link BoundsAware} model feature,
 * the {@link Selectable} model feature and is actually selected. In addition, the element must not be a {@link GRoutableElement}.
 * @param element The element to check.
 * @returns A type predicate indicating wether the element is of type {@link SelectableBoundsAware}.
 */
export function isNonRoutableSelectedBoundsAware(element: GModelElement): element is SelectableBoundsAware {
    return isNonRoutableBoundsAware(element) && isSelected(element);
}

/**
 * A typeguard function to check wether a given {@link GModelElement} implements the {@link BoundsAware} model feature.
 * In addition, the element must not be a {@link GRoutableElement}.
 * @param element The element to check.
 * @returns A type predicate indicating wether the element is of type {@link BoundsAwareModelElement}.
 */
export function isNonRoutableBoundsAware(element: GModelElement): element is BoundsAwareModelElement {
    return isBoundsAware(element) && !isRoutable(element);
}

/**
 * A type guard function to check wether a given {@link GModelElement} is a {@link GRoutableElement}.
 * @param element The element to check.
 * @returns A type predicate indicating wether the element is a {@link GRoutableElement}.
 */
export function isRoutable<T extends GModelElement>(element: T): element is T & GRoutableElement {
    return element instanceof GRoutableElement && (element as any).routingPoints !== undefined;
}

/**
 * A typeguard function to check wether a given {@link GModelElement} is a {@link SRoutingHandle}.
 * @param element The element to check.
 * @returns A type predicate indicating wether the element is a {@link SRoutingHandle}
 */
export function isRoutingHandle(element: GModelElement | undefined): element is GRoutingHandle {
    return element !== undefined && element instanceof GRoutingHandle;
}

/**
 * A typeguard function to check wether a given {@link GModelElement} implements the {@link Selectable} model feature and
 * the {@link BoundsAware} model feature.
 * @returns A type predicate indicating wether the element is of type {@link SelectableBoundsAware}.
 */
export function isSelectableAndBoundsAware(element: GModelElement): element is SelectableBoundsAware {
    return isSelectable(element) && isBoundsAware(element);
}
/**
 * Union type to describe {@link GModelElement}s that implement the {@link Selectable} feature.
 */
export type SelectableElement = GModelElement & Selectable;

/**
 * Union type to describe {@link GModelElement}s that implement the {@link Selectable} and {@link BoundsAware} feature.
 */
export type SelectableBoundsAware = SelectableElement & BoundsAware;

/**
 * Union type to describe {@link GModelElement}s that implement the {@link BoundsAware} feature.
 */
export type BoundsAwareModelElement = GModelElement & BoundsAware;

/**
 * Union type to describe {@link GModelElement}s that implement the {@link Locateable} feature.
 */
export type MoveableElement = GModelElement & Locateable;

export interface Resizable extends BoundsAware, Selectable {}

export interface ResizableModelElement extends GParentElement, Resizable {
    resizeLocations?: ResizeHandleLocation[];
}

/**
 * Helper function to translate a given {@link GModelElement} into its corresponding {@link ElementAndBounds} representation.
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
 * Helper function to translate a given {@link GRoutableElement} into its corresponding
 * {@link ElementAndRoutingPoints} representation.
 * @param element The element to translate.
 * @returns The corresponding {@link ElementAndRoutingPoints} for the given element.
 */
export function toElementAndRoutingPoints(element: GRoutableElement): ElementAndRoutingPoints {
    return {
        elementId: element.id,
        newRoutingPoints: element.routingPoints
    };
}
/** All routing points. */
export const ALL_ROUTING_POINTS = undefined;

/** Pure routing point data kinds. */
export const ROUTING_POINT_KINDS = ['linear', 'bezier-junction'];

/** Pure route data kinds. */
export const ROUTE_KINDS = [...ROUTING_POINT_KINDS, 'source', 'target'];

/**
 * Helper function to calculate the {@link ElementAndRoutingPoints} for a given {@link GRoutableElement}.
 * If client layout is activated, i.e., the edge routing registry is given and has a router for the element, then the routing
 * points from the calculated route are used, otherwise we use the already specified routing points of the {@link GRoutableElement}.
 * @param element The element to translate.
 * @param routerRegistry the edge router registry.
 * @returns The corresponding {@link ElementAndRoutingPoints} for the given element.
 */
export function calcElementAndRoutingPoints(element: GRoutableElement, routerRegistry?: EdgeRouterRegistry): ElementAndRoutingPoints {
    const newRoutingPoints = routerRegistry ? calcRoute(element, routerRegistry, ROUTING_POINT_KINDS) : element.routingPoints;
    return { elementId: element.id, newRoutingPoints };
}

/**
 * Helper function to calculate the route for a given {@link GRoutableElement}.
 * If client layout is activated, i.e., the edge routing registry is given and has a router for the element, then the points
 * from the calculated route are used, otherwise we use the already specified routing points of the {@link GRoutableElement}.
 * @param element The element to translate.
 * @param routerRegistry the edge router registry.
 * @returns The corresponding route for the given element.
 */
export function calcElementAndRoute(element: GRoutableElement, routerRegistry?: EdgeRouterRegistry): ElementAndRoutingPoints {
    let route: Point[] | undefined = routerRegistry ? calcRoute(element, routerRegistry, ROUTE_KINDS) : undefined;
    if (!route) {
        // add source and target to the routing points
        route = [...element.routingPoints];
        route.splice(0, 0, element.source?.position || Point.ORIGIN);
        route.push(element.target?.position || Point.ORIGIN);
    }
    return { elementId: element.id, newRoutingPoints: route };
}

/**
 * Helper function to calculate the route for a given {@link GRoutableElement} by filtering duplicate points.
 * @param element The element to translate.
 * @param routerRegistry the edge router registry.
 * @param pointKinds the routing point kinds that should be considered.
 * @param tolerance the tolerance applied to a point's coordinates to determine duplicates.
 * @returns The corresponding route for the given element.
 */
export function calcRoute(
    element: GRoutableElement,
    routerRegistry: EdgeRouterRegistry,
    pointKinds: string[] | undefined = ALL_ROUTING_POINTS,
    tolerance = Number.EPSILON
): RoutedPoint[] | undefined {
    const route = routerRegistry.get(element.routerKind).route(element);
    const calculatedRoute: RoutedPoint[] = [];
    for (const point of route) {
        // only include points we are actually interested in
        if (pointKinds && !pointKinds.includes(point.kind)) {
            continue;
        }
        // check if we are a duplicate based on coordinates in the already calculated route
        if (
            ROUTING_POINT_KINDS.includes(point.kind) &&
            calculatedRoute.find(calculatedPoint => Point.maxDistance(point, calculatedPoint) < tolerance)
        ) {
            continue;
        }
        calculatedRoute.push(point);
    }
    return calculatedRoute;
}

/**
 * Convenience function to retrieve the model element type from a given input. The input
 * can either be a {@link GModelElement}, {@link GModelElementSchema} or a string.
 * @param input The type input.
 * @returns The corresponding model type as string.
 */
export function getElementTypeId(input: GModelElement | GModelElementSchema | string): string {
    if (typeof input === 'string') {
        return input;
    } else {
        return input.type;
    }
}

export function findTopLevelElementByFeature<T>(
    element: GModelElement,
    predicate: (t: GModelElement) => t is GModelElement & T,
    skip: (t: GModelElement) => boolean = _t => false
): (GModelElement & T) | undefined {
    let match: (GModelElement & T) | undefined;
    let current: GModelElement | undefined = element;
    while (current !== undefined) {
        if (!skip(current) && predicate(current)) {
            match = current;
        }
        if (current instanceof GChildElement) {
            current = current.parent;
        } else {
            current = undefined;
        }
    }
    return match;
}

export function calculateDeltaBetweenPoints(target: Point, source: Point, element: GModelElement): Point {
    const delta = Point.subtract(target, source);
    const zoom = getZoom(element);
    const adaptedDelta = Point.divideScalar(delta, zoom);
    return adaptedDelta;
}

export function isVisibleOnCanvas(model: BoundsAwareModelElement): boolean {
    const modelBounds = getAbsoluteBounds(model);
    const canvasBounds = model.root.canvasBounds;
    return (
        modelBounds.x <= canvasBounds.width &&
        modelBounds.x + modelBounds.width >= 0 &&
        modelBounds.y <= canvasBounds.height &&
        modelBounds.y + modelBounds.height >= 0
    );
}

export function getDescendantIds(element?: GModelElement, skip?: (t: GModelElement) => boolean): string[] {
    if (!element || skip?.(element)) {
        return [];
    }
    const parent = element;
    const ids = [parent.id];
    if (parent instanceof GParentElement) {
        ids.push(...parent.children.flatMap(child => getDescendantIds(child, skip)));
    }
    return ids;
}

/**
 * Returns a filter function that checks if the given element is not a descendant of any of the given elements.
 *
 * @param elements  The elements that the element should not be a descendant of.
 * @returns the filter function
 */
export function isNotDescendantOfAnyElement<T extends GModelElement>(elements: FluentIterable<T>): (element: T) => boolean {
    const elementsSet = new Set<GModelElement>(elements);
    return (element: T): boolean => {
        let parent: GModelElement = element;
        while (parent instanceof GChildElement) {
            parent = parent.parent;
            if (elementsSet.has(parent)) {
                return false;
            }
        }
        return true;
    };
}

/**
 * Removes any descendants of the given elements from the given elements.
 * @param elements The elements to filter.
 * @returns the filtered elements
 */
export function removeDescendants<T extends GModelElement>(elements: FluentIterable<T>): FluentIterable<T> {
    return elements.filter(isNotDescendantOfAnyElement(elements));
}
