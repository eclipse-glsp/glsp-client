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
import { Action, ActionMessage, CompoundOperation, Operation, RejectAction, RequestAction, ResponseAction } from '../base-protocol';

/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Base Protocol Actions', () => {
    const customAction: SomeCustomAction = { kind: 'custom' };

    describe('Action', () => {
        it('Action.is with valid action object', () => {
            const action = { kind: 'myAction' };
            expect(Action.is(action)).to.be.true;
        });
        it('Action.is with `undefined`', () => {
            expect(Action.is(undefined)).to.be.false;
        });
        it('Action.is with object with wrong kind type', () => {
            const notAnAction = { kind: 5 };
            expect(Action.is(notAnAction)).to.be.false;
        });
        it('Action.hasKind with valid action object', () => {
            const action = { kind: 'myAction' };
            expect(Action.hasKind(action, 'myAction')).to.be.true;
        });
        it('Action.hasKind with `undefined`', () => {
            expect(Action.hasKind(undefined, '')).to.be.false;
        });
        it('Action.hasKind with object with wrong kind value', () => {
            const action = { kind: 'myAction' };
            expect(Action.hasKind(action, 'someOtherKind')).to.be.false;
        });
        it('Action.hasKind with object of invalid type', () => {
            expect(Action.hasKind({ I: 'm not an action' }, '')).to.be.false;
        });
    });

    describe('ActionMessage', () => {
        it('ActionMessage.is with valid object', () => {
            const message: ActionMessage = { action: { kind: 'myAction' }, clientId: 'someId' };
            expect(ActionMessage.is(message)).to.be.true;
        });
        it('ActionMessage.is with valid object (with typeguard)', () => {
            const message: ActionMessage = { action: customAction, clientId: 'someId' };
            expect(ActionMessage.is(message, isSomeCustomAction)).to.be.true;
        });
        it('ActionMessage.is with `undefined`', () => {
            expect(ActionMessage.is(undefined)).to.be.false;
        });
        it('ActionMessage.is with invalid object', () => {
            const notAnActionMessage = 'notAnActionMessage';
            expect(ActionMessage.is(notAnActionMessage)).to.be.false;
        });
        it('ActionMessage.is with object that fails typeguard check', () => {
            const message: ActionMessage = { action: { kind: 'myAction' }, clientId: 'someId' };
            expect(ActionMessage.is(message, isSomeCustomAction)).to.be.false;
        });
    });

    const requestAction: SomeRequestAction = { kind: 'someRequest', requestId: '' };

    describe('RequestAction', () => {
        it('RequestAction.is with valid request action', () => {
            expect(RequestAction.is(requestAction)).to.be.true;
        });
        it('RequestAction.is with undefined', () => {
            expect(RequestAction.is(undefined)).to.be.false;
        });
        it('RequestAction.is with non-request action', () => {
            expect(RequestAction.is(customAction)).to.be.false;
        });
        it('RequestAction.hasKind with valid request action', () => {
            expect(RequestAction.hasKind(requestAction, 'someRequest')).to.be.true;
        });
        it('RequestAction.hasKind with `undefined`', () => {
            expect(RequestAction.hasKind(undefined, '')).to.be.false;
        });
        it('RequestAction.hasKind with object with wrong kind value', () => {
            expect(RequestAction.hasKind(requestAction, 'someOtherKind')).to.be.false;
        });
        it('RequestAction.hasKind with object of invalid type', () => {
            expect(RequestAction.hasKind({ I: 'm not an action' }, '')).to.be.false;
        });
    });

    const responseAction: SomeResponseAction = { kind: 'someResponse', responseId: '' };
    describe('ResponseAction', () => {
        it('ResponseAction.is with valid response action', () => {
            expect(ResponseAction.is(responseAction)).to.be.true;
        });
        it('ResponseAction.is with undefined', () => {
            expect(ResponseAction.is(undefined)).to.be.false;
        });
        it('ResponseAction.is with non-request action', () => {
            expect(ResponseAction.is(customAction)).to.be.false;
        });
        it('RequestAction.hasResponseId with valid response action', () => {
            const nonEmptyResponse = { ...responseAction, responseId: 'nonempty' };
            expect(ResponseAction.hasValidResponseId(nonEmptyResponse)).to.be.true;
        });
        it('RequestAction.hasResponseId with `undefined`', () => {
            expect(ResponseAction.hasValidResponseId(undefined)).to.be.false;
        });
        it('RequestAction.hasResponseId with with empty response', () => {
            expect(ResponseAction.hasValidResponseId(responseAction)).to.be.false;
        });
    });

    const rejectAction: RejectAction = { kind: 'rejectRequest', message: '', responseId: '' };
    describe('RejectAction', () => {
        it('RejectAction.is with valid reject action', () => {
            expect(RejectAction.is(rejectAction)).to.be.true;
        });
        it('RejectAction.is with undefined', () => {
            expect(RejectAction.is(undefined)).to.be.false;
        });
        it('RejectAction.is with non-reject action', () => {
            expect(RejectAction.is(customAction)).to.be.false;
        });
        it('RejectAction.create with required args', () => {
            const expected = { kind: RejectAction.KIND, responseId: '', message: 'someMessage' };
            const { message } = expected;
            expect(RejectAction.create(message)).to.deep.equals(expected);
        });
        it('RejectAction.create with optional args', () => {
            const expected = { kind: RejectAction.KIND, responseId: 'someId', message: 'someMessage', detail: 'details' };
            const { detail, responseId, message } = expected;
            expect(RejectAction.create(message, { detail, responseId })).to.deep.equals(expected);
        });
    });

    const operation: Operation = { kind: 'someOperation', isOperation: true };
    describe('Operation', () => {
        it('Operation.is with valid operation', () => {
            expect(Operation.is(operation)).to.be.true;
        });
        it('Operation.is with undefined', () => {
            expect(Operation.is(undefined)).to.be.false;
        });
        it('Operation.is with non-operation', () => {
            expect(Operation.is(customAction)).to.be.false;
        });
        it('Operation.hasKind with valid operation object', () => {
            expect(Operation.hasKind(operation, operation.kind)).to.be.true;
        });
        it('Operation.hasKind with `undefined`', () => {
            expect(Operation.hasKind(undefined, '')).to.be.false;
        });
        it('Operation.hasKind with object with wrong kind value', () => {
            expect(Operation.hasKind(operation, 'someOtherKind')).to.be.false;
        });
        it('Operation.hasKind with object of invalid type', () => {
            expect(Operation.hasKind({ I: 'm not an action' }, '')).to.be.false;
        });
    });

    const compoundOperation: CompoundOperation = { kind: 'compound', isOperation: true, operationList: [] };
    describe('CompoundOperation', () => {
        it('CompoundOperation.is with valid compound operation', () => {
            expect(CompoundOperation.is(compoundOperation)).to.be.true;
        });
        it('CompoundOperation.is with undefined', () => {
            expect(CompoundOperation.is(undefined)).to.be.false;
        });
        it('CompoundOperation.is with non-compound operation', () => {
            expect(CompoundOperation.is(customAction)).to.be.false;
        });
        it('CompoundOperation.create with required args', () => {
            const operationList = [operation];
            const expected = { kind: CompoundOperation.KIND, isOperation: true, operationList };
            expect(CompoundOperation.create(operationList)).to.deep.equals(expected);
        });
    });
});

/** Collection of simple custom action types used for testing the action type guards */

interface SomeCustomAction extends Action {
    kind: 'custom';
}

interface SomeRequestAction extends RequestAction<SomeResponseAction> {
    kind: 'someRequest';
}

interface SomeResponseAction extends ResponseAction {
    kind: 'someResponse';
}
const isSomeCustomAction = (object: any): object is SomeCustomAction => object !== undefined && object.kind === 'custom';
