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
    Action,
    Disposable,
    GModelElement,
    GModelRoot,
    LazyInjector,
    MaybePromise,
    MouseListener,
    MouseTool,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { IDiagramStartup } from '../model/diagram-loader';
import { Ranked } from '../ranked';

/**
 * Custom helper type to declare the explicit mouse listener methods
 * of {@link MouseListener} i.e. omitting the `decorate` method.
 */
type MouseListenerMethods = keyof Omit<MouseListener, 'decorate'>;

@injectable()
export class GLSPMouseTool extends MouseTool implements IDiagramStartup {
    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;

    protected rankedMouseListeners: Map<number, MouseListener[]>;

    constructor(@inject(TYPES.EmptyArray) mouseListeners: MouseListener[]) {
        super(mouseListeners);
    }

    preLoadDiagram(): MaybePromise<void> {
        this.lazyInjector.getAll<MouseListener>(TYPES.MouseListener).forEach(listener => this.register(listener));
    }

    override register(mouseListener: MouseListener): void {
        super.register(mouseListener);
        this.rankedMouseListeners = groupBy(this.mouseListeners, listener => Ranked.getRank(listener));
    }

    registerListener(mouseListener: MouseListener): Disposable {
        this.register(mouseListener);
        return Disposable.create(() => this.deregister(mouseListener));
    }

    override deregister(mouseListener: MouseListener): void {
        super.deregister(mouseListener);
        this.rankedMouseListeners = groupBy(this.mouseListeners, listener => Ranked.getRank(listener));
    }

    protected override handleEvent<K extends MouseListenerMethods>(methodName: K, model: GModelRoot, event: MouseEvent): void {
        this.focusOnMouseEvent(methodName, model);
        const element = this.getTargetElement(model, event);
        if (!element) {
            return;
        }
        this.notifyListenersByRank(element, methodName, event);
    }

    protected async notifyListenersByRank<K extends MouseListenerMethods>(
        element: GModelElement,
        methodName: K,
        event: MouseEvent
    ): Promise<void> {
        for (const rank of this.rankedMouseListeners) {
            await this.dispatchActions(rank[1], methodName, element, event);
        }
    }

    protected async dispatchActions<K extends MouseListenerMethods>(
        mouseListeners: MouseListener[],
        methodName: K,
        element: GModelElement,
        event: MouseEvent
    ): Promise<void> {
        const actions = mouseListeners.map(listener => listener[methodName](element, event as WheelEvent)).reduce((a, b) => a.concat(b));
        if (actions.length > 0) {
            event.preventDefault();
            for (const actionOrPromise of actions) {
                if (Action.is(actionOrPromise)) {
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
