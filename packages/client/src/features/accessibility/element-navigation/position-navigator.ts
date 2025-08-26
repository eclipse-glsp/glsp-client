/********************************************************************************
 * Copyright (c) 2023-2024 Business Informatics Group (TU Wien) and others.
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
    Bounds,
    GChildElement,
    GModelElement,
    GModelRoot,
    GNode,
    IActionDispatcher,
    Point,
    TYPES,
    isBoundsAware,
    isSelectable,
    toArray
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { SelectableBoundsAware } from '../../../utils/gmodel-util';
import { ElementNavigator } from './element-navigator';

@injectable()
export class PositionNavigator implements ElementNavigator {
    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher;

    previous(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): GModelElement | undefined {
        return this.getNearestElement(root, current, e => this.bounds(root, e).x < this.bounds(root, current).x);
    }

    next(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): GModelElement | undefined {
        return this.getNearestElement(root, current, e => this.bounds(root, e).x > this.bounds(root, current).x);
    }

    up(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): GModelElement | undefined {
        return this.getNearestElement(root, current, e => this.bounds(root, e).y < this.bounds(root, current).y);
    }

    down(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): GModelElement | undefined {
        return this.getNearestElement(root, current, e => this.bounds(root, e).y > this.bounds(root, current).y);
    }

    protected getNearestElement(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        filter: (e: SelectableBoundsAware) => boolean
    ): GModelElement | undefined {
        const elements = this.boundElements(root).filter(filter);
        return this.sortByDistance(root, current, elements)[0];
    }

    protected sortByDistance(root: GModelRoot, current: SelectableBoundsAware, elements: SelectableBoundsAware[]): SelectableBoundsAware[] {
        // https://www.tutorialspoint.com/sort-array-of-points-by-ascending-distance-from-a-given-point-javascript
        const distance = (coor1: Point, coor2: Point): number => {
            const x = coor2.x - coor1.x;
            const y = coor2.y - coor1.y;
            return Math.sqrt(x * x + y * y);
        };

        return elements.sort(
            (a, b) =>
                distance(this.bounds(root, a), this.bounds(root, current)) - distance(this.bounds(root, b), this.bounds(root, current))
        );
    }

    protected boundElements(root: Readonly<GModelRoot>): SelectableBoundsAware[] {
        return toArray(root.index.all().filter(e => e instanceof GNode && isSelectable(e) && isBoundsAware(e))) as SelectableBoundsAware[];
    }

    protected bounds(root: Readonly<GModelRoot>, element: SelectableBoundsAware): Bounds {
        return this.boundsInViewport(element, element.bounds, root);
    }

    protected boundsInViewport(element: GModelElement, bounds: Bounds, viewport: GModelRoot): Bounds {
        if (element instanceof GChildElement && element.parent !== viewport) {
            return this.boundsInViewport(element.parent, element.parent.localToParent(bounds) as Bounds, viewport);
        } else {
            return bounds;
        }
    }
}
