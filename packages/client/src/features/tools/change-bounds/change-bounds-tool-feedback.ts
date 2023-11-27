/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    CommandExecutionContext,
    CommandReturn,
    Disposable,
    ElementMove,
    GChildElement,
    GModelElement,
    GModelRoot,
    MoveAction,
    Point,
    TYPES,
    findParentByFeature,
    hasStringProp,
    isMoveable,
    isSelectable
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';

import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { FeedbackCommand } from '../../../base/feedback/feedback-command';
import { forEachElement } from '../../../utils/gmodel-util';
import { SResizeHandle, addResizeHandles, isResizable, removeResizeHandles } from '../../change-bounds/model';
import { createMovementRestrictionFeedback, removeMovementRestrictionFeedback } from '../../change-bounds/movement-restrictor';
import { PointPositionUpdater } from '../../change-bounds/point-position-updater';
import { ChangeBoundsTool } from './change-bounds-tool';

export interface ShowChangeBoundsToolResizeFeedbackAction extends Action {
    kind: typeof ShowChangeBoundsToolResizeFeedbackAction.KIND;

    elementId: string;
}

export namespace ShowChangeBoundsToolResizeFeedbackAction {
    export const KIND = 'showChangeBoundsToolResizeFeedback';

    export function is(object: any): object is ShowChangeBoundsToolResizeFeedbackAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'elementId');
    }

    export function create(elementId: string): ShowChangeBoundsToolResizeFeedbackAction {
        return {
            kind: KIND,
            elementId
        };
    }
}

export interface HideChangeBoundsToolResizeFeedbackAction extends Action {
    kind: typeof HideChangeBoundsToolResizeFeedbackAction.KIND;
}

export namespace HideChangeBoundsToolResizeFeedbackAction {
    export const KIND = 'hideChangeBoundsToolResizeFeedback';

    export function is(object: any): object is HideChangeBoundsToolResizeFeedbackAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): HideChangeBoundsToolResizeFeedbackAction {
        return { kind: KIND };
    }
}

@injectable()
export class ShowChangeBoundsToolResizeFeedbackCommand extends FeedbackCommand {
    static readonly KIND = ShowChangeBoundsToolResizeFeedbackAction.KIND;

    @inject(TYPES.Action) protected action: ShowChangeBoundsToolResizeFeedbackAction;

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;

        forEachElement(index, isResizable, removeResizeHandles);

        if (this.action.elementId) {
            const resizeElement = index.getById(this.action.elementId);
            if (resizeElement && isResizable(resizeElement)) {
                addResizeHandles(resizeElement);
            }
        }
        return context.root;
    }
}

@injectable()
export class HideChangeBoundsToolResizeFeedbackCommand extends FeedbackCommand {
    static readonly KIND = HideChangeBoundsToolResizeFeedbackAction.KIND;

    @inject(TYPES.Action) protected action: HideChangeBoundsToolResizeFeedbackAction;

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        forEachElement(index, isResizable, removeResizeHandles);
        return context.root;
    }
}

export interface MoveInitializedAction extends Action {
    kind: typeof MoveInitializedAction.KIND;
}

export namespace MoveInitializedAction {
    export const KIND = 'move-initialized';

    export function is(object: any): object is MoveInitializedAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): MoveInitializedAction {
        return { kind: KIND };
    }
}

export interface MoveFinishedAction extends Action {
    kind: typeof MoveFinishedAction.KIND;
}

export namespace MoveFinishedAction {
    export const KIND = 'move-finished';

    export function is(object: any): object is MoveFinishedAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): MoveFinishedAction {
        return { kind: KIND };
    }
}

/**
 * This mouse listener provides visual feedback for moving by sending client-side
 * `MoveAction`s while elements are selected and dragged. This will also update
 * their bounds, which is important, as it is not only required for rendering
 * the visual feedback but also the basis for sending the change to the server
 * (see also `tools/MoveTool`).
 */
export class FeedbackMoveMouseListener extends DragAwareMouseListener implements Disposable {
    protected rootElement?: GModelRoot;
    protected positionUpdater;
    protected elementId2startPos = new Map<string, Point>();

