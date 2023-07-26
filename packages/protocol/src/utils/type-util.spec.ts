/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
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
import { AnyObject, hasArrayProp, hasBooleanProp, hasFunctionProp, hasNumberProp, hasObjectProp, hasStringProp } from './type-util';

describe('TypeUtil', () => {
    describe('AnyObject', () => {
        describe('is', () => {
            it('should return true for an empty object', () => {
                expect(AnyObject.is({})).to.be.true;
            });
            it('should return true for an object with arbitrary properties', () => {
                expect(AnyObject.is({ a: 'a', b: 5 })).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(AnyObject.is(undefined)).to.be.false;
            });
            it('should return false for `null`', () => {
                // eslint-disable-next-line no-null/no-null
                expect(AnyObject.is(null)).to.be.false;
            });
            it('should return false for any object of primitive type', () => {
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
    });

    describe('hasStringProp', () => {
        it('should return true for an object that has a property that matches the given key and type', () => {
            expect(hasStringProp({ someProp: 'someKey' }, 'someProp')).to.be.true;
        });
        it('should return false for an object that has a property that matches the given but not the given type', () => {
            expect(hasStringProp({ someProp: 123 }, 'someProp')).to.be.false;
        });
        it('should return false for an object that does not have a property that matches the given key', () => {
            expect(hasStringProp({ anotherProp: 123 }, 'someProp')).to.be.false;
        });
        it('should return true for an object that does not have a matching key when using the optional flag', () => {
            expect(hasStringProp({ anotherProp: 123 }, 'someProp', true)).to.be.true;
        });
        it('should return false for an object that has a property with matching name but invalid type when using the optional flag', () => {
            expect(hasStringProp({ someProp: 123 }, 'someProp', true)).to.be.false;
        });
        it('should return true for an object that has a property with matching name but without value when using the optional flag', () => {
            expect(hasStringProp({ someProp: undefined }, 'someProp', true)).to.be.true;
        });
        it('should return true for an object that has a property that matches the given key and type when using the optional flag', () => {
            expect(hasStringProp({ someProp: 'someKey' }, 'someProp', true)).to.be.true;
        });
    });

    describe('hasBooleanProp', () => {
        it('should return true for an object that has a property that matches the given key and type', () => {
            expect(hasBooleanProp({ someProp: true }, 'someProp')).to.be.true;
        });
        it('should return false for an object that has a property that matches the given but not the given type', () => {
            expect(hasBooleanProp({ someProp: 123 }, 'someProp')).to.be.false;
        });
        it('should return false for an object that does not have a property that matches the given key', () => {
            expect(hasBooleanProp({ anotherProp: 123 }, 'someProp')).to.be.false;
        });
        it('should return true for an object that does not have a matching key when using the optional flag', () => {
            expect(hasBooleanProp({ anotherProp: 123 }, 'someProp', true)).to.be.true;
        });
        it('should return false for an object that has a property with matching name but invalid type when using the optional flag', () => {
            expect(hasBooleanProp({ someProp: 123 }, 'someProp', true)).to.be.false;
        });
        it('should return true for an object that has a property with matching name but without value when using the optional flag', () => {
            expect(hasBooleanProp({ someProp: undefined }, 'someProp', true)).to.be.true;
        });
        it('should return true for an object that has a property that matches the given key and type when using the optional flag', () => {
            expect(hasBooleanProp({ someProp: true }, 'someProp', true)).to.be.true;
        });
    });

    describe('hasNumberProp', () => {
        it('should return true for an object that has a property that matches the given key and type', () => {
            expect(hasNumberProp({ someProp: 123 }, 'someProp')).to.be.true;
        });
        it('should return false for an object that has a property that matches the given but not the given type', () => {
            expect(hasNumberProp({ someProp: '123' }, 'someProp')).to.be.false;
        });
        it('should return false for an object that does not have a property that matches the given key', () => {
            expect(hasNumberProp({ anotherProp: 123 }, 'someProp')).to.be.false;
        });
        it('should return true for an object that does not have a matching key when using the optional flag', () => {
            expect(hasNumberProp({ anotherProp: 123 }, 'someProp', true)).to.be.true;
        });
        it('should return false for an object that has a property with matching name but invalid type when using the optional flag', () => {
            expect(hasNumberProp({ someProp: '123' }, 'someProp', true)).to.be.false;
        });
        it('should return true for an object that has a property with matching name but without value when using the optional flag', () => {
            expect(hasNumberProp({ someProp: undefined }, 'someProp', true)).to.be.true;
        });
        it('should return true for an object that has a property that matches the given key and type when using the optional flag', () => {
            expect(hasNumberProp({ someProp: 123 }, 'someProp', true)).to.be.true;
        });
    });

    describe('hasObjectProp', () => {
        it('should return true for an object that has a property that matches the given key and type', () => {
            expect(hasObjectProp({ someProp: { value: 'someKey' } }, 'someProp')).to.be.true;
        });
        it('should return false for an object that has a property that matches the given but not the given type', () => {
            expect(hasObjectProp({ someProp: '123' }, 'someProp')).to.be.false;
        });
        it('should return false for an object that does not have a property that matches the given key', () => {
            expect(hasObjectProp({ anotherProp: 123 }, 'someProp')).to.be.false;
        });
        it('should return true for an object that does not have a matching key when using the optional flag', () => {
            expect(hasObjectProp({ anotherProp: 123 }, 'someProp', true)).to.be.true;
        });
        it('should return false for an object that has a property with matching name but invalid type when using the optional flag', () => {
            expect(hasObjectProp({ someProp: 123 }, 'someProp', true)).to.be.false;
        });
        it('should return true for an object that has a property with matching name but without value when using the optional flag', () => {
            expect(hasObjectProp({ someProp: undefined }, 'someProp', true)).to.be.true;
        });
        it('should return true for an object that has a property that matches the given key and type when using the optional flag', () => {
            expect(hasObjectProp({ someProp: { value: 'someKey' } }, 'someProp', true)).to.be.true;
        });
    });

    describe('hasFunctionProp', () => {
        it('should return true for an object that has a property that matches the given key and type', () => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            expect(hasFunctionProp({ someProp: () => {} }, 'someProp')).to.be.true;
        });
        it('should return false for an object that has a property that matches the given but not the given type', () => {
            expect(hasFunctionProp({ someProp: '123' }, 'someProp')).to.be.false;
        });
        it('should return false for an object that does not have a property that matches the given key', () => {
            expect(hasFunctionProp({ anotherProp: 123 }, 'someProp')).to.be.false;
        });
        it('should return true for an object that does not have a matching key when using the optional flag', () => {
            expect(hasFunctionProp({ anotherProp: 123 }, 'someProp', true)).to.be.true;
        });
        it('should return false for an object that has a property with matching name but invalid type when using the optional flag', () => {
            expect(hasFunctionProp({ someProp: 123 }, 'someProp', true)).to.be.false;
        });
        it('should return true for an object that has a property with matching name but without value when using the optional flag', () => {
            expect(hasFunctionProp({ someProp: undefined }, 'someProp', true)).to.be.true;
        });
        it('should return true for an object that has a property that matches the given key and type when using the optional flag', () => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            expect(hasFunctionProp({ someProp: () => {} }, 'someProp', true)).to.be.true;
        });
    });

    describe('hasArrayProp', () => {
        it('should return true for an object that has a property that matches the given key and type', () => {
            expect(hasArrayProp({ someProp: ['some', 'prop'] }, 'someProp')).to.be.true;
        });
        it('should return false for an object that has a property that matches the given but not the given type', () => {
            expect(hasArrayProp({ someProp: '123' }, 'someProp')).to.be.false;
        });
        it('should return false for an object that does not have a property that matches the given key', () => {
            expect(hasArrayProp({ anotherProp: 123 }, 'someProp')).to.be.false;
        });
        it('should return true for an object that does not have a matching key when using the optional flag', () => {
            expect(hasArrayProp({ anotherProp: 123 }, 'someProp', true)).to.be.true;
        });
        it('should return false for an object that has a property with matching name but invalid type when using the optional flag', () => {
            expect(hasArrayProp({ someProp: 123 }, 'someProp', true)).to.be.false;
        });
        it('should return true for an object that has a property with matching name but without value when using the optional flag', () => {
            expect(hasArrayProp({ someProp: undefined }, 'someProp', true)).to.be.true;
        });
        it('should return true for an object that has a property that matches the given key and type when using the optional flag', () => {
            expect(hasArrayProp({ someProp: ['some', 'prop'] }, 'someProp', true)).to.be.true;
        });
    });
});
