/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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

import { AnyObject, hasNumberProp } from '@eclipse-glsp/sprotty';

/**
 * A common interface for objects that can be orderable by a priority.
 */
export interface Prioritized {
    priority: number;
}

export namespace Prioritized {
    export const DEFAULT_PRIORITY = 0;
    export function is(object: unknown): object is Prioritized {
        return AnyObject.is(object) && hasNumberProp(object, 'priority');
    }

    /**
     * Tries to retrieve the priority form the given object. If the object
     * implements the {@link Prioritized} interface the corresponding rank is returned
     * otherwise the {@link DEFAULT_RANK} is returned.
     * @param object
     */
    export function getPriority(object: unknown): number {
        return is(object) ? object.priority : DEFAULT_PRIORITY;
    }

    /** Sort function for lowest priority first. */
    export const sortAsc = (left: unknown, right: unknown): number => getPriority(left) - getPriority(right);

    /** Sort function for highest priority first. */
    export const sortDesc = (left: unknown, right: unknown): number => getPriority(right) - getPriority(left);

    /** Default sort function for priority: Highest priority first */
    export const sort = sortDesc;
}