    constructor(protected tool: ChangeBoundsTool) {
        super();
        this.positionUpdater = new PointPositionUpdater(tool.positionSnapper);
    }

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        if (event.button === 0 && !(target instanceof SResizeHandle)) {
            const moveable = findParentByFeature(target, isMoveable);
            if (moveable !== undefined && !(target instanceof SResizeHandle)) {
                this.positionUpdater.updateLastDragPosition(event);
                this.tool.registerFeedback([MoveInitializedAction.create()], this);
            } else {
                this.positionUpdater.resetPosition();
            }
            this._isMouseDrag = false;
        }
        return [];
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.buttons === 0) {
            this.mouseUp(target, event);
        } else if (!this.positionUpdater.isLastDragPositionUndefined()) {
            if (this.elementId2startPos.size === 0) {
                this.collectStartPositions(target.root);
            }
            this._isMouseDrag = true;
            const moveAction = this.getElementMoves(target, event, false);
            if (moveAction) {
                result.push(moveAction);
                result.push(cursorFeedbackAction(CursorCSS.MOVE));
                this.tool.registerFeedback(result, this);
            }
        }
        return [];
    }

    protected collectStartPositions(root: GModelRoot): void {
        this.rootElement = root;
        const selectedElements = root.index.all().filter(element => isSelectable(element) && element.selected);
        const elementsSet = new Set(selectedElements);
        selectedElements
            .filter(element => !this.isChildOfSelected(elementsSet, element))
            .forEach(element => {
                if (isMoveable(element)) {
                    this.elementId2startPos.set(element.id, element.position);
                }
            });
    }

    protected isChildOfSelected(selectedElements: Set<GModelElement>, element: GModelElement): boolean {
        while (element instanceof GChildElement) {
            element = element.parent;
            if (selectedElements.has(element)) {
                return true;
            }
        }
        return false;
    }

    protected getElementMoves(target: GModelElement, event: MouseEvent, finished: boolean): MoveAction | undefined {
        const delta = this.positionUpdater.updatePosition(target, event);
        if (!delta) {
            return undefined;
        }
        const elementMoves: ElementMove[] = this.getElementMovesForDelta(target, delta, finished);
        if (elementMoves.length > 0) {
            return MoveAction.create(elementMoves, { animate: false, finished });
        } else {
            return undefined;
        }
    }

    protected getElementMovesForDelta(target: GModelElement, delta: Point, finished: boolean): ElementMove[] {
        const elementMoves: ElementMove[] = [];
        this.elementId2startPos.forEach((startPosition, elementId) => {
            const element = target.root.index.getById(elementId);
            if (element) {
                if (isMoveable(element)) {
                    const targetPosition = Point.add(element.position, delta);
                    const toPosition = this.validateMove(startPosition, targetPosition, element, finished);
                    elementMoves.push({ elementId: element.id, fromPosition: element.position, toPosition });
                }
            }
        });
        return elementMoves;
    }

    protected validateMove(startPosition: Point, toPosition: Point, element: GModelElement, isFinished: boolean): Point {
        let newPosition = toPosition;
        if (this.tool.movementRestrictor) {
            const valid = this.tool.movementRestrictor.validate(element, toPosition);
            let action;
            if (!valid) {
                action = createMovementRestrictionFeedback(element, this.tool.movementRestrictor);
                if (isFinished) {
                    newPosition = startPosition;
                }
            } else {
                action = removeMovementRestrictionFeedback(element, this.tool.movementRestrictor);
            }
            this.tool.registerFeedback([action], this);
        }
        return newPosition;
    }

    override mouseEnter(target: GModelElement, event: MouseEvent): Action[] {
        if (target instanceof GModelRoot && event.buttons === 0 && this.positionUpdater.isLastDragPositionUndefined()) {
            this.mouseUp(target, event);
        }
        return [];
    }

    override nonDraggingMouseUp(element: GModelElement, event: MouseEvent): Action[] {
        this.reset(true);
        return [];
    }

    override draggingMouseUp(target: GModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (this.positionUpdater.isLastDragPositionUndefined()) {
            this.reset(true);
            return result;
        } else {
            const moveAction = this.getElementMoves(target, event, true);
            if (moveAction) {
                result.push(moveAction);
            }
            const resetFeedback: Action[] = [];
            if (this.tool.movementRestrictor) {
                resetFeedback.push(removeMovementRestrictionFeedback(target, this.tool.movementRestrictor));
            }
            resetFeedback.push(cursorFeedbackAction(CursorCSS.DEFAULT));
            this.tool.deregisterFeedback(this, resetFeedback);
        }
        this.reset();
        return result;
    }

    protected resetMoveFeedback(): ElementMove[] {
        const elementMoves: ElementMove[] = [];
        this.elementId2startPos.forEach((startPosition, elementId) => {
            const element = this.rootElement!.index.getById(elementId);
            if (element) {
                if (isMoveable(element)) {
                    elementMoves.push({ elementId: element.id, fromPosition: element.position, toPosition: startPosition });
                }
            }
        });
        return elementMoves;
    }

    protected reset(resetFeedback = false): void {
        if (this.rootElement && resetFeedback) {
            const elementMoves: ElementMove[] = this.resetMoveFeedback();
            if (elementMoves.length > 0) {
                const moveAction = MoveAction.create(elementMoves, { animate: false, finished: true });
                this.tool.deregisterFeedback(this, [moveAction]);
            }
        } else if (resetFeedback) {
            this.tool.deregisterFeedback(this, [MoveFinishedAction.create()]);
        }
        this.positionUpdater.resetPosition();
        this._isMouseDrag = false;
        this.rootElement = undefined;
        this.elementId2startPos.clear();
    }

    dispose(): void {
        this.reset(true);
    }
}
