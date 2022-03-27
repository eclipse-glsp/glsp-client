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
import { CenterAction, FitToScreenAction } from '../viewport';

describe('Viewport Actions', () => {
    describe('CenterAction', () => {
        it('CenterAction.is with valid action type', () => {
            const action: CenterAction = {
                kind: 'center',
                elementIds: [],
                animate: true,
                retainZoom: true
            };
            expect(CenterAction.is(action)).to.be.true;
        });
        it('CenterAction.is with undefined', () => {
            expect(CenterAction.is(undefined)).to.be.false;
        });
        it('CenterAction.is with invalid action type', () => {
            expect(CenterAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('CenterAction.create with required args', () => {
            const expected: CenterAction = {
                kind: 'center',
                elementIds: ['my', 'elements'],
                animate: true,
                retainZoom: false
            };
            const { elementIds } = expected;
            expect(CenterAction.create(elementIds)).to.deep.equals(expected);
        });
        it('CenterAction.create with optional args', () => {
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

    describe('FitToScreenAction', () => {
        it('FitToScreenAction.is with valid action type', () => {
            const action: FitToScreenAction = {
                kind: 'fit',
                elementIds: [],
                animate: true
            };
            expect(FitToScreenAction.is(action)).to.be.true;
        });
        it('FitToScreenAction.is with undefined', () => {
            expect(FitToScreenAction.is(undefined)).to.be.false;
        });
        it('FitToScreenAction.is with invalid action type', () => {
            expect(FitToScreenAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('FitToScreenAction.create with required args', () => {
            const expected: FitToScreenAction = {
                kind: 'fit',
                elementIds: ['my', 'elements'],
                animate: true
            };
            const { elementIds } = expected;
            expect(FitToScreenAction.create(elementIds)).to.deep.equals(expected);
        });
        it('FitToScreenAction.create with optional args', () => {
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
