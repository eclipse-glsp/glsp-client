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
    IActionHandler,
    MouseListener,
    SChildElement,
    SModelElement,
    SModelRoot
} from 'sprotty';
import {
    Action, DisposeSubclientAction,
    hasObjectProp,
    MouseMoveAction,
    Point, SetViewportAction, SubclientInfo, Viewport
} from '@eclipse-glsp/protocol';
import {inject, injectable} from 'inversify';
import {IFeedbackActionDispatcher} from '../tool-feedback/feedback-action-dispatcher';
import {FeedbackCommand} from '../tool-feedback/model';
import {TYPES} from '../../base/types';

export const MOUSE_POINTER = 'mouse-pointer';

export interface DrawMousePointerAction extends Action {
    kind: typeof DrawMousePointerAction.KIND;
    position: Point;
    initialSubclientInfo: SubclientInfo;
}

export namespace DrawMousePointerAction {
    export const KIND = 'drawMousePointer';

    export function is(object: any): object is DrawMousePointerAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'position') && hasObjectProp(object, 'initialSubclientInfo');
    }

    export function create(options: { position: Point, initialSubclientInfo: SubclientInfo }): DrawMousePointerAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class DrawMousePointerCommand extends FeedbackCommand {
    static readonly KIND = DrawMousePointerAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawMousePointerAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = mousePointerId(context.root, this.action.initialSubclientInfo.subclientId);
        removeMousePointer(context.root, id);
        const mousePointerSchema = {
            id,
            type: MOUSE_POINTER,
            position: {
                x: this.action.position.x,
                y: this.action.position.y
            },
            color: this.action.initialSubclientInfo.color,
            name: this.action.initialSubclientInfo.name
        };
        context.root.add(context.modelFactory.createElement(mousePointerSchema));
        return context.root;
    }
}

export interface RemoveMousePointerAction extends Action {
    kind: typeof RemoveMousePointerAction.KIND;
    initialSubclientInfo: SubclientInfo;
}

export namespace RemoveMousePointerAction {
    export const KIND = 'removeMousePointer';

    export function is(object: any): object is RemoveMousePointerAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'initialSubclientInfo');
    }

    export function create(options: { initialSubclientInfo: SubclientInfo }): RemoveMousePointerAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class RemoveMousePointerCommand extends Command {
    static readonly KIND = RemoveMousePointerAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RemoveMousePointerAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = mousePointerId(context.root, this.action.initialSubclientInfo.subclientId);
        removeMousePointer(context.root, id);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export function mousePointerId(root: SModelRoot, subclientId: string): string {
    return root.id + '_' + MOUSE_POINTER + '_' + subclientId;
}

export function removeMousePointer(root: SModelRoot, id: string): void {
    const mousePointer = root.index.getById(id);
    if (mousePointer instanceof SChildElement) {
        root.remove(mousePointer);
    }
}

@injectable()
export class MouseMoveListener extends MouseListener implements IActionHandler {

    protected lastViewport: Viewport = {
        scroll: {
            x: 0,
            y: 0
        },
        zoom: 1
    };

    override mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const x = this.lastViewport.scroll.x + (event.pageX / this.lastViewport.zoom);
        const y = this.lastViewport.scroll.y + (event.pageY / this.lastViewport.zoom);

        return [MouseMoveAction.create({ position: { x, y }})];
    }

    handle(action: Action): void {
        if (SetViewportAction.is(action)) {
            this.lastViewport = action.newViewport;
        }
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
