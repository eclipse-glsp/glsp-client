/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
    AbstractEdgeRouter,
    EdgeRouterRegistry,
    GNode,
    GRoutableElement,
    GRoutingHandle,
    LinearRouteOptions,
    Point,
    ResolvedHandleMove,
    RoutedPoint
} from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { Container } from 'inversify';
import { routingModule } from '../features/routing/routing-module';
import { ALL_ROUTING_POINTS, ROUTE_KINDS, ROUTING_POINT_KINDS, calcRoute } from './gmodel-util';
import { GEdge, GGraph } from '../model';

class TestRouter extends AbstractEdgeRouter {
    kind = 'test-router';

    route(edge: GRoutableElement): RoutedPoint[] {
        const pureRoute = edge.routingPoints.map(
            (point, idx) =>
                <RoutedPoint>{
                    kind: 'linear',
                    ...point,
                    pointIndex: idx
                }
        );
        return [
            { kind: 'source', ...edge.source!.position },
            ...pureRoute,
            { kind: 'bezier-control-after', x: 999, y: 999, pointIndex: pureRoute.length },
            { kind: 'target', ...edge.target!.position }
        ];
    }

    createRoutingHandles(edge: GRoutableElement): void {
        // do nothing
    }

    protected getOptions(edge: GRoutableElement): LinearRouteOptions {
        return {
            minimalPointDistance: 0,
            selfEdgeOffset: 0,
            standardDistance: 0
        };
    }

    protected getInnerHandlePosition(edge: GRoutableElement, route: RoutedPoint[], handle: GRoutingHandle): Point | undefined {
        return undefined;
    }

    protected applyInnerHandleMoves(edge: GRoutableElement, moves: ResolvedHandleMove[]): void {
        // do nothing
    }
}

