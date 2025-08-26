/********************************************************************************
 * Copyright (c) 2022-2025 EclipseSource and others.
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
import { Dimension, Point } from 'sprotty-protocol';
import { ComputedBoundsAction, LayoutOperation, RequestBoundsAction, TriggerLayoutAction } from './model-layout';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Model layout actions', () => {
    describe('RequestBoundsAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RequestBoundsAction = {
                    kind: 'requestBounds',
                    requestId: '',
                    newRoot: { id: '', type: '' }
                };
                expect(RequestBoundsAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestBoundsAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestBoundsAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestBoundsAction = {
                    kind: 'requestBounds',
                    requestId: '',
                    newRoot: { id: 'myId', type: 'myType' }
                };
                const { newRoot } = expected;
                expect(RequestBoundsAction.create(newRoot)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: RequestBoundsAction = {
                    kind: 'requestBounds',
                    requestId: 'myRequest',
                    newRoot: { id: 'myId', type: 'myType' }
                };
                const { newRoot, requestId } = expected;
                expect(RequestBoundsAction.create(newRoot, { requestId })).to.deep.equals(expected);
            });
        });
    });

    describe('ComputedBoundsAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: ComputedBoundsAction = {
                    kind: 'computedBounds',
                    responseId: '',
                    bounds: []
                };
                expect(ComputedBoundsAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(ComputedBoundsAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ComputedBoundsAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: ComputedBoundsAction = {
                    kind: 'computedBounds',
                    responseId: '',
                    bounds: [{ elementId: '', newSize: Dimension.EMPTY, newPosition: Point.ORIGIN }]
                };
                const { bounds } = expected;
                expect(ComputedBoundsAction.create(bounds)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: ComputedBoundsAction = {
                    kind: 'computedBounds',
                    responseId: 'myResponse',
                    alignments: [{ elementId: 'myElement', newAlignment: Point.ORIGIN }],
                    revision: 5,
                    bounds: [{ elementId: '', newSize: Dimension.EMPTY, newPosition: Point.ORIGIN }],
                    routes: [{ elementId: 'myEdge', newRoutingPoints: [{ x: 42, y: 1337 }] }]
                };
                const { bounds, responseId, alignments, revision, routes } = expected;
                expect(ComputedBoundsAction.create(bounds, { responseId, alignments, revision, routes })).to.deep.equals(expected);
            });
        });
    });

    describe('TriggerLayoutAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: TriggerLayoutAction = {
                    kind: 'triggerLayout'
                };
                expect(TriggerLayoutAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(TriggerLayoutAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(TriggerLayoutAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: TriggerLayoutAction = {
                    kind: 'triggerLayout',
                    args: { customArg: 'argValue' }
                };
                expect(TriggerLayoutAction.create({ args: { customArg: 'argValue' } })).to.deep.equals(expected);
            });
        });
    });

    describe('LayoutOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: LayoutOperation = {
                    kind: 'layout',
                    isOperation: true
                };
                expect(LayoutOperation.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(LayoutOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(LayoutOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: LayoutOperation = {
                    kind: 'layout',
                    isOperation: true,
                    elementIds: ['myElements']
                };
                const { elementIds } = expected;
                expect(LayoutOperation.create(elementIds)).to.deep.equals(expected);
            });
        });
    });
});
