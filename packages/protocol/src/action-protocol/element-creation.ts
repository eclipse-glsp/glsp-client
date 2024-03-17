/********************************************************************************
 * Copyright (c) 2021-2023 STMicroelectronics and others.
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

import { Point } from 'sprotty-protocol';
import * as sprotty from 'sprotty-protocol/lib/actions';
import { hasArrayProp, hasStringProp } from '../utils/type-util';
import { Operation } from './base-protocol';
import { Args } from './types';

/**
 * Common interface for all create {@link Operation}s in GLSP.
 * The corresponding namespace offers a helper function for type guard checks.
 */
export interface CreateOperation extends Operation {
    /**
     * The type of the element that should be created.
     */
    elementTypeId: string;
}

export namespace CreateOperation {
    export function is(object: unknown): object is CreateOperation {
        return Operation.is(object) && hasStringProp(object, 'elementTypeId');
    }

    /**
     * Typeguard function to check wether the given object is a {@link CreateOperation} with the given `kind`.
     * @param object The object to check.
     * @param kind  The expected operation kind.
     * @returns A type literal indicating wether the given object is a create operation with the given kind.
     */
    export function hasKind(object: unknown, kind: string): object is CreateOperation {
        return CreateOperation.is(object) && object.kind === kind;
    }
}

/**
 * In order to create a node in the model the client can send a CreateNodeOperation with the necessary information to create
 * the element that corresponds to that node in the source model.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `CreateNodeOperations`.
 */
export interface CreateNodeOperation extends CreateOperation {
    kind: typeof CreateNodeOperation.KIND;

    /*
     * The location at which the operation shall be executed.
     */
    location?: Point;

    /*
     * The id of container element in which the node should be created. If not defined
     * the root element will be used.
     */
    containerId?: string;
}

export namespace CreateNodeOperation {
    export const KIND = 'createNode';

    export function is(object: unknown): object is CreateNodeOperation {
        return CreateOperation.hasKind(object, KIND);
    }

    export function create(
        elementTypeId: string,
        options: { location?: Point; containerId?: string; args?: Args } = {}
    ): CreateNodeOperation {
        return {
            kind: KIND,
            isOperation: true,
            elementTypeId,
            ...options
        };
    }
}
/**
 * In order to create an edge in the model the client can send a `CreateEdgeOperation` with the necessary information to create
 * the element that corresponds to that edge in the source model.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `CreateEdgeOperations`.
 */
export interface CreateEdgeOperation extends CreateOperation {
    kind: typeof CreateEdgeOperation.KIND;

    sourceElementId: string;

    targetElementId: string;
}

export namespace CreateEdgeOperation {
    export const KIND = 'createEdge';

    export function is(object: unknown): object is CreateEdgeOperation {
        return (
            CreateOperation.hasKind(object, KIND) && hasStringProp(object, 'sourceElementId') && hasStringProp(object, 'targetElementId')
        );
    }

    export function create(options: {
        elementTypeId: string;
        sourceElementId: string;
        targetElementId: string;
        args?: Args;
    }): CreateEdgeOperation {
        return {
            kind: KIND,
            isOperation: true,
            ...options
        };
    }
}
/**
 * The client sends a `DeleteElementOperation` to the server to request the deletion of an element from the source model.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `DeleteElementOperations`.
 */
export interface DeleteElementOperation extends Operation, Omit<sprotty.DeleteElementAction, 'kind'> {
    kind: typeof DeleteElementOperation.KIND;

    /**
     * The ids of the elements to be deleted.
     */
    elementIds: string[];
}

export namespace DeleteElementOperation {
    export const KIND = 'deleteElement';

    export function is(object: unknown): object is DeleteElementOperation {
        return Operation.hasKind(object, KIND) && hasArrayProp(object, 'elementIds');
    }

    export function create(elementIds: string[], options: { args?: Args } = {}): DeleteElementOperation {
        return {
            kind: KIND,
            isOperation: true,
            elementIds,
            ...options
        };
    }
}
