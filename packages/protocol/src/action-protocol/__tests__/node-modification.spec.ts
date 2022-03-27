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
import { Dimension, Point } from 'sprotty-protocol';
import { ChangeBoundsOperation, ChangeContainerOperation } from '../node-modification';

/**
 * The schema of an SModelElement describes its serializable form. The actual class-based model is derived
 * its schema whenever the client or server deserializes a received schema`.
 * Each model element must have a unique ID and a type that is used on the client to  look up its view.
 */

describe('Node modification actions', () => {
    describe('ChangeBoundsOperation', () => {
        it('ChangeBoundsOperation.is with valid action type', () => {
            const operation: ChangeBoundsOperation = {
                kind: 'changeBounds',
                isOperation: true,
                newBounds: []
            };
            expect(ChangeBoundsOperation.is(operation)).to.be.true;
        });
        it('ChangeBoundsOperation.is with undefined', () => {
            expect(ChangeBoundsOperation.is(undefined)).to.be.false;
        });
        it('ChangeBoundsOperation.is with invalid action type', () => {
            expect(ChangeBoundsOperation.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('ChangeBoundsOperation.create with required args', () => {
            const expected: ChangeBoundsOperation = {
                kind: 'changeBounds',
                isOperation: true,
                newBounds: [{ elementId: 'someElement', newSize: Dimension.EMPTY, newPosition: Point.ORIGIN }]
            };
            const { newBounds } = expected;
            expect(ChangeBoundsOperation.create(newBounds)).to.deep.equals(expected);
        });
    });
});

describe('ChangeContainerOperation', () => {
    it('ChangeContainerOperation.is with valid action type', () => {
        const action: ChangeContainerOperation = {
            kind: 'changeContainer',
            isOperation: true,
            elementId: '',
            targetContainerId: ''
        };
        expect(ChangeContainerOperation.is(action)).to.be.true;
    });
    it('ChangeContainerOperation.is with undefined', () => {
        expect(ChangeContainerOperation.is(undefined)).to.be.false;
    });
    it('ChangeContainerOperation.is with invalid action type', () => {
        expect(ChangeContainerOperation.is({ kind: 'notTheRightOne' })).to.be.false;
    });
    it('ChangeContainerOperation.create with required args', () => {
        const expected: ChangeContainerOperation = {
            kind: 'changeContainer',
            isOperation: true,
            elementId: 'myElement',
            targetContainerId: 'myContainer'
        };
        const { elementId, targetContainerId } = expected;
        expect(ChangeContainerOperation.create({ elementId, targetContainerId })).to.deep.equals(expected);
    });
    it('ChangeContainerOperation.create with optional args', () => {
        const expected: ChangeContainerOperation = {
            kind: 'changeContainer',
            isOperation: true,
            elementId: 'myElement',
            targetContainerId: 'myContainer',
            location: Point.ORIGIN
        };
        const { elementId, targetContainerId, location } = expected;
        expect(ChangeContainerOperation.create({ elementId, targetContainerId, location })).to.deep.equals(expected);
    });
});
