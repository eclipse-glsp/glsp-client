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
import { RequestTypeHintsAction, SetTypeHintsAction } from '../element-type-hints';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Element type hints actions', () => {
    describe('RequestTypeHintsAction', () => {
        it('RequestTypeHintsAction.is with valid action type', () => {
            const action: RequestTypeHintsAction = {
                kind: 'requestTypeHints',
                requestId: ''
            };
            expect(RequestTypeHintsAction.is(action)).to.be.true;
        });
        it('RequestTypeHintsAction.is with undefined', () => {
            expect(RequestTypeHintsAction.is(undefined)).to.be.false;
        });
        it('RequestTypeHintsAction.is with invalid action type', () => {
            expect(RequestTypeHintsAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestTypeHintsAction.create with required args', () => {
            const expected: RequestTypeHintsAction = {
                kind: 'requestTypeHints',
                requestId: ''
            };

            expect(RequestTypeHintsAction.create()).to.deep.equals(expected);
        });
        it('RequestTypeHintsAction.create with optional args', () => {
            const expected: RequestTypeHintsAction = {
                kind: 'requestTypeHints',
                requestId: 'myRequest'
            };
            const { requestId } = expected;
            expect(RequestTypeHintsAction.create({ requestId })).to.deep.equals(expected);
        });
    });

    describe('SetTypeHintsAction', () => {
        it('SetTypeHintsAction.is with valid action type', () => {
            const action: SetTypeHintsAction = {
                kind: 'setTypeHints',
                responseId: '',
                edgeHints: [],
                shapeHints: []
            };
            expect(SetTypeHintsAction.is(action)).to.be.true;
        });
        it('SetTypeHintsAction.is with undefined', () => {
            expect(SetTypeHintsAction.is(undefined)).to.be.false;
        });
        it('SetTypeHintsAction.is with invalid action type', () => {
            expect(SetTypeHintsAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetTypeHintsAction.create with required args', () => {
            const expected: SetTypeHintsAction = {
                kind: 'setTypeHints',
                responseId: '',
                edgeHints: [
                    {
                        deletable: false,
                        elementTypeId: 'myShape',
                        repositionable: true,
                        routable: true,
                        sourceElementTypeIds: [],
                        targetElementTypeIds: []
                    }
                ],
                shapeHints: [
                    {
                        deletable: true,
                        elementTypeId: 'myEdge',
                        reparentable: true,
                        repositionable: true,
                        resizable: true,
                        containableElementTypeIds: []
                    }
                ]
            };
            const { edgeHints, shapeHints } = expected;
            expect(SetTypeHintsAction.create({ edgeHints, shapeHints })).to.deep.equals(expected);
        });
        it('SetTypeHintsAction.create with optional args', () => {
            const expected: SetTypeHintsAction = {
                kind: 'setTypeHints',
                responseId: 'myResponse',
                edgeHints: [
                    {
                        deletable: false,
                        elementTypeId: 'myShape',
                        repositionable: true,
                        routable: true,
                        sourceElementTypeIds: [],
                        targetElementTypeIds: []
                    }
                ],
                shapeHints: [
                    {
                        deletable: true,
                        elementTypeId: 'myEdge',
                        reparentable: true,
                        repositionable: true,
                        resizable: true,
                        containableElementTypeIds: []
                    }
                ]
            };
            const { edgeHints, shapeHints, responseId } = expected;
            expect(SetTypeHintsAction.create({ edgeHints, shapeHints, responseId })).to.deep.equals(expected);
        });
    });
});
