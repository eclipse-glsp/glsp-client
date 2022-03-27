/********************************************************************************
 * Copyright (c) 2021-2022 STMicroelectronics and others.
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
import * as sprotty from 'sprotty-protocol/lib/actions';
import { hasArrayProp, hasObjectProp } from '../utils/type-util';
import { Action, Operation, RequestAction, ResponseAction } from './base-protocol';
import { SModelRootSchema } from './model-structure';
import { ElementAndAlignment, ElementAndBounds } from './types';

/** Sent from the server to the client to request bounds for the given model. The model is rendered invisibly so the bounds can
 * derived from the DOM. The response is a ComputedBoundsAction. This hidden rendering round-trip is necessary if the client is responsible
 * for parts of the layout.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestBoundsActions`.
 */
export interface RequestBoundsAction extends RequestAction<ComputedBoundsAction>, sprotty.RequestBoundsAction {
    /**
     * The unique action kind.
     */
    kind: typeof RequestBoundsAction.KIND;

    /**
     * The model elements to consider to compute the new bounds.
     */
    newRoot: SModelRootSchema;
}

export namespace RequestBoundsAction {
    export const KIND = 'requestBounds';

    export function is(object: any): object is RequestBoundsAction {
        return RequestAction.hasKind(object, KIND) && hasObjectProp(object, 'newRoot');
    }

    export function create(newRoot: SModelRootSchema, options: { requestId?: string } = {}): RequestBoundsAction {
        return {
            kind: KIND,
            requestId: '',
            newRoot,
            ...options
        };
    }
}

/**
 * Sent from the client to the server to transmit the result of bounds computation as a response to a {@link RequestBoundsAction}.
 * If the server is responsible for parts of the layout, it can do so after applying the computed bounds received with this action.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ComputedBoundsActions`.
 */
export interface ComputedBoundsAction extends ResponseAction, sprotty.ComputedBoundsAction {
    /**
     * The unique action kind.
     */
    kind: typeof ComputedBoundsAction.KIND;
    /**
     * The new bounds of the model elements.
     */
    bounds: ElementAndBounds[];

    /*
     * The revision number.
     */
    revision?: number;

    /**
     * The new alignment of the model elements.
     */
    alignments?: ElementAndAlignment[];
}

export namespace ComputedBoundsAction {
    export const KIND = 'computedBounds';

    export function is(object: any): object is ComputedBoundsAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'bounds');
    }

    export function create(
        bounds: ElementAndBounds[],
        options: {
            revision?: number;
            responseId?: string;
            alignments?: ElementAndAlignment[];
        } = {}
    ): ComputedBoundsAction {
        return {
            kind: KIND,
            responseId: '',
            bounds,
            ...options
        };
    }
}

/**
 * Request a layout of the diagram or the selected elements only.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `LayoutOperations`.
 */
export interface LayoutOperation extends Operation, Omit<sprotty.LayoutAction, 'layoutType'> {
    /**
     * The unique action kind.
     */
    kind: typeof LayoutOperation.KIND;

    /**
     * The identifiers of the elements that should be layouted, may be just the root element.
     */
    elementIds: string[];
}

export namespace LayoutOperation {
    export const KIND = 'layout';

    export function is(object: any): object is LayoutOperation {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'elementIds');
    }

    export function create(elementIds: string[]): LayoutOperation {
        return {
            kind: KIND,
            isOperation: true,
            elementIds
        };
    }
}
