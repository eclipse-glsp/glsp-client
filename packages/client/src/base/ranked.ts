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

import { AnyObject, hasNumberProp } from '@eclipse-glsp/sprotty';

/**
 * A common interface for services/listeners that should be
 * orderable by a type or rank/priority.
 */
export interface Ranked {
    /**
     * A rank implies the position of this element within a sequence of other ranked elements.
     * A lower rank implies a position earlier in the list.
     */
    rank: number;
}

export namespace Ranked {
    export const DEFAULT_RANK = 0;

    export function is(object: unknown): object is Ranked {
        return AnyObject.is(object) && hasNumberProp(object, 'rank');
    }

    /**
     * Tries to retrieve the rank form the given object. If the object
     * implements the {@link Ranked} interface the corresponding rank is returned
     * otherwise the {@link DEFAULT_RANK} is returned.
     * @param object
     */
    export function getRank(object: unknown): number {
        return is(object) ? object.rank : DEFAULT_RANK;
    }

    /** Sort function for lowest rank first. */
    export const sortAsc = (left: unknown, right: unknown): number => getRank(left) - getRank(right);

    /** Sort function for highest rank first. */
    export const sortDesc = (left: unknown, right: unknown): number => getRank(right) - getRank(left);

    /** Default sort function for rank: Lowest rank first */
    export const sort = sortAsc;
}
