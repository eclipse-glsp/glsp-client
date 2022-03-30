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
import { RedoOperation, UndoOperation } from './undo-redo';

describe('Undo & Redo Actions', () => {
    describe('UndoOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: UndoOperation = {
                    kind: 'glspUndo',
                    isOperation: true
                };
                expect(UndoOperation.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(UndoOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(UndoOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: UndoOperation = {
                    kind: 'glspUndo',
                    isOperation: true
                };
                expect(UndoOperation.create()).to.deep.equals(expected);
            });
        });
    });

    describe('RedoOperation', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RedoOperation = {
                    kind: 'glspRedo',
                    isOperation: true
                };
                expect(RedoOperation.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RedoOperation.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RedoOperation.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: RedoOperation = {
                    kind: 'glspRedo',
                    isOperation: true
                };
                expect(RedoOperation.create()).to.deep.equals(expected);
            });
        });
    });
});
