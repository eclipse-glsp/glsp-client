/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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
import { BoundsAware, EdgeRouterRegistry, SConnectableElement, SEdge, SModelElement, SModelRoot, TYPES } from '~glsp-sprotty';
import { ElementNavigator } from './element-navigator';
import { inject, injectable, optional } from 'inversify';
import { GLSPActionDispatcher } from '../../../base/action-dispatcher';
import { applyCssClasses, deleteCssClasses } from '../../../base/feedback/css-feedback';
import { SelectableBoundsAware } from '../../../utils/smodel-util';

@injectable()
export class LocalElementNavigator implements ElementNavigator {
    navigableElementCSS = 'navigable-element';
    @inject(EdgeRouterRegistry) @optional() readonly edgeRouterRegistry?: EdgeRouterRegistry;
    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: GLSPActionDispatcher;

    previous(
        root: Readonly<SModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: SModelElement) => boolean
    ): SModelElement | undefined {
        return this.getPreviousElement(current, predicate);
    }

    next(
        root: Readonly<SModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: SModelElement) => boolean
    ): SModelElement | undefined {
        return this.getNextElement(current, predicate);
    }

    up(
        root: Readonly<SModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: SModelElement) => boolean
    ): SModelElement | undefined {
        return this.getIterable(current, previousCurrent, predicate);
    }

    down(
        root: Readonly<SModelRoot>,
        current: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: SModelElement) => boolean
    ): SModelElement | undefined {
        return this.getIterable(current, previousCurrent, predicate);
    }

    process(
        root: Readonly<SModelRoot>,
        current: SelectableBoundsAware,
        target: SelectableBoundsAware,
        previousCurrent?: SelectableBoundsAware,
        predicate?: (element: SModelElement) => boolean
    ): void {
        let elements: SModelElement[] = [];

        // Mark only edges
        if (target instanceof SEdge) {
            // If current is a edge, we have to check the source and target
            if (current instanceof SEdge) {
                elements = this.getIterables(target, current.source === target.source ? current.source : current.target, predicate);
            } else {
                // Otherwise take the current as it is
                elements = this.getIterables(target, current, predicate);
            }
        }
        elements.filter(e => e.id !== target.id).forEach(e => this.actionDispatcher.dispatch(applyCssClasses(e, this.navigableElementCSS)));
    }

    clean(root: Readonly<SModelRoot>, current?: SelectableBoundsAware, previousCurrent?: SelectableBoundsAware): void {
        root.index.all().forEach(e => this.actionDispatcher.dispatch(deleteCssClasses(e, this.navigableElementCSS)));
    }

    protected getIterables(
        current: SelectableBoundsAware,
        previousCurrent?: SModelElement & BoundsAware,
        predicate: (element: SModelElement) => boolean = () => true
    ): SModelElement[] {
        const elements: SModelElement[] = [];

        if (current instanceof SEdge) {
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
        predicate: (element: SModelElement) => boolean = () => true
    ): SModelElement | undefined {
        return this.getIterables(current, previousCurrent, predicate).filter(e => e.id !== current.id)[0];
    }
    protected getNextElement(
        current: SelectableBoundsAware,
        predicate: (element: SModelElement) => boolean = () => true
    ): SModelElement | undefined {
        const elements: SModelElement[] = [];

        if (current instanceof SConnectableElement) {
            current.outgoingEdges.forEach(e => elements.push(e));
        } else if (current instanceof SEdge) {
            const target = current.target as SModelElement;
            elements.push(target);
        }

        return elements.filter(predicate)[0];
    }

    protected getPreviousElement(
        current: SelectableBoundsAware,
        predicate: (element: SModelElement) => boolean = () => true
    ): SModelElement | undefined {
        const elements: SModelElement[] = [];

        if (current instanceof SConnectableElement) {
            current.incomingEdges.forEach(e => elements.push(e));
        } else if (current instanceof SEdge) {
            const source = current.source as SModelElement;
            elements.push(source);
        }

        return elements.filter(predicate)[0];
    }
}
