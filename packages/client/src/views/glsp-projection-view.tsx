/********************************************************************************
 * Copyright (c) 2017-2023 TypeFox and others.
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
    Bounds,
    EdgeRouterRegistry,
    GViewportRootElement,
    IViewArgs,
    ProjectedViewportView,
    ProjectionParams,
    RenderingContext,
    TYPES,
    ViewProjection,
    html,
    setAttr,
    setClass
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode, VNodeStyle, h } from 'snabbdom';
import { GridManager } from '../features';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: html };

/**
 * Special viewport root view that renders horizontal and vertical projection bars for quick navigation.
 */
@injectable()
export class GLSPProjectionView extends ProjectedViewportView {
    @inject(EdgeRouterRegistry) edgeRouterRegistry: EdgeRouterRegistry;
    @optional() @inject(TYPES.IGridManager) protected gridManager?: GridManager;

    override render(model: Readonly<GViewportRootElement>, context: RenderingContext, args?: IViewArgs): VNode {
        const rootNode: VNode = (
            <div class-sprotty-graph={false} style={{ width: '100%', height: '100%' }}>
                {this.renderSvg(model, context, args)}
                {this.renderProjections(model, context, args)}
            </div>
        );
        setAttr(rootNode, 'tabindex', 1);
        setAttr(rootNode, 'aria-label', 'Diagram');

        return rootNode;
    }

    protected override renderSvg(model: Readonly<GViewportRootElement>, context: RenderingContext, args?: IViewArgs): VNode {
        const edgeRouting = this.edgeRouterRegistry.routeAllChildren(model);
        const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`;
        const ns = 'http://www.w3.org/2000/svg';
        const svg = h(
            'svg',
            { ns, style: { height: '100%', ...this.gridManager?.getGridStyle(model) }, class: { 'sprotty-graph': true } },
            h('g', { ns, attrs: { transform } }, context.renderChildren(model, { edgeRouting }))
        );
        return svg;
    }

    protected override renderProjectionBar(
        projections: ViewProjection[],
        model: Readonly<GViewportRootElement>,
        modelBounds: Bounds,
        orientation: 'horizontal' | 'vertical'
    ): VNode {
        const params: ProjectionParams = { modelBounds, orientation } as ProjectionParams;
        // NOTE: Here we assume that the projection bars have the same size as the diagram canvas,
        // i.e. they are drawn as overlay above the canvas.
        params.factor =
            orientation === 'horizontal' ? model.canvasBounds.width / modelBounds.width : model.canvasBounds.height / modelBounds.height;
        params.zoomedFactor = params.factor / model.zoom;
        return (
            <div
                class-sprotty-projection-bar={true}
                class-horizontal={orientation === 'horizontal'}
                class-vertical={orientation === 'vertical'}
                class-bordered-projection-bar={true}
            >
                {this.renderViewport(model, params)}
                {projections.map(p => this.renderProjection(p, model, params))}
            </div>
        );
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
        let canvasSize;
        let projPos;
        let projSize: number;
        if (params.orientation === 'horizontal') {
            canvasSize = model.canvasBounds.width;
            projPos = (projection.projectedBounds.x - params.modelBounds.x) * params.factor;
            projSize = projection.projectedBounds.width * params.factor;
        } else {
            canvasSize = model.canvasBounds.height;
            projPos = (projection.projectedBounds.y - params.modelBounds.y) * params.factor;
            projSize = projection.projectedBounds.height * params.factor;
        }
        if (projPos < 0) {
            projSize += projPos;
            projPos = 0;
        } else if (projPos > canvasSize) {
            projPos = canvasSize;
        }
        if (projSize < 0) {
            projSize = 0;
        } else if (projPos + projSize > canvasSize) {
            projSize = canvasSize - projPos;
        }
        const style: VNodeStyle =
            params.orientation === 'horizontal'
                ? {
                      left: `${projPos}px`,
                      width: `${projSize}px`,
                      height: '60%'
                  }
                : {
                      top: `${projPos}px`,
                      height: `${projSize}px`,
                      width: '60%'
                  };
        const result = (
            <div
                id={`${params.orientation}-projection:${projection.elementId}`}
                class-sprotty-projection={true}
                class-glsp-projection={true}
                style={style}
            />
        );
        projection.cssClasses.forEach(cl => setClass(result, cl, true));
        return result;
    }
}
