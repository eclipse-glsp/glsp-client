/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
import { Bounds, Dimension, Point, RenderingContext, SGraphImpl, SGraphView, Writable } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { GridManager, GridStyle } from '../features/grid/grid-manager';
import { GridProperty } from '../features/grid/grid-style';

@injectable()
export class GGraphView extends SGraphView {
    @inject(GridManager) @optional() protected gridManager?: GridManager;

    override render(model: Readonly<SGraphImpl>, context: RenderingContext): VNode {
        const graph = super.render(model, context);
        if (graph.data) {
            graph.data.style = { ...graph.data.style, ...this.getGridStyle(model, context) };
        }
        return graph;
    }

    protected getGridStyle(viewport: Readonly<SGraphImpl>, context: RenderingContext): GridStyle {
        if (context.targetKind === 'hidden' || !this.gridManager?.isGridVisible) {
            return {};
        }
        const bounds = this.getBackgroundBounds(viewport, context, this.gridManager);
        return {
            [GridProperty.GRID_BACKGROUND_X]: bounds.x + 'px',
            [GridProperty.GRID_BACKGROUND_Y]: bounds.y + 'px',
            [GridProperty.GRID_BACKGROUND_WIDTH]: bounds.width + 'px',
            [GridProperty.GRID_BACKGROUND_HEIGHT]: bounds.height + 'px',
            [GridProperty.GRID_BACKGROUND_ZOOM]: viewport.zoom + '',
            [GridProperty.GRID_BACKGROUND_IMAGE]: this.getBackgroundImage(viewport, context, this.gridManager),
            backgroundPosition: `${bounds.x}px ${bounds.y}px`,
            backgroundSize: `${bounds.width}px ${bounds.height}px`
            // we do not set the background-image directly in the style object, because we want to toggle it on and off via CSS
        };
    }

    protected getBackgroundBounds(viewport: Readonly<SGraphImpl>, context: RenderingContext, gridManager: GridManager): Writable<Bounds> {
        const position = Point.multiplyScalar(Point.subtract(gridManager.grid, viewport.scroll), viewport.zoom);
        const size = Dimension.fromPoint(Point.multiplyScalar(gridManager.grid, viewport.zoom));
        return { ...position, ...size };
    }

    protected getBackgroundImage(viewport: Readonly<SGraphImpl>, context: RenderingContext, gridManager: GridManager): string {
        const color = getComputedStyle(document.documentElement).getPropertyValue(GridProperty.GRID_COLOR).trim().replace(/#/g, '%23');
        // eslint-disable-next-line max-len
        return `url('data:image/svg+xml;utf8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridManager.grid.x} ${gridManager.grid.y}"><rect width="${gridManager.grid.x}" height="${gridManager.grid.y}" x="0" y="0" fill="none" stroke="${color}" stroke-width="1" /></svg>')`;
    }
}
