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
import { Action, ActionMessage, CompoundOperation, Operation, RejectAction, RequestAction, ResponseAction } from './base-protocol';
import { AnyObject } from '../utils/type-util';

/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Base Protocol Actions', () => {
    const customAction: SomeCustomAction = { kind: 'custom' };

    describe('Action', () => {
        describe('is', () => {
            it('should return true for an object having a `kind` property with string type', () => {
                const action = { kind: 'myAction' };
                expect(Action.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(Action.is(undefined)).to.be.false;
            });
            it('should return false for an object having a `kind` property with incorrect type', () => {
                const notAnAction = { kind: 5 };
                expect(Action.is(notAnAction)).to.be.false;
            });
        });
        describe('hasKind', () => {
            it('should return true for an object having a `kind` property that matches the given value', () => {
                const action = { kind: 'myAction' };
                expect(Action.hasKind(action, 'myAction')).to.be.true;
            });
            it('should return false for undefined', () => {
                expect(Action.hasKind(undefined, '')).to.be.false;
            });
            it('should return false for an object having a "kind" property that does not match the given value', () => {
                const action = { kind: 'myAction' };
                expect(Action.hasKind(action, 'someOtherKind')).to.be.false;
            });
            it('should return false for an object not having a `kind` property', () => {
                expect(Action.hasKind({ I: 'm not an action' }, '')).to.be.false;
            });
        });
    });

    describe('ActionMessage', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const message: ActionMessage = { action: { kind: 'myAction' }, clientId: 'someId' };
                expect(ActionMessage.is(message)).to.be.true;
            });
            it('should return false for undefined', () => {
                expect(ActionMessage.is(undefined)).to.be.false;
            });
            it('should return false for an object that does have all required interface properties', () => {
                const notAnActionMessage = 'notAnActionMessage';
                expect(ActionMessage.is(notAnActionMessage)).to.be.false;
            });
            it('should return true for an object that has all required interface properties an `action` property that passes the typeguard check', () => {
                const message: ActionMessage = { action: customAction, clientId: 'someId' };
                expect(ActionMessage.is(message, isSomeCustomAction)).to.be.true;
            });
            it('should return false for an object that has all required interface properties but does not have an `action` property that passes the typeguard check  ', () => {
                const message: ActionMessage = { action: { kind: 'myAction' }, clientId: 'someId' };
                expect(ActionMessage.is(message, isSomeCustomAction)).to.be.false;
            });
        });
    });

    const requestAction: SomeRequestAction = { kind: 'someRequest', requestId: '' };

    describe('RequestAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(RequestAction.is(requestAction)).to.be.true;
            });
            it('should return false for undefined', () => {
                expect(RequestAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestAction.is(customAction)).to.be.false;
            });
        });

        describe('hasKind', () => {
            it('should return true for an object having the correct type and a value for all required interface properties and a `kind` property that matches the given value', () => {
                expect(RequestAction.hasKind(requestAction, 'someRequest')).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestAction.hasKind(undefined, '')).to.be.false;
            });
            it('should return false for an object having the correct type and a value for all required interface properties but having a `kind` property that does not match the given value', () => {
                expect(RequestAction.hasKind(requestAction, 'someOtherKind')).to.be.false;
            });
            it('should return for an object not having the correct type and value for all required interface properties', () => {
                expect(RequestAction.hasKind({ I: 'm not an action' }, '')).to.be.false;
            });
        });
    });

    const responseAction: SomeResponseAction = { kind: 'someResponse', responseId: '' };
    describe('ResponseAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(ResponseAction.is(responseAction)).to.be.true;
            });
            it('should return false for undefined', () => {
                expect(ResponseAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ResponseAction.is(customAction)).to.be.false;
            });
        });

        describe('hasValidResponseId', () => {
            it('should return true for an object having the correct type and a value for all required interface properties and a non-empty value for `requestId`', () => {
                const nonEmptyResponse = { ...responseAction, responseId: 'nonempty' };
                expect(ResponseAction.hasValidResponseId(nonEmptyResponse)).to.be.true;
            });
            it('should return false for an object having the correct type and a value for all required interface properties and an empty value for `requestId`', () => {
                expect(ResponseAction.hasValidResponseId(responseAction)).to.be.false;
            });
            it('should return false for `undefined`', () => {
                expect(ResponseAction.hasValidResponseId(undefined)).to.be.false;
            });
        });
    });

    const rejectAction: RejectAction = { kind: 'rejectRequest', message: '', responseId: '' };
    describe('RejectAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(RejectAction.is(rejectAction)).to.be.true;
            });
            it('should return false for undefined', () => {
                expect(RejectAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RejectAction.is(customAction)).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected = { kind: RejectAction.KIND, responseId: '', message: 'someMessage' };
                const { message } = expected;
                expect(RejectAction.create(message)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected = { kind: RejectAction.KIND, responseId: 'someId', message: 'someMessage', detail: 'details' };
                const { detail, responseId, message } = expected;
                expect(RejectAction.create(message, { detail, responseId })).to.deep.equals(expected);
            });
        });
    });

    const operation: Operation = { kind: 'someOperation', isOperation: true };
    describe('Operation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(Operation.is(operation)).to.be.true;
            });
            it('should return false for undefined', () => {
                expect(Operation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(Operation.is(customAction)).to.be.false;
            });
        });

        describe('hasKind', () => {
            it('should return true for an object having the correct type and a value for all required interface properties and a `kind` property that matches the given value', () => {
                expect(Operation.hasKind(operation, operation.kind)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(Operation.hasKind(undefined, '')).to.be.false;
            });
            it('should return false for an object having the correct type and a value for all required interface properties but having a `kind` property that does not match the given value', () => {
                expect(Operation.hasKind(operation, 'someOtherKind')).to.be.false;
            });
            it('should return false for an object not having the correct type and value for all required interface properties', () => {
                expect(Operation.hasKind({ I: 'm not an action' }, '')).to.be.false;
            });
        });
    });

    const compoundOperation: CompoundOperation = { kind: 'compound', isOperation: true, operationList: [] };
    describe('CompoundOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(CompoundOperation.is(compoundOperation)).to.be.true;
            });
            it('should return false for undefined', () => {
                expect(CompoundOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(CompoundOperation.is(customAction)).to.be.false;
            });
        });
        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const operationList = [operation];
                const expected = { kind: CompoundOperation.KIND, isOperation: true, operationList };
                expect(CompoundOperation.create(operationList)).to.deep.equals(expected);
            });
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
const isSomeCustomAction = (object: unknown): object is SomeCustomAction =>
    AnyObject.is(object) && 'kind' in object && object.kind === 'custom';
