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
import { AnyObject, hasArrayProp, hasBooleanProp, hasNumberProp, hasObjectProp, hasStringProp } from './type-util';
describe('TypeUtil', () => {
    describe('AnyObject', () => {
        it('AnyObject.is with empty object', () => {
            expect(AnyObject.is({})).to.be.true;
        });
        it('AnyObject.is with valid object', () => {
            expect(AnyObject.is({ a: 'a', b: 5 })).to.be.true;
        });
        it('AnyObject.is with undefined', () => {
            expect(AnyObject.is(undefined)).to.be.false;
        });
        it('AnyObject.is with null', () => {
            // eslint-disable-next-line no-null/no-null
            expect(AnyObject.is(null)).to.be.false;
        });
        it('AnyObject.is with non object types', () => {
            expect(AnyObject.is('')).to.be.false;
            expect(AnyObject.is(5)).to.be.false;
            expect(AnyObject.is(true)).to.be.false;

            expect(
                AnyObject.is(() => {
                    /**/
                })
            ).to.be.false;
            expect(AnyObject.is(Symbol('Symbol')));
        });
    });

    it('hasStringProp with object with matching property', () => {
        expect(hasStringProp({ someProp: 'someKey' }, 'someProp')).to.be.true;
    });
    it('hasStringProp with matching property but wrong type', () => {
        expect(hasStringProp({ someProp: 123 }, 'someProp')).to.be.false;
    });

    it('hasBooleanProp with object with matching property', () => {
        expect(hasBooleanProp({ someProp: true }, 'someProp')).to.be.true;
    });
    it('hasBooleanProp with matching property but wrong type', () => {
        expect(hasBooleanProp({ someProp: undefined }, 'someProp')).to.be.false;
    });

    it('hasNumberProp with object with matching property', () => {
        expect(hasNumberProp({ someProp: 123 }, 'someProp')).to.be.true;
    });
    it('hasNumberProp with matching property but wrong type', () => {
        expect(hasNumberProp({ someProp: '123' }, 'someProp')).to.be.false;
    });

    it('hasObjectProp with object with matching property', () => {
        expect(hasObjectProp({ someProp: { value: 'someKey' } }, 'someProp')).to.be.true;
    });
    it('hasObjectProp with matching property but wrong type', () => {
        expect(hasObjectProp({ someProp: 123 }, 'someProp')).to.be.false;
    });

    it('hasArrayProp with object with matching property', () => {
        expect(hasArrayProp({ someProp: ['some', 'prop'] }, 'someProp')).to.be.true;
    });
    it('hasArrayProp with matching property but wrong type', () => {
        expect(hasArrayProp({ someProp: 123 }, 'someProp')).to.be.false;
    });
});
