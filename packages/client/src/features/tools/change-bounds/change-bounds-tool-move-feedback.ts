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
import { Action, Disposable, ElementMove, GModelElement, GModelRoot, MoveAction, Point, findParentByFeature } from '@eclipse-glsp/sprotty';

import { DebouncedFunc, debounce } from 'lodash';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feeback-emitter';
import { MoveableElement, filter, getElements, isNonRoutableSelectedMovableBoundsAware, removeDescendants } from '../../../utils';
import { PointPositionUpdater } from '../../change-bounds';
import { SResizeHandle } from '../../change-bounds/model';
import { createMovementRestrictionFeedback, removeMovementRestrictionFeedback } from '../../change-bounds/movement-restrictor';
import { ChangeBoundsTool } from './change-bounds-tool';
import { MoveFinishedEventAction, MoveInitializedEventAction } from './change-bounds-tool-feedback';

export interface ValidatedElementMove extends ElementMove {
    valid: boolean;
}

export namespace ValidatedElementMove {
    export function isValid(move: ElementMove): boolean {
        return (move as ValidatedElementMove).valid ?? true;
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

    protected pendingMoveInitialized?: DebouncedFunc<() => void>;

    protected moveInitializedFeedback: FeedbackEmitter;
    protected moveFeedback: FeedbackEmitter;

    constructor(protected tool: ChangeBoundsTool) {
        super();
        this.positionUpdater = new PointPositionUpdater(tool.positionSnapper);
        this.moveInitializedFeedback = tool.createFeedbackEmitter();
        this.moveFeedback = tool.createFeedbackEmitter();
    }

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseDown(target, event);
        if (event.button === 0) {
            this.initializeMove(target, event);
            return [];
        }
        this.positionUpdater.resetPosition();
        return [];
    }

    protected initializeMove(target: GModelElement, event: MouseEvent): void {
        if (target instanceof SResizeHandle) {
            // avoid conflict with resize tool
            return;
        }
        const moveable = findParentByFeature(target, this.isValidMoveable);
        if (moveable !== undefined) {
            this.positionUpdater.updateLastDragPosition(event);
            this.scheduleMoveInitialized();
        } else {
            this.positionUpdater.resetPosition();
        }
    }

    protected scheduleMoveInitialized(): void {
        this.pendingMoveInitialized?.cancel();
        this.pendingMoveInitialized = debounce(() => {
            this.moveInitialized();
            this.pendingMoveInitialized = undefined;
        }, 750);
        this.pendingMoveInitialized();
    }

    protected moveInitializationTimeout(): number {
        return 750;
    }

    protected moveInitialized(): void {
        if (this.isMouseDown) {
            this.moveInitializedFeedback
                .add(MoveInitializedEventAction.create(), MoveFinishedEventAction.create())
                .add(cursorFeedbackAction(CursorCSS.MOVE), cursorFeedbackAction(CursorCSS.DEFAULT))
                .submit();
        }
    }

    protected isValidMoveable(element?: GModelElement): element is MoveableElement {
        return !!element && isNonRoutableSelectedMovableBoundsAware(element) && !(element instanceof SResizeHandle);
    }

    override nonDraggingMouseUp(element: GModelElement, event: MouseEvent): Action[] {
        // should reset everything that may have happend on mouse down
        this.moveInitializedFeedback.dispose();
        this.positionUpdater.resetPosition();
        return [];
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseMove(target, event);
        if (event.buttons === 0) {
            return this.mouseUp(target, event);
        } else if (!this.positionUpdater.isLastDragPositionUndefined()) {
            return this.moveElements(target, event);
        }
        return [];
    }

    protected moveElements(target: GModelElement, event: MouseEvent): Action[] {
        if (this.elementId2startPos.size === 0) {
            this.initializeElementsToMove(target.root);
        }
        const moveAction = this.getElementMoves(target, event, false);
        if (!moveAction) {
            return [];
        }
        // cancel any pending move
        this.pendingMoveInitialized?.cancel();
        this.moveFeedback.add(moveAction, () => this.resetElementPositions(target));
        this.addMovementFeedback(moveAction, target);
        this.moveFeedback.submit();
        return [];
    }

