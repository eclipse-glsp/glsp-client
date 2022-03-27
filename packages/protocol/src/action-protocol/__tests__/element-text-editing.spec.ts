/********************************************************************************
 * Copyright (c) 2022 STMicroelectronics and others.
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
import { expect } from 'chai';
import {
    ApplyLabelEditOperation,
    RequestEditValidationAction,
    SetEditValidationResultAction,
    ValidationStatus
} from '../element-text-editing';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element text editing actions', () => {
    describe('RequestEditValidationAction', () => {
        it('RequestEditValidationAction.is with valid action type', () => {
            const action: RequestEditValidationAction = {
                kind: 'requestEditValidation',
                requestId: '',
                contextId: '',
                modelElementId: '',
                text: ''
            };
            expect(RequestEditValidationAction.is(action)).to.be.true;
        });
        it('RequestEditValidationAction.is with undefined', () => {
            expect(RequestEditValidationAction.is(undefined)).to.be.false;
        });
        it('RequestEditValidationAction.is with invalid action type', () => {
            expect(RequestEditValidationAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestEditValidationAction.create with required args', () => {
            const expected: RequestEditValidationAction = {
                kind: 'requestEditValidation',
                requestId: '',
                contextId: 'myContext',
                modelElementId: 'myModelElement',
                text: 'someText'
            };
            const { contextId, modelElementId, text } = expected;
            expect(RequestEditValidationAction.create({ contextId, modelElementId, text })).to.deep.equals(expected);
        });
        it('RequestEditValidationAction.create with optional args', () => {
            const expected: RequestEditValidationAction = {
                kind: 'requestEditValidation',
                requestId: 'myRequest',
                contextId: 'myContext',
                modelElementId: 'myModelElement',
                text: 'someText'
            };
            const { contextId, modelElementId, text, requestId } = expected;
            expect(RequestEditValidationAction.create({ contextId, modelElementId, text, requestId })).to.deep.equals(expected);
        });
    });

    describe('SetEditValidationResultAction', () => {
        it('SetEditValidationResultAction.is with valid action type', () => {
            const action: SetEditValidationResultAction = {
                kind: 'setEditValidationResult',
                responseId: '',
                status: { severity: ValidationStatus.Severity.OK }
            };
            expect(SetEditValidationResultAction.is(action)).to.be.true;
        });
        it('SetEditValidationResultAction.is with undefined', () => {
            expect(SetEditValidationResultAction.is(undefined)).to.be.false;
        });
        it('SetEditValidationResultAction.is with invalid action type', () => {
            expect(SetEditValidationResultAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetEditValidationResultAction.create with required args', () => {
            const expected: SetEditValidationResultAction = {
                kind: 'setEditValidationResult',
                responseId: '',
                status: { severity: ValidationStatus.Severity.OK }
            };
            const { status } = expected;
            expect(SetEditValidationResultAction.create(status)).to.deep.equals(expected);
        });
        it('SetEditValidationResultAction.create with optional args', () => {
            const expected: SetEditValidationResultAction = {
                kind: 'setEditValidationResult',
                responseId: 'myRespsone',
                args: { some: 'args' },
                status: { severity: ValidationStatus.Severity.OK }
            };
            const { status, args, responseId } = expected;
            expect(SetEditValidationResultAction.create(status, { args, responseId })).to.deep.equals(expected);
        });
    });

    describe('ApplyLabelEditOperation', () => {
        it('ApplyLabelEditOperation.is with valid action type', () => {
            const operation: ApplyLabelEditOperation = {
                kind: 'applyLabelEdit',
                isOperation: true,
                labelId: '',
                text: ''
            };
            expect(ApplyLabelEditOperation.is(operation)).to.be.true;
        });
        it('ApplyLabelEditOperation.is with undefined', () => {
            expect(ApplyLabelEditOperation.is(undefined)).to.be.false;
        });
        it('ApplyLabelEditOperation.is with invalid action type', () => {
            expect(ApplyLabelEditOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('ApplyLabelEditOperation.create with required args', () => {
            const expected: ApplyLabelEditOperation = {
                kind: 'applyLabelEdit',
                isOperation: true,
                labelId: 'myLabel',
                text: 'myText'
            };
            const { labelId, text } = expected;
            expect(ApplyLabelEditOperation.create({ labelId, text })).to.deep.equals(expected);
        });
    });
});
