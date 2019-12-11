/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable } from "inversify";
import { VNode } from "snabbdom/vnode";
import {
    Action,
    CommandExecutionContext,
    CommandReturn,
    ElementMove,
    findParentByFeature,
    isMoveable,
    isSelectable,
    isViewport,
    MouseListener,
    MoveAction,
    Point,
    SModelElement,
    SModelRoot,
    TYPES
} from "sprotty/lib";

import { isNotUndefined } from "../../utils/smodel-util";
import { getAbsolutePosition } from "../../utils/viewpoint-util";
import {
    addResizeHandles,
    isBoundsAwareMoveable,
    isResizable,
    removeResizeHandles,
    SResizeHandle
} from "../change-bounds/model";
import { IMovementRestrictor } from "../change-bounds/movement-restrictor";
import { FeedbackCommand } from "./model";

export class ShowChangeBoundsToolResizeFeedbackAction implements Action {
    kind = ShowChangeBoundsToolResizeFeedbackCommand.KIND;
    constructor(readonly elementId?: string) { }
}

export class HideChangeBoundsToolResizeFeedbackAction implements Action {
    kind = HideChangeBoundsToolResizeFeedbackCommand.KIND;
    constructor() { }
}

@injectable()
export class ShowChangeBoundsToolResizeFeedbackCommand extends FeedbackCommand {
    static readonly KIND = 'showChangeBoundsToolResizeFeedback';

    constructor(@inject(TYPES.Action) protected action: ShowChangeBoundsToolResizeFeedbackAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        index.all().filter(isResizable).forEach(removeResizeHandles);

        if (isNotUndefined(this.action.elementId)) {
            const resizeElement = index.getById(this.action.elementId);
            if (isNotUndefined(resizeElement) && isResizable(resizeElement)) {
                addResizeHandles(resizeElement);
            }
        }
        return context.root;
    }
}

@injectable()
export class HideChangeBoundsToolResizeFeedbackCommand extends FeedbackCommand {
    static readonly KIND = 'hideChangeBoundsToolResizeFeedback';

    constructor(@inject(TYPES.Action) protected action: HideChangeBoundsToolResizeFeedbackAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        index.all().filter(isResizable).forEach(removeResizeHandles);
        return context.root;
    }
}

/**
 * This mouse listener provides visual feedback for moving by sending client-side
 * `MoveAction`s while elements are selected and dragged. This will also update
 * their bounds, which is important, as it is not only required for rendering
 * the visual feedback but also the basis for sending the change to the server
 * (see also `tools/MoveTool`).
 */
export class FeedbackMoveMouseListener extends MouseListener {
    hasDragged = false;
    lastDragPosition: Point | undefined;
    constructor(protected movementRestrictor?: IMovementRestrictor) { super(); }
    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        if (event.button === 0 && !(target instanceof SResizeHandle)) {
            const moveable = findParentByFeature(target, isMoveable);
            if (moveable !== undefined) {
                this.lastDragPosition = { x: event.pageX, y: event.pageY };
            } else {
                this.lastDragPosition = undefined;
            }
            this.hasDragged = false;
        }
        return [];
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.buttons === 0)
            this.mouseUp(target, event);
        else if (this.lastDragPosition) {
            const viewport = findParentByFeature(target, isViewport);
            this.hasDragged = true;
            const zoom = viewport ? viewport.zoom : 1;
            const mousePoint: Point = getAbsolutePosition(target, event);
            const dx = (event.pageX - this.lastDragPosition.x) / zoom;
            const dy = (event.pageY - this.lastDragPosition.y) / zoom;
            const nodeMoves: ElementMove[] = [];
            let isValidMove: boolean = true;

            target.root.index.all()
                .filter(element => isSelectable(element) && element.selected)
                .forEach(element => {
                    if (isBoundsAwareMoveable(element)) {
                        // If a movement restrictor is bound attemt a non restricted move
                        if (this.movementRestrictor) {
                            isValidMove = this.movementRestrictor.attemptMove(element, mousePoint, target, { x: dx, y: dy }, result);
                        }
                    }
                    if (isMoveable(element) && isValidMove) {
                        nodeMoves.push({
                            elementId: element.id,
                            fromPosition: {
                                x: element.position.x,
                                y: element.position.y
                            },
                            toPosition: {
                                x: element.position.x + dx,
                                y: element.position.y + dy
                            }
                        });
                    }
                });
            this.lastDragPosition = { x: event.pageX, y: event.pageY };
            if (nodeMoves.length > 0 && isValidMove) {
                result.push(new MoveAction(nodeMoves, false));
            }
        }
        return result;
    }

    mouseEnter(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SModelRoot && event.buttons === 0)
            this.mouseUp(target, event);
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        this.hasDragged = false;
        this.lastDragPosition = undefined;
        return [];
    }

    decorate(vnode: VNode, element: SModelElement): VNode {
        return vnode;
    }

}
