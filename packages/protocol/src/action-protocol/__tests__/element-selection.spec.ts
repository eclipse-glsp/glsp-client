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
import { SelectAction, SelectAllAction } from '../element-selection';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element selection actions', () => {
    describe('SelectAction', () => {
        it('SelectAction.is with valid action type', () => {
            const action: SelectAction = {
                kind: 'elementSelected',
                selectedElementsIDs: [],
                deselectedElementsIDs: []
            };
            expect(SelectAction.is(action)).to.be.true;
        });
        it('SelectAction.is with undefined', () => {
            expect(SelectAction.is(undefined)).to.be.false;
        });
        it('SelectAction.is with invalid action type', () => {
            expect(SelectAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SelectAction.create with required args', () => {
            const expected: SelectAction = {
                kind: 'elementSelected',
                selectedElementsIDs: [],
                deselectedElementsIDs: []
            };
            expect(SelectAction.create()).to.deep.equals(expected);
        });
        it('SelectAction.create with optional args', () => {
            const expected: SelectAction = {
                kind: 'elementSelected',
                selectedElementsIDs: ['selected'],
                deselectedElementsIDs: ['deselected']
            };
            const { selectedElementsIDs, deselectedElementsIDs } = expected;
            expect(SelectAction.create({ deselectedElementsIDs, selectedElementsIDs })).to.deep.equals(expected);
        });
    });

    describe('SelectAllAction', () => {
        it('SelectAllAction.is with valid action type', () => {
            const action: SelectAllAction = {
                kind: 'allSelected',
                select: true
            };
            expect(SelectAllAction.is(action)).to.be.true;
        });
        it('SelectAllAction.is with undefined', () => {
            expect(SelectAllAction.is(undefined)).to.be.false;
        });
        it('SelectAllAction.is with invalid action type', () => {
            expect(SelectAllAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SelectAllAction.create with required args', () => {
            const expected: SelectAllAction = {
                kind: 'allSelected',
                select: true
            };
            expect(SelectAllAction.create()).to.deep.equals(expected);
        });
        it('SelectAllAction.create with optional args', () => {
            const expected: SelectAllAction = {
                kind: 'allSelected',
                select: false
            };
            const { select } = expected;
            expect(SelectAllAction.create(select)).to.deep.equals(expected);
        });
    });
});
