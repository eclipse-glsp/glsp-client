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
    ATTR_BBOX_ELEMENT,
    Action,
    Bounds,
    BoundsAware,
    ComputedBoundsAction,
    Deferred,
    Disposable,
    DisposableCollection,
    EdgeRouterRegistry,
    ElementAndRoutingPoints,
    GModelElement,
    GRoutableElement,
    HiddenBoundsUpdater,
    IActionDispatcher,
    RequestAction,
    ResponseAction,
    isSVGGraphicsElement
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { GArgument } from '../../utils/argument-utils';
import { calcElementAndRoute, isRoutable } from '../../utils/gmodel-util';
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
    protected edges: GRoutableElement[] = [];
    protected nodes: VNode[] = [];

    override decorate(vnode: VNode, element: GModelElement): VNode {
        super.decorate(vnode, element);
        if (isRoutable(element)) {
            this.element2route.push(calcElementAndRoute(element, this.edgeRouterRegistry));
        }
        return vnode;
    }

    override postUpdate(cause?: Action): void {
        const actions = this.captureActions(() => super.postUpdate(cause));
        actions
            .filter(action => ComputedBoundsAction.is(action))
            .forEach(action => this.actionDispatcher.dispatch(this.enhanceAction(action as ComputedBoundsAction, cause)));
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

    protected enhanceAction(action: ComputedBoundsAction, cause?: Action): ComputedBoundsAction {
        if (LocalRequestBoundsAction.is(cause)) {
            LocalComputedBoundsAction.mark(action);
        }
        action.routes = this.element2route.length === 0 ? undefined : this.element2route;
        return action;
    }

    protected override getBounds(elm: Node, element: GModelElement & BoundsAware): Bounds {
        if (!isSVGGraphicsElement(elm)) {
            this.logger.error(this, 'Not an SVG element:', elm);
            return Bounds.EMPTY;
        }
        if (elm.tagName === 'g') {
            for (const child of Array.from(elm.children)) {
                // eslint-disable-next-line no-null/no-null
                if (child.getAttribute(ATTR_BBOX_ELEMENT) !== null) {
                    return this.getBounds(child, element);
                }
            }
        }
        const bounds = this.getBBounds(elm, element);
        return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        };
    }

    protected getBBounds(elm: SVGGraphicsElement, element: GModelElement & BoundsAware): DOMRect {
        // CUSTOMIZATION: Hide certain elements during bbox calculation
        if (GArgument.getBoolean(element, ARG_HAS_HIDDEN_BBOX_ELEMENT)) {
            const restore = this.ignoreHiddenBBoxElements(elm);
            const bounds = elm.getBBox();
            restore.dispose();
            return bounds;
        }
        // END CUSTOMIZATION
        return elm.getBBox();
    }

    protected ignoreHiddenBBoxElements(elm: Element): Disposable {
        const revert = new DisposableCollection();
        // eslint-disable-next-line no-null/no-null
        if (isSVGGraphicsElement(elm) && elm.getAttribute(ATTR_HIDDEN_BBOX_ELEMENT) !== null) {
            const prevStyle = elm.style.display;
            elm.style.display = 'none';
            revert.push(() => (elm.style.display = prevStyle));
        }
        revert.push(...Array.from(elm.children).map(child => this.ignoreHiddenBBoxElements(child)));
        return revert;
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

/** If the this attribute is present on an element, it will be ignored during the bounding box calculation of it's parent. */
export const ATTR_HIDDEN_BBOX_ELEMENT = 'hiddenBboxElement';

/**
 * If this argument is set to true this elements requires special handling during bounding box calculation as it has children
 * whose size should not be considered.
 */
export const ARG_HAS_HIDDEN_BBOX_ELEMENT = 'hasHiddenBboxElement';
