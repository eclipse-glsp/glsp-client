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
import { TriggerEdgeCreationAction, TriggerNodeCreationAction } from './tool-palette';

describe('Tool palette Actions', () => {
    describe('TriggerNodeCreationAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: TriggerNodeCreationAction = {
                    kind: 'triggerNodeCreation',
                    elementTypeId: ''
                };
                expect(TriggerNodeCreationAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(TriggerNodeCreationAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(TriggerNodeCreationAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: TriggerNodeCreationAction = {
                    kind: 'triggerNodeCreation',
                    elementTypeId: 'myElementType'
                };
                const { elementTypeId } = expected;
                expect(TriggerNodeCreationAction.create(elementTypeId)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: TriggerNodeCreationAction = {
                    kind: 'triggerNodeCreation',
                    elementTypeId: 'myElementType',
                    args: { some: 'args' }
                };
                const { elementTypeId, args } = expected;
                expect(TriggerNodeCreationAction.create(elementTypeId, { args })).to.deep.equals(expected);
            });
        });
    });

    describe('TriggerEdgeCreationAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: TriggerEdgeCreationAction = {
                    kind: 'triggerEdgeCreation',
                    elementTypeId: ''
                };
                expect(TriggerEdgeCreationAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(TriggerEdgeCreationAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(TriggerEdgeCreationAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: TriggerEdgeCreationAction = {
                    kind: 'triggerEdgeCreation',
                    elementTypeId: 'myEdge'
                };
                const { elementTypeId } = expected;
                expect(TriggerEdgeCreationAction.create(elementTypeId)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
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
});
