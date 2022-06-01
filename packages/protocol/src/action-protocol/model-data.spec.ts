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
import { RequestModelAction, SetModelAction, SourceModelChangedAction, UpdateModelAction } from './model-data';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Model data actions', () => {
    describe('RequestModelAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                it('RequestModelAction.is with valid action type', () => {
                    const action: RequestModelAction = {
                        kind: 'requestModel',
                        requestId: ''
                    };
                    expect(RequestModelAction.is(action)).to.be.true;
                });
            });
            it('should return false for `undefined`', () => {
                expect(RequestModelAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestModelAction = {
                    kind: 'requestModel',
                    requestId: ''
                };

                expect(RequestModelAction.create()).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: RequestModelAction = {
                    kind: 'requestModel',
                    requestId: 'myRequestId',
                    options: { some: 'option' }
                };
                const { requestId, options } = expected;
                expect(RequestModelAction.create({ options, requestId })).to.deep.equals(expected);
            });
        });
    });

    describe('SetModelAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetModelAction = {
                    kind: 'setModel',
                    responseId: '',
                    newRoot: { id: '', type: '' }
                };
                expect(SetModelAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SetModelAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SetModelAction = {
                    kind: 'setModel',
                    responseId: '',
                    newRoot: { id: 'myId', type: 'myType' }
                };
                const { newRoot } = expected;
                expect(SetModelAction.create(newRoot)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SetModelAction = {
                    kind: 'setModel',
                    responseId: 'myResponse',
                    newRoot: { id: '', type: '' }
                };
                const { newRoot, responseId } = expected;
                expect(SetModelAction.create(newRoot, { responseId })).to.deep.equals(expected);
            });
        });
    });

    describe('UpdateModelAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: UpdateModelAction = {
                    kind: 'updateModel',
                    newRoot: { id: '', type: '' }
                };
                expect(UpdateModelAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(UpdateModelAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(UpdateModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: UpdateModelAction = {
                    kind: 'updateModel',
                    animate: true,
                    newRoot: { id: 'myId', type: 'myType' }
                };
                const { newRoot } = expected;
                expect(UpdateModelAction.create(newRoot)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: UpdateModelAction = {
                    kind: 'updateModel',
                    newRoot: { id: 'myId', type: 'myType' },
                    animate: false
                };
                const { newRoot, animate } = expected;
                expect(UpdateModelAction.create(newRoot, { animate })).to.deep.equals(expected);
            });
        });
    });

    describe('SourceModelChangedAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SourceModelChangedAction = {
                    kind: 'sourceModelChanged',
                    sourceModelName: ''
                };
                expect(SourceModelChangedAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SourceModelChangedAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SourceModelChangedAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: SourceModelChangedAction = {
                    kind: 'sourceModelChanged',
                    sourceModelName: 'myModelSource'
                };
                const { sourceModelName: sourceModelName } = expected;
                expect(SourceModelChangedAction.create(sourceModelName)).to.deep.equals(expected);
            });
        });
    });
});
