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
import { ChangeRoutingPointsOperation, ReconnectEdgeOperation } from '../edge-modification';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Edge modification operations', () => {
    describe('ReconnectEdgeOperation', () => {
        it('ReconnectEdgeOperation.is with valid action type', () => {
            const operation: ReconnectEdgeOperation = {
                kind: 'reconnectEdge',
                isOperation: true,
                edgeElementId: '1',
                sourceElementId: '2',
                targetElementId: '3'
            };
            expect(ReconnectEdgeOperation.is(operation)).to.be.true;
        });
        it('ReconnectEdgeOperation.is with undefined', () => {
            expect(ReconnectEdgeOperation.is(undefined)).to.be.false;
        });
        it('ReconnectEdgeOperation.is with invalid action type', () => {
            expect(ReconnectEdgeOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('ReconnectEdgeOperation.create with required args', () => {
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
        it('ReconnectEdgeOperation.create with optional args', () => {
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

    describe('ChangeRoutingPointsOperation', () => {
        it('ChangeRoutingPointsOperation.is with valid action type', () => {
            const operation: ChangeRoutingPointsOperation = {
                kind: 'changeRoutingPoints',
                isOperation: true,
                newRoutingPoints: []
            };
            expect(ChangeRoutingPointsOperation.is(operation)).to.be.true;
        });
        it('ChangeRoutingPointsOperation.is with undefined', () => {
            expect(ChangeRoutingPointsOperation.is(undefined)).to.be.false;
        });
        it('ChangeRoutingPointsOperation.is with invalid action type', () => {
            expect(ChangeRoutingPointsOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('ChangeRoutingPointsOperation.create with required args', () => {
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
