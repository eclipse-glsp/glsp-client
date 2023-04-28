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
    Command,
    CommandExecutionContext,
    CommandReturn,
    IActionHandler, InitializeCanvasBoundsAction,
    SChildElement,
    SModelRoot
} from 'sprotty';
import {
    Action, Bounds, DisposeSubclientAction,
    hasObjectProp,
    SetViewportAction, SubclientInfo, Viewport, ViewportBoundsChangeAction
} from '@eclipse-glsp/protocol';
import {inject, injectable} from 'inversify';
import {IFeedbackActionDispatcher} from '../tool-feedback/feedback-action-dispatcher';
import {FeedbackCommand} from '../tool-feedback/model';
import {TYPES} from '../../base/types';

export const VIEWPORT_RECT = 'viewport-rect';

export interface DrawViewportRectAction extends Action {
    kind: typeof DrawViewportRectAction.KIND;
    bounds: Bounds;
    initialSubclientInfo: SubclientInfo;
}

export namespace DrawViewportRectAction {
    export const KIND = 'drawViewportRect';

    export function is(object: any): object is DrawViewportRectAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'bounds') && hasObjectProp(object, 'initialSubclientInfo');
    }

    export function create(options: { bounds: Bounds, initialSubclientInfo: SubclientInfo }): DrawViewportRectAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class DrawViewportRectCommand extends FeedbackCommand {
    static readonly KIND = DrawViewportRectAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawViewportRectAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = viewportRectId(context.root, this.action.initialSubclientInfo.subclientId);
        removeViewportRect(context.root, id);
        const viewportRectSchema = {
            id,
            type: VIEWPORT_RECT,
            position: {
                x: this.action.bounds.x,
                y: this.action.bounds.y
            },
            size: {
                width: this.action.bounds.width,
                height: this.action.bounds.height
            },
            color: this.action.initialSubclientInfo.color,
            name: this.action.initialSubclientInfo.name
        };
        context.root.add(context.modelFactory.createElement(viewportRectSchema));
        return context.root;
    }
}

export interface RemoveViewportRectAction extends Action {
    kind: typeof RemoveViewportRectAction.KIND;
    initialSubclientInfo: SubclientInfo;
}

export namespace RemoveViewportRectAction {
    export const KIND = 'removeViewportRefct';

    export function is(object: any): object is RemoveViewportRectAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'initialSubclientInfo');
    }

    export function create(options: { initialSubclientInfo: SubclientInfo }): RemoveViewportRectAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class RemoveViewportRectCommand extends Command {
    static readonly KIND = RemoveViewportRectAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RemoveViewportRectAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = viewportRectId(context.root, this.action.initialSubclientInfo.subclientId);
        removeViewportRect(context.root, id);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export function viewportRectId(root: SModelRoot, subclientId: string): string {
    return root.id + '_' + VIEWPORT_RECT + '_' + subclientId;
}

export function removeViewportRect(root: SModelRoot, id: string): void {
    const viewportRect = root.index.getById(id);
    if (viewportRect instanceof SChildElement) {
        root.remove(viewportRect);
    }
}

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

/**
 * Catches all MouseMoveActions and creates DrawMousePointerActions for MouseMoveActions initiated from other subclients.
 * Saves LastActions per subclient and passes all lastActions to feedbackActionDispatcher
 */
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
            // we could also use something to identify mousepointer and subclient in feedbackActionDispatcher instead of lastActions
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
