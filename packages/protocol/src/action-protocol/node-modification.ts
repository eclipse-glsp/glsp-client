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

import { Point } from 'sprotty-protocol';
import { hasArrayProp, hasStringProp } from '../utils/type-util';
import { Operation } from './base-protocol';
import { Args, ElementAndBounds } from './types';

/**
 * Triggers the position or size change of elements. This action concerns only the element's graphical size and position.
 * Whether an element can be resized or repositioned may be specified by the server with a `TypeHint` to allow for immediate user feedback
 * before resizing or repositioning.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ChangeBoundsOperations`.
 */
export interface ChangeBoundsOperation extends Operation {
    kind: typeof ChangeBoundsOperation.KIND;

    newBounds: ElementAndBounds[];
}

export namespace ChangeBoundsOperation {
    export const KIND = 'changeBounds';

    export function is(object: unknown): object is ChangeBoundsOperation {
        return Operation.hasKind(object, KIND) && hasArrayProp(object, 'newBounds');
    }

    export function create(newBounds: ElementAndBounds[]): ChangeBoundsOperation {
        return {
            kind: KIND,
            isOperation: true,
            newBounds
        };
    }
}

/**
 * The client sends a `ChangeContainerOperation` to the server to request the a semantic move i.e. the corresponding element
 * should be moved form its current container to the target container.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ChangeContainerOperations`.
 */
export interface ChangeContainerOperation extends Operation {
    kind: typeof ChangeContainerOperation.KIND;

    /**
     * The element to be changed.
     */
    elementId: string;

    /**
     * The element container of the changeContainer operation.
     */
    targetContainerId: string;

    /**
     * The graphical location.
     */
    location?: Point;
}

export namespace ChangeContainerOperation {
    export const KIND = 'changeContainer';

    export function is(object: unknown): object is ChangeContainerOperation {
        return Operation.hasKind(object, KIND) && hasStringProp(object, 'elementId') && hasStringProp(object, 'targetContainerId');
    }

    export function create(options: {
        elementId: string;
        targetContainerId: string;
        location?: Point;
        args?: Args;
    }): ChangeContainerOperation {
        return {
            kind: KIND,
            isOperation: true,
            ...options
        };
    }
}
