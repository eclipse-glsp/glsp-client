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
import { hasStringProp } from '../utils/type-util';
import { Action } from './base-protocol';

/**
 * This action is typically sent by the server to signal a state change.
 * If a timeout is given the respective status should disappear after the timeout is reached.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ServerStatusActions`.
 */
export interface ServerStatusAction extends Action {
    /**
     * The unique action kind.
     */
    kind: typeof ServerStatusAction.KIND;
    /**
     * The severity of the status.
     */
    severity: ServerSeverity;

    /**
     * The message describing the status.
     */
    message: string;

    /**
     * Timeout after which a displayed status disappears..
     */
    timeout?: number;
}

export namespace ServerStatusAction {
    export const KIND = 'serverStatus';

    export function is(object: any): object is ServerStatusAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'severity') && hasStringProp(object, 'message');
    }

    export function create(message: string, options: { severity?: ServerSeverity; timeout?: number } = {}): ServerStatusAction {
        return {
            kind: KIND,
            severity: 'INFO',
            message,
            ...options
        };
    }
}

/**
 * The possible server status severity levels.
 */

export type ServerSeverity = 'NONE' | 'INFO' | 'WARNING' | 'ERROR' | 'FATAL' | 'OK';

/**
 * This action is sent by the server to notify the user about something of interest. Typically this message is handled by
 * the client by prompting a message with the application's message service.
 * If a timeout is given the respective message should disappear after the timeout is reached.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ServerMessageActions`.
 */
export interface ServerMessageAction extends Action {
    /**
     * The unique action kind.
     */
    kind: typeof ServerMessageAction.KIND;

    /**
     * The severity of the message.
     */
    severity: ServerSeverity;

    /**
     * The message text.
     */
    message: string;

    /**
     * Further details on the message.
     */
    details?: string;

    /**
     * Timeout after which a displayed message disappears.
     */
    timeout?: number;
}

export namespace ServerMessageAction {
    export const KIND = 'serverMessage';

    export function is(object: any): object is ServerMessageAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'message') && hasStringProp(object, 'severity');
    }

    export function create(
        message: string,
        options: {
            severity?: ServerSeverity;
            details?: string;
            timeout?: number;
        } = {}
    ): ServerMessageAction {
        return {
            kind: KIND,
            message,
            severity: 'INFO',
            ...options
        };
    }
}
