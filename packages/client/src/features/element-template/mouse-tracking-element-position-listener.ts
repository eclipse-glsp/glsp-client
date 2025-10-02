/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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
    Dimension,
    DisposableCollection,
    GModelElement,
    GModelRoot,
    MoveAction,
    Point,
    isBoundsAware,
    isMoveable
} from '@eclipse-glsp/sprotty';
import { DragAwareMouseListener } from '../../base/drag-aware-mouse-listener';
import { EditorContextService } from '../../base/editor-context-service';
import { CSS_HIDDEN, ModifyCSSFeedbackAction } from '../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../base/feedback/feedback-emitter';
import { MoveableElement } from '../../utils/gmodel-util';
import { getAbsolutePosition } from '../../utils/viewpoint-util';
import { FeedbackAwareTool } from '../tools/base-tools';
import { IChangeBoundsManager } from '../tools/change-bounds/change-bounds-manager';
import { MoveFinishedEventAction } from '../tools/change-bounds/change-bounds-tool-feedback';
import { TrackedMove, type MoveTracker } from '../tools/change-bounds/change-bounds-tracker';

export interface PositioningTool extends FeedbackAwareTool {
    readonly changeBoundsManager: IChangeBoundsManager;
}

export class MouseTrackingElementPositionListener extends DragAwareMouseListener {
    protected moveGhostFeedback: FeedbackEmitter;
    protected moveTracker: MoveTracker;
    protected toDispose = new DisposableCollection();

    constructor(
        protected elementId: string,
        protected tool: PositioningTool,
        protected cursorPosition: 'top-left' | 'middle' = 'top-left',
        protected editorContext?: EditorContextService
    ) {
        super();
        this.moveTracker = this.tool.changeBoundsManager.createTracker();
        this.moveGhostFeedback = this.tool.createFeedbackEmitter();
        this.toDispose.push(this.moveGhostFeedback);
        const modelRootChangedListener = editorContext?.onModelRootChanged(newRoot => this.modelRootChanged(newRoot));
        if (modelRootChangedListener) {
            this.toDispose.push(modelRootChangedListener);
        }
    }

    protected getTrackedElement(target: GModelElement, event: MouseEvent): MoveableElement | undefined {
        const element = target.root.index.getById(this.elementId);
        return !element || !isMoveable(element) ? undefined : element;
    }

    override mouseMove(ctx: GModelElement, event: MouseEvent): Action[] {
        super.mouseMove(ctx, event);
        const element = this.getTrackedElement(ctx, event);
        if (!element) {
            return [];
        }
        const isInitializing = !this.moveTracker.isTracking();
        if (isInitializing) {
            this.initialize(element, ctx, event);
        }
        const move = this.moveTracker.moveElements([element], {
            snap: event,
            restrict: event,
            skipStatic: !isInitializing,
            wrap: false
        });
        const elementMove = move.elementMoves[0];
        if (!elementMove) {
            return [];
        }
        // since we are moving a ghost element that is feedback-only and will be removed anyway,
        // we just send a MoveFinishedEventAction instead of reseting the position with a MoveAction and the finished flag set to true.
        this.moveGhostFeedback.add(
            MoveAction.create([{ elementId: this.elementId, toPosition: elementMove.toPosition }], { animate: false }),
            MoveFinishedEventAction.create()
        );
        this.addMoveFeedback(move, ctx, event);
        this.moveGhostFeedback.submit();
        this.moveTracker.updateTrackingPosition(elementMove.moveVector);
        return [];
    }

    protected initialize(element: MoveableElement, target: GModelElement, event: MouseEvent): void {
        this.moveTracker.startTracking(target.root);
        element.position = this.initializeElementPosition(element, target, event);
    }

    protected initializeElementPosition(element: MoveableElement, target: GModelElement, event: MouseEvent): Point {
        const mousePosition = getAbsolutePosition(target, event);
        return this.cursorPosition === 'middle' && isBoundsAware(element)
            ? Point.subtract(mousePosition, Dimension.center(element.bounds))
            : mousePosition;
    }

    protected addMoveFeedback(move: TrackedMove, ctx: GModelElement, event: MouseEvent): void {
        this.moveGhostFeedback.add(ModifyCSSFeedbackAction.create({ elements: [this.elementId], remove: [CSS_HIDDEN] }));
        this.tool.changeBoundsManager.addMoveFeedback(this.moveGhostFeedback, move, ctx, event);
    }

    protected modelRootChanged(root: Readonly<GModelRoot>): void {
        // stop the tracking once we receive a new model root and ensure proper alignment with next next mouse move
        this.moveTracker.stopTracking();
    }

    override dispose(): void {
        this.toDispose.dispose();
        super.dispose();
    }
}
