/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
import { generateUuid, isUuid } from './uuid';

describe('Uuid', () => {
    describe('isUuid', () => {
        it('should return true for a valid UUID', () => {
            expect(isUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).to.be.true;
        });
        it('should return true for a generated UUID', () => {
            expect(isUuid(generateUuid())).to.be.true;
        });
        it('should return false for a malformed UUID', () => {
            expect(isUuid('not-a-uuid')).to.be.false;
            expect(isUuid('')).to.be.false;
        });
    });
});
