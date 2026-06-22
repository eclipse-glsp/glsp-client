/********************************************************************************
 * Copyright (c) 2022-2026 STMicroelectronics and others.
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

import { describe, expect, it } from 'vitest';
import { DeleteMarkersAction, RequestMarkersAction, SetMarkersAction } from './element-validation';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element validation actions', () => {
    describe('RequestMarkersAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RequestMarkersAction = {
                    kind: 'requestMarkers',
                    requestId: '',
                    elementsIDs: []
                };
                expect(RequestMarkersAction.is(action)).toBe(true);
            });
            it('should return false for `undefined`', () => {
                expect(RequestMarkersAction.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestMarkersAction.is({ kind: 'notTheRightOne' })).toBe(false);
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestMarkersAction = {
                    kind: 'requestMarkers',
                    requestId: '',
                    elementsIDs: ['myIds'],
                    reason: 'batch'
                };
                const { elementsIDs } = expected;
                expect(RequestMarkersAction.create(elementsIDs)).toEqual(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: RequestMarkersAction = {
                    kind: 'requestMarkers',
                    requestId: 'myRequest',
                    elementsIDs: ['myIds'],
                    reason: 'batch'
                };
                const { elementsIDs, requestId } = expected;
                expect(RequestMarkersAction.create(elementsIDs, { requestId })).toEqual(expected);
            });
        });
    });

    describe('SetMarkersAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetMarkersAction = {
                    kind: 'setMarkers',
                    responseId: '',
                    markers: []
                };
                expect(SetMarkersAction.is(action)).toBe(true);
            });
            it('should return false for `undefined`', () => {
                expect(SetMarkersAction.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetMarkersAction.is({ kind: 'notTheRightOne' })).toBe(false);
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SetMarkersAction = {
                    kind: 'setMarkers',
                    responseId: '',
                    reason: 'batch',
                    markers: [{ description: 'desc', elementId: 'myId', kind: 'info', label: 'string' }]
                };
                const { markers } = expected;
                expect(SetMarkersAction.create(markers)).toEqual(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SetMarkersAction = {
                    kind: 'setMarkers',
                    responseId: 'myResponse',
                    reason: 'batch',
                    markers: [{ description: 'desc', elementId: 'myId', kind: 'info', label: 'string' }]
                };
                const { markers, responseId } = expected;
                expect(SetMarkersAction.create(markers, { responseId })).toEqual(expected);
            });
        });
    });

    describe('DeleteMarkersAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: DeleteMarkersAction = {
                    kind: 'deleteMarkers',
                    markers: []
                };
                expect(DeleteMarkersAction.is(action)).toBe(true);
            });
            it('should return false for `undefined`', () => {
                expect(DeleteMarkersAction.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(DeleteMarkersAction.is({ kind: 'notTheRightOne' })).toBe(false);
            });

            describe('create', () => {
                it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                    const expected: DeleteMarkersAction = {
                        kind: 'deleteMarkers',
                        markers: [{ description: 'desc', elementId: 'myId', kind: 'info', label: 'string' }]
                    };
                    const { markers } = expected;
                    expect(DeleteMarkersAction.create(markers)).toEqual(expected);
                });
            });
        });
    });
});
