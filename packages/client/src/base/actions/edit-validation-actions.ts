/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { Action, generateRequestId, RequestAction, ResponseAction } from "sprotty";

import { Args } from "../args";

export class RequestEditValidationAction implements RequestAction<SetEditValidationResultAction> {
    static readonly KIND = "requestEditValidation";
    constructor(
        public readonly contextId: string,
        public readonly modelElementId: string,
        public readonly text: string,
        public readonly requestId: string = generateRequestId(),
        public readonly kind: string = RequestEditValidationAction.KIND) { }
}

export class SetEditValidationResultAction implements ResponseAction {
    static readonly KIND = "setEditValidationResult";
    constructor(
        public readonly status: ValidationStatus,
        public readonly responseId: string = '',
        public readonly args?: Args,
        public readonly kind: string = SetEditValidationResultAction.KIND) { }
}

export function isSetEditValidationResultAction(action: Action): action is SetEditValidationResultAction {
    return action !== undefined && (action.kind === SetEditValidationResultAction.KIND)
        && (<SetEditValidationResultAction>action).status !== undefined;
}

export interface ValidationStatus {
    readonly severity: ValidationStatus.Severity;
    readonly message: string;
    readonly error: ResponseError;
}

export interface ResponseError {
    readonly code: number;
    readonly message: string;
    readonly data: Object;
}

export namespace ValidationStatus {

    export enum Severity {
        FATAL, ERROR, WARNING, INFO, OK, NONE
    }

    export const NONE: ValidationStatus = {
        severity: Severity.NONE, message: '', error: { code: -1, message: '', data: {} }
    };

    export function isOk(validationStatus: ValidationStatus): boolean {
        return validationStatus.severity === Severity.OK
            || validationStatus.severity === Severity.INFO
            || validationStatus.severity === Severity.NONE;
    }

    export function isWarning(validationStatus: ValidationStatus): boolean {
        return validationStatus.severity === Severity.WARNING;
    }

    export function isError(validationStatus: ValidationStatus): boolean {
        return validationStatus.severity === Severity.ERROR
            || validationStatus.severity === Severity.FATAL;
    }
}
