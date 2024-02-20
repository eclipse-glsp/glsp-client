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
import { EndProgressAction, MessageAction, StartProgressAction, StatusAction, UpdateProgressAction } from './client-notification';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Client notification actions', () => {
    describe('StatusAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const statusAction: StatusAction = { kind: StatusAction.KIND, message: 'Some', severity: 'INFO' };
                expect(StatusAction.is(statusAction)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(StatusAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(StatusAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const message = 'someMessage';
                const expected: StatusAction = { kind: StatusAction.KIND, message, severity: 'INFO' };
                expect(StatusAction.create(message)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: StatusAction = {
                    kind: StatusAction.KIND,
                    message: 'someMessage',
                    severity: 'ERROR',
                    timeout: 5
                };
                const { message, severity, timeout } = expected;
                expect(StatusAction.create(message, { severity, timeout })).to.deep.equals(expected);
            });
        });
    });

    describe('MessageAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const messageAction: MessageAction = { kind: MessageAction.KIND, message: '', severity: 'INFO' };
                expect(MessageAction.is(messageAction)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(MessageAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(MessageAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const message = 'someMessage';
                const expected: MessageAction = { kind: MessageAction.KIND, message, severity: 'INFO' };
                expect(MessageAction.create(message)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: MessageAction = {
                    kind: MessageAction.KIND,
                    message: 'someMessage',
                    details: 'details',
                    severity: 'ERROR'
                };
                const { message, severity, details } = expected;
                expect(MessageAction.create(message, { severity, details })).to.deep.equals(expected);
            });
        });
    });

    describe('StartProgressAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const messageAction: StartProgressAction = { kind: 'startProgress', progressId: '1', title: 'Progress title' };
                expect(StartProgressAction.is(messageAction)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(StartProgressAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(StartProgressAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const progressId = '1';
                const title = 'Progress title';
                const expected: StartProgressAction = { kind: StartProgressAction.KIND, progressId, title };
                expect(StartProgressAction.create({ progressId, title })).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: StartProgressAction = {
                    kind: StartProgressAction.KIND,
                    progressId: '1',
                    title: 'Progress title',
                    message: 'Some message',
                    percentage: 10
                };
                const { progressId, title, message, percentage } = expected;
                expect(StartProgressAction.create({ progressId, title, message, percentage })).to.deep.equals(expected);
            });
        });
    });

    describe('UpdateProgressAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const messageAction: UpdateProgressAction = { kind: 'updateProgress', progressId: '1' };
                expect(UpdateProgressAction.is(messageAction)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(UpdateProgressAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(UpdateProgressAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const progressId = '1';
                const expected: UpdateProgressAction = { kind: UpdateProgressAction.KIND, progressId };
                expect(UpdateProgressAction.create(progressId)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: UpdateProgressAction = {
                    kind: UpdateProgressAction.KIND,
                    progressId: '1',
                    message: 'Some message',
                    percentage: 10
                };
                const { progressId, message, percentage } = expected;
                expect(UpdateProgressAction.create(progressId, { message, percentage })).to.deep.equals(expected);
            });
        });
    });

    describe('EndProgressAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const messageAction: EndProgressAction = { kind: 'endProgress', progressId: '1' };
                expect(EndProgressAction.is(messageAction)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(EndProgressAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(EndProgressAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const progressId = '1';
                const expected: EndProgressAction = { kind: EndProgressAction.KIND, progressId, message: undefined };
                expect(EndProgressAction.create(progressId)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: EndProgressAction = {
                    kind: EndProgressAction.KIND,
                    progressId: '1',
                    message: 'Some message'
                };
                const { progressId, message } = expected;
                expect(EndProgressAction.create(progressId, message)).to.deep.equals(expected);
            });
        });
    });
});
