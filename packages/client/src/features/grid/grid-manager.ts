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

import { IActionHandler, PropertiesOfType, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct } from 'inversify';
import { IFeedbackActionDispatcher } from '../../base/feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from '../../base/feedback/feedback-emitter';
import { Grid } from './grid';
import { ShowGridAction } from './grid-model';

export type GridStyle = Record<string, string> & Partial<PropertiesOfType<CSSStyleDeclaration, string>>;

export interface IGridManager {
    /** The grid to manage. */
    readonly grid: Grid;
    /** Flag to indicate whether the grid is visible. */
    readonly isGridVisible: boolean;
    /** Sets the visibility of the grid. */
    setGridVisible(visible: boolean): void;
    /** Toggles the visibility of the grid. */
    toggleGridVisible(): void;
}

/**
 * The default {@link IGridManager} implementation.
 * This class manages the visibility and behavior of a grid in the application.
 */
@injectable()
export class GridManager implements IActionHandler, IGridManager {
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
        this.setGridVisible(action.show);
    }

    setGridVisible(visible: boolean): void {
        if (this._gridVisible && !visible) {
            this._gridVisible = false;
            this.gridFeedback.dispose();
        } else if (!this._gridVisible && visible) {
            this._gridVisible = true;
            this.gridFeedback.add(ShowGridAction.create({ show: true }), ShowGridAction.create({ show: false })).submit();
        }
    }

    toggleGridVisible(): void {
        this.setGridVisible(!this._gridVisible);
    }
}
