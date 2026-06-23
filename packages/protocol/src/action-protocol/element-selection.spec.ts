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
import { SelectAction, SelectAllAction } from './element-selection';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element selection actions', () => {
    describe('SelectAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SelectAction = {
                    kind: 'elementSelected',
                    selectedElementsIDs: [],
                    deselectedElementsIDs: []
                };
                expect(SelectAction.is(action)).toBe(true);
            });
            it('should return false for `undefined`', () => {
                expect(SelectAction.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SelectAction.is({ kind: 'notTheRightOne' })).toBe(false);
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SelectAction = {
                    kind: 'elementSelected',
                    selectedElementsIDs: [],
                    deselectedElementsIDs: [],
                    deselectAll: false
                };
                expect(SelectAction.create()).toEqual(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SelectAction = {
                    kind: 'elementSelected',
                    selectedElementsIDs: ['selected'],
                    deselectedElementsIDs: ['deselected'],
                    deselectAll: false
                };
                const { selectedElementsIDs, deselectedElementsIDs } = expected;
                expect(SelectAction.create({ deselectedElementsIDs, selectedElementsIDs })).toEqual(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments: deselectAll', () => {
                const expected: SelectAction = {
                    kind: 'elementSelected',
                    selectedElementsIDs: ['selected'],
                    deselectedElementsIDs: [],
                    deselectAll: true
                };
                const { selectedElementsIDs } = expected;
                expect(SelectAction.create({ deselectedElementsIDs: true, selectedElementsIDs })).toEqual(expected);
            });
        });
        describe('addSelection', () => {
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SelectAction = {
                    kind: 'elementSelected',
                    selectedElementsIDs: ['selected'],
                    deselectedElementsIDs: [],
                    deselectAll: false
                };
                const { selectedElementsIDs } = expected;
                expect(SelectAction.addSelection(selectedElementsIDs)).toEqual(expected);
            });
        });
        describe('removeSelection', () => {
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SelectAction = {
                    kind: 'elementSelected',
                    selectedElementsIDs: [],
                    deselectedElementsIDs: ['deselected'],
                    deselectAll: false
                };
                const { deselectedElementsIDs } = expected;
                expect(SelectAction.removeSelection(deselectedElementsIDs)).toEqual(expected);
            });
        });
        describe('setSelection', () => {
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SelectAction = {
                    kind: 'elementSelected',
                    selectedElementsIDs: ['selected'],
                    deselectedElementsIDs: [],
                    deselectAll: true
                };
                const { selectedElementsIDs } = expected;
                expect(SelectAction.setSelection(selectedElementsIDs)).toEqual(expected);
            });
        });
    });

    describe('SelectAllAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SelectAllAction = {
                    kind: 'allSelected',
                    select: true
                };
                expect(SelectAllAction.is(action)).toBe(true);
            });
            it('should return false for `undefined`', () => {
                expect(SelectAllAction.is(undefined)).toBe(false);
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SelectAllAction.is({ kind: 'notTheRightOne' })).toBe(false);
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SelectAllAction = {
                    kind: 'allSelected',
                    select: true
                };
                expect(SelectAllAction.create()).toEqual(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SelectAllAction = {
                    kind: 'allSelected',
                    select: false
                };
                const { select } = expected;
                expect(SelectAllAction.create(select)).toEqual(expected);
            });
        });
    });
});