describe('SModel Util', () => {
    describe('calcRoute', () => {
        const graph = new GGraph();

        const source = new GNode();
        source.id = 'node0';
        source.position = { x: 0, y: 0 };
        source.size = { width: 0, height: 0 };
        graph.add(source);

        const target = new GNode();
        target.id = 'node1';
        target.position = { x: 100, y: 100 };
        target.size = { width: 0, height: 0 };
        graph.add(target);

        const edge = new GEdge();
        edge.id = 'edge0';
        edge.sourceId = 'node0';
        edge.targetId = 'node1';
        graph.add(edge);

        edge.routerKind = 'test-router';

        const container = new Container();
        container.load(routingModule);

        const routerRegistry = container.get<EdgeRouterRegistry>(EdgeRouterRegistry);
        routerRegistry.register('test-router', new TestRouter());

        it('should return complete route', () => {
            edge.source!.position = { x: 0, y: 0 };
            edge.target!.position = { x: 100, y: 100 };
            edge.routingPoints = [
                { x: 20, y: 20 },
                { x: 30, y: 30 },
                { x: 40, y: 40 }
            ];
            const route = calcRoute(edge, routerRegistry);
            expect(route).to.deep.equal(<RoutedPoint[]>[
                { x: 0, y: 0, kind: 'source' },
                { x: 20, y: 20, kind: 'linear', pointIndex: 0 },
                { x: 30, y: 30, kind: 'linear', pointIndex: 1 },
                { x: 40, y: 40, kind: 'linear', pointIndex: 2 },
                { x: 999, y: 999, kind: 'bezier-control-after', pointIndex: 3 },
                { x: 100, y: 100, kind: 'target' }
            ]);
        });

        it('should filter duplicates with same coordinates', () => {
            edge.source!.position = { x: 0, y: 0 };
            edge.target!.position = { x: 100, y: 100 };
            edge.routingPoints = [
                { x: 20, y: 20 },
                { x: 20, y: 20 },
                { x: 30, y: 30 },
                { x: 40, y: 40 }
            ];

            const route = calcRoute(edge, routerRegistry);
            expect(route).to.deep.equal(<RoutedPoint[]>[
                { x: 0, y: 0, kind: 'source' },
                { x: 20, y: 20, kind: 'linear', pointIndex: 0 },
                { x: 30, y: 30, kind: 'linear', pointIndex: 2 },
                { x: 40, y: 40, kind: 'linear', pointIndex: 3 },
                { x: 999, y: 999, kind: 'bezier-control-after', pointIndex: 4 },
                { x: 100, y: 100, kind: 'target' }
            ]);
        });

        it('should not filter source and target even if duplicate coordinates', () => {
            edge.source!.position = { x: 0, y: 0 };
            edge.target!.position = { x: 0, y: 0 };
            edge.routingPoints = [
                { x: 20, y: 20 },
                { x: 30, y: 30 },
                { x: 40, y: 40 }
            ];

            const route = calcRoute(edge, routerRegistry);
            expect(route).to.deep.equal(<RoutedPoint[]>[
                { x: 0, y: 0, kind: 'source' },
                { x: 20, y: 20, kind: 'linear', pointIndex: 0 },
                { x: 30, y: 30, kind: 'linear', pointIndex: 1 },
                { x: 40, y: 40, kind: 'linear', pointIndex: 2 },
                { x: 999, y: 999, kind: 'bezier-control-after', pointIndex: 3 },
                { x: 0, y: 0, kind: 'target' }
            ]);
        });

        it('should filter duplicates with same coordinates but allow tolerance', () => {
            edge.source!.position = { x: 0, y: 0 };
            edge.target!.position = { x: 100, y: 100 };
            edge.routingPoints = [
                { x: 20, y: 20 },
                { x: 25, y: 25 },
                { x: 30, y: 30 },
                { x: 40, y: 40 }
            ];

            const route = calcRoute(edge, routerRegistry, ALL_ROUTING_POINTS, 10);
            expect(route).to.deep.equal(<RoutedPoint[]>[
                { x: 0, y: 0, kind: 'source' },
                { x: 20, y: 20, kind: 'linear', pointIndex: 0 },
                { x: 30, y: 30, kind: 'linear', pointIndex: 2 },
                { x: 40, y: 40, kind: 'linear', pointIndex: 3 },
                { x: 999, y: 999, kind: 'bezier-control-after', pointIndex: 4 },
                { x: 100, y: 100, kind: 'target' }
            ]);
        });

        it('should allow filtering based on point type: ROUTE_KINDS', () => {
            edge.source!.position = { x: 0, y: 0 };
            edge.target!.position = { x: 100, y: 100 };
            edge.routingPoints = [
                { x: 20, y: 20 },
                { x: 30, y: 30 },
                { x: 40, y: 40 }
            ];

            const route = calcRoute(edge, routerRegistry, ROUTE_KINDS);
            expect(route).to.deep.equal(<RoutedPoint[]>[
                { x: 0, y: 0, kind: 'source' },
                { x: 20, y: 20, kind: 'linear', pointIndex: 0 },
                { x: 30, y: 30, kind: 'linear', pointIndex: 1 },
                { x: 40, y: 40, kind: 'linear', pointIndex: 2 },
                { x: 100, y: 100, kind: 'target' }
            ]);
        });

        it('should allow filtering based on point type: ROUTING_POINT_KINDS', () => {
            edge.source!.position = { x: 0, y: 0 };
            edge.target!.position = { x: 100, y: 100 };
            edge.routingPoints = [
                { x: 20, y: 20 },
                { x: 30, y: 30 },
                { x: 40, y: 40 }
            ];

            const route = calcRoute(edge, routerRegistry, ROUTING_POINT_KINDS);
            expect(route).to.deep.equal(<RoutedPoint[]>[
                { x: 20, y: 20, kind: 'linear', pointIndex: 0 },
                { x: 30, y: 30, kind: 'linear', pointIndex: 1 },
                { x: 40, y: 40, kind: 'linear', pointIndex: 2 }
            ]);
        });
    });
});
