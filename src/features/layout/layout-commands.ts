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
import {
    Action,
    Command,
    CommandExecutionContext,
    CommandReturn,
    Dimension,
    ElementAndBounds,
    ElementMove,
    IActionDispatcher,
    KeyListener,
    MoveAction,
    Point,
    SetBoundsAction,
    SModelElement,
    TYPES
} from "sprotty";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";

import { GLSP_TYPES } from "../../types";
import { isNonRoutableSelectedBoundsAware, SelectableBoundsAware } from "../../utils/smodel-util";
import { ChangeBoundsOperationAction } from "../operation/operation-actions";
import { SelectionService } from "../select/selection-service";

export enum ResizeDimension {
    Width,
    Height,
    Width_And_Height
}

export namespace Reduce {
    export function min(...values: number[]): number {
        return Math.min(...values);
    }

    export function max(...values: number[]): number {
        return Math.max(...values);
    }

    export function avg(...values: number[]): number {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    export function first(...values: number[]): number {
        return values[0];
    }

    export function last(...values: number[]): number {
        return values[values.length - 1];
    }
}

export class ResizeElementsAction implements Action {
    readonly kind = ResizeElementsCommand.KIND;

    constructor(
        /**
         * IDs of the elements that should be resized. If no IDs are given, the selected elements will be resized.
         */
        public readonly elementIds: string[] = [],
        /**
         * Resize dimension.
         */
        public readonly dimension: ResizeDimension = ResizeDimension.Width,
        /**
         * Function to reduce the dimension to a target dimension value, see Reduce.* for potential functions.
         */
        public readonly reductionFunction: (...values: number[]) => number) {
    }
}

export enum Alignment {
    Left,
    Center,
    Right,
    Top,
    Middle,
    Bottom
}

export namespace Select {
    export function all(elements: SelectableBoundsAware[]) {
        return elements;
    }

    export function first(elements: SelectableBoundsAware[]) {
        return [elements[0]];
    }

    export function last(elements: SelectableBoundsAware[]) {
        return [elements[elements.length - 1]];
    }
}


export class AlignElementsAction implements Action {
    readonly kind = AlignElementsCommand.KIND;

    constructor(
        /**
         * IDs of the elements that should be aligned. If no IDs are given, the selected elements will be aligned.
         */
        public readonly elementIds: string[] = [],
        /**
         * Alignment direction.
         */
        public readonly alignment: Alignment = Alignment.Left,
        /**
         * Function to selected elements that are considered during alignment calculation, see Select.* for potential functions.
         */
        public readonly selectionFunction: (elements: SelectableBoundsAware[]) => SelectableBoundsAware[] = Select.all) {
    }
}

@injectable()
abstract class LayoutElementsCommand extends Command {
    constructor(@inject(TYPES.Action) protected action: ResizeElementsAction | AlignElementsAction,
        @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher,
        @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService) {
        super();
    }

    getActionElements(context: CommandExecutionContext): SelectableBoundsAware[] {
        const model = context.root;
        const elementIDs = this.action.elementIds;
        if (elementIDs.length === 0) {
            // collect the selected elements from the selection service (selection order is kept by service)
            this.selectionService.getSelectedElementIDs().forEach(elementID => elementIDs.push(elementID));
        }
        const selectableBoundsAware: SelectableBoundsAware[] = [];
        elementIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element && isNonRoutableSelectedBoundsAware(element)) {
                selectableBoundsAware.push(element);
            }
        });
        return selectableBoundsAware;
    }

    dispatchAction(action: Action) {
        this.actionDispatcher.dispatch(action);
    }

    dispatchActions(actions: Action[]) {
        this.actionDispatcher.dispatchAll(actions);
    }
}

@injectable()
export class ResizeElementsCommand extends LayoutElementsCommand {
    static readonly KIND = 'layout:resize';

    constructor(@inject(TYPES.Action) protected action: ResizeElementsAction,
        @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher,
        @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService) {
        super(action, actionDispatcher, selectionService);
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const elements = this.getActionElements(context);
        if (elements.length > 1) {
            switch (this.action.dimension) {
                case ResizeDimension.Width:
                    this.resizeWidth(elements);
                    break;
                case ResizeDimension.Height:
                    this.resizeHeight(elements);
                    break;
                case ResizeDimension.Width_And_Height:
                    this.resizeWidthAndHeight(elements);
                    break;
            }
        }
        return context.root;
    }

