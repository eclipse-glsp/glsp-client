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
import { TriggerEdgeCreationAction, TriggerNodeCreationAction } from '../tool-palette';

describe('Tool palette Actions', () => {
    describe('TrigerNodeCreationAction', () => {
        it('TriggerNodeCreationAction.is with valid action type', () => {
            const action: TriggerNodeCreationAction = {
                kind: 'triggerNodeCreation',
                elementTypeId: ''
            };
            expect(TriggerNodeCreationAction.is(action)).to.be.true;
        });
        it('TriggerNodeCreationAction.is with undefined', () => {
            expect(TriggerNodeCreationAction.is(undefined)).to.be.false;
        });
        it('TriggerNodeCreationAction.is with invalid action type', () => {
            expect(TriggerNodeCreationAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('TriggerNodeCreationAction.create with required args', () => {
            const expected: TriggerNodeCreationAction = {
                kind: 'triggerNodeCreation',
                elementTypeId: 'myElementType'
            };
            const { elementTypeId } = expected;
            expect(TriggerNodeCreationAction.create(elementTypeId)).to.deep.equals(expected);
        });
        it('TriggerNodeCreationAction.create with optional args', () => {
            const expected: TriggerNodeCreationAction = {
                kind: 'triggerNodeCreation',
                elementTypeId: 'myElementType',
                args: { some: 'args' }
            };
            const { elementTypeId, args } = expected;
            expect(TriggerNodeCreationAction.create(elementTypeId, { args })).to.deep.equals(expected);
        });
    });

    describe('TriggerEdgeCreationAction', () => {
        it('TriggerEdgeCreationAction.is with valid action type', () => {
            const action: TriggerEdgeCreationAction = {
                kind: 'triggerEdgeCreation',
                elementTypeId: ''
            };
            expect(TriggerEdgeCreationAction.is(action)).to.be.true;
        });
        it('TriggerEdgeCreationAction.is with undefined', () => {
            expect(TriggerEdgeCreationAction.is(undefined)).to.be.false;
        });
        it('TriggerEdgeCreationAction.is with invalid action type', () => {
            expect(TriggerEdgeCreationAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('TriggerEdgeCreationAction.create with required args', () => {
            const expected: TriggerEdgeCreationAction = {
                kind: 'triggerEdgeCreation',
                elementTypeId: 'myEdge'
            };
            const { elementTypeId } = expected;
            expect(TriggerEdgeCreationAction.create(elementTypeId)).to.deep.equals(expected);
        });
        it('TriggerEdgeCreationAction.create with optional args', () => {
            const expected: TriggerEdgeCreationAction = {
                kind: 'triggerEdgeCreation',
                elementTypeId: 'myEdge',
                args: { some: 'args' }
            };
            const { elementTypeId, args } = expected;
            expect(TriggerEdgeCreationAction.create(elementTypeId, { args })).to.deep.equals(expected);
        });
    });
});
