/********************************************************************************
 * Copyright (c) 2020-2025 EclipseSource and others.
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
    Bounds,
    EMPTY_ROOT,
    GIssueSeverity,
    GModelElement,
    GModelElementSchema,
    GModelRootSchema,
    GPreRenderedElementSchema,
    HoverFeedbackAction,
    HoverMouseListener,
    IActionHandler,
    ICommand,
    RequestPopupModelAction,
    SetPopupModelAction
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { FocusStateChangedAction } from '../../base/focus/focus-state-change-action';
import { messages } from '../../base/messages';
import { EnableDefaultToolsAction, EnableToolsAction } from '../../base/tool-manager/tool';
import { EdgeCreationTool } from '../tools/edge-creation/edge-creation-tool';
import { GIssueMarker, getSeverity } from '../validation/issue-marker';
@injectable()
export class GlspHoverMouseListener extends HoverMouseListener implements IActionHandler {
    protected enableHover = true;
    /**
     * Stops mouse over timer and remove hover feedback, if focus is lost.
     *
     * This fixes strange effects that appear if the mouse left the element via e.g. a context menu,
     * which explicitly removes the focus of the diagram.
     * @see SelectionServiceAwareContextMenuMouseListener
     * @param action should be a `FocusStateChangedAction`
     * @returns a `HoverFeedbackAction` resetting the state, if the specified action indicates lost focus
     */
    handle(action: Action): void | Action | ICommand {
        if (FocusStateChangedAction.is(action) && !action.hasFocus) {
            this.stopMouseOverTimer();
            if (this.lastHoverFeedbackElementId) {
                const previousTargetId = this.lastHoverFeedbackElementId;
                this.lastHoverFeedbackElementId = undefined;
                return HoverFeedbackAction.create({ mouseoverElement: previousTargetId, mouseIsOver: false });
            }
        } else if (EnableToolsAction.is(action)) {
            this.enableHover = !(action as EnableToolsAction).toolIds.includes(EdgeCreationTool.ID);
        } else if (EnableDefaultToolsAction.is(action)) {
            this.enableHover = true;
        }
    }

    override mouseOver(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (this.enableHover) {
            return super.mouseOver(target, event);
        }
        return [];
    }

    protected override startMouseOverTimer(target: GModelElement, event: MouseEvent): Promise<Action> {
        this.stopMouseOverTimer();
        return new Promise(resolve => {
            this.state.mouseOverTimer = window.setTimeout(() => {
                const popupBounds = this.computePopupBounds(target, { x: event.pageX, y: event.pageY });
                if (target instanceof GIssueMarker) {
                    resolve(SetPopupModelAction.create(this.createPopupModel(target, popupBounds)));
                } else {
                    resolve(RequestPopupModelAction.create({ elementId: target.id, bounds: popupBounds }));
                }

                this.state.popupOpen = true;
                this.state.previousPopupElement = target;
            }, this.options.popupOpenDelay);
        });
    }

    protected createPopupModel(marker: GIssueMarker, bounds: Bounds): GModelRootSchema {
        if (marker.issues !== undefined && marker.issues.length > 0) {
            return {
                type: 'html',
                id: 'sprotty-popup',
                children: [this.createMarkerIssuePopup(marker)],
                canvasBounds: this.modifyBounds(bounds)
            };
        }
        return { type: EMPTY_ROOT.type, id: EMPTY_ROOT.id };
    }

    protected createMarkerIssuePopup(marker: GIssueMarker): GModelElementSchema {
        const message = this.createIssueMessage(marker);
        return <GPreRenderedElementSchema>{
            type: 'pre-rendered',
            id: 'popup-title',
            code: `<div class="${getSeverity(marker)}"><div class="sprotty-popup-title">${message}</div></div>`
        };
    }

    protected createIssueMessage(marker: GIssueMarker): string {
        return '<ul>' + marker.issues.map(i => '<li>' + this.getSeverityString(i.severity) + ': ' + i.message + '</li>').join('') + '</ul>';
    }

    protected getSeverityString(severity: GIssueSeverity): string {
        switch (severity) {
            case 'error':
                return messages.issue_marker.severity_error;
            case 'warning':
                return messages.issue_marker.severity_warning;
            case 'info':
                return messages.issue_marker.severity_info;
        }
    }

    protected modifyBounds(bounds: Bounds): Bounds {
        return bounds;
    }
}