    resizeWidth(elements: SelectableBoundsAware[]) {
        const targetWidth = this.action.reductionFunction(...elements.map(element => element.bounds.width));
        this.dispatchResizeActions(elements, (element, bounds) => {
            // resize around center
            const halfDiffWidth = 0.5 * (targetWidth - element.bounds.width);
            bounds.newPosition.x = element.bounds.x - halfDiffWidth;
            bounds.newSize.width = targetWidth;
        });
    }

    resizeHeight(elements: SelectableBoundsAware[]) {
        const targetHeight = this.action.reductionFunction(...elements.map(element => element.bounds.height));
        this.dispatchResizeActions(elements, (element, bounds) => {
            // resize around middle
            const halfDiffHeight = 0.5 * (targetHeight - element.bounds.height);
            bounds.newPosition.y = element.bounds.y - halfDiffHeight;
            bounds.newSize.height = targetHeight;
        });
    }

    resizeWidthAndHeight(elements: SelectableBoundsAware[]) {
        const targetWidth = this.action.reductionFunction(...elements.map(element => element.bounds.width));
        const targetHeight = this.action.reductionFunction(...elements.map(element => element.bounds.height));
        this.dispatchResizeActions(elements, (element, bounds) => {
            // resize around center and middle
            const halfDiffWidth = 0.5 * (targetWidth - element.bounds.width);
            const halfDiffHeight = 0.5 * (targetHeight - element.bounds.height);
            bounds.newPosition.x = element.bounds.x - halfDiffWidth;
            bounds.newPosition.y = element.bounds.y - halfDiffHeight;
            bounds.newSize.width = targetWidth;
            bounds.newSize.height = targetHeight;
        });
    }

    dispatchResizeActions(elements: SelectableBoundsAware[], change: (element: SelectableBoundsAware, bounds: WriteableElementAndBounds) => void) {
        const elementAndBounds: ElementAndBounds[] = []; // client- and server-side resize
        elements.forEach(element => elementAndBounds.push(this.createElementAndBounds(element, change)));
        this.dispatchActions([new SetBoundsAction(elementAndBounds), new ChangeBoundsOperationAction(elementAndBounds)]);
    }

    createElementAndBounds(element: SelectableBoundsAware, change: (element: SelectableBoundsAware, bounds: WriteableElementAndBounds) => void) {
        const bounds: WriteableElementAndBounds = {
            elementId: element.id,
            newPosition: {
                x: element.bounds.x,
                y: element.bounds.y
            },
            newSize: {
                width: element.bounds.width,
                height: element.bounds.height
            }
        };
        change(element, bounds);
        return bounds;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        // we dispatch another action which can be undone, so no explicit implementation necessary
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        // we dispatch another action which can be redone, so no explicit implementation necessary
        return context.root;
    }
}

@injectable()
export class AlignElementsCommand extends LayoutElementsCommand {
    static readonly KIND = 'layout:align';

    constructor(@inject(TYPES.Action) protected action: AlignElementsAction,
        @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher,
        @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService) {
        super(action, actionDispatcher, selectionService);
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const elements = this.getActionElements(context);
        if (elements.length > 1) {
            switch (this.action.alignment) {
                case Alignment.Left:
                    this.alignLeft(elements);
                    break;
                case Alignment.Center:
                    this.alignCenter(elements);
                    break;
                case Alignment.Right:
                    this.alignRight(elements);
                    break;
                case Alignment.Top:
                    this.alignTop(elements);
                    break;
                case Alignment.Middle:
                    this.alignMiddle(elements);
                    break;
                case Alignment.Bottom:
                    this.alignBottom(elements);
                    break;
            }
        }
        return context.root;
    }

    alignLeft(elements: SelectableBoundsAware[]) {
        const calculationElements = this.action.selectionFunction(elements);
        const minX = calculationElements.map(element => element.bounds.x).reduce((a, b) => Math.min(a, b));
        this.dispatchAlignActions(elements, (_, move) => move.toPosition.x = minX);
    }

