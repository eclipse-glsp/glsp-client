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
import { CutOperation, PasteOperation, RequestClipboardDataAction, SetClipboardDataAction } from '../clipboard';
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
        it('RequestClipboardDataAction.is with valid action type', () => {
            expect(RequestClipboardDataAction.is(requestClipboardDataAction)).to.be.true;
        });
        it('RequestClipboardDataAction.is with undefined', () => {
            expect(RequestClipboardDataAction.is(undefined)).to.be.false;
        });
        it('RequestClipboardDataAction.is with invalid action type', () => {
            expect(RequestClipboardDataAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestClipboardDataAction.create with required args', () => {
            const expected: RequestClipboardDataAction = {
                kind: RequestClipboardDataAction.KIND,
                editorContext: { selectedElementIds: ['element1'] },
                requestId: ''
            };
            const { editorContext } = expected;
            expect(RequestClipboardDataAction.create(editorContext)).to.deep.equals(expected);
        });
        it('RequestClipboardDataAction.create with optional args', () => {
            const expected: RequestClipboardDataAction = {
                kind: RequestClipboardDataAction.KIND,
                editorContext: { selectedElementIds: ['element1'] },
                requestId: '100'
            };
            const { editorContext, requestId } = expected;
            expect(RequestClipboardDataAction.create(editorContext, { requestId })).to.deep.equals(expected);
        });
    });

    describe('SetClipboardDataAction', () => {
        it('SetClipboardDataAction.is with valid action type', () => {
            const action: SetClipboardDataAction = {
                clipboardData: { format: '' },
                kind: 'setClipboardData',
                responseId: ''
            };
            expect(SetClipboardDataAction.is(action)).to.be.true;
        });
        it('SetClipboardDataAction.is with undefined', () => {
            expect(SetClipboardDataAction.is(undefined)).to.be.false;
        });
        it('SetClipboardDataAction.is with invalid action type', () => {
            expect(SetClipboardDataAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetClipboardDataAction.create with required args', () => {
            const expected: SetClipboardDataAction = {
                clipboardData: { format: 'json' },
                kind: 'setClipboardData',
                responseId: ''
            };
            const { clipboardData } = expected;
            expect(SetClipboardDataAction.create(clipboardData)).to.deep.equals(expected);
        });
        it('SetClipboardDataAction.create with optional args', () => {
            const expected: SetClipboardDataAction = {
                clipboardData: { format: 'json' },
                kind: 'setClipboardData',
                responseId: '600'
            };
            const { clipboardData, responseId } = expected;
            expect(SetClipboardDataAction.create(clipboardData, { responseId })).to.deep.equals(expected);
        });
    });

    describe('CutOperation', () => {
        it('CutOperation.is with valid action type', () => {
            const operation: CutOperation = {
                kind: 'cut',
                isOperation: true,
                editorContext: { selectedElementIds: [] }
            };
            expect(CutOperation.is(operation)).to.be.true;
        });
        it('CutOperation.is with undefined', () => {
            expect(CutOperation.is(undefined)).to.be.false;
        });
        it('CutOperation.is with invalid action type', () => {
            expect(CutOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('CutOperation.create with required args', () => {
            const expected: CutOperation = {
                kind: 'cut',
                isOperation: true,
                editorContext: { selectedElementIds: ['element1'] }
            };
            const { editorContext } = expected;
            expect(CutOperation.create(editorContext)).to.deep.equals(expected);
        });
    });

    describe('PasteOperation', () => {
        it('PasteOperation.is with valid action type', () => {
            const operation: PasteOperation = {
                kind: 'paste',
                isOperation: true,
                editorContext: { selectedElementIds: [] },
                clipboardData: { format: '' }
            };
            expect(PasteOperation.is(operation)).to.be.true;
        });
        it('PasteOperation.is with undefined', () => {
            expect(PasteOperation.is(undefined)).to.be.false;
        });
        it('PasteOperation.is with invalid action type', () => {
            expect(PasteOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('PasteOperation.create with required args', () => {
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
