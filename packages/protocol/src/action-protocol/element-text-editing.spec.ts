/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
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
/* eslint-disable max-len */
import { expect } from 'chai';
import {
    ApplyLabelEditOperation,
    RequestEditValidationAction,
    SetEditValidationResultAction,
    ValidationStatus
} from './element-text-editing';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element text editing actions', () => {
    describe('RequestEditValidationAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RequestEditValidationAction = {
                    kind: 'requestEditValidation',
                    requestId: '',
                    contextId: '',
                    modelElementId: '',
                    text: ''
                };
                expect(RequestEditValidationAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestEditValidationAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestEditValidationAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
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
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
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
    });

    describe('SetEditValidationResultAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetEditValidationResultAction = {
                    kind: 'setEditValidationResult',
                    responseId: '',
                    status: { severity: ValidationStatus.Severity.OK }
                };
                expect(SetEditValidationResultAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SetEditValidationResultAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetEditValidationResultAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SetEditValidationResultAction = {
                    kind: 'setEditValidationResult',
                    responseId: '',
                    status: { severity: ValidationStatus.Severity.OK }
                };
                const { status } = expected;
                expect(SetEditValidationResultAction.create(status)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SetEditValidationResultAction = {
                    kind: 'setEditValidationResult',
                    responseId: 'myResponse',
                    args: { some: 'args' },
                    status: { severity: ValidationStatus.Severity.OK }
                };
                const { status, args, responseId } = expected;
                expect(SetEditValidationResultAction.create(status, { args, responseId })).to.deep.equals(expected);
            });
        });
    });

    describe('ApplyLabelEditOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: ApplyLabelEditOperation = {
                    kind: 'applyLabelEdit',
                    isOperation: true,
                    labelId: '',
                    text: ''
                };
                expect(ApplyLabelEditOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(ApplyLabelEditOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ApplyLabelEditOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
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
});