    protected addMovementFeedback(movement: MoveAction, ctx: GModelElement): void {
        // cursor feedback
        this.moveFeedback.add(cursorFeedbackAction(CursorCSS.MOVE), cursorFeedbackAction(CursorCSS.DEFAULT));

        // restriction feedback
        movement.moves.forEach(move => {
            const element = ctx.root.index.getById(move.elementId);
            if (element && this.tool.movementRestrictor) {
                if (!ValidatedElementMove.isValid(move)) {
                    this.moveFeedback.add(createMovementRestrictionFeedback(element, this.tool.movementRestrictor), () =>
                        removeMovementRestrictionFeedback(element, this.tool.movementRestrictor!)
                    );
                } else {
                    this.moveFeedback.add(removeMovementRestrictionFeedback(element, this.tool.movementRestrictor));
                }
            }
        });
    }

    protected initializeElementsToMove(root: GModelRoot): void {
        const elementsToMove = this.collectElementsToMove(root);
        elementsToMove.forEach(element => this.elementId2startPos.set(element.id, element.position));
    }

    protected collectElementsToMove(root: GModelRoot): MoveableElement[] {
        const moveableElements = filter(root.index, this.isValidMoveable);
        const topLevelElements = removeDescendants(moveableElements);
        return Array.from(topLevelElements);
    }

    protected getElementsToMove(context: GModelElement): MoveableElement[] {
        return getElements(context.root.index, Array.from(this.elementId2startPos.keys()), this.isValidMoveable);
    }

    protected getElementMoves(target: GModelElement, event: MouseEvent, finished: boolean): MoveAction | undefined {
        const delta = this.positionUpdater.updatePosition(target, event);
        if (!delta) {
            return undefined;
        }
        const elementMoves: ElementMove[] = this.getElementMovesForDelta(target, delta, finished).filter(move =>
            this.filterElementMove(move)
        );
        if (elementMoves.length > 0) {
            // we never want to animate the move action as this interferes with the move feedback
            return MoveAction.create(elementMoves, { animate: false, finished });
        } else {
            return undefined;
        }
    }

    protected filterElementMove(elementMove: ValidatedElementMove): boolean {
        return !!elementMove.fromPosition && !Point.equals(elementMove.fromPosition, elementMove.toPosition);
    }

    protected getElementMovesForDelta(target: GModelElement, delta: Point, finished: boolean): ValidatedElementMove[] {
        return this.getElementsToMove(target).flatMap<ValidatedElementMove>(element => {
            const startPosition = this.elementId2startPos.get(element.id);
            if (!startPosition) {
                return [];
            }
            const targetPosition = Point.add(element.position, delta);
            const valid = this.tool.movementRestrictor?.validate(element, targetPosition) ?? true;
            return [this.createElementMove(element, targetPosition, valid, finished)];
        });
    }

    protected createElementMove(element: MoveableElement, toPosition: Point, valid: boolean, finished: boolean): ValidatedElementMove {
        // if we are finished and have an invalid move, we want to move the element back to its start position
        return !valid && finished
            ? { elementId: element.id, fromPosition: element.position, toPosition: element.position, valid }
            : { elementId: element.id, fromPosition: element.position, toPosition, valid };
    }

    protected resetElementPositions(context: GModelElement): MoveAction | undefined {
        const elementMoves: ElementMove[] = this.revertElementMoves(context);
        return MoveAction.create(elementMoves, { animate: false, finished: true });
    }

    protected revertElementMoves(context?: GModelElement): ElementMove[] {
        const elementMoves: ElementMove[] = [];
        if (context?.root?.index) {
            const movableElements = this.getElementsToMove(context);
            movableElements.forEach(element =>
                elementMoves.push({ elementId: element.id, toPosition: this.elementId2startPos.get(element.id)! })
            );
        }
        return elementMoves;
    }

    override draggingMouseUp(target: GModelElement, event: MouseEvent): Action[] {
        if (this.positionUpdater.isLastDragPositionUndefined()) {
            return [];
        }
        // only reset the move of invalid elements, the others will be handled by the change bounds tool itself
        const moves = this.getElementMovesForDelta(target, Point.ORIGIN, false);
        moves.filter(move => move.valid).forEach(move => this.elementId2startPos.delete(move.elementId));
        this.dispose();
        return [];
    }

    override dispose(): void {
        this.pendingMoveInitialized?.cancel();
        this.moveInitializedFeedback.dispose();
        this.moveFeedback.dispose();
        this.positionUpdater.resetPosition();
        this.elementId2startPos.clear();
        super.dispose();
    }
}
