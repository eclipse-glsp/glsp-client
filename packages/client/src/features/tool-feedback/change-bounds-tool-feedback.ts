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
} from "sprotty";

import { isNotUndefined } from "../../utils/smodel-util";
import { addResizeHandles, isResizable, removeResizeHandles, SResizeHandle } from "../change-bounds/model";
import { createMovementRestrictionFeedback, removeMovementRestrictionFeedback } from "../change-bounds/movement-restrictor";
import { ChangeBoundsTool } from "../tools/change-bounds-tool";
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
    static readonly KIND = "showChangeBoundsToolResizeFeedback";

    constructor(
        @inject(TYPES.Action)
        protected action: ShowChangeBoundsToolResizeFeedbackAction
    ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        index
            .all()
            .filter(isResizable)
            .forEach(removeResizeHandles);

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
    static readonly KIND = "hideChangeBoundsToolResizeFeedback";

    constructor(
        @inject(TYPES.Action)
        protected action: HideChangeBoundsToolResizeFeedbackAction
    ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        index
            .all()
            .filter(isResizable)
            .forEach(removeResizeHandles);
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
    startDragPosition: Point | undefined;
    elementId2startPos = new Map<string, Point>();

    constructor(protected tool: ChangeBoundsTool) {
        super();
    }
    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        if (event.button === 0 && !(target instanceof SResizeHandle)) {
            const moveable = findParentByFeature(target, isMoveable);
            if (moveable !== undefined) {
                this.startDragPosition = { x: event.pageX, y: event.pageY };
            } else {
                this.startDragPosition = undefined;
            }
            this.hasDragged = false;
        }
        return [];
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.buttons === 0) this.mouseUp(target, event);
        else if (this.startDragPosition) {
            if (this.elementId2startPos.size === 0) {
                this.collectStartPositions(target.root);
            }
            this.hasDragged = true;
            const moveAction = this.getElementMoves(target, event, false);
            if (moveAction) result.push(moveAction);
        }
        return result;
    }

    protected collectStartPositions(root: SModelRoot) {
        root.index
            .all()
            .filter(element => isSelectable(element) && element.selected)
            .forEach(element => {
                if (isMoveable(element)) {
                    this.elementId2startPos.set(element.id, element.position);
                }
            });
    }

    protected getElementMoves(target: SModelElement, event: MouseEvent, isFinished: boolean): MoveAction | undefined {
        if (!this.startDragPosition) return undefined;
        const elementMoves: ElementMove[] = [];
        const viewport = findParentByFeature(target, isViewport);
        const zoom = viewport ? viewport.zoom : 1;
        const delta = {
            x: (event.pageX - this.startDragPosition.x) / zoom,
            y: (event.pageY - this.startDragPosition.y) / zoom
        };
        this.elementId2startPos.forEach((startPosition, elementId) => {
            const element = target.root.index.getById(elementId);
            if (element) {
                let toPosition = this.snap(
                    {
                        x: startPosition.x + delta.x,
                        y: startPosition.y + delta.y
                    },
                    element,
                    !event.shiftKey
                );

                if (isMoveable(element)) {
                    toPosition = this.validateMove(startPosition, toPosition, element, isFinished);
                    elementMoves.push({
                        elementId: element.id,
                        fromPosition: {
                            x: element.position.x,
                            y: element.position.y
                        },
                        toPosition
                    });
                }
            }
        });
        if (elementMoves.length > 0)
            return new MoveAction(elementMoves, false, isFinished);
        else return undefined;
    }

    protected validateMove(startPostion: Point, toPosition: Point, element: SModelElement, isFinished: boolean) {
        let newPosition = toPosition;
        if (this.tool.movementRestrictor) {
            const valid = this.tool.movementRestrictor.validate(toPosition, element);
            let action;
            if (!valid) {
                action = createMovementRestrictionFeedback(element, this.tool.movementRestrictor);

                if (isFinished) {
                    newPosition = startPostion;
                }
            } else {
                action = removeMovementRestrictionFeedback(element, this.tool.movementRestrictor);
            }

            this.tool.dispatchFeedback([action], this);
        }
        return newPosition;
    }
    protected snap(position: Point, element: SModelElement, isSnap: boolean): Point {
        if (isSnap && this.tool.snapper) return this.tool.snapper.snap(position, element);
        else return position;
    }

    mouseEnter(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SModelRoot && event.buttons === 0)
            this.mouseUp(target, event);
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (this.startDragPosition) {
            const moveAction = this.getElementMoves(target, event, true);
            if (moveAction) {
                result.push(moveAction);
            }
            if (this.tool.movementRestrictor) {
                this.tool.deregisterFeedback([removeMovementRestrictionFeedback(target, this.tool.movementRestrictor)], this);
            }

        }
        this.hasDragged = false;
        this.startDragPosition = undefined;
        this.elementId2startPos.clear();
        return result;
    }

    decorate(vnode: VNode, element: SModelElement): VNode {
        return vnode;
    }
}
