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
    ElementMove,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    ISnapper,
    MoveAction,
    MoveViewportAction,
    Point,
    TYPES,
    isBoundsAware
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional, postConstruct } from 'inversify';
import { DebouncedFunc, debounce } from 'lodash';
import { EditorContextService } from '../../base/editor-context-service';
import { IFeedbackActionDispatcher } from '../../base/feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from '../../base/feedback/feedback-emitter';
import { SelectableBoundsAware, getElements, isSelectableAndBoundsAware } from '../../utils/gmodel-util';
import { isValidMove } from '../../utils/layout-utils';
import { outsideOfViewport } from '../../utils/viewpoint-util';
import { IMovementRestrictor } from '../change-bounds/movement-restrictor';
import { MoveElementRelativeAction } from './move-element-action';

/**
 * Action handler for moving elements.
 */
@injectable()
export class MoveElementHandler implements IActionHandler {
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
    }

    handle(action: Action): void | Action | ICommand {
        if (MoveElementRelativeAction.is(action)) {
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
        const elements = getElements(viewport.index, action.elementIds, isSelectableAndBoundsAware);
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
        const moveAction = MoveAction.create(elementMoves, { animate: false });
        this.moveFeedback.add(moveAction).submit();

        this.scheduleChangeBounds(this.toElementAndBounds(elementMoves));
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
        }, 300);
        this.debouncedChangeBounds();
    }

    protected toElementAndBounds(elementMoves: ElementMove[]): ElementAndBounds[] {
        const elementBounds: ElementAndBounds[] = [];
        for (const elementMove of elementMoves) {
            const element = this.editorContextService.modelRoot.index.getById(elementMove.elementId);
            if (element && isBoundsAware(element)) {
                elementBounds.push({
                    elementId: elementMove.elementId,
                    newSize: {
                        height: element.bounds.height,
                        width: element.bounds.width
                    },
                    newPosition: {
                        x: elementMove.toPosition.x,
                        y: elementMove.toPosition.y
                    }
                });
            }
        }
        return elementBounds;
    }
}
