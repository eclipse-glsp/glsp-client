/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { injectable } from "inversify";
import {
    Action,
    Bounds,
    EMPTY_ROOT,
    HoverMouseListener,
    PreRenderedElementSchema,
    RequestPopupModelAction,
    SetPopupModelAction,
    SIssueMarker,
    SIssueSeverity,
    SModelElement,
    SModelRootSchema
} from "sprotty";

import { GIssueMarker } from "../validation/validate";

@injectable()
export class GlspHoverMouseListener extends HoverMouseListener {

    protected startMouseOverTimer(target: SModelElement, event: MouseEvent): Promise<Action> {
        this.stopMouseOverTimer();
        return new Promise(resolve => {
            this.state.mouseOverTimer = window.setTimeout(() => {
                const popupBounds = this.computePopupBounds(target, { x: event.pageX, y: event.pageY });
                if (target instanceof GIssueMarker) {
                    resolve(new SetPopupModelAction(this.createPopupModel(target as GIssueMarker, popupBounds)));
                } else {
                    resolve(new RequestPopupModelAction(target.id, popupBounds));
                }

                this.state.popupOpen = true;
                this.state.previousPopupElement = target;
            }, this.options.popupOpenDelay);
        });
    }

    protected createPopupModel(marker: GIssueMarker, bounds: Bounds): SModelRootSchema {
        if (marker.issues !== undefined && marker.issues.length > 0) {
            const message = '<ul>' + marker.issues.map(i => '<li>' + i.severity.toUpperCase() + ': ' + i.message + '</li>').join('') + '</ul>';
            return {
                type: 'html',
                id: 'sprotty-popup',
                children: [
                    <PreRenderedElementSchema>{
                        type: 'pre-rendered',
                        id: 'popup-title',
                        code: `<div class="${getSeverity(marker)}"><div class="sprotty-popup-title">${message}</div></div>`
                    }
                ],
                canvasBounds: this.modifyBounds(bounds)
            };
        }
        return { type: EMPTY_ROOT.type, id: EMPTY_ROOT.id };
    }

    protected modifyBounds(bounds: Bounds): Bounds {
        return bounds;
    }
}

export function getSeverity(marker: SIssueMarker): SIssueSeverity {
    let currentSeverity: SIssueSeverity = 'info';
    for (const severity of marker.issues.map(s => s.severity)) {
        if (severity === 'error')
            return severity;
        if (severity === 'warning' && currentSeverity === 'info')
            currentSeverity = severity;
    }
    return currentSeverity;
}
