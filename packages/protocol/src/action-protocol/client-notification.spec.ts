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
import { ServerMessageAction, ServerStatusAction } from './client-notification';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Client notification actions', () => {
    describe('ServerStatusAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const statusAction: ServerStatusAction = { kind: 'serverStatus', message: 'Some', severity: 'INFO' };
                expect(ServerStatusAction.is(statusAction)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(ServerStatusAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ServerStatusAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const message = 'someMessage';
                const expected: ServerStatusAction = { kind: ServerStatusAction.KIND, message, severity: 'INFO' };
                expect(ServerStatusAction.create(message)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: ServerStatusAction = {
                    kind: ServerStatusAction.KIND,
                    message: 'someMessage',
                    severity: 'ERROR',
                    timeout: 5
                };
                const { message, severity, timeout } = expected;
                expect(ServerStatusAction.create(message, { severity, timeout })).to.deep.equals(expected);
            });
        });
    });

    describe('ServerMessageAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const messageAction: ServerMessageAction = { kind: 'serverMessage', message: '', severity: 'INFO' };
                expect(ServerMessageAction.is(messageAction)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(ServerMessageAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ServerMessageAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const message = 'someMessage';
                const expected: ServerMessageAction = { kind: ServerMessageAction.KIND, message, severity: 'INFO' };
                expect(ServerMessageAction.create(message)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: ServerMessageAction = {
                    kind: ServerMessageAction.KIND,
                    message: 'someMessage',
                    details: 'details',
                    severity: 'ERROR',
                    timeout: 5
                };
                const { message, severity, timeout, details } = expected;
                expect(ServerMessageAction.create(message, { severity, timeout, details })).to.deep.equals(expected);
            });
        });
    });
});
