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
    IActionHandler,
    MouseListener,
    SModelElement
} from 'sprotty';
import {
    Action, DisposeSubclientAction,
    MouseMoveAction,
    SetViewportAction, Viewport
} from '@eclipse-glsp/protocol';
import {inject, injectable} from 'inversify';
import {IFeedbackActionDispatcher} from '../../tool-feedback/feedback-action-dispatcher';
import {TYPES} from '../../../base/types';
import {BaseGLSPTool} from '../../tools/base-glsp-tool';
import {DrawMousePointerAction, RemoveMousePointerAction} from './mouse-move-actions';

@injectable()
export class MouseMoveTool extends BaseGLSPTool implements IActionHandler {
    static ID = 'glsp.mouse-move-tool';

    protected mouseListener: MouseMoveListener;

    get id(): string {
        return MouseMoveTool.ID;
    }

    protected lastViewport: Viewport = {
        scroll: {
            x: 0,
            y: 0
        },
        zoom: 1
    };

    handle(action: Action): void {
        if (SetViewportAction.is(action)) {
            this.lastViewport = action.newViewport;
        }
    }

    enable(): void {
        this.mouseListener = new MouseMoveListener(this);
        this.mouseTool.register(this.mouseListener);
    }

    disable(): void {
        this.mouseTool.deregister(this.mouseListener);
    }

    getLastViewport(): Viewport {
        return this.lastViewport;
    }
}

export class MouseMoveListener extends MouseListener {

    constructor(protected tool: MouseMoveTool) {
        super();
    }

    override mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const lastViewport = this.tool.getLastViewport();
        const x = lastViewport.scroll.x + (event.pageX / lastViewport.zoom);
        const y = lastViewport.scroll.y + (event.pageY / lastViewport.zoom);

        return [MouseMoveAction.create({ position: { x, y }})];
    }
}

/**
 * Catches all MouseMoveActions and creates DrawMousePointerActions for MouseMoveActions initiated from other subclients.
 * Saves LastActions per subclient and passes all lastActions to feedbackActionDispatcher
 */
@injectable()
export class DrawMousePointerProvider implements IActionHandler {
    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    protected lastActions: Map<string, DrawMousePointerAction> = new Map();

    handle(action: Action): Action | void {
        if (MouseMoveAction.is(action) && action.initialSubclientInfo != null) {
            const feedbackAction = DrawMousePointerAction.create({
                position: action.position,
                initialSubclientInfo: action.initialSubclientInfo
            });
            // we could also use something to identify mousepointer and subclient in feedbackActionDispatcher instead of lastActions
            this.lastActions.set(feedbackAction.initialSubclientInfo.subclientId, feedbackAction);
            this.feedbackActionDispatcher.registerFeedback(this, [...this.lastActions.values()]);
        }
        if (DisposeSubclientAction.is(action) && action.initialSubclientInfo != null) {
            this.lastActions.delete(action.initialSubclientInfo.subclientId);
            this.feedbackActionDispatcher.registerFeedback(this, [...this.lastActions.values()]);
            return RemoveMousePointerAction.create({
                initialSubclientInfo: action.initialSubclientInfo
            });
        }
    }
}
