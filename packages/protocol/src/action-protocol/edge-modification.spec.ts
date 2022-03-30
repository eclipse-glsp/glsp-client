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
import { ChangeRoutingPointsOperation, ReconnectEdgeOperation } from './edge-modification';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Edge modification operations', () => {
    describe('ReconnectEdgeOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: ReconnectEdgeOperation = {
                    kind: 'reconnectEdge',
                    isOperation: true,
                    edgeElementId: '1',
                    sourceElementId: '2',
                    targetElementId: '3'
                };
                expect(ReconnectEdgeOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(ReconnectEdgeOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ReconnectEdgeOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: ReconnectEdgeOperation = {
                    kind: 'reconnectEdge',
                    isOperation: true,
                    edgeElementId: 'edgeElement',
                    sourceElementId: 'source',
                    targetElementId: 'target'
                };
                const { edgeElementId, sourceElementId, targetElementId } = expected;
                expect(ReconnectEdgeOperation.create({ edgeElementId, sourceElementId, targetElementId })).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: ReconnectEdgeOperation = {
                    kind: 'reconnectEdge',
                    isOperation: true,
                    edgeElementId: 'edgeElement',
                    sourceElementId: 'source',
                    targetElementId: 'target',
                    args: { some: 'args' }
                };
                const { edgeElementId, sourceElementId, targetElementId, args } = expected;
                expect(ReconnectEdgeOperation.create({ edgeElementId, sourceElementId, targetElementId, args })).to.deep.equals(expected);
            });
        });
    });

    describe('ChangeRoutingPointsOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const operation: ChangeRoutingPointsOperation = {
                    kind: 'changeRoutingPoints',
                    isOperation: true,
                    newRoutingPoints: []
                };
                expect(ChangeRoutingPointsOperation.is(operation)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(ChangeRoutingPointsOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ChangeRoutingPointsOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: ReconnectEdgeOperation = {
                    kind: 'reconnectEdge',
                    isOperation: true,
                    edgeElementId: 'edgeElement',
                    sourceElementId: 'source',
                    targetElementId: 'target'
                };
                const { edgeElementId, sourceElementId, targetElementId } = expected;
                expect(ReconnectEdgeOperation.create({ edgeElementId, sourceElementId, targetElementId })).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required args', () => {
                const expected: ChangeRoutingPointsOperation = {
                    kind: 'changeRoutingPoints',
                    isOperation: true,
                    newRoutingPoints: [{ elementId: 'element', newRoutingPoints: [Point.ORIGIN] }]
                };
                const { newRoutingPoints } = expected;
                expect(ChangeRoutingPointsOperation.create(newRoutingPoints)).to.deep.equals(expected);
            });
        });
    });
});
