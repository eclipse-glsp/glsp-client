/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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
import { inject, injectable } from 'inversify';
import { Action, IActionHandler, ICommand, TYPES, ViewerOptions } from '@eclipse-glsp/sprotty';
import { FocusStateChangedAction } from './focus-state-change-action';

@injectable()
export class FocusTracker implements IActionHandler {
    protected inActiveCssClass = 'inactive';
    protected _hasFocus = true;
    protected _focusElement: HTMLOrSVGElement | null;
    protected _diagramElement: HTMLElement | null;

    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;

    get hasFocus(): boolean {
        return this._hasFocus;
    }

    get focusElement(): HTMLOrSVGElement | null {
        return this._focusElement;
    }

    get diagramElement(): HTMLElement | null {
        return this._diagramElement;
    }

    handle(action: Action): void | Action | ICommand {
        if (FocusStateChangedAction.is(action)) {
            this._hasFocus = action.hasFocus;
            this._focusElement = document.activeElement as HTMLOrSVGElement | null;
            this._diagramElement = document.getElementById(this.options.baseDiv);
            if (!this._diagramElement) {
                return;
            }
            if (this.hasFocus) {
                if (this._diagramElement.classList.contains(this.inActiveCssClass)) {
                    this._diagramElement.classList.remove(this.inActiveCssClass);
                }
            } else {
                this._diagramElement.classList.add(this.inActiveCssClass);
            }
        }
    }
}
