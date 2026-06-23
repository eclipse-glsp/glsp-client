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
                expect(Action.is(action)).toBe(true);
            });
            it('should return false for `undefined`', () => {
                expect(Action.is(undefined)).toBe(false);
            });
            it('should return false for an object having a `kind` property with incorrect type', () => {
                const notAnAction = { kind: 5 };
                expect(Action.is(notAnAction)).toBe(false);
            });
        });
        describe('hasKind', () => {
            it('should return true for an object having a `kind` property that matches the given value', () => {
                const action = { kind: 'myAction' };
                expect(Action.hasKind(action, 'myAction')).toBe(true);
            });
            it('should return false for undefined', () => {
                expect(Action.hasKind(undefined, '')).toBe(false);
            });
            it('should return false for an object having a "kind" property that does not match the given value', () => {
                const action = { kind: 'myAction' };
                expect(Action.hasKind(action, 'someOtherKind')).toBe(false);
            });
            it('should return false for an object not having a `kind` property', () => {
                expect(Action.hasKind({ I: 'm not an action' }, '')).toBe(false);
            });
        });
    });

    describe('ActionMessage', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const message: ActionMessage = { action: { kind: 'myAction' }, clientId: 'someId' };
                expect(ActionMessage.is(message)).toBe(true);
            });
            it('should return false for undefined', () => {
                expect(ActionMessage.is(undefined)).toBe(false);
            });
            it('should return false for an object that does have all required interface properties', () => {
                const notAnActionMessage = 'notAnActionMessage';
                expect(ActionMessage.is(notAnActionMessage)).toBe(false);
            });
            it('should return true for an object that has all required interface properties an `action` property that passes the typeguard check', () => {
                const message: ActionMessage = { action: customAction, clientId: 'someId' };
                expect(ActionMessage.is(message, isSomeCustomAction)).toBe(true);
            });
            it('should return false for an object that has all required interface properties but does not have an `action` property that passes the typeguard check  ', () => {
                const message: ActionMessage = { action: { kind: 'myAction' }, clientId: 'someId' };
                expect(ActionMessage.is(message, isSomeCustomAction)).toBe(false);
            });
        });
    });

    const requestAction: SomeRequestAction = { kind: 'someRequest', requestId: '' };

    describe('RequestAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(RequestAction.is(requestAction)).toBe(true);
            });
            it('should return false for undefined', () => {
                expect(RequestAction.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestAction.is(customAction)).toBe(false);
            });
        });

        describe('hasKind', () => {
            it('should return true for an object having the correct type and a value for all required interface properties and a `kind` property that matches the given value', () => {
                expect(RequestAction.hasKind(requestAction, 'someRequest')).toBe(true);
            });
            it('should return false for `undefined`', () => {
                expect(RequestAction.hasKind(undefined, '')).toBe(false);
            });
            it('should return false for an object having the correct type and a value for all required interface properties but having a `kind` property that does not match the given value', () => {
                expect(RequestAction.hasKind(requestAction, 'someOtherKind')).toBe(false);
            });
            it('should return for an object not having the correct type and value for all required interface properties', () => {
                expect(RequestAction.hasKind({ I: 'm not an action' }, '')).toBe(false);
            });
        });
    });

    const responseAction: SomeResponseAction = { kind: 'someResponse', responseId: '' };
    describe('ResponseAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(ResponseAction.is(responseAction)).toBe(true);
            });
            it('should return false for undefined', () => {
                expect(ResponseAction.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ResponseAction.is(customAction)).toBe(false);
            });
        });

        describe('hasValidResponseId', () => {
            it('should return true for an object having the correct type and a value for all required interface properties and a non-empty value for `requestId`', () => {
                const nonEmptyResponse = { ...responseAction, responseId: 'nonempty' };
                expect(ResponseAction.hasValidResponseId(nonEmptyResponse)).toBe(true);
            });
            it('should return false for an object having the correct type and a value for all required interface properties and an empty value for `requestId`', () => {
                expect(ResponseAction.hasValidResponseId(responseAction)).toBe(false);
            });
            it('should return false for `undefined`', () => {
                expect(ResponseAction.hasValidResponseId(undefined)).toBe(false);
            });
        });
    });

    const rejectAction: RejectAction = { kind: 'rejectRequest', message: '', responseId: '' };
    describe('RejectAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(RejectAction.is(rejectAction)).toBe(true);
            });
            it('should return false for undefined', () => {
                expect(RejectAction.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RejectAction.is(customAction)).toBe(false);
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected = { kind: RejectAction.KIND, responseId: '', message: 'someMessage' };
                const { message } = expected;
                expect(RejectAction.create(message)).toEqual(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected = { kind: RejectAction.KIND, responseId: 'someId', message: 'someMessage', detail: 'details' };
                const { detail, responseId, message } = expected;
                expect(RejectAction.create(message, { detail, responseId })).toEqual(expected);
            });
        });
    });

    const operation: Operation = { kind: 'someOperation', isOperation: true };
    describe('Operation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(Operation.is(operation)).toBe(true);
            });
            it('should return false for undefined', () => {
                expect(Operation.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(Operation.is(customAction)).toBe(false);
            });
        });

        describe('hasKind', () => {
            it('should return true for an object having the correct type and a value for all required interface properties and a `kind` property that matches the given value', () => {
                expect(Operation.hasKind(operation, operation.kind)).toBe(true);
            });
            it('should return false for `undefined`', () => {
                expect(Operation.hasKind(undefined, '')).toBe(false);
            });
            it('should return false for an object having the correct type and a value for all required interface properties but having a `kind` property that does not match the given value', () => {
                expect(Operation.hasKind(operation, 'someOtherKind')).toBe(false);
            });
            it('should return false for an object not having the correct type and value for all required interface properties', () => {
                expect(Operation.hasKind({ I: 'm not an action' }, '')).toBe(false);
            });
        });
    });

    const compoundOperation: CompoundOperation = { kind: 'compound', isOperation: true, operationList: [] };
    describe('CompoundOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                expect(CompoundOperation.is(compoundOperation)).toBe(true);
            });
            it('should return false for undefined', () => {
                expect(CompoundOperation.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(CompoundOperation.is(customAction)).toBe(false);
            });
        });
        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const operationList = [operation];
                const expected = { kind: CompoundOperation.KIND, isOperation: true, operationList };
                expect(CompoundOperation.create(operationList)).toEqual(expected);
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
