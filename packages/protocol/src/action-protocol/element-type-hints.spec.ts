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
import { CheckEdgeResultAction, RequestCheckEdgeAction, RequestTypeHintsAction, SetTypeHintsAction } from './element-type-hints';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Element type hints actions', () => {
    describe('RequestTypeHintsAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RequestTypeHintsAction = {
                    kind: 'requestTypeHints',
                    requestId: ''
                };
                expect(RequestTypeHintsAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestTypeHintsAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestTypeHintsAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestTypeHintsAction = {
                    kind: 'requestTypeHints',
                    requestId: ''
                };

                expect(RequestTypeHintsAction.create()).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: RequestTypeHintsAction = {
                    kind: 'requestTypeHints',
                    requestId: 'myRequest'
                };
                const { requestId } = expected;
                expect(RequestTypeHintsAction.create({ requestId })).to.deep.equals(expected);
            });
        });
    });

    describe('SetTypeHintsAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetTypeHintsAction = {
                    kind: 'setTypeHints',
                    responseId: '',
                    edgeHints: [],
                    shapeHints: []
                };
                expect(SetTypeHintsAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SetTypeHintsAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetTypeHintsAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
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
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
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
    describe('RequestCheckEdgeAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RequestCheckEdgeAction = {
                    kind: 'requestCheckEdge',
                    edgeType: 'edge',
                    sourceElementId: 'source',
                    requestId: ''
                };
                expect(RequestCheckEdgeAction.is(action)).to.be.true;
            });
            it('should return true for an object having the correct type and a value for all required interface & optional properties', () => {
                const action: RequestCheckEdgeAction = {
                    kind: 'requestCheckEdge',
                    edgeType: 'edge',
                    sourceElementId: 'source',
                    targetElementId: 'target',
                    requestId: ''
                };
                expect(RequestCheckEdgeAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestCheckEdgeAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestCheckEdgeAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestCheckEdgeAction = {
                    kind: 'requestCheckEdge',
                    edgeType: 'edge',
                    sourceElementId: 'source',
                    requestId: '',
                    targetElementId: undefined
                };

                expect(RequestCheckEdgeAction.create({ edgeType: 'edge', sourceElement: 'source' })).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: RequestCheckEdgeAction = {
                    kind: 'requestCheckEdge',
                    edgeType: 'edge',
                    sourceElementId: 'source',
                    targetElementId: 'target',
                    requestId: 'myRequest'
                };

                expect(
                    RequestCheckEdgeAction.create({
                        edgeType: 'edge',
                        sourceElement: 'source',
                        targetElement: 'target',
                        requestId: 'myRequest'
                    })
                ).to.deep.equals(expected);
            });
        });
    });
    describe('CheckEdgeResultAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: CheckEdgeResultAction = {
                    isValid: true,
                    kind: 'checkEdgeTargetResult',
                    edgeType: 'edge',
                    sourceElementId: 'source',
                    responseId: ''
                };
                expect(CheckEdgeResultAction.is(action)).to.be.true;
            });
            it('should return true for an object having the correct type and a value for all required interface & optional properties', () => {
                const action: CheckEdgeResultAction = {
                    isValid: true,
                    kind: 'checkEdgeTargetResult',
                    edgeType: 'edge',
                    sourceElementId: 'source',
                    targetElementId: 'target',
                    responseId: 'myResponse'
                };
                expect(CheckEdgeResultAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(CheckEdgeResultAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(CheckEdgeResultAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: CheckEdgeResultAction = {
                    isValid: true,
                    kind: 'checkEdgeTargetResult',
                    edgeType: 'edge',
                    sourceElementId: 'source',
                    responseId: ''
                };
                expect(CheckEdgeResultAction.create({ edgeType: 'edge', isValid: true, sourceElementId: 'source' })).to.deep.equals(
                    expected
                );
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: CheckEdgeResultAction = {
                    isValid: true,
                    kind: 'checkEdgeTargetResult',
                    edgeType: 'edge',
                    sourceElementId: 'source',
                    targetElementId: 'target',
                    responseId: 'myResponse'
                };

                expect(
                    CheckEdgeResultAction.create({
                        edgeType: 'edge',
                        isValid: true,
                        sourceElementId: 'source',
                        targetElementId: 'target',
                        responseId: 'myResponse'
                    })
                ).to.deep.equals(expected);
            });
        });
    });
});
