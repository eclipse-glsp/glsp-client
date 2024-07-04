/********************************************************************************
 * Copyright (c) 2022-2024 EclipseSource and others.
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

import { GModelElement } from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { GridSnapper } from './grid-snapper';

describe('GridSnapper', () => {
    it('snap', () => {
        const element = new GModelElement();
        const snapper = new GridSnapper();
        expect(snapper.snap({ x: 0, y: 0 }, element)).to.be.deep.equals({ x: 0, y: 0 });
        expect(snapper.snap({ x: 4, y: 5 }, element)).to.be.deep.equals({ x: 0, y: 10 });
        expect(snapper.snap({ x: 8, y: 11 }, element)).to.be.deep.equals({ x: 10, y: 10 });
        expect(snapper.snap({ x: -7, y: -4 }, element)).to.be.deep.equals({ x: -10, y: -0 });
    });
});
