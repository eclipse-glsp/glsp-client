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
import { Bounds } from 'sprotty-protocol';
import { RequestPopupModelAction, SetPopupModelAction } from '../element-hover';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element hover actions', () => {
    describe('RequestPopupModelAction', () => {
        it('RequestPopupModelAction.is with valid action type', () => {
            const action: RequestPopupModelAction = {
                kind: 'requestPopupModel',
                requestId: '',
                elementId: '',
                bounds: Bounds.EMPTY
            };
            expect(RequestPopupModelAction.is(action)).to.be.true;
        });
        it('RequestPopupModelAction.is with undefined', () => {
            expect(RequestPopupModelAction.is(undefined)).to.be.false;
        });
        it('RequestPopupModelAction.is with invalid action type', () => {
            expect(RequestPopupModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestPopupModelAction.create with required args', () => {
            const expected: RequestPopupModelAction = {
                kind: 'requestPopupModel',
                requestId: '',
                elementId: 'someId',
                bounds: Bounds.EMPTY
            };
            const { elementId, bounds } = expected;
            expect(RequestPopupModelAction.create({ bounds, elementId })).to.deep.equals(expected);
        });
        it('RequestPopupModelAction.create with optional args', () => {
            const expected: RequestPopupModelAction = {
                kind: 'requestPopupModel',
                requestId: 'someRequest',
                elementId: 'someId',
                bounds: Bounds.EMPTY
            };
            const { elementId, bounds, requestId } = expected;
            expect(RequestPopupModelAction.create({ bounds, elementId, requestId })).to.deep.equals(expected);
        });
    });

    describe('SetPopupModelAction', () => {
        it('SetPopupModelAction.is with valid action type', () => {
            const action: SetPopupModelAction = {
                kind: 'setPopupModel',
                responseId: '',
                newRoot: { id: '', type: '' }
            };
            expect(SetPopupModelAction.is(action)).to.be.true;
        });
        it('SetPopupModelAction.is with undefined', () => {
            expect(SetPopupModelAction.is(undefined)).to.be.false;
        });
        it('SetPopupModelAction.is with invalid action type', () => {
            expect(SetPopupModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetPopupModelAction.create with required args', () => {
            const expected: SetPopupModelAction = {
                kind: 'setPopupModel',
                responseId: '',
                newRoot: { id: '', type: '' }
            };
            const { newRoot } = expected;
            expect(SetPopupModelAction.create(newRoot)).to.deep.equals(expected);
        });
        it('SetPopupModelAction.create with optional args', () => {
            const expected: SetPopupModelAction = {
                kind: 'setPopupModel',
                responseId: 'someResponse',
                newRoot: { id: '', type: '' }
            };
            const { newRoot, responseId } = expected;
            expect(SetPopupModelAction.create(newRoot, { responseId })).to.deep.equals(expected);
        });
    });
});
