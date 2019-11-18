/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable } from "inversify";
import {
    Action,
    EditableLabel,
    EditLabelValidationResult,
    generateRequestId,
    IEditLabelValidationDecorator,
    IEditLabelValidator,
    RequestAction,
    ResponseAction,
    Severity,
    SModelElement,
    TYPES
} from "sprotty";

import { GLSPActionDispatcher } from "../request-response/glsp-action-dispatcher";

export class ValidateLabelEditAction implements RequestAction<SetLabelEditValidationResultAction> {
    static readonly KIND = "validateLabelEdit";
    kind = ValidateLabelEditAction.KIND;
    constructor(
        public readonly value: string,
        public readonly labelId: string,
        public readonly requestId: string = generateRequestId()) { }
}

export class SetLabelEditValidationResultAction implements ResponseAction {
    static readonly KIND = "setLabelEditValidationResult";
    kind = SetLabelEditValidationResultAction.KIND;
    constructor(
        public readonly result: EditLabelValidationResult,
        public readonly responseId: string = '') { }
}

export function isSetLabelEditValidationResultAction(action: Action): action is SetLabelEditValidationResultAction {
    return action !== undefined && (action.kind === SetLabelEditValidationResultAction.KIND)
        && (<SetLabelEditValidationResultAction>action).result !== undefined;
}

@injectable()
export class ServerEditLabelValidator implements IEditLabelValidator {

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: GLSPActionDispatcher;

    validate(value: string, label: EditableLabel & SModelElement): Promise<EditLabelValidationResult> {
        const action = new ValidateLabelEditAction(value, label.id);
        return this.actionDispatcher.requestUntil(action).then(response => this.getValidationResultFromResponse(response));
    }

    getValidationResultFromResponse(action: Action): EditLabelValidationResult {
        if (isSetLabelEditValidationResultAction(action)) {
            return action.result;
        }
        return { severity: <Severity>'ok' };
    }

}

@injectable()
export class BalloonLabelValidationDecorator implements IEditLabelValidationDecorator {

    decorate(input: HTMLInputElement, result: EditLabelValidationResult): void {
        const containerElement = input.parentElement;
        if (!containerElement) {
            return;
        }
        if (result.message) {
            containerElement.setAttribute('data-balloon', result.message);
            containerElement.setAttribute('data-balloon-pos', 'up-left');
            containerElement.setAttribute('data-balloon-visible', 'true');
        }
        switch (result.severity) {
            case 'ok': containerElement.classList.add('validation-ok'); break;
            case 'warning': containerElement.classList.add('validation-warning'); break;
            case 'error': containerElement.classList.add('validation-error'); break;
        }
    }

    dispose(input: HTMLInputElement): void {
        const containerElement = input.parentElement;
        if (containerElement) {
            containerElement.removeAttribute('data-balloon');
            containerElement.removeAttribute('data-balloon-pos');
            containerElement.removeAttribute('data-balloon-visible');
            containerElement.classList.remove('validation-ok', 'validation-warning', 'validation-error');
        }
    }
}
