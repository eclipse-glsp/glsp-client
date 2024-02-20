/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { hasObjectProp, hasStringProp } from '../utils/type-util';
import { Action, Operation, RequestAction, ResponseAction } from './base-protocol';
import { Args } from './types';

/**
 * Requests the validation of the given text in the context of the provided model element. Typically sent from the client to the server.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `NewActions`.
 */
export interface RequestEditValidationAction extends RequestAction<SetEditValidationResultAction> {
    kind: typeof RequestEditValidationAction.KIND;

    /**
     * Context in which the text is validated, e.g., 'label-edit'.
     */
    contextId: string;

    /**
     * Model element that is being edited.
     */
    modelElementId: string;

    /**
     * Text that should be validated for the given context and the model element.
     */
    text: string;
}

export namespace RequestEditValidationAction {
    export const KIND = 'requestEditValidation';

    export function is(object: unknown): object is RequestEditValidationAction {
        return (
            RequestAction.hasKind(object, KIND) &&
            hasStringProp(object, 'contextId') &&
            hasStringProp(object, 'modelElementId') &&
            hasStringProp(object, 'text')
        );
    }

    export function create(options: {
        contextId: string;
        modelElementId: string;
        text: string;
        requestId?: string;
    }): RequestEditValidationAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/**
 * Response to a {@link RequestEditValidationAction} containing the validation result for applying a text on a certain model element.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetEditValidationResultActions`.
 */
export interface SetEditValidationResultAction extends ResponseAction {
    kind: typeof SetEditValidationResultAction.KIND;

    status: ValidationStatus;

    /*
     * Additional arguments for custom behavior.
     */
    args?: Args;
}

export namespace SetEditValidationResultAction {
    export const KIND = 'setEditValidationResult';

    export function is(object: unknown): object is SetEditValidationResultAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'status');
    }

    export function create(status: ValidationStatus, options: { args?: Args; responseId?: string } = {}): SetEditValidationResultAction {
        return {
            kind: KIND,
            responseId: '',
            status,
            ...options
        };
    }
}

/**
 * A very common use case in domain models is the support of labels that display textual information to the user.
 * To apply new text to such a label element the client may send an ApplyLabelEditOperation to the server. Typically this is
 * done by the client after it has received a error free validation result via {@link SetEditValidationResultAction} from the server.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ApplyLabelEditOperations`.
 */
export interface ApplyLabelEditOperation extends Operation, sprotty.ApplyLabelEditAction {
    kind: typeof ApplyLabelEditOperation.KIND;

    /**
     * Identifier of the label model element.
     */
    labelId: string;

    /**
     * Text that should be applied on the label.
     */
    text: string;
}

export namespace ApplyLabelEditOperation {
    export const KIND = 'applyLabelEdit';

    export function is(object: unknown): object is ApplyLabelEditOperation {
        return Operation.hasKind(object, KIND) && hasStringProp(object, 'labelId') && hasStringProp(object, 'text');
    }

    export function create(options: { labelId: string; text: string; args?: Args }): ApplyLabelEditOperation {
        return {
            kind: KIND,
            isOperation: true,
            ...options
        };
    }
}

/**
 * The serializable result of an an validation request.
 * Tje corresponding namespace offers the default severity values
 * and other utility functions.
 */
export interface ValidationStatus {
    /**
     * The severity of the validation returned by the server.
     */
    readonly severity: ValidationStatus.Severity;

    /**
     * The validation status message which may be rendered in the view.
     */
    readonly message?: string;

    /**
     * A potential error that encodes more details.
     */
    readonly error?: ResponseError;
}

export namespace ValidationStatus {
    /**
     * The default {@link ValidationStatus} severity levels used in GLSP.
     */
    export enum Severity {
        FATAL,
        ERROR,
        WARNING,
        INFO,
        OK,
        NONE
    }

    /**
     * An empty {@link ValidationStatus}.
     */
    export const NONE: ValidationStatus = {
        severity: Severity.NONE,
        message: '',
        error: { code: -1, message: '', data: {} }
    };

    /**
     * Utility function to check wether the given {@link ValidationStatus} has
     * a severity that is considered to be OK.
     * @param validationStatus The validation status to check.
     * @returns `true` if the given status has a non critical severity, `false` otherwise.
     */
    export function isOk(validationStatus: ValidationStatus): boolean {
        return (
            validationStatus.severity === Severity.OK ||
            validationStatus.severity === Severity.INFO ||
            validationStatus.severity === Severity.NONE
        );
    }

    /**
     * Utility function to check wether the given {@link ValidationStatus} has
     * a `warning` severity.
     * @param validationStatus The validation status to check.
     * @returns `true` if the given status has a `warning` severity, `false` otherwise.
     */
    export function isWarning(validationStatus: ValidationStatus): boolean {
        return validationStatus.severity === Severity.WARNING;
    }

    /**
     * Utility function to check wether the given {@link ValidationStatus} has
     * an `error` or `fatal` severity.
     * @param validationStatus The validation status to check.
     * @returns `true` if the given status has a `error` or `fatal` severity, `false` otherwise.
     */
    export function isError(validationStatus: ValidationStatus): boolean {
        return validationStatus.severity === Severity.ERROR || validationStatus.severity === Severity.FATAL;
    }
}

/**
 * The serializable format of an error that occurred during validation.
 */
export interface ResponseError {
    /**
     * Code identifying the error kind.
     */
    readonly code: number;

    /**
     * Error message.
     */
    readonly message: string;

    /**
     * Additional custom data, e.g., a serialized stacktrace.
     */
    readonly data: Record<string, unknown>;
}
