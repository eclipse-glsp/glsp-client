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

import { EdgeRouterRegistry, findParentByFeature, GModelElement, GModelRoot, Point, toArray } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { GEdge } from '../../../model';
import { calcElementAndRoute, isRoutable, isSelectableAndBoundsAware, SelectableBoundsAware } from '../../../utils/gmodel-util';
import { ElementNavigator } from './element-navigator';

@injectable()
export class LeftToRightTopToBottomElementNavigator implements ElementNavigator {
    @inject(EdgeRouterRegistry) @optional() readonly edgeRouterRegistry?: EdgeRouterRegistry;

    previous(
        root: Readonly<GModelRoot>,
        current?: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate: (element: GModelElement) => boolean = () => true
    ): GModelElement | undefined {
        const elements = this.getElements(root, predicate);

        if (current === undefined) {
            return elements.length > 0 ? elements[0] : undefined;
        }
        return elements[this.getPreviousIndex(current, elements) % elements.length];
    }

    next(
        root: Readonly<GModelRoot>,
        current?: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate: (element: GModelElement) => boolean = () => true
    ): GModelElement | undefined {
        const elements = this.getElements(root, predicate);
        if (current === undefined) {
            return elements.length > 0 ? elements[0] : undefined;
        }
        return elements[this.getNextIndex(current, elements) % elements.length];
    }

    protected getElements(root: Readonly<GModelRoot>, predicate: (element: GModelElement) => boolean): GModelElement[] {
        const elements = toArray(root.index.all().filter(e => isSelectableAndBoundsAware(e))) as SelectableBoundsAware[];
        return elements.sort((a, b) => this.compare(a, b)).filter(predicate);
    }

    protected getNextIndex(current: SelectableBoundsAware, elements: GModelElement[]): number {
        for (let index = 0; index < elements.length; index++) {
            if (this.compare(elements[index], current) > 0) {
                return index;
            }
        }

        return 0;
    }

    protected getPreviousIndex(current: SelectableBoundsAware, elements: GModelElement[]): number {
        for (let index = elements.length - 1; index >= 0; index--) {
            if (this.compare(elements[index], current) < 0) {
                return index;
            }
        }

        return elements.length - 1;
    }

    protected compare(one: GModelElement, other: GModelElement): number {
        let positionOne: Point | undefined = undefined;
        let positionOther: Point | undefined = undefined;

        if (one instanceof GEdge && isRoutable(one)) {
            positionOne = calcElementAndRoute(one, this.edgeRouterRegistry).newRoutingPoints?.[0];
        }

        if (other instanceof GEdge && isRoutable(other)) {
            positionOther = calcElementAndRoute(other, this.edgeRouterRegistry).newRoutingPoints?.[0];
        }

        const boundsOne = findParentByFeature(one, isSelectableAndBoundsAware);
        const boundsOther = findParentByFeature(other, isSelectableAndBoundsAware);

        if (positionOne === undefined && boundsOne) {
            positionOne = boundsOne.bounds;
        }

        if (positionOther === undefined && boundsOther) {
            positionOther = boundsOther.bounds;
        }

        if (positionOne && positionOther) {
            if (positionOne.y !== positionOther.y) {
                return positionOne.y - positionOther.y;
            }
            if (positionOne.x !== positionOther.x) {
                return positionOne.x - positionOther.x;
            }
        }

        return 0;
    }
}
