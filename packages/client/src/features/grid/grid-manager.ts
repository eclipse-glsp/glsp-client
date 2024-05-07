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

import { IActionHandler, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct } from 'inversify';
import { FeedbackEmitter, IFeedbackActionDispatcher } from '../../base';
import { Grid } from './grid';
import { ShowGridAction } from './grid-model';

@injectable()
export class GridManager implements IActionHandler {
    protected _gridVisible: boolean = false;
    protected gridFeedback: FeedbackEmitter;

    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackDispatcher: IFeedbackActionDispatcher;

    @inject(Grid)
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
}
