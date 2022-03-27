/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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
import { ExportSvgAction, RequestExportSvgAction, SaveModelAction, SetDirtyStateAction } from '../model-saving';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Model saving actions', () => {
    describe('SaveModelAction', () => {
        it('SaveModelAction.is with valid action type', () => {
            const action: SaveModelAction = {
                kind: 'saveModel'
            };
            expect(SaveModelAction.is(action)).to.be.true;
        });
        it('SaveModelAction.is with undefined', () => {
            expect(SaveModelAction.is(undefined)).to.be.false;
        });
        it('SaveModelAction.is with invalid action type', () => {
            expect(SaveModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SaveModelAction.create with required args', () => {
            const expected: SaveModelAction = {
                kind: 'saveModel'
            };

            expect(SaveModelAction.create()).to.deep.equals(expected);
        });
        it('SaveModelAction.create with optional args', () => {
            const expected: SaveModelAction = {
                kind: 'saveModel',
                fileUri: 'myUri'
            };
            const { fileUri } = expected;
            expect(SaveModelAction.create({ fileUri })).to.deep.equals(expected);
        });
    });

    describe('SetDirtyStateAction', () => {
        it('SetDirtyStateAction.is with valid action type', () => {
            const action: SetDirtyStateAction = {
                kind: 'setDirtyState',
                isDirty: true
            };
            expect(SetDirtyStateAction.is(action)).to.be.true;
        });
        it('SetDirtyStateAction.is with undefined', () => {
            expect(SetDirtyStateAction.is(undefined)).to.be.false;
        });
        it('SetDirtyStateAction.is with invalid action type', () => {
            expect(SetDirtyStateAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetDirtyStateAction.create with required args', () => {
            const expected: SetDirtyStateAction = {
                kind: 'setDirtyState',
                isDirty: true
            };
            const { isDirty } = expected;
            expect(SetDirtyStateAction.create(isDirty)).to.deep.equals(expected);
        });
        it('SetDirtyStateAction.create with optional args', () => {
            const expected: SetDirtyStateAction = {
                kind: 'setDirtyState',
                isDirty: false,
                reason: 'save'
            };
            const { isDirty, reason } = expected;
            expect(SetDirtyStateAction.create(isDirty, { reason })).to.deep.equals(expected);
        });
    });

    describe('RequestExportSvgAction', () => {
        it('RequestExportSvgAction.is with valid action type', () => {
            const action: RequestExportSvgAction = {
                kind: 'requestExportSvg',
                requestId: ''
            };
            expect(RequestExportSvgAction.is(action)).to.be.true;
        });
        it('RequestExportSvgAction.is with undefined', () => {
            expect(RequestExportSvgAction.is(undefined)).to.be.false;
        });
        it('RequestExportSvgAction.is with invalid action type', () => {
            expect(RequestExportSvgAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestExportSvgAction.create with required args', () => {
            const expected: RequestExportSvgAction = {
                kind: 'requestExportSvg',
                requestId: ''
            };
            expect(RequestExportSvgAction.create()).to.deep.equals(expected);
        });
        it('RequestExportSvgAction.create with optional args', () => {
            const expected: RequestExportSvgAction = {
                kind: 'requestExportSvg',
                requestId: 'myRequest'
            };
            const { requestId } = expected;
            expect(RequestExportSvgAction.create({ requestId })).to.deep.equals(expected);
        });
    });

    describe('ExportSvgAction', () => {
        it('ExportSvgAction.is with valid action type', () => {
            const action: ExportSvgAction = {
                kind: 'exportSvg',
                responseId: '',
                svg: ''
            };
            expect(ExportSvgAction.is(action)).to.be.true;
        });
        it('ExportSvgAction.is with undefined', () => {
            expect(ExportSvgAction.is(undefined)).to.be.false;
        });
        it('ExportSvgAction.is with invalid action type', () => {
            expect(ExportSvgAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('ExportSvgAction.create with required args', () => {
            const expected: ExportSvgAction = {
                kind: 'exportSvg',
                responseId: '',
                svg: 'someSvg'
            };
            const { svg } = expected;
            expect(ExportSvgAction.create(svg)).to.deep.equals(expected);
        });
        it('ExportSvgAction.create with optional args', () => {
            const expected: ExportSvgAction = {
                kind: 'exportSvg',
                responseId: 'responseId',
                svg: 'someSvg'
            };
            const { svg, responseId } = expected;
            expect(ExportSvgAction.create(svg, { responseId })).to.deep.equals(expected);
        });
    });
});
