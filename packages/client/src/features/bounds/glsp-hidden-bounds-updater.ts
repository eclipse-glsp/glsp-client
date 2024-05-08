/********************************************************************************
 * Copyright (c) 2022-2024 EclipseSource and others.
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
    Action,
    BoundsData,
    ComputedBoundsAction,
    EdgeRouterRegistry,
    ElementAndAlignment,
    ElementAndBounds,
    ElementAndLayoutData,
    ElementAndRoutingPoints,
    GChildElement,
    GModelElement,
    HiddenBoundsUpdater,
    LayoutData,
    ModelIndexImpl,
    RequestBoundsAction,
    isLayoutContainer
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { BoundsAwareModelElement, calcElementAndRoute, getDescendantIds, isRoutable } from '../../utils/gmodel-util';
import { LayoutAware } from './layout-data';
import { LocalComputedBoundsAction, LocalRequestBoundsAction } from './local-bounds';

export class BoundsDataExt extends BoundsData {
    layoutData?: LayoutData;
}

/**
 * Grabs the bounds from hidden SVG DOM elements, applies layouts, collects routes and fires {@link ComputedBoundsAction}s.
 *
 * The actions will contain the bound, alignment, and routing points of elements.
 */
@injectable()
export class GLSPHiddenBoundsUpdater extends HiddenBoundsUpdater {
    @inject(EdgeRouterRegistry) @optional() protected readonly edgeRouterRegistry?: EdgeRouterRegistry;

    protected element2route: ElementAndRoutingPoints[] = [];

    protected getElement2BoundsData(): Map<BoundsAwareModelElement, BoundsDataExt> {
        return this['element2boundsData'];
    }

    override decorate(vnode: VNode, element: GModelElement): VNode {
        super.decorate(vnode, element);
        if (isRoutable(element)) {
            this.element2route.push(calcElementAndRoute(element, this.edgeRouterRegistry));
        }
        return vnode;
    }

    override postUpdate(cause?: Action): void {
        if (LocalRequestBoundsAction.is(cause) && cause.elementIDs) {
            this.focusOnElements(cause.elementIDs);
        }

        // collect bounds and layout data in element2BoundsData
        this.getBoundsFromDOM();
        this.layouter.layout(this.getElement2BoundsData());

        // prepare data for action
        const resizes: ElementAndBounds[] = [];
        const alignments: ElementAndAlignment[] = [];
        const layoutData: ElementAndLayoutData[] = [];
        this.getElement2BoundsData().forEach((boundsData, element) => {
            if (boundsData.boundsChanged && boundsData.bounds !== undefined) {
                const resize: ElementAndBounds = {
                    elementId: element.id,
                    newSize: {
                        width: boundsData.bounds.width,
                        height: boundsData.bounds.height
                    }
                };
                // don't copy position if the element is layouted by the server
                if (element instanceof GChildElement && isLayoutContainer(element.parent)) {
                    resize.newPosition = {
                        x: boundsData.bounds.x,
                        y: boundsData.bounds.y
                    };
                }
                resizes.push(resize);
            }
            if (boundsData.alignmentChanged && boundsData.alignment !== undefined) {
                alignments.push({
                    elementId: element.id,
                    newAlignment: boundsData.alignment
                });
            }
            if (LayoutAware.is(boundsData)) {
                layoutData.push({ elementId: element.id, layoutData: boundsData.layoutData });
            }
        });
        const routes = this.element2route.length === 0 ? undefined : this.element2route;

        // prepare and dispatch action
        const responseId = (cause as RequestBoundsAction).requestId;
        const revision = this.root !== undefined ? this.root.revision : undefined;
        const computedBoundsAction = ComputedBoundsAction.create(resizes, { revision, alignments, layoutData, routes, responseId });
        if (LocalRequestBoundsAction.is(cause)) {
            LocalComputedBoundsAction.mark(computedBoundsAction);
        }
        this.actionDispatcher.dispatch(computedBoundsAction);

        // cleanup
        this.getElement2BoundsData().clear();
        this.element2route = [];
    }

    protected focusOnElements(elementIDs: string[]): void {
        const data = this.getElement2BoundsData();
        if (data.size > 0) {
            // expand given IDs to their descendent element IDs as we need their bounding boxes as well
            const index = [...data.keys()][0].index;
            const relevantIds = new Set(elementIDs.flatMap(elementId => this.expandElementId(elementId, index, elementIDs)));

            // ensure we only keep the bounds of the elements we are interested in
            data.forEach((_bounds, element) => !relevantIds.has(element.id) && data.delete(element));
        }
    }

    protected expandElementId(id: string, index: ModelIndexImpl, elementIDs: string[]): string[] {
        return getDescendantIds(index.getById(id));
    }
}
