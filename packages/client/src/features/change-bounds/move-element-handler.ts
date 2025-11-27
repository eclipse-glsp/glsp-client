/********************************************************************************
 * Copyright (c) 2023-2025 Business Informatics Group (TU Wien) and others.
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
    ChangeBoundsOperation,
    ElementAndBounds,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    ISnapper,
    MoveAction,
    MoveViewportAction,
    Point,
    TYPES,
    isBoundsAware,
    type Bounds,
    type ElementMove,
    type GModelElement
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional, postConstruct } from 'inversify';
import { DebouncedFunc, debounce } from 'lodash';
import { EditorContextService } from '../../base/editor-context-service';
import { IFeedbackActionDispatcher } from '../../base/feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from '../../base/feedback/feedback-emitter';
import {
    SelectableBoundsAware,
    getElements,
    isNonRoutableSelectedMovableBoundsAware,
    isNotUndefined,
    type MoveableElement
} from '../../utils/gmodel-util';
import { isValidMove } from '../../utils/layout-utils';
import { outsideOfViewport } from '../../utils/viewpoint-util';
import { IMovementRestrictor } from '../change-bounds/movement-restrictor';
import type { IChangeBoundsManager } from '../tools/change-bounds/change-bounds-manager';
import { TrackedElementResize, type ChangeBoundsTracker } from '../tools/change-bounds/change-bounds-tracker';
import { GResizeHandle } from './model';
import { MoveElementRelativeAction } from './move-element-action';

/**
 * Action handler for moving elements.
 *
 * Examples: nudging with arrow keys
 */
@injectable()
export class MoveElementHandler implements IActionHandler {
    @inject(TYPES.IChangeBoundsManager)
    protected readonly changeBoundsManager: IChangeBoundsManager;
    protected tracker: ChangeBoundsTracker;

    @inject(EditorContextService)
    protected editorContextService: EditorContextService;

    @inject(TYPES.IActionDispatcher)
    protected dispatcher: IActionDispatcher;

    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackDispatcher: IFeedbackActionDispatcher;

    @inject(TYPES.ISnapper)
    @optional()
    readonly snapper?: ISnapper;

    @inject(TYPES.IMovementRestrictor)
    @optional()
    readonly movementRestrictor?: IMovementRestrictor;

    protected debouncedChangeBounds?: DebouncedFunc<() => void>;
    protected moveFeedback: FeedbackEmitter;

    @postConstruct()
    protected init(): void {
        this.moveFeedback = this.feedbackDispatcher.createEmitter();
        this.tracker = this.changeBoundsManager.createTracker();
    }

    handle(action: Action): void | Action | ICommand {
        if (MoveElementRelativeAction.is(action) && action.elementIds.length > 0) {
            this.tracker.startTracking(this.editorContextService.modelRoot);
            this.handleMoveElement(action);
        }
    }

    protected handleMoveElement(action: MoveElementRelativeAction): void {
        const viewport = this.editorContextService.viewport;
        if (!viewport) {
            return;
        }

        const viewportActions: Action[] = [];
        const elementMoves: ElementMove[] = [];
        const elements = getElements(viewport.index, action.elementIds, this.isValidMoveable);
        for (const element of elements) {
            const newPosition = this.getTargetBounds(element, action);
            elementMoves.push({
                elementId: element.id,
                fromPosition: {
                    x: element.bounds.x,
                    y: element.bounds.y
                },
                toPosition: newPosition
            });

            const topLeftCorner = newPosition;
            const bottomRightCorner = Point.add(newPosition, { x: element.bounds.width, y: element.bounds.height });

            if (outsideOfViewport(topLeftCorner, viewport) || outsideOfViewport(bottomRightCorner, viewport)) {
                viewportActions.push(MoveViewportAction.create({ moveX: action.moveX, moveY: action.moveY }));
            }
        }
        this.dispatcher.dispatchAll(viewportActions);
        this.moveFeedback.add(this.createMoveAction(elementMoves));

        const newBounds = elementMoves.map(this.toElementAndBounds.bind(this)).filter(isNotUndefined);
        const wraps = this.tracker.wrap(
            elements.map(element => {
                const bounds = newBounds.find(b => b.elementId === element.id)!;
                const toBounds: Bounds = {
                    ...element.bounds,
                    ...bounds.newSize,
                    ...bounds.newPosition
                };
                return {
                    element: element,
                    fromBounds: element.bounds,
                    toBounds
                };
            }),
            {
                validate: true
            }
        );

        this.moveFeedback.add(TrackedElementResize.createFeedbackActions(Object.values(wraps ?? {})));
        this.moveFeedback.submit();

        if (Object.keys(wraps).length > 0) {
            newBounds.push(
                ...Object.values(wraps)
                    .filter(resize => !action.elementIds.includes(resize.element.id))
                    .map(TrackedElementResize.toElementAndBounds)
            );
        }

        this.scheduleChangeBounds(newBounds);
    }

    protected getTargetBounds(element: SelectableBoundsAware, action: MoveElementRelativeAction): Point {
        let position = Point.add(element.bounds, { x: action.moveX, y: action.moveY });
        if (this.snapper && action.snap) {
            position = this.snapper.snap(position, element);
        }
        if (!isValidMove(element, position, this.movementRestrictor)) {
            // reset to position before the move, if not valid
            position = { x: element.bounds.x, y: element.bounds.y };
        }
        return position;
    }

    protected scheduleChangeBounds(elementAndBounds: ElementAndBounds[]): void {
        this.debouncedChangeBounds?.cancel();
        this.debouncedChangeBounds = debounce(() => {
            this.moveFeedback.dispose();
            this.dispatcher.dispatchAll([ChangeBoundsOperation.create(elementAndBounds)]);
            this.debouncedChangeBounds = undefined;
            this.tracker.dispose();
        }, 300);
        this.debouncedChangeBounds();
    }

    protected createMoveAction(moves: ElementMove[]): Action {
        return MoveAction.create(moves, { animate: false });
    }

    protected isValidMoveable(element?: GModelElement): element is MoveableElement & SelectableBoundsAware {
        return !!element && isNonRoutableSelectedMovableBoundsAware(element) && !(element instanceof GResizeHandle);
    }

    protected toElementAndBounds(elementMove: ElementMove): ElementAndBounds | undefined {
        const element = this.editorContextService.modelRoot.index.getById(elementMove.elementId);
        if (element && isBoundsAware(element)) {
            return {
                elementId: elementMove.elementId,
                newSize: {
                    height: element.bounds.height,
                    width: element.bounds.width
                },
                newPosition: {
                    x: elementMove.toPosition.x,
                    y: elementMove.toPosition.y
                }
            };
        }

        return undefined;
    }
}
