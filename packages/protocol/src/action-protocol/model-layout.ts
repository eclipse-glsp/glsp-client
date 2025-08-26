/********************************************************************************
 * Copyright (c) 2021-2025 STMicroelectronics and others.
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
import { Bounds, Viewport } from 'sprotty-protocol';
import * as sprotty from 'sprotty-protocol/lib/actions';
import { GModelRootSchema } from '../model/model-schema';
import { hasArrayProp, hasObjectProp } from '../utils/type-util';
import { Action, Operation, RequestAction, ResponseAction } from './base-protocol';
import { Args, ElementAndAlignment, ElementAndBounds, ElementAndLayoutData, ElementAndRoutingPoints } from './types';

/**
 * Sent from the server to the client to request bounds for the given model. The model is rendered invisibly so the bounds can
 * derived from the DOM. The response is a ComputedBoundsAction. This hidden rendering round-trip is necessary if the client is responsible
 * for parts of the layout.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestBoundsActions`.
 */
export interface RequestBoundsAction extends RequestAction<ComputedBoundsAction>, Omit<sprotty.RequestBoundsAction, '_'> {
    kind: typeof RequestBoundsAction.KIND;

    /**
     * The model root element for which to compute the bounds.
     */
    newRoot: GModelRootSchema;
}

export namespace RequestBoundsAction {
    export const KIND = 'requestBounds';

    export function is(object: unknown): object is RequestBoundsAction {
        return RequestAction.hasKind(object, KIND) && hasObjectProp(object, 'newRoot');
    }

    export function create(newRoot: GModelRootSchema, options: { requestId?: string } = {}): RequestBoundsAction {
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

    /**
     * The route of the model elements.
     */
    routes?: ElementAndRoutingPoints[];

    /**
     * The layout data of hte model elements.
     */
    layoutData?: ElementAndLayoutData[];
}

export namespace ComputedBoundsAction {
    export const KIND = 'computedBounds';

    export function is(object: unknown): object is ComputedBoundsAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'bounds');
    }

    export function create(
        bounds: ElementAndBounds[],
        options: {
            revision?: number;
            responseId?: string;
            alignments?: ElementAndAlignment[];
            routes?: ElementAndRoutingPoints[];
            layoutData?: ElementAndLayoutData[];
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
    kind: typeof LayoutOperation.KIND;

    /**
     * The identifiers of the elements that should be layouted, will default to the root element if not defined.
     */
    elementIds?: string[];

    /**
     * The current bounds of the canvas at time of layout.
     */
    canvasBounds?: Bounds;

    /**
     * The current viewport information at time of layout.
     */
    viewport?: Viewport;
}

export namespace LayoutOperation {
    export const KIND = 'layout';

    export function is(object: unknown): object is LayoutOperation {
        return Action.hasKind(object, KIND);
    }

    export function create(
        elementIds?: string[],
        options: { args?: Args; canvasBounds?: Bounds; viewport?: Viewport } = {}
    ): LayoutOperation {
        return {
            kind: KIND,
            isOperation: true,
            elementIds,
            ...options
        };
    }
}

/**
 * Trigger a layout of the diagram or the selected elements only.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `TriggerLayoutActions`.
 */
export interface TriggerLayoutAction extends Action {
    kind: typeof TriggerLayoutAction.KIND;
    /**
     * Custom arguments that may be interpreted by the client.
     */
    args?: Args;
}

export namespace TriggerLayoutAction {
    export const KIND = 'triggerLayout';

    export function is(action: unknown): action is TriggerLayoutAction {
        return Action.hasKind(action, KIND);
    }

    export function create(options: { args?: Args } = {}): TriggerLayoutAction {
        return {
            kind: KIND,
            ...options
        };
    }
}
