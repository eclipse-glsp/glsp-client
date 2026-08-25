/********************************************************************************
 * Copyright (c) 2022-2026 EclipseSource and others.
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
    GModelRoot,
    GRoutableElement,
    HiddenBoundsUpdater,
    LayoutData,
    ModelIndexImpl,
    RequestBoundsAction,
    isLayoutContainer
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { EditorContextService } from '../../base/editor-context-service';
import { feedbackFeature } from '../../base/feedback/feedback-action-dispatcher';
import { ServerAction } from '../../base/model/glsp-model-source';
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
    @inject(EditorContextService) protected editorContext: EditorContextService;

    protected element2route: ElementAndRoutingPoints[] = [];

    /**
     * Ids of the routable elements of {@link element2route} that only exist as client-side feedback.
     * Recorded while decorating, as the routes outlive the root they were collected from.
     */
    protected feedbackRouteIds = new Set<string>();

    /**
     * Root of the hidden rendering currently being collected, used to detect the start of the next
     * one. Referenced weakly, as a hidden root is a throwaway copy of the whole model.
     */
    protected collectingForRoot?: WeakRef<GModelRoot>;

    protected getElement2BoundsData(): Map<BoundsAwareModelElement, BoundsDataExt> {
        return this['element2boundsData'];
    }

    override decorate(vnode: VNode, element: GModelElement): VNode {
        this.resetOnNewRendering(element);
        super.decorate(vnode, element);
        if (isRoutable(element)) {
            const route = this.calcElementRoute(element);
            if (route) {
                this.element2route.push(route);
                if (this.isFeedbackElement(element)) {
                    this.feedbackRouteIds.add(element.id);
                }
            }
        }
        return vnode;
    }

    /**
     * The route reported for the given element, or `undefined` to leave it out of the
     * {@link ComputedBoundsAction} of this rendering. Override to substitute or to skip a route,
     * which a later rendering reports again as soon as the edge can be routed.
     *
     * A route of fewer than two points, which is how a router reports an edge it cannot route, is
     * skipped: approximating it from the endpoint positions would overwrite the route on the server.
     */
    protected calcElementRoute(element: GRoutableElement): ElementAndRoutingPoints | undefined {
        const elementAndRoute = calcElementAndRoute(element, this.edgeRouterRegistry);
        return (elementAndRoute.newRoutingPoints?.length ?? 0) < 2 ? undefined : elementAndRoute;
    }

    /**
     * Drops the data collected for the previous hidden rendering as soon as a new one starts.
     * {@link postUpdate} cleans up on its way out, but a failing view or vdom patch aborts the
     * rendering before the viewer gets there, leaving the collected bounds behind.
     *
     * Elements are decorated bottom-up, so the rendering is recognized by the root of the element
     * at hand rather than by the root element itself.
     */
    protected resetOnNewRendering(element: GModelElement): void {
        if (this.collectingForRoot?.deref() !== element.root) {
            this.cleanUp();
            this.collectingForRoot = new WeakRef(element.root);
        }
    }

    override postUpdate(cause?: Action): void {
        try {
            if (cause === undefined || cause.kind !== RequestBoundsAction.KIND) {
                return;
            }

            if (LocalRequestBoundsAction.is(cause) && cause.elementIDs) {
                this.focusOnElements(cause.elementIDs);
            }

            // collect bounds and layout data in element2BoundsData
            this.getBoundsFromDOM();
            this.layouter.layout(this.getElement2BoundsData());

            // the server can only resolve elements it sent us itself
            const skipFeedback = ServerAction.is(cause);

            // prepare data for action
            const resizes: ElementAndBounds[] = [];
            const alignments: ElementAndAlignment[] = [];
            const layoutData: ElementAndLayoutData[] = [];
            this.getElement2BoundsData().forEach((boundsData, element) => {
                if (skipFeedback && this.isFeedbackElement(element)) {
                    return;
                }
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
            const relevantRoutes = skipFeedback
                ? this.element2route.filter(route => !this.feedbackRouteIds.has(route.elementId))
                : this.element2route;
            const routes = relevantRoutes.length === 0 ? undefined : relevantRoutes;

            // prepare and dispatch action
            const responseId = (cause as RequestBoundsAction).requestId;
            const revision = this.root !== undefined ? this.root.revision : undefined;
            const canvasBounds = this.editorContext.canvasBounds;
            const viewport = this.editorContext.viewportData;
            const computedBoundsAction = ComputedBoundsAction.create(resizes, {
                revision,
                alignments,
                layoutData,
                routes,
                responseId,
                canvasBounds,
                viewport
            });
            if (LocalRequestBoundsAction.is(cause)) {
                LocalComputedBoundsAction.mark(computedBoundsAction);
            }
            this.actionDispatcher.dispatch(computedBoundsAction);
        } finally {
            // always reset collected data so hidden renderings with other causes (e.g. exports/failures) do not leak into the next run
            this.cleanUp();
        }
    }

    protected cleanUp(): void {
        this.getElement2BoundsData().clear();
        this.element2route = [];
        this.feedbackRouteIds.clear();
        this.collectingForRoot = undefined;
        this.root = undefined;
    }

    protected isFeedbackElement(element: GModelElement): boolean {
        return element.hasFeature(feedbackFeature);
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
