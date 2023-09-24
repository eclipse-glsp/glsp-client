/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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

import { SModelElement } from 'sprotty-protocol';
import { SModelElementSchema } from '.';
import { hasArrayProp, hasBooleanProp, hasStringProp } from '../utils/type-util';
import { Action, RequestAction, ResponseAction } from './base-protocol';

/**
 * Type hints are used to define what modifications are supported on the different element types.
 * The rationale is to avoid a client-server round-trip for user feedback of each synchronous user interaction.
 */
export interface TypeHint {
    /**
     * The id of the element.
     */
    readonly elementTypeId: string;

    /**
     * Specifies whether the element can be relocated.
     */
    readonly repositionable: boolean;

    /**
     * Specifies whether the element can be deleted
     */
    readonly deletable: boolean;
}

/**
 * A {@link TypeHint} with additional modification properties for shape elements.
 */
export interface ShapeTypeHint extends TypeHint {
    /**
     * Specifies whether the element can be resized.
     */
    readonly resizable: boolean;

    /**
     * Specifies whether the element can be moved to another parent
     */
    readonly reparentable: boolean;

    /**
     * The types of elements that can be contained by this element (if any)
     */
    readonly containableElementTypeIds?: string[];
}

/**
 * A {@link TypeHint} with additional modification properties for edge elements.
 */
export interface EdgeTypeHint extends TypeHint {
    /**
     * Specifies whether the routing points of the edge can be changed
     * i.e. edited by the user.
     */
    readonly routable: boolean;

    /**
     * Allowed source element types for this edge type.
     * If not defined any element can be used as source element for this edge.
     */
    readonly sourceElementTypeIds?: string[];

    /**
     * Allowed target element types for this edge type
     *  If not defined any element can be used as target element for this edge.
     */
    readonly targetElementTypeIds?: string[];

    /**
     * Indicates whether this type hint is dynamic or not. Dynamic edge type hints
     * require an additional runtime check before creating an edge, when checking
     * source and target element types is not sufficient.
     *
     * @see {@link RequestCheckEdgeAction}
     */
    readonly dynamic?: boolean;
}

/**
 * Sent from the client to the server in order to request hints on whether certain modifications are allowed for a specific element type.
 * The `RequestTypeHintsAction` is optional, but should usually be among the first messages sent from the client to the server after
 * receiving the model via `RequestModelAction`. The response is a {@link SetTypeHintsAction}.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestTypeHintsActions`.
 */
export interface RequestTypeHintsAction extends RequestAction<SetTypeHintsAction> {
    kind: typeof RequestTypeHintsAction.KIND;
}

export namespace RequestTypeHintsAction {
    export const KIND = 'requestTypeHints';

    export function is(object: any): object is RequestTypeHintsAction {
        return RequestAction.hasKind(object, KIND);
    }

    export function create(options: { requestId?: string } = {}): RequestTypeHintsAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/**
 * Sent from the server to the client in order to provide hints certain modifications are allowed for a specific element type.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetTypeHintsActions`.
 */
export interface SetTypeHintsAction extends ResponseAction {
    kind: typeof SetTypeHintsAction.KIND;

    shapeHints: ShapeTypeHint[];

    edgeHints: EdgeTypeHint[];
}

export namespace SetTypeHintsAction {
    export const KIND = 'setTypeHints';

    export function is(object: any): object is SetTypeHintsAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'shapeHints') && hasArrayProp(object, 'edgeHints');
    }

    export function create(options: { shapeHints: ShapeTypeHint[]; edgeHints: EdgeTypeHint[]; responseId?: string }): SetTypeHintsAction {
        return {
            kind: KIND,
            responseId: '',
            ...options
        };
    }
}

/**
 * Send a Request to the server to check if an element is a valid target
 * when creating a new Edge. Typically dispatched twice, once for checking
 * the source element (with a dynamic hint) and a second time when trying to connect to a
 * target (with a dynamic hint).
 */
export interface RequestCheckEdgeAction extends RequestAction<CheckEdgeResultAction> {
    kind: typeof RequestCheckEdgeAction.KIND;

    /**
     * The element type of the edge being created.
     */
    edgeType: string;

    /**
     * The ID of the edge source element.
     */
    sourceElementId: string;

    /**
     * The ID of the edge target element to check.
     */
    targetElementId?: string;
}

export namespace RequestCheckEdgeAction {
    export const KIND = 'requestCheckEdge';

    export function is(object: unknown): object is RequestCheckEdgeAction {
        return (
            Action.hasKind(object, KIND) &&
            hasStringProp(object, 'edgeType') &&
            hasStringProp(object, 'sourceElementId') &&
            hasStringProp(object, 'targetElementId', true)
        );
    }

    export function create(options: {
        sourceElement: SModelElement | SModelElementSchema | string;
        targetElement?: SModelElement | SModelElementSchema | string;
        edgeType: string;
        requestId?: string;
    }): RequestCheckEdgeAction {
        return {
            kind: KIND,
            edgeType: options.edgeType,
            sourceElementId: getElementId(options.sourceElement),
            targetElementId: options.targetElement ? getElementId(options.targetElement) : undefined,
            requestId: options.requestId ?? ''
        };
    }
}

function getElementId(element: SModelElement | string): string {
    if (typeof element === 'string') {
        return element;
    }
    return element.id;
}

/**
 * Response Action for a {@link RequestCheckEdgeAction}. It provides
 * a boolean indicating whether the requested element is a valid target
 * for the edge being created and the context edge context information (type, source, target).
 */
export interface CheckEdgeResultAction extends ResponseAction {
    kind: typeof CheckEdgeResultAction.KIND;

    /**
     * true if the selected element is a valid target for this edge,
     * false otherwise.
     */
    isValid: boolean;
    /**
     * The element type of the edge that has been checked.
     */
    edgeType: string;

    /**
     * The ID of the source element of the edge that has been checked.
     */
    sourceElementId: string;
    /**
     * The ID of the target element of the edge that has been checked.
     */
    targetElementId?: string;
}

export namespace CheckEdgeResultAction {
    export const KIND = 'checkEdgeTargetResult';

    export function is(object: unknown): object is CheckEdgeResultAction {
        return (
            Action.hasKind(object, KIND) &&
            hasBooleanProp(object, 'isValid') &&
            hasStringProp(object, 'edgeType') &&
            hasStringProp(object, 'sourceElementId') &&
            hasStringProp(object, 'targetElementId', true)
        );
    }

    export function create(options: {
        isValid: boolean;
        edgeType: string;
        sourceElementId: string;
        targetElementId?: string;
        responseId?: string;
    }): CheckEdgeResultAction {
        return {
            kind: KIND,
            responseId: '',
            ...options
        };
    }
}
