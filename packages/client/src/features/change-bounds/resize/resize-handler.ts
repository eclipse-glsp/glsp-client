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
    Dimension,
    ElementAndBounds,
    GModelElement,
    GParentElement,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    ISnapper,
    Point,
    SetBoundsAction,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional, postConstruct } from 'inversify';
import { DebouncedFunc, debounce } from 'lodash';
import { EditorContextService } from '../../../base/editor-context-service';
import { IFeedbackActionDispatcher } from '../../../base/feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { Resizable, SelectableBoundsAware, getElements, isSelectableAndBoundsAware, toElementAndBounds } from '../../../utils/gmodel-util';
import { isValidMove, isValidSize, minHeight, minWidth } from '../../../utils/layout-utils';
import { Grid } from '../../grid/grid';

export enum ResizeType {
    Increase,
    Decrease,
    MinSize
}

/**
 * Action for triggering resizing of elements.
 */
export interface ResizeElementAction extends Action {
    kind: typeof ResizeElementAction.KIND;
    elementIds: string[];
    resizeType: ResizeType;
}
export namespace ResizeElementAction {
    export const KIND = 'resizeElementAction';

    export function is(object: any): object is ResizeElementAction {
        return Action.hasKind(object, KIND);
    }

    export function create(elementIds: string[], resizeType: ResizeType): ResizeElementAction {
        return { kind: KIND, elementIds, resizeType };
    }
}

/*
 * The ResizeElementHandler class is an implementation of the IActionHandler interface that handles
 * resizing of elements.
 */
@injectable()
export class ResizeElementHandler implements IActionHandler {
    @inject(EditorContextService)
    protected editorContextService: EditorContextService;
    @inject(TYPES.IActionDispatcher)
    protected dispatcher: IActionDispatcher;
    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackDispatcher: IFeedbackActionDispatcher;
    @inject(TYPES.Grid)
    @optional()
    protected grid: Grid = Grid.DEFAULT;
    @inject(TYPES.ISnapper)
    @optional()
    protected readonly snapper?: ISnapper;

    protected debouncedChangeBounds?: DebouncedFunc<() => void>;
    protected resizeFeedback: FeedbackEmitter;

    @postConstruct()
    protected init(): void {
        this.resizeFeedback = this.feedbackDispatcher.createEmitter();
    }

    handle(action: Action): void | Action | ICommand {
        if (ResizeElementAction.is(action)) {
            this.handleResizeElement(action);
        }
    }

    handleResizeElement(action: ResizeElementAction): void {
        const elements = getElements(this.editorContextService.modelRoot.index, action.elementIds, isSelectableAndBoundsAware);
        const elementAndBounds = this.computeElementAndBounds(elements, action);

        this.resizeFeedback.add(SetBoundsAction.create(elementAndBounds)).submit();

        this.debouncedChangeBounds?.cancel();
        this.debouncedChangeBounds = debounce(() => {
            this.resizeFeedback.dispose();
            this.dispatcher.dispatchAll([ChangeBoundsOperation.create(elementAndBounds)]);
            this.debouncedChangeBounds = undefined;
        }, 300);
        this.debouncedChangeBounds();
    }

    protected computeElementAndBounds(elements: SelectableBoundsAware[], action: ResizeElementAction): ElementAndBounds[] {
        const elementAndBounds: ElementAndBounds[] = [];

        elements.forEach(element => {
            const { x, y, width: oldWidth, height: oldHeight } = element.bounds;
            let width = 0;
            let height = 0;

            if (action.resizeType === ResizeType.Decrease) {
                width = oldWidth - this.grid.x;
                height = oldHeight - this.grid.y;
            } else if (action.resizeType === ResizeType.Increase) {
                width = oldWidth + this.grid.x;
                height = oldHeight + this.grid.y;
            } else if (action.resizeType === ResizeType.MinSize) {
                width = minWidth(element);
                height = minHeight(element);
            }

            if (this.isValidBoundChange(element, { x, y }, { width, height })) {
                const resizeElement = { id: element.id, bounds: { x, y, width, height } } as GModelElement & GParentElement & Resizable;
                elementAndBounds.push(toElementAndBounds(resizeElement));
            }
        });

        return elementAndBounds;
    }

    protected isValidBoundChange(element: SelectableBoundsAware, newPosition: Point, newSize: Dimension): boolean {
        return isValidSize(element, newSize) && isValidMove(element, newPosition);
    }
}
