/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { Action, ElementMove, GModelElement, GModelRoot, MoveAction, Point, TypeGuard, findParentByFeature } from '@eclipse-glsp/sprotty';

import { DebouncedFunc, debounce } from 'lodash';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { ISelectionListener } from '../../../base/selection-service';
import {
    MoveableElement,
    filter,
    getElements,
    isNonRoutableMovableBoundsAware,
    isNonRoutableSelectedMovableBoundsAware,
    removeDescendants
} from '../../../utils/gmodel-util';
import { GResizeHandle } from '../../change-bounds/model';
import { ChangeBoundsTool } from './change-bounds-tool';
import { MoveFinishedEventAction, MoveInitializedEventAction } from './change-bounds-tool-feedback';
import { ChangeBoundsTracker, TrackedMove } from './change-bounds-tracker';

/**
 * This mouse listener provides visual feedback for moving by sending client-side
 * `MoveAction`s while elements are selected and dragged. This will also update
 * their bounds, which is important, as it is not only required for rendering
 * the visual feedback but also the basis for sending the change to the server
 * (see also `tools/MoveTool`).
 */
export class FeedbackMoveMouseListener extends DragAwareMouseListener implements ISelectionListener {
    protected rootElement?: GModelRoot;
    protected tracker: ChangeBoundsTracker;
    protected elementId2startPos = new Map<string, Point>();

    protected pendingMoveInitialized?: DebouncedFunc<() => void>;

    protected moveInitializedFeedback: FeedbackEmitter;
    protected moveFeedback: FeedbackEmitter;

    constructor(protected tool: ChangeBoundsTool) {
        super();
        this.tracker = tool.createChangeBoundsTracker();
        this.moveInitializedFeedback = tool.createFeedbackEmitter();
        this.moveFeedback = tool.createFeedbackEmitter();
    }

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseDown(target, event);
        if (event.button === 0) {
            if (this.tracker.isTracking()) {
                // we have a move in progress that was not resolved yet (e.g., user may have triggered a mouse up outside the window)
                this.draggingMouseUp(target, event);
                return [];
            }
            this.initializeMove(target, event);
            return [];
        }
        this.tracker.stopTracking();
        return [];
    }

    protected initializeMove(target: GModelElement, event: MouseEvent): void {
        if (target instanceof GResizeHandle) {
            // avoid conflict with resize tool
            return;
        }
        const moveable = findParentByFeature(target, this.isValidMoveable);
        if (moveable !== undefined) {
            this.tracker.startTracking();
            this.scheduleMoveInitialized();
        } else {
            this.tracker.stopTracking();
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
        return !!element && isNonRoutableSelectedMovableBoundsAware(element) && !(element instanceof GResizeHandle);
    }

    protected isValidRevertable(element?: GModelElement): element is MoveableElement {
        return !!element && isNonRoutableMovableBoundsAware(element) && !(element instanceof GResizeHandle);
    }

    override nonDraggingMouseUp(element: GModelElement, event: MouseEvent): Action[] {
        // should reset everything that may have happend on mouse down
        this.moveInitializedFeedback.dispose();
        this.tracker.stopTracking();
        return [];
    }

    override draggingMouseMove(target: GModelElement, event: MouseEvent): Action[] {
        super.draggingMouseMove(target, event);
        if (this.tracker.isTracking()) {
            return this.moveElements(target, event);
        }
        return [];
    }

    protected moveElements(target: GModelElement, event: MouseEvent): Action[] {
        if (this.elementId2startPos.size === 0) {
            this.initializeElementsToMove(target.root);
        }
        const elementsToMove = this.getElementsToMove(target);
        const move = this.tracker.moveElements(elementsToMove, { snap: event, restrict: event });
        if (move.elementMoves.length === 0) {
            return [];
        }
        // cancel any pending move
        this.pendingMoveInitialized?.cancel();
        this.moveFeedback.add(this.createMoveAction(move), () => this.resetElementPositions(target));
        this.addMoveFeedback(move, target, event);
        this.tracker.updateTrackingPosition(move);
        this.moveFeedback.submit();
        return [];
    }

    protected createMoveAction(trackedMove: TrackedMove): Action {
        // we never want to animate the move action as this interferes with the move feedback
        return MoveAction.create(
            trackedMove.elementMoves.map(move => ({ elementId: move.element.id, toPosition: move.toPosition })),
            { animate: false }
        );
    }

    protected addMoveFeedback(trackedMove: TrackedMove, ctx: GModelElement, event: MouseEvent): void {
        this.tool.changeBoundsManager.addMoveFeedback(this.moveFeedback, trackedMove, ctx, event);
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

    protected getElementsToMove(context: GModelElement, moveable: TypeGuard<MoveableElement> = this.isValidMoveable): MoveableElement[] {
        return getElements(context.root.index, Array.from(this.elementId2startPos.keys()), moveable);
    }

    protected resetElementPositions(context: GModelElement): MoveAction | undefined {
        const elementMoves: ElementMove[] = this.revertElementMoves(context);
        return MoveAction.create(elementMoves, { animate: false, finished: true });
    }

    protected revertElementMoves(context?: GModelElement): ElementMove[] {
        const elementMoves: ElementMove[] = [];
        if (context?.root?.index) {
            const movableElements = this.getElementsToMove(context, this.isValidRevertable);
            movableElements.forEach(element =>
                elementMoves.push({ elementId: element.id, toPosition: this.elementId2startPos.get(element.id)! })
            );
        }
        return elementMoves;
    }

    override draggingMouseUp(target: GModelElement, event: MouseEvent): Action[] {
        if (!this.tracker.isTracking()) {
            return [];
        }
        const elementsToMove = this.getElementsToMove(target);
        if (!this.tool.movementOptions.allElementsNeedToBeValid) {
            // only reset the move of invalid elements, the others will be handled by the change bounds tool itself
            elementsToMove
                .filter(element => this.tool.changeBoundsManager.isValid(element))
                .forEach(element => this.elementId2startPos.delete(element.id));
        } else {
            if (elementsToMove.length > 0 && elementsToMove.every(element => this.tool.changeBoundsManager.isValid(element))) {
                // do not reset any element as all are valid
                this.elementId2startPos.clear();
            }
        }
        this.dispose();
        return [];
    }

    selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[], deselectedElements?: string[]): void {
        this.dispose();
    }

    override dispose(): void {
        this.pendingMoveInitialized?.cancel();
        this.moveInitializedFeedback.dispose();
        this.moveFeedback.dispose();
        this.tracker.dispose();
        this.elementId2startPos.clear();
        super.dispose();
    }
}
