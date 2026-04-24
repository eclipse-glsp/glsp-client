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
/** @jsx svg */
import {
    IViewArgs,
    Point,
    PolylineEdgeViewWithGapsOnIntersections,
    RenderingContext,
    isIntersectingRoutedPoint,
    svg
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { Classes, VNode } from 'snabbdom';
import { GEdge } from '../model';
import { EdgePadding } from '../utils/argument-utils';

/**
 * Gap-rendering counterpart to {@link GEdgeView}: extends
 * {@link PolylineEdgeViewWithGapsOnIntersections} and re-adds the GLSP-only
 * bits from `GEdgeView` — router dispatch, dangling-edge rendering,
 * `additionalClasses` hook, and the edge-padding mouse-handle overlay.
 *
 * Subclasses override {@link createPathForSegments} to inject per-point path
 * fragments. Intersections are spliced into the rendered line
 * (`addIntersectionPoints = true`) and skipped for the mouse-handle overlay
 * so the hit area stays contiguous.
 */
@injectable()
export class GEdgeViewWithGapsOnIntersections extends PolylineEdgeViewWithGapsOnIntersections {
    override render(edge: Readonly<GEdge>, context: RenderingContext, args?: IViewArgs): VNode {
        // route(edge, args) picks up the postprocessed routing populated by
        // SGraphView — that's where IntersectionFinder tags points.
        const route = this.edgeRouterRegistry.route(edge, args);
        if (route.length === 0) {
            return this.renderDanglingEdge('Cannot compute route', edge, context);
        }
        return (
            <g class-sprotty-edge={true} class-mouseover={edge.hoverFeedback} {...this.additionalClasses(edge, context)}>
                {this.renderLine(edge, route, context, args)}
                {this.renderAdditionals(edge, route, context)}
                {context.renderChildren(edge, { route })}
            </g>
        );
    }

    protected additionalClasses(_edge: Readonly<GEdge>, _context: RenderingContext): Classes {
        return {};
    }

    protected override renderLine(edge: GEdge, segments: Point[], _context: RenderingContext, args?: IViewArgs): VNode {
        return <path d={this.createPathForSegments(segments, edge, true, args)} />;
    }

    protected override renderAdditionals(edge: GEdge, segments: Point[], _context: RenderingContext): VNode[] {
        const edgePadding = EdgePadding.from(edge);
        return edgePadding ? [this.renderMouseHandle(edge, segments, edgePadding)] : [];
    }

    protected renderMouseHandle(edge: GEdge, segments: Point[], padding: number): VNode {
        return (
            <path
                class-mouse-handle
                d={this.createPathForSegments(segments, edge, false)}
                style-stroke-width={padding * 2}
                style-stroke='transparent'
                style-stroke-dasharray='none'
                style-stroke-dashoffset='0'
            />
        );
    }

    protected createPathForSegments(segments: Point[], edge: GEdge, addIntersectionPoints: boolean, args?: IViewArgs): string {
        if (segments.length === 0) {
            return '';
        }
        let path = `M ${segments[0].x},${segments[0].y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            if (addIntersectionPoints && isIntersectingRoutedPoint(p)) {
                path += this.intersectionPath(edge, segments, p, args);
            }
            path += ` L ${p.x},${p.y}`;
        }
        return path;
    }
}
