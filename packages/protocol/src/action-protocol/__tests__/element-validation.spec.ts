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
import { DeleteMarkersAction, RequestMarkersAction, SetMarkersAction } from '../element-validation';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element validation actions', () => {
    describe('RequestMarkersAction', () => {
        it('RequestMarkersAction.is with valid action type', () => {
            const action: RequestMarkersAction = {
                kind: 'requestMarkers',
                requestId: '',
                elementsIDs: []
            };
            expect(RequestMarkersAction.is(action)).to.be.true;
        });
        it('RequestMarkersAction.is with undefined', () => {
            expect(RequestMarkersAction.is(undefined)).to.be.false;
        });
        it('RequestMarkersAction.is with invalid action type', () => {
            expect(RequestMarkersAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestMarkersAction.create with required args', () => {
            const expected: RequestMarkersAction = {
                kind: 'requestMarkers',
                requestId: '',
                elementsIDs: ['myIds']
            };
            const { elementsIDs } = expected;
            expect(RequestMarkersAction.create(elementsIDs)).to.deep.equals(expected);
        });
        it('RequestMarkersAction.create with optional args', () => {
            const expected: RequestMarkersAction = {
                kind: 'requestMarkers',
                requestId: 'myRequest',
                elementsIDs: ['myIds']
            };
            const { elementsIDs, requestId } = expected;
            expect(RequestMarkersAction.create(elementsIDs, { requestId })).to.deep.equals(expected);
        });
    });

    describe('SetMarkersAction', () => {
        it('SetMarkersAction.is with valid action type', () => {
            const action: SetMarkersAction = {
                kind: 'setMarkers',
                responseId: '',
                markers: []
            };
            expect(SetMarkersAction.is(action)).to.be.true;
        });
        it('SetMarkersAction.is with undefined', () => {
            expect(SetMarkersAction.is(undefined)).to.be.false;
        });
        it('SetMarkersAction.is with invalid action type', () => {
            expect(SetMarkersAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetMarkersAction.create with required args', () => {
            const expected: SetMarkersAction = {
                kind: 'setMarkers',
                responseId: '',
                markers: [{ description: 'desc', elementId: 'myId', kind: 'info', label: 'string' }]
            };
            const { markers } = expected;
            expect(SetMarkersAction.create(markers)).to.deep.equals(expected);
        });
        it('SetMarkersAction.create with optional args', () => {
            const expected: SetMarkersAction = {
                kind: 'setMarkers',
                responseId: 'myResponse',
                markers: [{ description: 'desc', elementId: 'myId', kind: 'info', label: 'string' }]
            };
            const { markers, responseId } = expected;
            expect(SetMarkersAction.create(markers, { responseId })).to.deep.equals(expected);
        });
    });

    describe('DeleteMarkersAction', () => {
        it('DeleteMarkersAction.is with valid action type', () => {
            const action: DeleteMarkersAction = {
                kind: 'deleteMarkers',
                markers: []
            };
            expect(DeleteMarkersAction.is(action)).to.be.true;
        });
        it('DeleteMarkersAction.is with undefined', () => {
            expect(DeleteMarkersAction.is(undefined)).to.be.false;
        });
        it('DeleteMarkersAction.is with invalid action type', () => {
            expect(DeleteMarkersAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('DeleteMarkersAction.create with required args', () => {
            const expected: DeleteMarkersAction = {
                kind: 'deleteMarkers',
                markers: [{ description: 'desc', elementId: 'myId', kind: 'info', label: 'string' }]
            };
            const { markers } = expected;
            expect(DeleteMarkersAction.create(markers)).to.deep.equals(expected);
        });
    });
});
