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
import { Point } from 'sprotty-protocol';
import { CreateEdgeOperation, CreateNodeOperation, CreateOperation, DeleteElementOperation } from './element-creation';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element creation operations', () => {
    describe('CreateOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: CreateOperation = {
                    kind: 'CreateEdgeOperation',
                    isOperation: true,
                    elementTypeId: 'someType'
                };
                expect(CreateOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(CreateOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(CreateOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });
    });

    describe('CreateNodeOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: CreateNodeOperation = {
                    kind: 'createNode',
                    isOperation: true,
                    elementTypeId: ''
                };
                expect(CreateNodeOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(CreateNodeOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(CreateNodeOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: CreateNodeOperation = {
                    kind: 'createNode',
                    isOperation: true,
                    elementTypeId: 'someNode'
                };
                const { elementTypeId } = expected;
                expect(CreateNodeOperation.create(elementTypeId)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: CreateNodeOperation = {
                    kind: 'createNode',
                    elementTypeId: 'elementType',
                    containerId: 'container',
                    location: Point.ORIGIN,
                    isOperation: true,
                    args: { some: 'args' }
                };
                const { elementTypeId, containerId, location, args } = expected;
                expect(CreateNodeOperation.create(elementTypeId, { args, location, containerId })).to.deep.equals(expected);
            });
        });
    });

    describe('CreateEdgeOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: CreateEdgeOperation = {
                    kind: 'createEdge',
                    isOperation: true,
                    elementTypeId: '',
                    sourceElementId: '',
                    targetElementId: ''
                };
                expect(CreateEdgeOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(CreateEdgeOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(CreateEdgeOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: CreateEdgeOperation = {
                    kind: 'createEdge',
                    isOperation: true,
                    elementTypeId: 'someNode',
                    sourceElementId: 'source',
                    targetElementId: 'target'
                };
                const { elementTypeId, sourceElementId, targetElementId } = expected;
                expect(CreateEdgeOperation.create({ elementTypeId, sourceElementId, targetElementId })).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: CreateEdgeOperation = {
                    kind: 'createEdge',
                    isOperation: true,
                    elementTypeId: 'someNode',
                    sourceElementId: 'source',
                    targetElementId: 'target',
                    args: { some: 'args' }
                };
                const { elementTypeId, sourceElementId, targetElementId, args } = expected;
                expect(CreateEdgeOperation.create({ elementTypeId, sourceElementId, targetElementId, args })).to.deep.equals(expected);
            });
        });
    });

    describe('DeleteElementOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: DeleteElementOperation = {
                    kind: 'deleteElement',
                    isOperation: true,
                    elementIds: []
                };
                expect(DeleteElementOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(DeleteElementOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(DeleteElementOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: DeleteElementOperation = {
                    kind: 'deleteElement',
                    isOperation: true,
                    elementIds: ['deleteMe']
                };
                const { elementIds } = expected;
                expect(DeleteElementOperation.create(elementIds)).to.deep.equals(expected);
            });
        });
    });
});
