/********************************************************************************
 * Copyright (c) 2022-2026 Imixs Software Solutions GmbH.
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
import { IntersectingRoutedPoint, IViewArgs, Point, isIntersectingRoutedPoint } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { GEdge } from '../model';
import { GEdgeViewWithGapsOnIntersections } from './gedge-view-with-gaps-on-intersections';

/**
 * Manhattan edge view with rounded bends rendered as quadratic Béziers.
 * Non-orthogonal inputs render as sharp corners. Radius is clamped per corner;
 * override {@link cornerRadius} or {@link computeMaxRadius} to tune.
 *
 * Inherits gap / line-jump rendering from {@link GEdgeViewWithGapsOnIntersections}.
 * The rendered line splices intersection fragments between points; the mouse-
 * handle overlay skips them so the hit area stays contiguous.
 *
 * Based on Ralph Soika's `BPMNEdgeView`; see
 * https://github.com/eclipse-glsp/glsp/discussions/1642.
 */
@injectable()
export class RoundedCornerManhattanEdgeView extends GEdgeViewWithGapsOnIntersections {
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

    protected override createPathForSegments(segments: Point[], edge: GEdge, addIntersectionPoints: boolean, args?: IViewArgs): string {
        if (segments.length === 0) {
            return '';
        }
        let path = `M ${segments[0].x},${segments[0].y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            if (addIntersectionPoints && isIntersectingRoutedPoint(p)) {
                const effective = this.filterCornerZoneIntersections(p, segments, i);
                if (effective.intersections.length > 0) {
                    path += this.intersectionPath(edge, segments, effective, args);
                }
            }
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

    /**
     * Drops intersections inside either endpoint's rounded-corner zone (padded
     * by the gap's skip-offset). The gap fragment can't be placed there without
     * drawing backward into the curve on one side, and the crossing is hidden
     * behind the curve anyway.
     */
    protected filterCornerZoneIntersections(
        intersectingPoint: IntersectingRoutedPoint,
        segments: Point[],
        pointIndex: number
    ): IntersectingRoutedPoint {
        const p1 = segments[pointIndex - 1];
        const p2 = segments[pointIndex];
        const p1Threshold = this.getCornerRadius(segments, pointIndex - 1) + this.skipOffsetBefore;
        const p2Threshold = this.getCornerRadius(segments, pointIndex) + this.skipOffsetAfter;
        const filtered = intersectingPoint.intersections.filter(
            intersection =>
                Point.maxDistance(intersection.intersectionPoint, p1) > p1Threshold &&
                Point.maxDistance(intersection.intersectionPoint, p2) > p2Threshold
        );
        return { ...intersectingPoint, intersections: filtered };
    }

    /** Curve radius at `segments[cornerIndex]`, or 0 for source / target. */
    protected getCornerRadius(segments: Point[], cornerIndex: number): number {
        if (cornerIndex <= 0 || cornerIndex >= segments.length - 1) {
            return 0;
        }
        const corner = segments[cornerIndex];
        const prev = segments[cornerIndex - 1];
        const next = segments[cornerIndex + 1];
        return this.computeMaxRadius(corner, prev, next);
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
