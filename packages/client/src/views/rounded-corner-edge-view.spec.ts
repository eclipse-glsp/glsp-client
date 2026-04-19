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
import { Point } from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { RoundedCornerEdgeView } from './rounded-corner-edge-view';

class TestableRoundedCornerEdgeView extends RoundedCornerEdgeView {
    public override createPathForSegments(segments: Point[]): string {
        return super.createPathForSegments(segments);
    }
    public override computeMaxRadius(corner: Point, prev: Point, next: Point): number {
        return super.computeMaxRadius(corner, prev, next);
    }
}

describe('RoundedCornerEdgeView', () => {
    const view = new TestableRoundedCornerEdgeView();

    describe('createPathForSegments()', () => {
        it('emits only a moveto for a single-point route', () => {
            expect(view.createPathForSegments([{ x: 10, y: 20 }])).to.equal('M 10,20');
        });

        it('emits a straight line for routes without any bend', () => {
            const path = view.createPathForSegments([
                { x: 0, y: 0 },
                { x: 100, y: 0 }
            ]);
            expect(path).to.equal('M 0,0 L 100,0');
        });

        it('emits a quadratic curve at each right-angle bend', () => {
            const path = view.createPathForSegments([
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 80 }
            ]);
            // right → down corner at (100, 0) with radius 10 (well below 45% of either
            // 100px or 80px adjacent segment).
            expect(path).to.equal('M 0,0 L 90,0 Q 100,0 100,10 L 100,80');
        });

        it('ends a multi-bend route with a straight line to the target', () => {
            const path = view.createPathForSegments([
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 50, y: 40 },
                { x: 120, y: 40 }
            ]);
            expect(path.endsWith('L 120,40')).to.equal(true);
        });
    });

    describe('computeMaxRadius()', () => {
        it('returns the configured corner radius when segments are long enough', () => {
            const r = view.computeMaxRadius({ x: 100, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 100 });
            expect(r).to.equal(10);
        });

        it('clamps the radius to 45% of the shortest adjacent segment', () => {
            // shortest adjacent segment = 4px  →  45% = 1.8  →  bounced to minCornerRadius (2).
            const r = view.computeMaxRadius({ x: 4, y: 0 }, { x: 0, y: 0 }, { x: 4, y: 100 });
            expect(r).to.equal(2);
        });

        it('returns minCornerRadius when an adjacent segment has zero length', () => {
            const r = view.computeMaxRadius({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 50, y: 0 });
            expect(r).to.equal(2);
        });
    });
});
