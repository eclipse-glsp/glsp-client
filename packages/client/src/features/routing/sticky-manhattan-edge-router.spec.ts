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
import {
    AnchorComputerRegistry,
    DefaultAnchors,
    EdgeRouterRegistry,
    GNode,
    GRoutableElement,
    Point,
    RECTANGULAR_ANCHOR_KIND,
    Side
} from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { Container } from 'inversify';
import { GEdge, GGraph } from '../../model';
import { routingModule } from './routing-module';
import { StickyManhattanRectangularAnchor } from './sticky-manhattan-anchors';
import { GLSPStickyManhattanEdgeRouter, StickyManhattanRouterOptions } from './sticky-manhattan-edge-router';

/** Exposes the protected helpers as public so the spec can exercise them directly. */
class TestableStickyManhattanEdgeRouter extends GLSPStickyManhattanEdgeRouter {
    public override manhattanify(points: Point[]): void {
        super.manhattanify(points);
    }
    public override getOptions(edge: GRoutableElement): StickyManhattanRouterOptions {
        return super.getOptions(edge);
    }
    public override getBestConnectionAnchors(
        sourceAnchors: DefaultAnchors,
        targetAnchors: DefaultAnchors,
        options: StickyManhattanRouterOptions
    ): { source: Side; target: Side } {
        return super.getBestConnectionAnchors(sourceAnchors, targetAnchors, options);
    }
}

function newNode(id: string, x: number, y: number, width = 40, height = 30): GNode {
    const node = new GNode();
    node.id = id;
    node.position = { x, y };
    node.size = { width, height };
    return node;
}

function setupEdge(opts: { sourcePos?: Point; targetPos?: Point; routingPoints?: Point[] }): {
    graph: GGraph;
    edge: GEdge;
    router: GLSPStickyManhattanEdgeRouter;
} {
    const graph = new GGraph();
    const source = newNode('source', opts.sourcePos?.x ?? 0, opts.sourcePos?.y ?? 0);
    const target = newNode('target', opts.targetPos?.x ?? 200, opts.targetPos?.y ?? 100);
    graph.add(source);
    graph.add(target);

    const edge = new GEdge();
    edge.id = 'edge';
    edge.sourceId = 'source';
    edge.targetId = 'target';
    edge.routerKind = GLSPStickyManhattanEdgeRouter.KIND;
    if (opts.routingPoints) {
        edge.routingPoints = opts.routingPoints.slice();
    }
    graph.add(edge);

    const container = new Container();
    container.load(routingModule);
    const registry = container.get<EdgeRouterRegistry>(EdgeRouterRegistry);
    const router = registry.get(GLSPStickyManhattanEdgeRouter.KIND) as GLSPStickyManhattanEdgeRouter;
    return { graph, edge, router };
}

