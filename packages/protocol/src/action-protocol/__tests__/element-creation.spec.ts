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
import { Point } from 'sprotty-protocol';
import { CreateEdgeOperation, CreateNodeOperation, CreateOperation, DeleteElementOperation } from '../element-creation';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element creation operations', () => {
    describe('CreateOperation', () => {
        it('CreateOperation.is with valid action type', () => {
            const operation: CreateOperation = {
                kind: 'CreateEdgeOperation',
                isOperation: true,
                elementTypeId: 'someType'
            };
            expect(CreateOperation.is(operation)).to.be.true;
        });
        it('CreateOperation.is with undefined', () => {
            expect(CreateOperation.is(undefined)).to.be.false;
        });
        it('CreateOperation.is with invalid action type', () => {
            expect(CreateOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
    });

    describe('CreateNodeOperation', () => {
        it('CreateNodeOperation.is with valid action type', () => {
            const operation: CreateNodeOperation = {
                kind: 'createNode',
                isOperation: true,
                elementTypeId: ''
            };
            expect(CreateNodeOperation.is(operation)).to.be.true;
        });
        it('CreateNodeOperation.is with undefined', () => {
            expect(CreateNodeOperation.is(undefined)).to.be.false;
        });
        it('CreateNodeOperation.is with invalid action type', () => {
            expect(CreateNodeOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('CreateNodeOperation.create with required args', () => {
            const expected: CreateNodeOperation = {
                kind: 'createNode',
                isOperation: true,
                elementTypeId: 'someNode'
            };
            const { elementTypeId } = expected;
            expect(CreateNodeOperation.create(elementTypeId)).to.deep.equals(expected);
        });
        it('CreateNodeOperation.create with optional args', () => {
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

    describe('CreateEdgeOperation', () => {
        it('CreateEdgeOperation.is with valid action type', () => {
            const operation: CreateEdgeOperation = {
                kind: 'createEdge',
                isOperation: true,
                elementTypeId: '',
                sourceElementId: '',
                targetElementId: ''
            };
            expect(CreateEdgeOperation.is(operation)).to.be.true;
        });
        it('CreateEdgeOperation.is with undefined', () => {
            expect(CreateEdgeOperation.is(undefined)).to.be.false;
        });
        it('CreateEdgeOperation.is with invalid action type', () => {
            expect(CreateEdgeOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('CreateEdgeOperation.create with required args', () => {
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
        it('CreateEdgeOperation.create with optional args', () => {
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

    describe('DeleteElementOperation', () => {
        it('DeleteElementOperation.is with valid action type', () => {
            const operation: DeleteElementOperation = {
                kind: 'deleteElement',
                isOperation: true,
                elementIds: []
            };
            expect(DeleteElementOperation.is(operation)).to.be.true;
        });
        it('DeleteElementOperation.is with undefined', () => {
            expect(DeleteElementOperation.is(undefined)).to.be.false;
        });
        it('DeleteElementOperation.is with invalid action type', () => {
            expect(DeleteElementOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('DeleteElementOperation.create with required args', () => {
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
