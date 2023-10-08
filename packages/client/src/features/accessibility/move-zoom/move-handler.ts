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

import { inject, injectable } from 'inversify';
import { throttle } from 'lodash';
import {
    Action,
    ChangeBoundsOperation,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    Point,
    GModelRoot,
    SetViewportAction,
    TYPES,
    Viewport,
    findParentByFeature,
    isViewport
} from '@eclipse-glsp/sprotty';
import { EditorContextService } from '../../../base/editor-context-service';
import { SelectableBoundsAware, getElements, isSelectableAndBoundsAware } from '../../../utils/gmodel-util';

/**
 * Action for triggering moving of the viewport.
 */
export interface MoveViewportAction extends Action {
    kind: typeof MoveViewportAction.KIND;
    /**
     * used to specify the amount to be moved in the x-axis
     */
    moveX: number;
    /**
     * used to specify the amount to be moved in the y-axis
     */
    moveY: number;
}

export namespace MoveViewportAction {
    export const KIND = 'moveViewportAction';

    export function is(object: any): object is MoveViewportAction {
        return Action.hasKind(object, KIND);
    }

    export function create(moveX: number, moveY: number): MoveViewportAction {
        return { kind: KIND, moveX, moveY };
    }
}

/**
 * Action for triggering moving of elements.
 */
export interface MoveElementAction extends Action {
    kind: typeof MoveElementAction.KIND;
    /**
     * used to specify the elements to be zoomed in/out
     */
    elementIds: string[];
    /**
     * used to specify the amount to be moved in the x-axis
     */
    moveX: number;
    /**
     * used to specify the amount to be moved in the y-axis
     */
    moveY: number;
}

export namespace MoveElementAction {
    export const KIND = 'moveElementAction';

    export function is(object: any): object is MoveElementAction {
        return Action.hasKind(object, KIND);
    }

    export function create(elementIds: string[], moveX: number, moveY: number): MoveElementAction {
        return { kind: KIND, elementIds, moveX, moveY };
    }
}

/* The MoveViewportHandler class is an implementation of the IActionHandler interface that handles
moving of the viewport. */
@injectable()
export class MoveViewportHandler implements IActionHandler {
    @inject(EditorContextService)
    protected editorContextService: EditorContextService;

    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;
    protected readonly throttledHandleViewportMove = throttle((action: MoveViewportAction) => this.handleMoveViewport(action), 150);

    handle(action: Action): void | Action | ICommand {
        if (MoveViewportAction.is(action)) {
            this.throttledHandleViewportMove(action);
        }
    }

    handleMoveViewport(action: MoveViewportAction): void {
        const viewport = findParentByFeature(this.editorContextService.modelRoot, isViewport);
        if (!viewport) {
            return;
        }
        this.dispatcher.dispatch(this.moveViewport(viewport, action.moveX, action.moveY));
    }

    protected moveViewport(viewport: GModelRoot & Viewport, offsetX: number, offSetY: number): SetViewportAction {
        const newViewport: Viewport = {
            scroll: {
                x: viewport.scroll.x + offsetX,
                y: viewport.scroll.y + offSetY
            },
            zoom: viewport.zoom
        };

        return SetViewportAction.create(viewport.id, newViewport, { animate: true });
    }
}

/* The MoveElementHandler class is an implementation of the IActionHandler interface that handles
moving elements. */
@injectable()
export class MoveElementHandler implements IActionHandler {
    @inject(EditorContextService)
    protected editorContextService: EditorContextService;
    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;
    protected readonly throttledHandleElementMove = throttle((action: MoveElementAction) => this.handleMoveElement(action), 150);

    handle(action: Action): void | Action | ICommand {
        if (MoveElementAction.is(action)) {
            this.throttledHandleElementMove(action);
        }
    }

    handleMoveElement(action: MoveElementAction): void {
        const viewport = findParentByFeature(this.editorContextService.modelRoot, isViewport);
        if (!viewport) {
            return;
        }

        const elements = getElements(this.editorContextService.modelRoot.index, action.elementIds, isSelectableAndBoundsAware);

        this.dispatcher.dispatchAll(this.move(viewport, elements, action.moveX, action.moveY));
    }

    protected getBounds(element: SelectableBoundsAware, offSetX: number, offSetY: number): Point {
        return { x: element.bounds.x + offSetX, y: element.bounds.y + offSetY };
    }

    protected adaptViewport(
        viewport: GModelRoot & Viewport,
        newPoint: Point,
        moveX: number,
        moveY: number
    ): MoveViewportAction | undefined {
        if (
            newPoint.x < viewport.scroll.x ||
            newPoint.x > viewport.scroll.x + viewport.canvasBounds.width ||
            newPoint.y < viewport.scroll.y ||
            newPoint.y > viewport.scroll.y + viewport.canvasBounds.height
        ) {
            return MoveViewportAction.create(moveX, moveY);
        }
        return;
    }

    protected moveElement(element: SelectableBoundsAware, offSetX: number, offSetY: number): ChangeBoundsOperation {
        return ChangeBoundsOperation.create([
            {
                elementId: element.id,
                newSize: {
                    width: element.bounds.width,
                    height: element.bounds.height
                },
                newPosition: {
                    x: element.bounds.x + offSetX,
                    y: element.bounds.y + offSetY
                }
            }
        ]);
    }

    protected move(viewport: GModelRoot & Viewport, selectedElements: SelectableBoundsAware[], deltaX: number, deltaY: number): Action[] {
        const results: Action[] = [];

        if (selectedElements.length !== 0) {
            selectedElements.forEach(currentElement => {
                results.push(this.moveElement(currentElement, deltaX, deltaY));
                const newPosition = this.getBounds(currentElement, deltaX, deltaY);
                const viewportAction = this.adaptViewport(viewport, newPosition, deltaX, deltaY);
                if (viewportAction) {
                    results.push(viewportAction);
                }
            });
        }
        return results;
    }
}
