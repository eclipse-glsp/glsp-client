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
import * as sprotty from 'sprotty-protocol/lib/actions';
import { AnyObject, TypeGuard, hasArrayProp, hasStringProp } from '../utils/type-util';
import { Args } from './types';

/**
 * An action is a declarative description of a behavior that shall be invoked by the receiver upon receipt of the action.
 * It is a plain data structure, and as such transferable between server and client. An action must never contain actual
 * SModelElement instances, but either refer to them via their ids or contain serializable schema for model elements.
 * Additional typeguard functions are provided via the corresponding namespace.
 */
export interface Action extends sprotty.Action {
    /**
     * Unique identifier specifying the kind of action to process.
     */
    kind: string;
}

export namespace Action {
    export function is(object: any): object is Action {
        return AnyObject.is(object) && hasStringProp(object, 'kind');
    }
    /**
     * Typeguard function to check wether the given object is an {@link Action} with the given `kind`.
     * @param object The object to check.
     * @param kind  The expected action kind.
     * @returns A type literal indicating wether the given object is an action with the given kind.
     */
    export function hasKind(object: any, kind: string): object is Action {
        return Action.is(object) && object.kind === kind;
    }
}

/**
 * A general message serves as an envelope carrying an action to be transmitted between the client and the server via a DiagramServer.
 * @typeParam A the {@link Action} type that is contained by this message.
 * A typeguard function is provided via the corresponding namespace.
 */
export interface ActionMessage<A extends Action = Action> extends sprotty.ActionMessage {
    /**
     * The unique client id
     *  */
    clientId: string;

    /**
     * The action to execute.
     */
    action: A;
}

export namespace ActionMessage {
    export function is<A extends Action>(object: any, typeguard?: TypeGuard<A>): object is ActionMessage<A> {
        const actionGuard = typeguard ?? Action.is;
        return AnyObject.is(object) && hasStringProp(object, 'clientId') && 'action' in object && actionGuard(object.action);
    }
}

/**
 * A request action is tied to the expectation of receiving a corresponding response action. The requestId property is used to match the
 * received response with the original request. Typically its not necessary to create an explicit requestId. The requestId can be set
 * to an empty string. The action dispatcher than auto generates an request id if needed (i.e. the action was dispatched as request).
 *

 * A typeguard function, and a generic helper function to generate a request id are provided via the corresponding namespace.
 */
export interface RequestAction<Res extends ResponseAction> extends Action, sprotty.RequestAction<Res> {
    /**
     * Unique id for this request. In order to match a response to this request, the response needs to have the same id.
     */
    requestId: string;
    /**
     * Used to ensure correct typing. Clients must not use this property
     */
    readonly _?: Res;
}

export namespace RequestAction {
    export function is(object: any): object is RequestAction<ResponseAction> {
        return Action.is(object) && hasStringProp(object, 'requestId');
    }

    /**
     * Typeguard function to check wether the given object is an {@link RequestAction} with the given `kind`.
     * @param object The object to check.
     * @param kind  The expected action kind.
     * @returns A type literal indicating wether the given object is a request action with the given kind.
     */
    export function hasKind(object: any, kind: string): object is Action {
        return RequestAction.is(object) && object.kind === kind;
    }

    export function generateRequestId(): string {
        return sprotty.generateRequestId();
    }
}

/**
 * A response action is sent to respond to a request action. The responseId must match the requestId of the preceding request.
 * In case the responseId is empty, the action is handled as standalone, i.e. it was fired without a preceding request.
 * The action dispatcher of the GLSP server has a special handling for {@link RequestAction} handlers
 * and automatically sets the `responseId` of the corresponding responseAction. So on the server side its typically enough
 * to set the `responseId` to an empty string and rely on the `ActionDispatcher` for assigning the correct `responseId.
 * Additional typeguard functions are provided via the corresponding namespace.
 */
export interface ResponseAction extends Action, sprotty.ResponseAction {
    /**
     * Id corresponding to the request this action responds to.
     */
    responseId: string;
}

export namespace ResponseAction {
    export function is(object: any): object is ResponseAction {
        return Action.is(object) && hasStringProp(object, 'responseId');
    }

    /**
     * Typeguard function to check wether the given object is an {@link ResponseAction} with a non-empty response id.
     * @param object The object to check.
     * @returns A type literal indicating wether the given object is a response action with a non-empty response id.
     */
    export function hasValidResponseId(object: any): object is ResponseAction {
        return ResponseAction.is(object) && object.responseId !== '';
    }
}

/**
 * A reject action is a {@link ResponseAction} fired to indicate that a certain {@link ResponseAction}
 * has been rejected.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RejectActions`.
 */
export interface RejectAction extends ResponseAction, sprotty.RejectAction {
    kind: typeof RejectAction.KIND;
    /**
     * A human-readable description of the reject reason. Typically this is an error message
     * that has been thrown when handling the corresponding {@link RequestAction}.
     */
    message: string;
    /**
     * Optional additional details.
     */
    detail?: string;
}

export namespace RejectAction {
    export const KIND = 'rejectRequest';

    export function is(object: unknown): object is RejectAction {
        return Action.hasKind(object, RejectAction.KIND) && hasStringProp(object, 'message');
    }

    export function create(message: string, options: { detail?: string; responseId?: string } = {}): RejectAction {
        return {
            kind: KIND,
            responseId: '',
            message,
            ...options
        };
    }
}

/**
 * Operations are actions that denote requests from the client to _modify_ the model. Model modifications are always performed by the
 * server. After a successful modification, the server sends the updated model back to the client using the `UpdateModelAction`.
 * An operation contains a dedicated `isOperation` property that is used as a discriminator. This is necessary so that the server
 * can distinguish between plain actions and operations.
 * The corresponding namespace offers a helper function for type guard checks.
 */
export interface Operation extends Action {
    /**
     * Discriminator property to make operations distinguishable from plain {@link Action}s.
     */
    isOperation: true;

    /**
     * Optional custom arguments.
     */
    args?: Args;
}

export namespace Operation {
    export function is(object: unknown): object is Operation {
        return Action.is(object) && 'isOperation' in object && object.isOperation === true;
    }

    /**
     * Typeguard function to check wether the given object is an {@link Operation} with the given `kind`.
     * @param object The object to check.
     * @param kind  The expected operation kind.
     * @returns A type literal indicating wether the given object is an operation with the given kind.
     */
    export function hasKind(object: unknown, kind: string): object is Operation {
        return Operation.is(object) && object.kind === kind;
    }
}

/**
 * An operation that executes a list of sub-operations.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `CompoundOperations`.
 */
export interface CompoundOperation extends Operation {
    kind: typeof CompoundOperation.KIND;
    /**
     * List of operations that should be executed.
     */
    operationList: Operation[];
}

export namespace CompoundOperation {
    export const KIND = 'compound';

    export function is(object: unknown): object is CompoundOperation {
        return Operation.hasKind(object, KIND) && hasArrayProp(object, 'operationList');
    }

    export function create(operationList: Operation[], options: { args?: Args } = {}): CompoundOperation {
        return {
            kind: KIND,
            isOperation: true,
            operationList,
            ...options
        };
    }
}
