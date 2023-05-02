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

import {
    IActionHandler, InitializeCanvasBoundsAction
} from 'sprotty';
import {
    Action, Bounds, DisposeSubclientAction,
    SetViewportAction, Viewport, ViewportBoundsChangeAction
} from '@eclipse-glsp/protocol';
import {inject, injectable} from 'inversify';
import {IFeedbackActionDispatcher} from '../../tool-feedback/feedback-action-dispatcher';
import {TYPES} from '../../../base/types';
import {DrawViewportRectAction, RemoveViewportRectAction} from './viewport-bounds-change-actions';

@injectable()
export class ViewportBoundsChangeTool implements IActionHandler {

    protected lastViewport: Viewport = {
        scroll: {
            x: 0,
            y: 0
        },
        zoom: 1
    };

    protected lastCanvasBounds: Bounds | undefined = undefined;

    handle(action: Action): Action | void {
        if (isInitializeCanvasBoundsAction(action)) {
            this.lastCanvasBounds = action.newCanvasBounds;
        }
        if (SetViewportAction.is(action)) {
            this.lastViewport = action.newViewport;
        }
        if (this.lastCanvasBounds) {
            return ViewportBoundsChangeAction.create({
                bounds: {
                    x: this.lastViewport.scroll.x,
                    y: this.lastViewport.scroll.y,
                    width: this.lastCanvasBounds.width/this.lastViewport.zoom,
                    height: this.lastCanvasBounds.height/this.lastViewport.zoom
                }
            })
        }
    }

}

function isInitializeCanvasBoundsAction(action: Action): action is InitializeCanvasBoundsAction {
    return action.kind === InitializeCanvasBoundsAction.KIND;
}

@injectable()
export class DrawViewportRectProvider implements IActionHandler {
    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    protected lastActions: Map<string, DrawViewportRectAction> = new Map();

    handle(action: Action): Action | void {
        if (ViewportBoundsChangeAction.is(action) && action.initialSubclientInfo != null) {
            const feedbackAction = DrawViewportRectAction.create({
                bounds: action.bounds,
                initialSubclientInfo: action.initialSubclientInfo
            });
            this.lastActions.set(feedbackAction.initialSubclientInfo.subclientId, feedbackAction);
            this.feedbackActionDispatcher.registerFeedback(this, [...this.lastActions.values()]);
        }
        if (DisposeSubclientAction.is(action) && action.initialSubclientInfo != null) {
            this.lastActions.delete(action.initialSubclientInfo.subclientId);
            this.feedbackActionDispatcher.registerFeedback(this, [...this.lastActions.values()]);
            return RemoveViewportRectAction.create({
                initialSubclientInfo: action.initialSubclientInfo
            });
        }
    }
}
