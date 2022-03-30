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
import { SetEditModeAction } from './model-edit-mode';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */
describe('SetEditModeAction', () => {
    describe('is', () => {
        it('should return true for an object having the correct type and a value for all required interface properties', () => {
            const action: SetEditModeAction = {
                kind: 'setEditMode',
                editMode: ''
            };
            expect(SetEditModeAction.is(action)).to.be.true;
        });
        it('should return false for `undefined`', () => {
            expect(SetEditModeAction.is(undefined)).to.be.false;
        });
        it('should return false for an object that does not have all required interface properties', () => {
            expect(SetEditModeAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
    });

    describe('create', () => {
        it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
            const expected: SetEditModeAction = {
                kind: 'setEditMode',
                editMode: 'myMode'
            };
            const { editMode } = expected;
            expect(SetEditModeAction.create(editMode)).to.deep.equals(expected);
        });
    });
});
