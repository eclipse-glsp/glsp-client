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
import { ModelSourceChangedAction, RequestModelAction, SetModelAction, UpdateModelAction } from '../model-data';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Model data actions', () => {
    describe('RequestModelAction', () => {
        it('RequestModelAction.is with valid action type', () => {
            const action: RequestModelAction = {
                kind: 'requestModel',
                requestId: ''
            };
            expect(RequestModelAction.is(action)).to.be.true;
        });
        it('RequestModelAction.is with undefined', () => {
            expect(RequestModelAction.is(undefined)).to.be.false;
        });
        it('RequestModelAction.is with invalid action type', () => {
            expect(RequestModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestModelAction.create with required args', () => {
            const expected: RequestModelAction = {
                kind: 'requestModel',
                requestId: ''
            };

            expect(RequestModelAction.create()).to.deep.equals(expected);
        });
        it('RequestModelAction.create with optional args', () => {
            const expected: RequestModelAction = {
                kind: 'requestModel',
                requestId: 'myRequestId',
                options: { some: 'option' }
            };
            const { requestId, options } = expected;
            expect(RequestModelAction.create({ options, requestId })).to.deep.equals(expected);
        });
    });

    describe('SetModelAction', () => {
        it('SetModelAction.is with valid action type', () => {
            const action: SetModelAction = {
                kind: 'setModel',
                responseId: '',
                newRoot: { id: '', type: '' }
            };
            expect(SetModelAction.is(action)).to.be.true;
        });
        it('SetModelAction.is with undefined', () => {
            expect(SetModelAction.is(undefined)).to.be.false;
        });
        it('SetModelAction.is with invalid action type', () => {
            expect(SetModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetModelAction.create with required args', () => {
            const expected: SetModelAction = {
                kind: 'setModel',
                responseId: '',
                newRoot: { id: 'myId', type: 'myType' }
            };
            const { newRoot } = expected;
            expect(SetModelAction.create(newRoot)).to.deep.equals(expected);
        });
        it('SetModelAction.create with optional args', () => {
            const expected: SetModelAction = {
                kind: 'setModel',
                responseId: 'myResponse',
                newRoot: { id: '', type: '' }
            };
            const { newRoot, responseId } = expected;
            expect(SetModelAction.create(newRoot, { responseId })).to.deep.equals(expected);
        });
    });

    describe('UpdateModelAction', () => {
        it('UpdateModelAction.is with valid action type', () => {
            const action: UpdateModelAction = {
                kind: 'updateModel',
                newRoot: { id: '', type: '' }
            };
            expect(UpdateModelAction.is(action)).to.be.true;
        });
        it('UpdateModelAction.is with undefined', () => {
            expect(UpdateModelAction.is(undefined)).to.be.false;
        });
        it('UpdateModelAction.is with invalid action type', () => {
            expect(UpdateModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('UpdateModelAction.create with required args', () => {
            const expected: UpdateModelAction = {
                kind: 'updateModel',
                animate: true,
                newRoot: { id: 'myId', type: 'myType' }
            };
            const { newRoot } = expected;
            expect(UpdateModelAction.create(newRoot)).to.deep.equals(expected);
        });
        it('UpdateModelAction.create with optional args', () => {
            const expected: UpdateModelAction = {
                kind: 'updateModel',
                newRoot: { id: 'myId', type: 'myType' },
                animate: false
            };
            const { newRoot, animate } = expected;
            expect(UpdateModelAction.create(newRoot, { animate })).to.deep.equals(expected);
        });
    });

    describe('ModelSourceChangedAction', () => {
        it('ModelSourceChangedAction.is with valid action type', () => {
            const action: ModelSourceChangedAction = {
                kind: 'modelSourceChanged',
                modelSourceName: ''
            };
            expect(ModelSourceChangedAction.is(action)).to.be.true;
        });
        it('ModelSourceChangedAction.is with undefined', () => {
            expect(ModelSourceChangedAction.is(undefined)).to.be.false;
        });
        it('ModelSourceChangedAction.is with invalid action type', () => {
            expect(ModelSourceChangedAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('ModelSourceChangedAction.create with required args', () => {
            const expected: ModelSourceChangedAction = {
                kind: 'modelSourceChanged',
                modelSourceName: 'myModelSource'
            };
            const { modelSourceName } = expected;
            expect(ModelSourceChangedAction.create(modelSourceName)).to.deep.equals(expected);
        });
    });
});
