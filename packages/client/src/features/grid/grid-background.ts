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

import {
    Action,
    IActionHandler,
    MaybePromise,
    Point,
    SetViewportAction,
    TYPES,
    ViewerOptions,
    Viewport,
    findParentByFeature,
    isViewport
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService, IDiagramStartup } from '../../base';
import { Grid } from './grid';

@injectable()
export class GridBackground implements IActionHandler, IDiagramStartup {
    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;
    @inject(Grid) protected grid: Grid;
    @inject(EditorContextService) protected editorContextService: EditorContextService;

    handle(action: Action): void {
        if (SetViewportAction.is(action)) {
            this.moveGridBackground(action.newViewport);
        }
    }

    postModelInitialization(): MaybePromise<void> {
        this.moveGridBackground();
        const div = document.querySelector<HTMLElement>(`#${this.options.baseDiv}`);
        if (div) {
            div.style.setProperty('--grid-background-image', this.getBackgroundImage());
        }
    }

    protected getBackgroundImage(): string {
        // eslint-disable-next-line max-len
        return `url('data:image/svg+xml;utf8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.grid.x} ${this.grid.y}"><rect width="${this.grid.x}" height="${this.grid.y}" x="0" y="0" fill="none" stroke="black" stroke-width="1" stroke-opacity="0.10" /></svg>')`;
    }

    protected getViewport(): Viewport {
        return findParentByFeature(this.editorContextService.modelRoot, isViewport) ?? { scroll: Point.ORIGIN, zoom: 1 };
    }

    protected moveGridBackground(viewport: Viewport = this.getViewport()): void {
        const graphDiv = document.querySelector<HTMLElement>(`#${this.options.baseDiv} .sprotty-graph`);
        if (graphDiv) {
            const bgPosition = Point.multiplyScalar(Point.subtract(this.grid, viewport.scroll), viewport.zoom);
            const bgSize = Point.multiplyScalar(this.grid, viewport.zoom);

            graphDiv.style.backgroundPosition = `${bgPosition.x}px ${bgPosition.y}px`;
            graphDiv.style.backgroundSize = `${bgSize.x}px ${bgSize.y}px`;
        }
    }
}
