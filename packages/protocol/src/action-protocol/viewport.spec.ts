/********************************************************************************
 * Copyright (c) 2022-2025 STMicroelectronics and others.
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
import { CenterAction, FitToScreenAction, MoveViewportAction } from './viewport';

describe('Viewport Actions', () => {
    describe('CenterAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: CenterAction = {
                    kind: 'center',
                    elementIds: [],
                    animate: true,
                    retainZoom: true
                };
                expect(CenterAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(CenterAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(CenterAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: CenterAction = {
                    kind: 'center',
                    elementIds: ['my', 'elements'],
                    animate: true,
                    retainZoom: false
                };
                const { elementIds } = expected;
                expect(CenterAction.create(elementIds)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: CenterAction = {
                    kind: 'center',
                    elementIds: ['my', 'elements'],
                    animate: false,
                    retainZoom: true
                };
                const { elementIds, animate, retainZoom } = expected;
                expect(CenterAction.create(elementIds, { animate, retainZoom })).to.deep.equals(expected);
            });
        });
    });

    describe('FitToScreenAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: FitToScreenAction = {
                    kind: 'fit',
                    elementIds: [],
                    animate: true
                };
                expect(FitToScreenAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(FitToScreenAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(FitToScreenAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: FitToScreenAction = {
                    kind: 'fit',
                    elementIds: ['my', 'elements'],
                    animate: true
                };
                const { elementIds } = expected;
                expect(FitToScreenAction.create(elementIds)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: FitToScreenAction = {
                    kind: 'fit',
                    elementIds: ['my', 'elements'],
                    animate: false,
                    maxZoom: 4,
                    padding: 12
                };
                const { elementIds, maxZoom, padding, animate } = expected;
                expect(FitToScreenAction.create(elementIds, { maxZoom, padding, animate })).to.deep.equals(expected);
            });
        });
    });

    describe('MoveViewportAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: MoveViewportAction = {
                    kind: 'moveViewport',
                    moveX: 0,
                    moveY: 0
                };
                expect(MoveViewportAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(MoveViewportAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(MoveViewportAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: MoveViewportAction = {
                    kind: 'moveViewport',
                    moveX: 0,
                    moveY: 0
                };
                const { moveX, moveY } = expected;
                expect(MoveViewportAction.create({ moveX, moveY })).to.deep.equals(expected);
            });
        });
    });
});
