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
import { EdgeRouterRegistry, GConnectableElement, GModelElement, GModelRoot, IActionDispatcher, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { applyCssClasses, deleteCssClasses } from '../../../base/feedback/css-feedback';
import { GEdge } from '../../../model';
import { BoundsAwareModelElement, SelectableBoundsAware } from '../../../utils/gmodel-util';
import { ElementNavigator } from './element-navigator';

@injectable()
export class LocalElementNavigator implements ElementNavigator {
    navigableElementCSS = 'navigable-element';
    @inject(EdgeRouterRegistry) @optional() readonly edgeRouterRegistry?: EdgeRouterRegistry;
    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher;

    previous(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): GModelElement | undefined {
        return this.getPreviousElement(current, predicate);
    }

    next(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): GModelElement | undefined {
        return this.getNextElement(current, predicate);
    }

    up(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): GModelElement | undefined {
        return this.getIterable(current, previousCurrent, predicate);
    }

    down(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): GModelElement | undefined {
        return this.getIterable(current, previousCurrent, predicate);
    }

    process(
        root: Readonly<GModelRoot>,
        current: SelectableBoundsAware,
        target: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: GModelElement) => boolean
    ): void {
        let elements: GModelElement[] = [];

        // Mark only edges
        if (target instanceof GEdge) {
            // If current is a edge, we have to check the source and target
            if (current instanceof GEdge) {
                elements = this.getIterables(target, current.source === target.source ? current.source : current.target, predicate);
            } else {
                // Otherwise take the current as it is
                elements = this.getIterables(target, current, predicate);
            }
        }
        elements.filter(e => e.id !== target.id).forEach(e => this.actionDispatcher.dispatch(applyCssClasses(e, this.navigableElementCSS)));
    }

    clean(root: Readonly<GModelRoot>, current?: SelectableBoundsAware, previousCurrent?: SelectableBoundsAware): void {
        root.index.all().forEach(e => this.actionDispatcher.dispatch(deleteCssClasses(e, this.navigableElementCSS)));
    }

    protected getIterables(
        current: SelectableBoundsAware,
        previousCurrent?: BoundsAwareModelElement,
        predicate: (element: GModelElement) => boolean = () => true
    ): GModelElement[] {
        const elements: GModelElement[] = [];

        if (current instanceof GEdge) {
            if (current.target === previousCurrent) {
                current.target?.incomingEdges.forEach(e => elements.push(e));
            } else {
                current.source?.outgoingEdges.forEach(e => elements.push(e));
            }
        }

        return elements.filter(predicate);
    }

    protected getIterable(
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate: (element: GModelElement) => boolean = () => true
    ): GModelElement | undefined {
        return this.getIterables(current, previousCurrent, predicate).filter(e => e.id !== current.id)[0];
    }
    protected getNextElement(
        current: SelectableBoundsAware,
        predicate: (element: GModelElement) => boolean = () => true
    ): GModelElement | undefined {
        const elements: GModelElement[] = [];

        if (current instanceof GConnectableElement) {
            current.outgoingEdges.forEach(e => elements.push(e));
        } else if (current instanceof GEdge) {
            const target = current.target as GModelElement;
            elements.push(target);
        }

        return elements.filter(predicate)[0];
    }

    protected getPreviousElement(
        current: SelectableBoundsAware,
        predicate: (element: GModelElement) => boolean = () => true
    ): GModelElement | undefined {
        const elements: GModelElement[] = [];

        if (current instanceof GConnectableElement) {
            current.incomingEdges.forEach(e => elements.push(e));
        } else if (current instanceof GEdge) {
            const source = current.source as GModelElement;
            elements.push(source);
        }

        return elements.filter(predicate)[0];
    }
}
