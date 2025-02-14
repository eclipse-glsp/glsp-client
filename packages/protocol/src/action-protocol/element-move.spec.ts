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
import { MoveElementAction } from './element-move';

/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('Element move actions', () => {
    describe('MoveElementAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: MoveElementAction = {
                    kind: 'moveElement',
                    elementIds: ['someId'],
                    moveX: 0,
                    moveY: 0,
                    snap: true
                };
                expect(MoveElementAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(MoveElementAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(MoveElementAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: MoveElementAction = {
                    kind: 'moveElement',
                    elementIds: ['someId'],
                    moveX: 0,
                    moveY: 0,
                    snap: true
                };
                const { elementIds, moveX, moveY } = expected;
                expect(MoveElementAction.create({ elementIds, moveX, moveY })).to.deep.equals(expected);
            });
        });
    });
});
