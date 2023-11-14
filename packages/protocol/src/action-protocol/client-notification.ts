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
import { hasStringProp } from '../utils/type-util';
import { Action } from './base-protocol';

/**
 * Sent by the server (or the client) to signal a status change.
 * If a timeout is given the respective status should disappear after the timeout is reached.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `StatusAction`s.
 */
export interface StatusAction extends Action {
    kind: typeof StatusAction.KIND;
    /**
     * The severity of the status.
     */
    severity: SeverityLevel;

    /**
     * The user-facing message describing the status.
     */
    message: string;

    /**
     * Timeout after which a displayed status should disappear.
     */
    timeout?: number;
}

export namespace StatusAction {
    export const KIND = 'status';

    export function is(object: unknown): object is StatusAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'severity') && hasStringProp(object, 'message');
    }

    export function create(message: string, options: { severity?: SeverityLevel; timeout?: number } = {}): StatusAction {
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

export type SeverityLevel = 'NONE' | 'INFO' | 'WARNING' | 'ERROR' | 'FATAL' | 'OK';

/**
 * Sent by the server (or the client) to notify the user about something of interest. Typically this message is handled by
 * the client by showing a message to the user with the application's message service.
 * If a timeout is given the respective message should disappear after the timeout is reached.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `MessageAction`s.
 */
export interface MessageAction extends Action {
    kind: typeof MessageAction.KIND;

    severity: SeverityLevel;

    /**
     * The message that shall be shown to the user.
     */
    message: string;

    /**
     * Further details on the message.
     */
    details?: string;
}

export namespace MessageAction {
    export const KIND = 'message';

    export function is(object: unknown): object is MessageAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'message') && hasStringProp(object, 'severity');
    }

    export function create(
        message: string,
        options: {
            severity?: SeverityLevel;
            details?: string;
        } = {}
    ): MessageAction {
        return {
            kind: KIND,
            message,
            severity: 'INFO',
            ...options
        };
    }
}

/**
 * Sent to request presenting the progress of a long running process in the UI.
 */
export interface StartProgressAction extends Action {
    kind: typeof StartProgressAction.KIND;

    /**
     * An ID that can be used in subsequent `updateProgress` and `endProgress` events to make them refer to the same progress reporting.
     */
    progressId: string;
    /**
     * Short title of the progress reporting. Shown in the UI to describe the long running process.
     */
    title: string;
    /**
     * Optional additional progress message. Shown in the UI to describe the long running process.
     */
    message?: string;
    /**
     * Progress percentage to display (value range: 0 to 100). If omitted no percentage is shown.
     */
    percentage?: number;
}

export namespace StartProgressAction {
    export const KIND = 'startProgress';

    export function is(object: unknown): object is StartProgressAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'progressId') && hasStringProp(object, 'title');
    }

    export function create(options: { progressId: string; title: string; message?: string; percentage?: number }): StartProgressAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

/**
 * Sent to presenting an update of the progress of a long running process in the UI.
 */
export interface UpdateProgressAction extends Action {
    kind: typeof UpdateProgressAction.KIND;

    /**
     * The ID of the progress reporting to update.
     */
    progressId: string;
    /**
     * The message to show in the progress reporting.
     */
    message?: string;
    /**
     * The percentage (value range: 0 to 100) to show in the progress reporting.
     */
    percentage?: number;
}

export namespace UpdateProgressAction {
    export const KIND = 'updateProgress';

    export function is(object: unknown): object is UpdateProgressAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'progressId');
    }

    export function create(
        progressId: string,
        options: {
            message?: string;
            percentage?: number;
        } = {}
    ): UpdateProgressAction {
        return {
            kind: KIND,
            progressId,
            ...options
        };
    }
}

/**
 * Sent to end the reporting of a progress.
 */
export interface EndProgressAction extends Action {
    kind: typeof EndProgressAction.KIND;

    /**
     * The ID of the progress reporting to update.
     */
    progressId: string;
    /**
     * The message to show in the progress reporting.
     */
    message?: string;
}

export namespace EndProgressAction {
    export const KIND = 'endProgress';

    export function is(object: unknown): object is EndProgressAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'progressId');
    }

    export function create(progressId: string, message?: string): EndProgressAction {
        return {
            kind: KIND,
            progressId,
            message
        };
    }
}
