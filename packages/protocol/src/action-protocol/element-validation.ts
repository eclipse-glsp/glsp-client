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
import { ProposalString, hasArrayProp } from '../utils/type-util';
import { Action, RequestAction, ResponseAction } from './base-protocol';

/**
 * Validation in GLSP is performed by using validation markers. A marker represents the validation result for a single model element
 */
export interface Marker {
    /**
     * Short label describing this marker message, e.g., short validation message
     */
    readonly label: string;
    /**
     * Full description of this marker, e.g., full validation message
     */
    readonly description: string;
    /**
     * Id of the model element this marker refers to
     */
    readonly elementId: string;
    /**
     * Marker kind, e.g., info, warning, error or custom kind
     */
    readonly kind: string;
}

/**
 * The default marker kinds used in GLSP
 */
export namespace MarkerKind {
    export const INFO = 'info';
    export const WARNING = 'warning';
    export const ERROR = 'error';
}

/**
 * Utility type for the reason of markers, which offers the default values `batch` and `live` as
 * proposals. Any other string value can be used as custom reason as well.
 */
export type MarkersReason = ProposalString<(typeof MarkersReason)[keyof typeof MarkersReason]>;
export const MarkersReason = {
    /** Markers resulting from a batch validation */
    BATCH: 'batch',
    /** Markers resulting from a live validation */
    LIVE: 'live'
} as const;

/**
 * Action to retrieve markers for the specified model elements. Sent from the client to the server.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestMarkersActions`.
 */
export interface RequestMarkersAction extends RequestAction<SetMarkersAction> {
    kind: typeof RequestMarkersAction.KIND;

    /**
     * The elements for which markers are requested, may be just the root element.
     */
    elementsIDs: string[];

    /**
     * The reason for this request.
     * Default values are `batch` and `live`, but custom reasons can be used as well.
     * If not specified, the default value is `batch`.
     */
    reason?: string;
}

export namespace RequestMarkersAction {
    export const KIND = 'requestMarkers';

    export function is(object: unknown): object is RequestMarkersAction {
        return RequestAction.hasKind(object, KIND) && hasArrayProp(object, 'elementsIDs');
    }

    export function create<R extends MarkersReason>(
        elementsIDs: string[],
        options: { requestId?: string; reason?: R } = {}
    ): RequestMarkersAction {
        return {
            kind: KIND,
            requestId: '',
            elementsIDs,
            reason: MarkersReason.BATCH,
            ...options
        };
    }
}

/**
 * Instructs the client to add markers to the diagram.
 * Typically, this is a response to the {@link RequestMarkersAction} containing all validation markers, but can be sent by the server at
 * unknown time.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetMarkersActions`.
 */
export interface SetMarkersAction extends ResponseAction {
    kind: typeof SetMarkersAction.KIND;

    /**
     * The list of markers to be added to the diagram.
     */
    readonly markers: Marker[];

    /**
     * The reason for message, such as `batch` or `live` validation.
     */
    reason?: MarkersReason;
}

export namespace SetMarkersAction {
    export const KIND = 'setMarkers';

    export function is(object: unknown): object is SetMarkersAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'markers');
    }

    export function create<R extends MarkersReason>(
        markers: Marker[],
        options: { responseId?: string; reason?: R } = {}
    ): SetMarkersAction {
        return {
            kind: KIND,
            responseId: '',
            markers,
            reason: MarkersReason.BATCH,
            ...options
        };
    }
}

/**
 * Action for clearing makers of a model
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `DeleteMarkersActions`. Can be sent by either the client or the server.
 */
export interface DeleteMarkersAction extends Action {
    kind: typeof DeleteMarkersAction.KIND;

    /**
     * The list of markers that has been requested by the `RequestMarkersAction`.
     */
    markers: Marker[];
}

export namespace DeleteMarkersAction {
    export const KIND = 'deleteMarkers';

    export function is(object: unknown): object is DeleteMarkersAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'markers');
    }

    export function create(markers: Marker[]): DeleteMarkersAction {
        return {
            kind: KIND,
            markers
        };
    }
}
