/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { injectable, multiInject, optional } from "inversify";
import { VNode } from "snabbdom/vnode";
import { Action, isAction, MouseListener, MouseTool, SModelElement, SModelRoot, TYPES } from "sprotty";

import { getRank } from "../rank/model";

export interface IMouseTool {
    register(mouseListener: MouseListener): void;
    deregister(mouseListener: MouseListener): void;
}

@injectable()
export class RankingMouseTool extends MouseTool implements IMouseTool {
    protected rankedMouseListeners: Map<number, MouseListener[]>;

    constructor(@multiInject(TYPES.MouseListener) @optional() protected mouseListeners: MouseListener[] = []) {
        super(mouseListeners);
        this.rankedMouseListeners = groupBy(mouseListeners, listener => getRank(listener));
    }

    register(mouseListener: MouseListener) {
        super.register(mouseListener);
        this.rankedMouseListeners = groupBy(this.mouseListeners, listener => getRank(listener));
    }

    deregister(mouseListener: MouseListener) {
        super.deregister(mouseListener);
        this.rankedMouseListeners = groupBy(this.mouseListeners, listener => getRank(listener));
    }

    decorate(vnode: VNode, element: SModelElement) {
        // we need to overwrite the existing event handlers registered by the original mouse tool
        if (element instanceof SModelRoot) {
            overwriteOn(vnode, 'mouseover', this.mouseOver.bind(this), element);
            overwriteOn(vnode, 'mouseout', this.mouseOut.bind(this), element);
            overwriteOn(vnode, 'mouseenter', this.mouseEnter.bind(this), element);
            overwriteOn(vnode, 'mouseleave', this.mouseLeave.bind(this), element);
            overwriteOn(vnode, 'mousedown', this.mouseDown.bind(this), element);
            overwriteOn(vnode, 'mouseup', this.mouseUp.bind(this), element);
            overwriteOn(vnode, 'mousemove', this.mouseMove.bind(this), element);
            overwriteOn(vnode, 'wheel', this.wheel.bind(this), element);
            overwriteOn(vnode, 'contextmenu', (target: SModelElement, event: any) => {
                event.preventDefault();
            }, element);
            overwriteOn(vnode, 'dblclick', this.doubleClick.bind(this), element);
        }
        vnode = this.mouseListeners.reduce(
            (n: VNode, listener: MouseListener) => listener.decorate(n, element),
            vnode);
        return vnode;
    }

    protected handleEvent<K extends keyof MouseListener>(methodName: K, model: SModelRoot, event: MouseEvent) {
        this.focusOnMouseEvent(methodName, model);
        const element = this.getTargetElement(model, event);
        if (!element) {
            return;
        }
        this.notifyListenersByRank(element, methodName, model, event);
    }

    async notifyListenersByRank<K extends keyof MouseListener>(element: SModelElement, methodName: K, model: SModelRoot, event: MouseEvent) {
        for (const rank of this.rankedMouseListeners) {
            await this.dispatchActions(rank[1], methodName, element, event);
        }
    }

    async dispatchActions<K extends keyof MouseListener>(mouseListeners: MouseListener[], methodName: K, element: SModelElement, event: MouseEvent): Promise<void> {
        const actions = mouseListeners
            .map(listener => listener[methodName].apply(listener, [element, event]))
            .reduce((a, b) => a.concat(b));
        if (actions.length > 0) {
            event.preventDefault();
            for (const actionOrPromise of actions) {
                if (isAction(actionOrPromise)) {
                    await this.actionDispatcher.dispatch(actionOrPromise);
                } else {
                    actionOrPromise.then((action: Action) => {
                        this.actionDispatcher.dispatch(action);
                    });
                }
            }
        }
    }
}

function groupBy<K, T>(array: Array<T>, keyFunction: (x: T) => K): Map<K, T[]> {
    const unsortedMap = array.reduce((result: Map<K, T[]>, item: T) => {
        const key = keyFunction(item);
        if (!result.has(key)) {
            result.set(key, [item]);
        } else {
            const entries = result.get(key);
            if (entries) {
                entries.push(item);
            }
        }
        return result;
    }, new Map<K, T[]>());
    return new Map<K, T[]>([...unsortedMap.entries()].sort());
}

function overwriteOn(vnode: VNode, event: string, listener: (model: SModelElement, event: Event) => void, element: SModelElement) {
    const val = getOn(vnode);
    // ignore any previous val[event] registrations
    (val as any)[event] = [listener, element];
}

function getOn(vnode: VNode) {
    const data = getData(vnode);
    if (!data.on)
        data.on = {};
    return data.on;
}

function getData(vnode: VNode) {
    if (!vnode.data)
        vnode.data = {};
    return vnode.data;
}
