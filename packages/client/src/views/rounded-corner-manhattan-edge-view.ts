/********************************************************************************
 * Copyright (c) 2022 Imixs Software Solutions GmbH.
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
import { injectable } from 'inversify';
import { GEdgeView } from './gedge-view';

/**
 * Manhattan edge view with rounded bends rendered as quadratic Béziers.
 * Non-orthogonal inputs render as sharp corners, degrading to {@link GEdgeView}
 * output. Radius is clamped per corner; override {@link cornerRadius} or
 * {@link computeMaxRadius} to tune.
 *
 * Based on Ralph Soika's `BPMNEdgeView`; see
 * https://github.com/eclipse-glsp/glsp/discussions/1642.
 */
@injectable()
export class RoundedCornerManhattanEdgeView extends GEdgeView {
    /** Target corner radius in pixels. The effective radius is clamped per corner. */
    protected readonly cornerRadius: number = 10;

    /** Lower bound for the effective radius, even on very short adjacent segments. */
    protected readonly minCornerRadius: number = 2;

    /** Upper fraction of the shorter adjacent segment to use for the radius. */
    protected readonly maxRadiusFactor: number = 0.45;

    /** Segment length (px) below which {@link shortSegmentRadiusFactor} tightens the radius further. */
    protected readonly shortSegmentThreshold: number = 5;

    /** Fraction of the shorter adjacent segment to use as the radius below {@link shortSegmentThreshold}. */
    protected readonly shortSegmentRadiusFactor: number = 0.3;

    protected override createPathForSegments(segments: Point[]): string {
        if (segments.length === 0) {
            return '';
        }
        const first = segments[0];
        let path = `M ${first.x},${first.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            if (i < segments.length - 1) {
                const prev = segments[i - 1];
                const next = segments[i + 1];
                const radius = this.computeMaxRadius(p, prev, next);
                path += this.renderRoundedCorner(p, prev, next, radius);
            } else {
                path += ` L ${p.x},${p.y}`;
            }
        }
        return path;
    }

    /** SVG fragment for one rounded corner; falls back to `L` if not a right angle. */
    protected renderRoundedCorner(corner: Point, prev: Point, next: Point, radius: number): string {
        // Round only right-angle bends; diagonal / collinear inputs render sharp.
        const horizIn = Point.isHorizontalAligned(prev, corner);
        const vertIn = Point.isVerticalAligned(prev, corner);
        const horizOut = Point.isHorizontalAligned(corner, next);
        const vertOut = Point.isVerticalAligned(corner, next);
        const isRightAngle = (horizIn && vertOut && !vertIn) || (vertIn && horizOut && !horizIn);
        if (!isRightAngle) {
            return ` L ${corner.x},${corner.y}`;
        }
        if (prev.x < corner.x && corner.y < next.y) {
            // right → down
            return ` L ${corner.x - radius},${corner.y} Q ${corner.x},${corner.y} ${corner.x},${corner.y + radius}`;
        }
        if (prev.y < corner.y && corner.x < next.x) {
            // down → right
            return ` L ${corner.x},${corner.y - radius} Q ${corner.x},${corner.y} ${corner.x + radius},${corner.y}`;
        }
        if (prev.x < corner.x && corner.y > next.y) {
            // right → up
            return ` L ${corner.x - radius},${corner.y} Q ${corner.x},${corner.y} ${corner.x},${corner.y - radius}`;
        }
        if (prev.y > corner.y && corner.x < next.x) {
            // up → right
            return ` L ${corner.x},${corner.y + radius} Q ${corner.x},${corner.y} ${corner.x + radius},${corner.y}`;
        }
        if (prev.y < corner.y && corner.x > next.x) {
            // down → left
            return ` L ${corner.x},${corner.y - radius} Q ${corner.x},${corner.y} ${corner.x - radius},${corner.y}`;
        }
        if (prev.x > corner.x && corner.y < next.y) {
            // left → down
            return ` L ${corner.x + radius},${corner.y} Q ${corner.x},${corner.y} ${corner.x},${corner.y + radius}`;
        }
        if (prev.y > corner.y && corner.x > next.x) {
            // up → left
            return ` L ${corner.x},${corner.y + radius} Q ${corner.x},${corner.y} ${corner.x - radius},${corner.y}`;
        }
        if (prev.x > corner.x && corner.y > next.y) {
            // left → up
            return ` L ${corner.x + radius},${corner.y} Q ${corner.x},${corner.y} ${corner.x},${corner.y - radius}`;
        }
        return ` L ${corner.x},${corner.y}`;
    }

    /** Clamps {@link cornerRadius} to a fraction of the shorter adjacent segment. */
    protected computeMaxRadius(corner: Point, prev: Point, next: Point): number {
        const segBefore = Point.maxDistance(corner, prev);
        const segAfter = Point.maxDistance(next, corner);
        if (segBefore === 0 || segAfter === 0) {
            return this.minCornerRadius;
        }
        const shortest = Math.min(segBefore, segAfter);
        let radius = Math.min(this.cornerRadius, shortest * this.maxRadiusFactor);
        if (shortest < this.shortSegmentThreshold) {
            radius = Math.min(radius, shortest * this.shortSegmentRadiusFactor);
        }
        radius = Math.min(radius, shortest / 2);
        return Math.max(this.minCornerRadius, radius);
    }
}
