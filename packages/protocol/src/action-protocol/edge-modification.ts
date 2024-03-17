/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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

import { hasArrayProp, hasStringProp } from '../utils/type-util';
import { Operation } from './base-protocol';
import { Args, ElementAndRoutingPoints } from './types';

/**
 * If the source and/or target element of an edge should be adapted, the client can send a `ReconnectEdgeOperation` to the server.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ReconnectEdgeOperations`.
 */
export interface ReconnectEdgeOperation extends Operation {
    kind: typeof ReconnectEdgeOperation.KIND;

    /**
     * The edge element that should be reconnected.
     */
    edgeElementId: string;

    /**
     * The (new) source element of the edge.
     */
    sourceElementId: string;

    /**
     * The (new) target element of the edge.
     */
    targetElementId: string;
}

export namespace ReconnectEdgeOperation {
    export const KIND = 'reconnectEdge';

    export function is(object: unknown): object is ReconnectEdgeOperation {
        return (
            Operation.hasKind(object, KIND) &&
            hasStringProp(object, 'edgeElementId') &&
            hasStringProp(object, 'sourceElementId') &&
            hasStringProp(object, 'targetElementId')
        );
    }

    export function create(options: {
        edgeElementId: string;
        sourceElementId: string;
        targetElementId: string;
        args?: Args;
    }): ReconnectEdgeOperation {
        return {
            kind: KIND,
            isOperation: true,
            ...options
        };
    }
}

/**
 * An edge may have zero or more routing points that "re-direct" the edge between the source and the target element. In order to set these
 * routing points the client may send a `ChangeRoutingPointsOperation`.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ChangeRoutingPointsOperations`.
 */
export interface ChangeRoutingPointsOperation extends Operation {
    kind: typeof ChangeRoutingPointsOperation.KIND;

    /**
     * The routing points of the edge (may be empty).
     */
    newRoutingPoints: ElementAndRoutingPoints[];
}

export namespace ChangeRoutingPointsOperation {
    export const KIND = 'changeRoutingPoints';

    export function is(object: unknown): object is ChangeRoutingPointsOperation {
        return Operation.hasKind(object, KIND) && hasArrayProp(object, 'newRoutingPoints');
    }

    export function create(newRoutingPoints: ElementAndRoutingPoints[], options: { args?: Args } = {}): ChangeRoutingPointsOperation {
        return {
            kind: KIND,
            isOperation: true,
            newRoutingPoints,
            ...options
        };
    }
}
