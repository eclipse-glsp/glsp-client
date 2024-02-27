/********************************************************************************
 * Copyright (c) 2022-2023 EclipseSource and others.
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
    Deferred,
    EdgeRouterRegistry,
    ElementAndRoutingPoints,
    GModelElement,
    HiddenBoundsUpdater,
    IActionDispatcher,
    ModelIndexImpl,
    RequestAction,
    ResponseAction
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { BoundsAwareModelElement, calcElementAndRoute, getDescendantIds, isRoutable } from '../../utils/gmodel-util';
import { LocalComputedBoundsAction, LocalRequestBoundsAction } from './local-bounds';

/**
 * Grabs the bounds from hidden SVG DOM elements, applies layouts, collects routes and fires {@link ComputedBoundsAction}s.
 *
 * The actions will contain the bound, alignment, and routing points of elements.
 */
@injectable()
export class GLSPHiddenBoundsUpdater extends HiddenBoundsUpdater {
    @inject(EdgeRouterRegistry) @optional() protected readonly edgeRouterRegistry?: EdgeRouterRegistry;

    protected element2route: ElementAndRoutingPoints[] = [];

    protected getElement2BoundsData(): Map<BoundsAwareModelElement, BoundsData> {
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
        const actions = this.captureActions(() => super.postUpdate(cause));
        actions
            .filter(action => ComputedBoundsAction.is(action))
            .forEach(action => this.actionDispatcher.dispatch(this.enhanceAction(action as ComputedBoundsAction, cause)));
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

    protected captureActions(call: () => void): Action[] {
        const capturingActionDispatcher = new CapturingActionDispatcher();
        const actualActionDispatcher = this.actionDispatcher;
        this.actionDispatcher = capturingActionDispatcher;
        try {
            call();
            return capturingActionDispatcher.actions;
        } finally {
            this.actionDispatcher = actualActionDispatcher;
        }
    }

    protected enhanceAction(action: ComputedBoundsAction, cause?: Action): ComputedBoundsAction {
        if (LocalRequestBoundsAction.is(cause)) {
            LocalComputedBoundsAction.mark(action);
        }
        action.routes = this.element2route.length === 0 ? undefined : this.element2route;
        return action;
    }
}

class CapturingActionDispatcher implements IActionDispatcher {
    readonly actions: Action[] = [];

    async dispatch(action: Action): Promise<void> {
        this.actions.push(action);
    }

    async dispatchAll(actions: Action[]): Promise<void> {
        this.actions.push(...actions);
    }

    async request<Res extends ResponseAction>(action: RequestAction<Res>): Promise<Res> {
        // ignore, not needed for our purposes
        return new Deferred<Res>().promise;
    }
}
