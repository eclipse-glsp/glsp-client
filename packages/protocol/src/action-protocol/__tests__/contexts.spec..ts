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
import { RequestContextActions, SetContextActions } from '../contexts';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Context Actions', () => {
    describe('RequestContextActions', () => {
        it('RequestContextActions.is with valid action type', () => {
            const action: RequestContextActions = {
                contextId: '',
                editorContext: { selectedElementIds: [] },
                kind: 'requestContextActions',
                requestId: ''
            };
            expect(RequestContextActions.is(action)).to.be.true;
        });
        it('RequestContextActions.is with undefined', () => {
            expect(RequestContextActions.is(undefined)).to.be.false;
        });
        it('RequestContextActions.is with invalid action type', () => {
            expect(RequestContextActions.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestContextActions.create with required args', () => {
            const expected: RequestContextActions = {
                kind: 'requestContextActions',
                contextId: 'someId',
                editorContext: { selectedElementIds: ['element1'] },
                requestId: ''
            };
            const { contextId, editorContext } = expected;
            expect(RequestContextActions.create({ contextId, editorContext })).to.deep.equals(expected);
        });
        it('RequestContextActions.create with optional args', () => {
            const expected: RequestContextActions = {
                kind: 'requestContextActions',
                contextId: 'someId',
                editorContext: { selectedElementIds: ['element1'] },
                requestId: 'myRequest'
            };
            const { contextId, editorContext, requestId } = expected;
            expect(RequestContextActions.create({ contextId, editorContext, requestId })).to.deep.equals(expected);
        });
    });

    describe('SetContextActions', () => {
        it('SetContextActions.is with valid action type', () => {
            const action: SetContextActions = {
                kind: 'setContextActions',
                actions: [],
                responseId: ''
            };
            expect(SetContextActions.is(action)).to.be.true;
        });
        it('SetContextActions.is with undefined', () => {
            expect(SetContextActions.is(undefined)).to.be.false;
        });
        it('SetContextActions.is with invalid action type', () => {
            expect(SetContextActions.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetContextActions.create with required args', () => {
            const expected: SetContextActions = {
                kind: 'setContextActions',
                actions: [{ label: 'label', actions: [{ kind: 'kind' }] }],
                responseId: ''
            };
            const { actions } = expected;
            expect(SetContextActions.create(actions)).to.deep.equals(expected);
        });
        it('SetContextActions.create with optional args', () => {
            const expected: SetContextActions = {
                kind: 'setContextActions',
                actions: [{ label: 'label', actions: [{ kind: 'kind' }] }],
                responseId: 'someResponse',
                args: { some: 'args' }
            };
            const { actions, args, responseId } = expected;
            expect(SetContextActions.create(actions, { args, responseId })).to.deep.equals(expected);
        });
    });
});