describe('GLSPStickyManhattanEdgeRouter', () => {
    describe('KIND', () => {
        it('uses the sticky-manhattan identifier to avoid collision with the standard Manhattan router', () => {
            expect(GLSPStickyManhattanEdgeRouter.KIND).to.equal('sticky-manhattan');
        });
    });

    describe('anchor registration', () => {
        it('registers dedicated anchor computers under the sticky-manhattan router kind', () => {
            const container = new Container();
            container.load(routingModule);
            const anchors = container.get<AnchorComputerRegistry>(AnchorComputerRegistry);
            const computer = anchors.get(GLSPStickyManhattanEdgeRouter.KIND, RECTANGULAR_ANCHOR_KIND);
            expect(computer).to.be.instanceOf(StickyManhattanRectangularAnchor);
            expect(computer.kind).to.equal(GLSPStickyManhattanEdgeRouter.KIND + ':' + RECTANGULAR_ANCHOR_KIND);
        });
    });

    describe('route()', () => {
        it('returns an empty route when the source node cannot be resolved', () => {
            const graph = new GGraph();
            const target = newNode('target', 200, 100);
            graph.add(target);
            const edge = new GEdge();
            edge.id = 'edge';
            edge.sourceId = 'missing';
            edge.targetId = 'target';
            edge.routerKind = GLSPStickyManhattanEdgeRouter.KIND;
            graph.add(edge);

            const container = new Container();
            container.load(routingModule);
            const router = container
                .get<EdgeRouterRegistry>(EdgeRouterRegistry)
                .get(GLSPStickyManhattanEdgeRouter.KIND) as GLSPStickyManhattanEdgeRouter;
            expect(router.route(edge)).to.deep.equal([]);
        });

        it('produces a source-first, target-last sequence with intermediate linear points', () => {
            const { edge, router } = setupEdge({});
            const route = router.route(edge);
            expect(route[0].kind).to.equal('source');
            expect(route[route.length - 1].kind).to.equal('target');
            expect(route.slice(1, -1).every(p => p.kind === 'linear')).to.equal(true);
        });

        it('computes a two-corner default route for horizontally separated nodes', () => {
            const { edge, router } = setupEdge({ sourcePos: { x: 0, y: 0 }, targetPos: { x: 200, y: 100 } });
            const route = router.route(edge);
            // source RIGHT -> target LEFT with different Y: two corners at midX.
            const interior = route.slice(1, -1);
            expect(interior).to.have.lengthOf(2);
            expect(interior[0].x).to.equal(interior[1].x);
            expect(interior[0].y).to.not.equal(interior[1].y);
        });
    });

    describe('sticky behavior', () => {
        it('preserves interior bend points when the source node moves vertically', () => {
            const { edge, router } = setupEdge({
                sourcePos: { x: 0, y: 0 },
                targetPos: { x: 300, y: 200 },
                routingPoints: [
                    { x: 150, y: 15 },
                    { x: 150, y: 215 }
                ]
            });

            // Prime the position snapshot.
            router.route(edge);

            // Move the source node down by 50px.
            edge.source!.position = { x: 0, y: 50 };
            const route = router.route(edge);
            const interior = route.slice(1, -1);

            // The shared x=150 spine must stay put — no recomputed midX.
            expect(interior.every(p => p.x === 150)).to.equal(true);
            // The target-side bend must not have moved.
            expect(interior[interior.length - 1].y).to.equal(215);
        });
    });

    describe('cleanupRoutingPoints()', () => {
        it('removes leading routing points that fall inside the source bounds', () => {
            const { edge, router } = setupEdge({
                sourcePos: { x: 0, y: 0 },
                targetPos: { x: 300, y: 100 },
                routingPoints: [
                    { x: 10, y: 10 }, // inside source bounds (40x30 at origin)
                    { x: 150, y: 20 },
                    { x: 150, y: 110 }
                ]
            });
            const points = edge.routingPoints.slice();
            router.cleanupRoutingPoints(edge, points, false, false);
            expect(points).to.not.deep.include({ x: 10, y: 10 });
            expect(points[0]).to.deep.equal({ x: 150, y: 20 });
        });

        it('collapses degenerate segments shorter than minimalPointDistance', () => {
            const { edge, router } = setupEdge({ sourcePos: { x: 0, y: 0 }, targetPos: { x: 300, y: 100 } });
            const points: Point[] = [
                { x: 100, y: 20 },
                { x: 101, y: 21 }, // manhattan distance 2 < default minimal of 3
                { x: 250, y: 20 }
            ];
            router.cleanupRoutingPoints(edge, points, false, false);
            expect(points).to.have.lengthOf(1);
            expect(points[0]).to.deep.equal({ x: 250, y: 20 });
        });
    });

    describe('manhattanify()', () => {
        const router = new TestableStickyManhattanEdgeRouter();

        it('inserts an intermediate corner so every segment is strictly orthogonal', () => {
            const points: Point[] = [
                { x: 0, y: 0 },
                { x: 50, y: 50 } // diagonal
            ];
            router.manhattanify(points);
            expect(points).to.deep.equal([
                { x: 0, y: 0 },
                { x: 0, y: 50 },
                { x: 50, y: 50 }
            ]);
        });

        it('leaves strictly orthogonal routes untouched', () => {
            const points: Point[] = [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 50, y: 40 }
            ];
            const before = points.map(p => ({ ...p }));
            router.manhattanify(points);
            expect(points).to.deep.equal(before);
        });
    });

    describe('getBestConnectionAnchors()', () => {
        it('picks RIGHT/LEFT when source is clearly to the left of target', () => {
            const { edge } = setupEdge({ sourcePos: { x: 0, y: 0 }, targetPos: { x: 400, y: 0 } });
            const router = new TestableStickyManhattanEdgeRouter();
            const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, 'source');
            const targetAnchors = new DefaultAnchors(edge.target!, edge.parent, 'target');
            const result = router.getBestConnectionAnchors(sourceAnchors, targetAnchors, router.getOptions(edge));
            expect(result).to.deep.equal({ source: Side.RIGHT, target: Side.LEFT });
        });
    });
});
