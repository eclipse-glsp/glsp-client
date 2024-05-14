/********************************************************************************
 * Copyright (c) 2024 Axon Ivy AG and others.
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
    Dimension,
    GGraphView,
    GViewportRootElement,
    IViewArgs,
    Point,
    RenderingContext,
    SGraphImpl,
    TYPES,
    Writable
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { VNode, VNodeStyle } from 'snabbdom';
import { GLSPProjectionView } from '../../views';
import { GridManager } from './grid-manager';

@injectable()
export class GridGraphView extends GGraphView {
    @inject(TYPES.IGridManager) protected gridManager: GridManager;

    override render(model: Readonly<SGraphImpl>, context: RenderingContext): VNode {
        const graph = super.render(model, context);
        if (graph.data) {
            graph.data!.style = { ...graph.data.style, ...this.backgroundStyle(model) };
        }
        return graph;
    }

    protected backgroundStyle(model: Readonly<SGraphImpl>): VNodeStyle & Partial<CSSStyleDeclaration> {
        if (!this.gridManager.isGridVisible) {
            return {};
        }
        const bounds = this.getBackgroundBounds(model);
        // we do not set the background image directly in the style object, because we want to toggle it on and off via CSS
        return {
            backgroundPosition: `${bounds.x}px ${bounds.y}px`,
            backgroundSize: `${bounds.width}px ${bounds.height}px`,
            '--grid-background-image': this.getBackgroundImage(model)
        };
    }

    protected getBackgroundBounds(viewport: Readonly<SGraphImpl>): Writable<Bounds> {
        const position = Point.multiplyScalar(Point.subtract(this.gridManager.grid, viewport.scroll), viewport.zoom);
        const size = Dimension.fromPoint(Point.multiplyScalar(this.gridManager.grid, viewport.zoom));
        return { ...position, ...size };
    }

    protected getBackgroundImage(model: Readonly<SGraphImpl>): string {
        // eslint-disable-next-line max-len
        return `url('data:image/svg+xml;utf8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.gridManager.grid.x} ${this.gridManager.grid.y}"><rect width="${this.gridManager.grid.x}" height="${this.gridManager.grid.y}" x="0" y="0" fill="none" stroke="black" stroke-width="1" stroke-opacity="0.10" /></svg>')`;
    }
}

@injectable()
export class GridProjectionGraphView extends GLSPProjectionView {
    @inject(TYPES.IGridManager) protected gridManager: GridManager;

    protected override renderSvg(model: Readonly<GViewportRootElement>, context: RenderingContext, args?: IViewArgs | undefined): VNode {
        const graph = super.renderSvg(model, context);
        if (graph.data) {
            graph.data!.style = { ...graph.data.style, ...this.backgroundStyle(model) };
        }
        return graph;
    }

    protected backgroundStyle(model: Readonly<SGraphImpl>): VNodeStyle & Partial<CSSStyleDeclaration> {
        if (!this.gridManager.isGridVisible) {
            return {};
        }
        const bounds = this.getBackgroundBounds(model);
        // we do not set the background image directly in the style object, because we want to toggle it on and off via CSS
        return {
            backgroundPosition: `${bounds.x}px ${bounds.y}px`,
            backgroundSize: `${bounds.width}px ${bounds.height}px`,
            '--grid-background-image': this.getBackgroundImage(model)
        };
    }

    protected getBackgroundBounds(viewport: Readonly<SGraphImpl>): Writable<Bounds> {
        const position = Point.multiplyScalar(Point.subtract(this.gridManager.grid, viewport.scroll), viewport.zoom);
        const size = Dimension.fromPoint(Point.multiplyScalar(this.gridManager.grid, viewport.zoom));
        return { ...position, ...size };
    }

    protected getBackgroundImage(model: Readonly<SGraphImpl>): string {
        // eslint-disable-next-line max-len
        return `url('data:image/svg+xml;utf8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.gridManager.grid.x} ${this.gridManager.grid.y}"><rect width="${this.gridManager.grid.x}" height="${this.gridManager.grid.y}" x="0" y="0" fill="none" stroke="black" stroke-width="1" stroke-opacity="0.10" /></svg>')`;
    }
}
