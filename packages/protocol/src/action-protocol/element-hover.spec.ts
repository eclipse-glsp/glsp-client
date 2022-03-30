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
import { Bounds } from 'sprotty-protocol';
import { RequestPopupModelAction, SetPopupModelAction } from './element-hover';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element hover actions', () => {
    describe('RequestPopupModelAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RequestPopupModelAction = {
                    kind: 'requestPopupModel',
                    requestId: '',
                    elementId: '',
                    bounds: Bounds.EMPTY
                };
                expect(RequestPopupModelAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestPopupModelAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestPopupModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestPopupModelAction = {
                    kind: 'requestPopupModel',
                    requestId: '',
                    elementId: 'someId',
                    bounds: Bounds.EMPTY
                };
                const { elementId, bounds } = expected;
                expect(RequestPopupModelAction.create({ bounds, elementId })).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
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
    });

    describe('SetPopupModelAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetPopupModelAction = {
                    kind: 'setPopupModel',
                    responseId: '',
                    newRoot: { id: '', type: '' }
                };
                expect(SetPopupModelAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SetPopupModelAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetPopupModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SetPopupModelAction = {
                    kind: 'setPopupModel',
                    responseId: '',
                    newRoot: { id: '', type: '' }
                };
                const { newRoot } = expected;
                expect(SetPopupModelAction.create(newRoot)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
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
});
