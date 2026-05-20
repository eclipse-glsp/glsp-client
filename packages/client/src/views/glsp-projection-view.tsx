/********************************************************************************
 * Copyright (c) 2017-2026 TypeFox and others.
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
/** @jsx html */
import {
    Bounds,
    Dimension,
    EdgeRouterRegistry,
    GViewportRootElement,
    IViewArgs,
    Point,
    ProjectedViewportView,
    ProjectionParams,
    RenderingContext,
    SGraphImpl,
    TYPES,
    ViewProjection,
    Writable,
    getProjections,
    html,
    isBoundsAware,
    setAttr,
    setClass
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode, VNodeStyle, h } from 'snabbdom';
import { messages } from '../base/messages';
import { GridStyle, IGridManager } from '../features/grid/grid-manager';
import { GridProperty } from '../features/grid/grid-style';

/**
 * Special viewport root view that renders horizontal and vertical projection bars for quick navigation.
 */
@injectable()
export class GLSPProjectionView extends ProjectedViewportView {
    @inject(EdgeRouterRegistry) edgeRouterRegistry: EdgeRouterRegistry;
    @inject(TYPES.IGridManager) @optional() protected gridManager?: IGridManager;

    override render(model: Readonly<GViewportRootElement>, context: RenderingContext, args?: IViewArgs): VNode {
        const rootNode: VNode = (
            <div class-sprotty-graph={false} style={{ width: '100%', height: '100%' }}>
                {this.renderSvg(model, context, args)}
                {this.renderProjections(model, context, args)}
            </div>
        );
        setAttr(rootNode, 'tabindex', 1);
        setAttr(rootNode, 'aria-label', messages.diagram.label);

        return rootNode;
    }

    protected override renderSvg(model: Readonly<GViewportRootElement>, context: RenderingContext, args?: IViewArgs): VNode {
        const edgeRouting = this.edgeRouterRegistry.routeAllChildren(model);
        const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`;
        const ns = 'http://www.w3.org/2000/svg';
        const svg = h(
            'svg',
            { ns, style: { height: '100%', ...this.getGridStyle(model, context) }, class: { 'sprotty-graph': true } },
            h('g', { ns, attrs: { transform } }, context.renderChildren(model, { edgeRouting }))
        );
        return svg;
    }

    protected getGridStyle(viewport: Readonly<SGraphImpl>, context: RenderingContext): GridStyle {
        if (context.targetKind === 'hidden' || !this.gridManager) {
            return {};
        }
        const bounds = this.getBackgroundBounds(viewport, context, this.gridManager);
        return {
            [GridProperty.GRID_BACKGROUND_X]: bounds.x + 'px',
            [GridProperty.GRID_BACKGROUND_Y]: bounds.y + 'px',
            [GridProperty.GRID_BACKGROUND_WIDTH]: bounds.width + 'px',
            [GridProperty.GRID_BACKGROUND_HEIGHT]: bounds.height + 'px',
            [GridProperty.GRID_BACKGROUND_ZOOM]: viewport.zoom + ''
        };
    }

    protected getBackgroundBounds(viewport: Readonly<SGraphImpl>, context: RenderingContext, gridManager: IGridManager): Writable<Bounds> {
        const position = Point.multiplyScalar(Point.subtract(gridManager.grid, viewport.scroll), viewport.zoom);
        const size = Dimension.fromPoint(Point.multiplyScalar(gridManager.grid, viewport.zoom));
        return { ...position, ...size };
    }

    protected override renderProjections(model: Readonly<GViewportRootElement>, context: RenderingContext, args?: IViewArgs): VNode[] {
        if (model.zoom <= 0) {
            return [];
        }
        const modelBounds = this.getModelBounds(model);
        if (!modelBounds) {
            return [];
        }
        const projections = getProjections(model) ?? [];
        return [
            this.renderProjectionBar(projections, model, modelBounds, 'vertical'),
            this.renderProjectionBar(projections, model, modelBounds, 'horizontal')
        ];
    }

    /**
     * Computes the total bounds that the projection bars map to, i.e. the union of the actual
     * content bounds and the current viewport.
     *
     * This is a reimplementation of sprotty's `getModelBounds`, with two minor fixes
     * - this intentionally derives the content bounds from the
     * root's children instead of using {@link GViewportRootElement.bounds} directly.
     * - We ignore bounds with invalid dimensions (e.g. from routable edges without bend points) to avoid pulling the
     */
    protected getModelBounds(model: Readonly<GViewportRootElement>): Bounds | undefined {
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const element of model.children) {
            if (isBoundsAware(element)) {
                const b = element.bounds;
                if (!Dimension.isValid(b)) {
                    continue;
                }
                minX = Math.min(minX, b.x);
                minY = Math.min(minY, b.y);
                maxX = Math.max(maxX, b.x + b.width);
                maxY = Math.max(maxY, b.y + b.height);
            }
        }

        // enlarge the bounds by the current viewport to ensure it always fits into the projection
        minX = Math.min(minX, model.scroll.x);
        minY = Math.min(minY, model.scroll.y);
        maxX = Math.max(maxX, model.scroll.x + model.canvasBounds.width / model.zoom);
        maxY = Math.max(maxY, model.scroll.y + model.canvasBounds.height / model.zoom);

        if (minX < maxX && minY < maxY) {
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
        return undefined;
    }

    protected override renderProjectionBar(
        projections: ViewProjection[],
        model: Readonly<GViewportRootElement>,
        modelBounds: Bounds,
        orientation: 'horizontal' | 'vertical'
    ): VNode {
        const vnode = super.renderProjectionBar(projections, model, modelBounds, orientation);
        setClass(vnode, 'bordered-projection-bar', true);
        return vnode;
    }

    protected override renderViewport(model: Readonly<GViewportRootElement>, params: ProjectionParams): VNode {
        let canvasSize;
        let viewportPos: number;
        if (params.orientation === 'horizontal') {
            canvasSize = model.canvasBounds.width;
            viewportPos = (model.scroll.x - params.modelBounds.x) * params.factor;
        } else {
            canvasSize = model.canvasBounds.height;
            viewportPos = (model.scroll.y - params.modelBounds.y) * params.factor;
        }
        let viewportSize = canvasSize * params.zoomedFactor;
        if (viewportPos < 0) {
            viewportSize += viewportPos;
            viewportPos = 0;
        } else if (viewportPos > canvasSize) {
            viewportPos = canvasSize;
        }
        if (viewportSize < 0) {
            viewportSize = 0;
        } else if (viewportPos + viewportSize > canvasSize) {
            viewportSize = canvasSize - viewportPos;
        }
        if (Math.abs(viewportSize - canvasSize) < 1) {
            viewportSize = 0;
        }
        const style: VNodeStyle =
            params.orientation === 'horizontal'
                ? {
                      left: `${viewportPos}px`,
                      width: `${viewportSize}px`
                  }
                : {
                      top: `${viewportPos}px`,
                      height: `${viewportSize}px`
                  };
        return <div class-sprotty-viewport={viewportSize !== 0} class-projection-scroll-bar={true} style={style} />;
    }

    protected override renderProjection(
        projection: ViewProjection,
        model: Readonly<GViewportRootElement>,
        params: ProjectionParams
    ): VNode {
        const vnode = super.renderProjection(projection, model, params);
        setClass(vnode, 'glsp-projection', true);
        const style = vnode.data!.style!;
        if (style.left) {
            style.height = '60%';
        } else {
            style.width = '60%';
        }
        return vnode;
    }
}
