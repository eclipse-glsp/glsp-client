/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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
    Action, ComputedBoundsAction, Deferred, ElementAndRoutingPoints, RequestAction,
    ResponseAction
} from '@eclipse-glsp/protocol';
import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { EdgeRouterRegistry, HiddenBoundsUpdater, IActionDispatcher, SModelElement, SRoutableElement } from 'sprotty';
import { calcElementAndRoute, isRoutable } from '../../utils/smodel-util';

/**
 * Grabs the bounds from hidden SVG DOM elements, applies layouts, collects routes and fires {@link ComputedBoundsAction}s.
 *
 * The actions will contain the bound, alignment, and routing points of elements.
 */
@injectable()
export class GLSPHiddenBoundsUpdater extends HiddenBoundsUpdater {

    @inject(EdgeRouterRegistry) @optional() protected readonly edgeRouterRegistry?: EdgeRouterRegistry;

    protected element2route: ElementAndRoutingPoints[] = [];
    protected edges: SRoutableElement[] = [];
    protected nodes: VNode[] = [];

    override decorate(vnode: VNode, element: SModelElement): VNode {
        super.decorate(vnode, element);
        if (isRoutable(element)) {
            this.element2route.push(calcElementAndRoute(element, this.edgeRouterRegistry));
        }
        return vnode;
    }

    override postUpdate(cause?: Action): void {
        const actions = this.captureActions(() => super.postUpdate(cause));
        actions.filter(action => ComputedBoundsAction.is(action))
            .forEach(action => this.actionDispatcher.dispatch(this.enhanceAction(action as ComputedBoundsAction)));
        this.element2route = [];
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

    protected enhanceAction(action: ComputedBoundsAction): ComputedBoundsAction {
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
