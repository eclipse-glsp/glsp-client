/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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

import { inject, injectable, optional } from 'inversify';
import {
    Action,
    ChangeBoundsOperation,
    Dimension,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    ISnapper,
    Point,
    SModelElement,
    SParentElement,
    TYPES
} from '~glsp-sprotty';
import { EditorContextService } from '../../../base/editor-context-service';
import { isValidMove, isValidSize, minHeight, minWidth } from '../../../utils/layout-utils';
import { SelectableBoundsAware, getElements, isSelectableAndBoundsAware, toElementAndBounds } from '../../../utils/smodel-util';
import { Resizable } from '../../change-bounds/model';
import { GridSnapper } from '../../change-bounds/snap';

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

/* The ResizeElementHandler class is an implementation of the IActionHandler interface that handles
resizing of elements. */
@injectable()
export class ResizeElementHandler implements IActionHandler {
    @inject(EditorContextService)
    protected editorContextService: EditorContextService;

    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;

    // Default x resize used if GridSnapper is not provided
    static readonly defaultResizeX = 20;

    // Default y resize used if GridSnapper is not provided
    static readonly defaultResizeY = 20;
    protected grid = { x: ResizeElementHandler.defaultResizeX, y: ResizeElementHandler.defaultResizeY };

    protected isEditMode = false;

    constructor(@inject(TYPES.ISnapper) @optional() protected readonly snapper?: ISnapper) {
        if (snapper instanceof GridSnapper) {
            this.grid = snapper.grid;
        }
    }

    handle(action: Action): void | Action | ICommand {
        if (ResizeElementAction.is(action)) {
            this.handleResizeElement(action);
        }
    }

    handleResizeElement(action: ResizeElementAction): void {
        const elements = getElements(this.editorContextService.modelRoot.index, action.elementIds, isSelectableAndBoundsAware);
        this.dispatcher.dispatchAll(this.resize(elements, action));
    }

    protected resize(elements: SelectableBoundsAware[], action: ResizeElementAction): Action[] {
        const actions: Action[] = [];

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
                const resizeElement = { id: element.id, bounds: { x, y, width, height } } as SModelElement & SParentElement & Resizable;
                actions.push(ChangeBoundsOperation.create([toElementAndBounds(resizeElement)]));
            }
        });

        return actions;
    }

    protected isValidBoundChange(element: SelectableBoundsAware, newPosition: Point, newSize: Dimension): boolean {
        return isValidSize(element, newSize) && isValidMove(element, newPosition);
    }
}
