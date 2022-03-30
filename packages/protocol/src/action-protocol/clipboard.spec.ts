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
/* eslint-disable max-len */
import { expect } from 'chai';
import { CutOperation, PasteOperation, RequestClipboardDataAction, SetClipboardDataAction } from './clipboard';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Clipboard actions', () => {
    describe('RequestClipboardDataAction', () => {
        const requestClipboardDataAction: RequestClipboardDataAction = {
            kind: 'requestClipboardData',
            requestId: '',
            editorContext: { selectedElementIds: [] }
        };

        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(RequestClipboardDataAction.is(requestClipboardDataAction)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestClipboardDataAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestClipboardDataAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestClipboardDataAction = {
                    kind: RequestClipboardDataAction.KIND,
                    editorContext: { selectedElementIds: ['element1'] },
                    requestId: ''
                };
                const { editorContext } = expected;
                expect(RequestClipboardDataAction.create(editorContext)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: RequestClipboardDataAction = {
                    kind: RequestClipboardDataAction.KIND,
                    editorContext: { selectedElementIds: ['element1'] },
                    requestId: '100'
                };
                const { editorContext, requestId } = expected;
                expect(RequestClipboardDataAction.create(editorContext, { requestId })).to.deep.equals(expected);
            });
        });
    });

    describe('SetClipboardDataAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetClipboardDataAction = {
                    clipboardData: { format: '' },
                    kind: 'setClipboardData',
                    responseId: ''
                };
                expect(SetClipboardDataAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SetClipboardDataAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetClipboardDataAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SetClipboardDataAction = {
                    clipboardData: { format: 'json' },
                    kind: 'setClipboardData',
                    responseId: ''
                };
                const { clipboardData } = expected;
                expect(SetClipboardDataAction.create(clipboardData)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SetClipboardDataAction = {
                    clipboardData: { format: 'json' },
                    kind: 'setClipboardData',
                    responseId: '600'
                };
                const { clipboardData, responseId } = expected;
                expect(SetClipboardDataAction.create(clipboardData, { responseId })).to.deep.equals(expected);
            });
        });
    });

    describe('CutOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: CutOperation = {
                    kind: 'cut',
                    isOperation: true,
                    editorContext: { selectedElementIds: [] }
                };
                expect(CutOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(CutOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(CutOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: CutOperation = {
                    kind: 'cut',
                    isOperation: true,
                    editorContext: { selectedElementIds: ['element1'] }
                };
                const { editorContext } = expected;
                expect(CutOperation.create(editorContext)).to.deep.equals(expected);
            });
        });
    });

    describe('PasteOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: PasteOperation = {
                    kind: 'paste',
                    isOperation: true,
                    editorContext: { selectedElementIds: [] },
                    clipboardData: { format: '' }
                };
                expect(PasteOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(PasteOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(PasteOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: PasteOperation = {
                    kind: 'paste',
                    isOperation: true,
                    clipboardData: { format: 'string' },
                    editorContext: { selectedElementIds: ['element1'] }
                };
                const { editorContext, clipboardData } = expected;
                expect(PasteOperation.create({ clipboardData, editorContext })).to.deep.equals(expected);
            });
        });
    });
});
