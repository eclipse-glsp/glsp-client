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
import { RedoAction, UndoAction } from './undo-redo';

describe('Undo & Redo Actions', () => {
    describe('UndoAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: UndoAction = {
                    kind: 'glspUndo'
                };
                expect(UndoAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(UndoAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(UndoAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: UndoAction = {
                    kind: 'glspUndo'
                };
                expect(UndoAction.create()).to.deep.equals(expected);
            });
        });
    });

    describe('RedoAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RedoAction = {
                    kind: 'glspRedo'
                };
                expect(RedoAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RedoAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RedoAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: RedoAction = {
                    kind: 'glspRedo'
                };
                expect(RedoAction.create()).to.deep.equals(expected);
            });
        });
    });
});