    alignCenter(elements: SelectableBoundsAware[]) {
        const calculationElements = this.action.selectionFunction(elements);
        const minX = calculationElements.map(element => element.bounds.x).reduce((a, b) => Math.min(a, b));
        const maxX = calculationElements.map(element => element.bounds.x + element.bounds.width).reduce((a, b) => Math.max(a, b));
        const diffX = maxX - minX;
        const centerX = minX + 0.5 * diffX;
        this.dispatchAlignActions(elements, (element, move) => move.toPosition.x = centerX - 0.5 * element.bounds.width);
    }

    alignRight(elements: SelectableBoundsAware[]) {
        const calculationElements = this.action.selectionFunction(elements);
        const maxX = calculationElements.map(element => element.bounds.x + element.bounds.width).reduce((a, b) => Math.max(a, b));
        this.dispatchAlignActions(elements, (element, move) => move.toPosition.x = maxX - element.bounds.width);
    }

    alignTop(elements: SelectableBoundsAware[]) {
        const calculationElements = this.action.selectionFunction(elements);
        const minY = calculationElements.map(element => element.bounds.y).reduce((a, b) => Math.min(a, b));
        this.dispatchAlignActions(elements, (_, move) => move.toPosition.y = minY);
    }

    alignMiddle(elements: SelectableBoundsAware[]) {
        const calculationElements = this.action.selectionFunction(elements);
        const minY = calculationElements.map(element => element.bounds.y).reduce((a, b) => Math.min(a, b));
        const maxY = calculationElements.map(element => element.bounds.y + element.bounds.height).reduce((a, b) => Math.max(a, b));
        const diffY = maxY - minY;
        const middleY = minY + 0.5 * diffY;
        this.dispatchAlignActions(elements, (element, move) => move.toPosition.y = middleY - 0.5 * element.bounds.height);
    }

    alignBottom(elements: SelectableBoundsAware[]) {
        const calculationElements = this.action.selectionFunction(elements);
        const maxY = calculationElements.map(element => element.bounds.y + element.bounds.height).reduce((a, b) => Math.max(a, b));
        this.dispatchAlignActions(elements, (element, move) => move.toPosition.y = maxY - element.bounds.height);
    }

    dispatchAlignActions(elements: SelectableBoundsAware[], change: (element: SelectableBoundsAware, move: WriteableElementMove) => void) {
        const moves: ElementMove[] = []; // client-side move
        const elementAndBounds: ElementAndBounds[] = []; // server-side move
        elements.forEach(element => {
            const move = this.createElementMove(element, change);
            moves.push(move);

            const elementAndBound = this.createElementAndBounds(element, move);
            elementAndBounds.push(elementAndBound);
        });
        this.dispatchActions([new MoveAction(moves), new ChangeBoundsOperationAction(elementAndBounds)]);
    }

    createElementMove(element: SelectableBoundsAware, change: (element: SelectableBoundsAware, move: WriteableElementMove) => void) {
        const move: WriteableElementMove = {
            elementId: element.id,
            fromPosition: {
                x: element.bounds.x,
                y: element.bounds.y
            },
            toPosition: {
                x: element.bounds.x,
                y: element.bounds.y
            }
        };
        change(element, move);
        return move;
    }

    createElementAndBounds(element: SelectableBoundsAware, move: ElementMove): ElementAndBounds {
        return {
            elementId: element.id,
            newPosition: {
                x: move.toPosition.x,
                y: move.toPosition.y
            },
            newSize: {
                width: element.bounds.width,
                height: element.bounds.height
            }
        };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        // we dispatch another action which can be undone, so no explicit implementation necessary
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        // we dispatch another action which can be redone, so no explicit implementation necessary
        return context.root;
    }
}

export class LayoutKeyboardListener extends KeyListener {
    keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyW', 'shift')) {
            return [new ResizeElementsAction([], ResizeDimension.Width, Reduce.max)];
        }
        if (matchesKeystroke(event, 'KeyH', 'shift')) {
            return [new ResizeElementsAction([], ResizeDimension.Height, Reduce.max)];
        }
        return [];
    }
}

interface WriteablePoint extends Point {
    x: number;
    y: number;
}

interface WriteableElementMove extends ElementMove {
    fromPosition?: WriteablePoint;
    toPosition: WriteablePoint;
}

interface WriteableDimension extends Dimension {
    width: number
    height: number
}
interface WriteableElementAndBounds extends ElementAndBounds {
    newPosition: WriteablePoint;
    newSize: WriteableDimension
}
