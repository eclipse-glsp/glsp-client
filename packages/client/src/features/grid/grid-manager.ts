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

import { Bounds, Dimension, IActionHandler, Point, PropertiesOfType, SGraphImpl, TYPES, Writable } from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct } from 'inversify';
import { FeedbackEmitter, IFeedbackActionDispatcher } from '../../base';
import { Grid } from './grid';
import { ShowGridAction } from './grid-model';

export type GridStyle = Record<string, string> & Partial<PropertiesOfType<CSSStyleDeclaration, string>>;

@injectable()
export class GridManager implements IActionHandler {
    protected _gridVisible: boolean = false;
    protected gridFeedback: FeedbackEmitter;

    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackDispatcher: IFeedbackActionDispatcher;

    @inject(TYPES.Grid)
    public readonly grid: Grid;

    get isGridVisible(): boolean {
        return this._gridVisible;
    }

    @postConstruct()
    protected init(): void {
        this.gridFeedback = this.feedbackDispatcher.createEmitter();
    }

    handle(action: ShowGridAction): void {
        this._gridVisible = action.show;
    }

    setGridVisible(visible: boolean): void {
        if (!visible) {
            this.gridFeedback.dispose();
        } else {
            this.gridFeedback.add(ShowGridAction.create({ show: true }), ShowGridAction.create({ show: false })).submit();
        }
    }

    toggleGridVisible(): void {
        this.setGridVisible(!this._gridVisible);
    }

    getGridStyle(model: Readonly<SGraphImpl>): GridStyle {
        if (!this.isGridVisible) {
            return {};
        }
        const bounds = this.getBackgroundBounds(model);
        return {
            backgroundPosition: `${bounds.x}px ${bounds.y}px`,
            backgroundSize: `${bounds.width}px ${bounds.height}px`,
            // we do not set the background image directly in the style object, because we want to toggle it on and off via CSS
            '--grid-background-image': this.getBackgroundImage(model)
        };
    }

    protected getBackgroundBounds(viewport: Readonly<SGraphImpl>): Writable<Bounds> {
        const position = Point.multiplyScalar(Point.subtract(this.grid, viewport.scroll), viewport.zoom);
        const size = Dimension.fromPoint(Point.multiplyScalar(this.grid, viewport.zoom));
        return { ...position, ...size };
    }

    protected getBackgroundImage(model: Readonly<SGraphImpl>): string {
        // eslint-disable-next-line max-len
        return `url('data:image/svg+xml;utf8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.grid.x} ${this.grid.y}"><rect width="${this.grid.x}" height="${this.grid.y}" x="0" y="0" fill="none" stroke="black" stroke-width="1" stroke-opacity="0.10" /></svg>')`;
    }
}
