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
/* eslint-disable import/no-deprecated */
/* eslint-disable deprecation/deprecation */

import { GModelElement } from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { GridSnapper } from './../grid/grid-snapper';
import { PointPositionUpdater } from './point-position-updater';

describe('PointPositionUpdater', () => {
    it('updatePosition with no last drag position', () => {
        const element = new GModelElement();
        const updater = new PointPositionUpdater();
        expect(updater.updatePosition(element, { x: 0, y: 0 }, false)).to.be.undefined;
        expect(updater.updatePosition(element, { x: 0, y: 0 }, true)).to.be.undefined;
    });

    it('update last position and reset', () => {
        const updater = new PointPositionUpdater();
        expect(updater.isLastDragPositionUndefined()).to.be.true;
        updater.updateLastDragPosition({ x: 0, y: 0 });
        expect(updater.isLastDragPositionUndefined()).to.be.false;
        updater.resetPosition();
        expect(updater.isLastDragPositionUndefined()).to.be.true;
    });

    it('updatePosition with no snapper', () => {
        const element = new GModelElement();
        const updater = new PointPositionUpdater();
        resetUpdater(updater);
        expect(updater.updatePosition(element, { x: 0, y: 0 }, false)).to.be.undefined;
        expect(updater.updatePosition(element, { x: 0, y: 0 }, true)).to.be.undefined;

        resetUpdater(updater);
        expect(updater.updatePosition(element, { x: 5, y: 3 }, false)).to.be.deep.equals({ x: 5, y: 3 });
        expect(updater.updatePosition(element, { x: 5, y: 3 }, true)).to.be.undefined;
        expect(updater.updatePosition(element, { x: 11, y: 6 }, false)).to.be.deep.equals({ x: 6, y: 3 });
        expect(updater.updatePosition(element, { x: -3, y: 2 }, true)).to.be.deep.equals({ x: -14, y: -4 });
    });

    it('updatePosition with snapper', () => {
        const element = new GModelElement();
        const snapper = new GridSnapper();
        const updater = new PointPositionUpdater(snapper);
        resetUpdater(updater);
        expect(updater.updatePosition(element, { x: 0, y: 0 }, false)).to.be.undefined;
        expect(updater.updatePosition(element, { x: 0, y: 0 }, true)).to.be.undefined;

        resetUpdater(updater);
        expect(updater.updatePosition(element, { x: 5, y: 3 }, true)).to.be.deep.equals({ x: 10, y: 0 });
        expect(updater.updatePosition(element, { x: 5, y: 3 }, true)).to.be.undefined;
        expect(updater.updatePosition(element, { x: 11, y: 6 }, true)).to.be.deep.equals({ x: 0, y: 10 });
        expect(updater.updatePosition(element, { x: -3, y: 2 }, true)).to.be.deep.equals({ x: -10, y: -10 });

        // disable snapping (alt key)
        resetUpdater(updater);
        expect(updater.updatePosition(element, { x: 5, y: 3 }, false)).to.be.deep.equals({ x: 5, y: 3 });
        expect(updater.updatePosition(element, { x: 5, y: 3 }, false)).to.be.undefined;
        expect(updater.updatePosition(element, { x: 11, y: 6 }, false)).to.be.deep.equals({ x: 6, y: 3 });
        expect(updater.updatePosition(element, { x: -3, y: 2 }, false)).to.be.deep.equals({ x: -14, y: -4 });
    });

    function resetUpdater(updater: PointPositionUpdater): void {
        updater.resetPosition();
        updater.updateLastDragPosition({ x: 0, y: 0 });
    }
});
