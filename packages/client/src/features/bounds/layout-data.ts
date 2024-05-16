/********************************************************************************
 * Copyright (c) 2024 Axon Ivy AG and others.
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

import { Dimension, LayoutData } from '@eclipse-glsp/sprotty';

export interface LayoutAware {
    layoutData: LayoutData;
}

export namespace LayoutAware {
    export function is<T extends object>(element: T): element is T & LayoutAware {
        return 'layoutData' in element;
    }

    export function getLayoutData<T extends object>(element: T): LayoutData | undefined {
        return is(element) ? element.layoutData : undefined;
    }

    export function setLayoutData<T extends object>(element: T, data: LayoutData): void {
        (element as LayoutAware).layoutData = data;
    }

    export function setComputedDimensions<T extends object>(element: T, computedDimensions: Dimension): void {
        ensureLayoutAware(element).layoutData.computedDimensions = computedDimensions;
    }

    export function getComputedDimensions<T extends object>(element: T): Dimension | undefined {
        return getLayoutData(element)?.computedDimensions;
    }

    function ensureLayoutAware<T extends object>(element: T): T & LayoutAware {
        (element as LayoutAware).layoutData = (element as LayoutAware).layoutData ?? {};
        return element as T & LayoutAware;
    }
}
