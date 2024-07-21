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
import {
    Action,
    ChangeBoundsOperation,
    Dimension,
    ElementAndBounds,
    ElementMove,
    GModelElement,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    MoveAction,
    Point,
    SetBoundsAction,
    TYPES,
    Writable,
    hasArrayProp,
    hasNumberProp,
    hasStringProp
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { SelectionService } from '../../base/selection-service';
import { BoundsAwareModelElement, getElements } from '../../utils/gmodel-util';
import { toValidElementAndBounds, toValidElementMove } from '../../utils/layout-utils';
import { isBoundsAwareMoveable, isResizable } from '../change-bounds/model';
import { IMovementRestrictor } from '../change-bounds/movement-restrictor';

/**
 * Used to specify the desired resize dimension for a {@link ResizeElementsCommand}.
 */
export enum ResizeDimension {
    Width,
    Height,
    Width_And_Height
}

/**
 * A function that computes a single number from a set of given numbers
 * i.e. it reduces the given numbers to one single number.
 * Mainly used by the {@link ResizeElementsCommand} to reduce the given dimensions to a target dimension value.
 */
export type ReduceFunction = (...values: number[]) => number;

export namespace ReduceFunction {
    /**
     * Returns the minimal value of the given numbers.
     * @param values Numbers to be evaluated.
     * @returns The reduced number.
     */
    export function min(...values: number[]): number {
        return Math.min(...values);
    }

    /**
     * Returns the maximal value of the given numbers.
     * @param values Numbers to be evaluated.
     * @returns The reduced number.
     */
    export function max(...values: number[]): number {
        return Math.max(...values);
    }

    /**
     * Computes the  average of the given numbers.
     * @param values Numbers to be evaluated.
     */
    export function avg(...values: number[]): number {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     *  Returns the last value of the given numbers.
     *  @param values Numbers to be evaluated.
     *  @returns The reduced number.
     */
    export function first(...values: number[]): number {
        return values[0];
    }

    /**
     *  Returns the minimal value of the given numbers.
     *  @param values Numbers  to be evaluated.
     *  @returns The reduced number.
     */
    export function last(...values: number[]): number {
        return values[values.length - 1];
    }

    /**
     * Returns the reduce function that corresponds to the given {@link ReduceFunctionType}.
     * @param type The reduce function kind.
     * @returns The corresponding reduce function.
     */
    export function get(type: ReduceFunctionType): ReduceFunction {
        return ReduceFunction[type];
    }
}

/** Union type of all {@link ReduceFunction} keys. */
export type ReduceFunctionType = Exclude<keyof typeof ReduceFunction, 'get'>;

export interface ResizeElementsAction extends Action {
    kind: typeof ResizeElementsAction.KIND;

    /**
     * IDs of the elements that should be resized. If no IDs are given, the selected elements will be resized.
     */
    elementIds: string[];

    /**
     * Resize dimension. The default is {@link ResizeDimension.Width}.
     */
    dimension: ResizeDimension;

    /**
     * Type of the {@link ReduceFunction} that should be used to reduce the dimension to a target dimension value
     */
    reduceFunction: ReduceFunctionType;
}

export namespace ResizeElementsAction {
    export const KIND = 'resizeElementAction';

    export function is(object: any): object is ResizeElementsAction {
        return (
            Action.hasKind(object, KIND) &&
            hasArrayProp(object, 'elementIds') &&
            hasNumberProp(object, 'dimension') &&
            hasStringProp(object, 'reduceFunction')
        );
    }

    export function create(options: {
        elementIds?: string[];
        dimension?: ResizeDimension;
        reduceFunction: ReduceFunctionType;
    }): ResizeElementsAction {
        return {
            kind: KIND,
            dimension: ResizeDimension.Width,
            elementIds: [],
            ...options
        };
    }
}

@injectable()
export abstract class LayoutElementsActionHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    @inject(SelectionService)
    protected selectionService: SelectionService;

    @inject(TYPES.IMovementRestrictor)
    @optional()
    protected movementRestrictor?: IMovementRestrictor;

    abstract handle(action: Action): void | Action | ICommand;

    getSelectedElements(selection: { elementIds: string[] }): BoundsAwareModelElement[] {
        const index = this.selectionService.getModelRoot().index;
        const selectedElements = selection.elementIds.length > 0 ? selection.elementIds : this.selectionService.getSelectedElementIDs();
        return getElements(index, selectedElements, this.isActionElement);
    }

    protected abstract isActionElement(element: GModelElement): element is BoundsAwareModelElement;

    dispatchAction(action: Action): void {
        this.actionDispatcher.dispatch(action);
    }

    dispatchActions(actions: Action[]): void {
        this.actionDispatcher.dispatchAll(actions);
    }
}

@injectable()
export class ResizeElementsActionHandler extends LayoutElementsActionHandler {
    handle(action: ResizeElementsAction): void {
        const elements = this.getSelectedElements(action);
        if (elements.length > 1) {
            const reduceFn = ReduceFunction.get(action.reduceFunction);
            switch (action.dimension) {
                case ResizeDimension.Width:
                    return this.resizeWidth(elements, reduceFn);
                case ResizeDimension.Height:
                    return this.resizeHeight(elements, reduceFn);
                case ResizeDimension.Width_And_Height:
                    return this.resizeWidthAndHeight(elements, reduceFn);
            }
        }
    }

    resizeWidth(elements: BoundsAwareModelElement[], reduceFn: ReduceFunction): void {
        const targetWidth = reduceFn(...elements.map(element => element.bounds.width));
        this.dispatchResizeActions(elements, (element, bounds) => {
            // resize around center (horizontal)
            const halfDiffWidth = 0.5 * (targetWidth - element.bounds.width);
            bounds.newPosition!.x = element.bounds.x - halfDiffWidth;
            bounds.newSize.width = targetWidth;
        });
    }

    resizeHeight(elements: BoundsAwareModelElement[], reduceFn: ReduceFunction): void {
        const targetHeight = reduceFn(...elements.map(element => element.bounds.height));
        this.dispatchResizeActions(elements, (element, bounds) => {
            // resize around middle (vertical)
            const halfDiffHeight = 0.5 * (targetHeight - element.bounds.height);
            bounds.newPosition!.y = element.bounds.y - halfDiffHeight;
            bounds.newSize.height = targetHeight;
        });
    }

    resizeWidthAndHeight(elements: BoundsAwareModelElement[], reduceFn: ReduceFunction): void {
        const targetWidth = reduceFn(...elements.map(element => element.bounds.width));
        const targetHeight = reduceFn(...elements.map(element => element.bounds.height));
        const targetDimension: Dimension = { width: targetWidth, height: targetHeight };
        this.dispatchResizeActions(elements, (element, bounds) => {
            // resize around center and middle (horizontal & vertical)
            const difference = Dimension.subtract(targetDimension, element.bounds);
            const center = Dimension.center(difference);
            bounds.newPosition = Point.subtract(element.bounds, center);
            bounds.newSize = targetDimension;
        });
    }

    dispatchResizeActions(
        elements: BoundsAwareModelElement[],
        change: (element: BoundsAwareModelElement, bounds: Writable<ElementAndBounds>) => void
    ): void {
        const elementAndBounds: ElementAndBounds[] = []; // client- and server-side resize

        elements.forEach(element => {
            const elementChange = this.createElementAndBounds(element, change);
            if (elementChange) {
                // simply skip invalid changes
                elementAndBounds.push(elementChange);
            }
        });
        this.dispatchActions([SetBoundsAction.create(elementAndBounds), ChangeBoundsOperation.create(elementAndBounds)]);
    }

    createElementAndBounds(
        element: BoundsAwareModelElement,
        change: (_element: BoundsAwareModelElement, _bounds: Writable<ElementAndBounds>) => void
    ): Writable<ElementAndBounds> | undefined {
        const bounds: ElementAndBounds = {
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
        return toValidElementAndBounds(element, bounds, this.movementRestrictor);
    }
    protected isActionElement(element: GModelElement): element is BoundsAwareModelElement {
        return isResizable(element);
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

/**
 * A function that retrieves a specific (sub)-selection of elements from a given set of elements.
 * Mainly used by the {@link AlignElementsActionHandler}.
 */
export type SelectFunction = (elements: BoundsAwareModelElement[]) => BoundsAwareModelElement[];
export namespace SelectFunction {
    /**
     * Select all elements from the given set of elements.
     * @param elements The set of elements.
     * @returns All elements.
     */
    export function all(elements: BoundsAwareModelElement[]): BoundsAwareModelElement[] {
        return elements;
    }

    /**
     * Select the first element from a given set of elements.
     * @param elements The elements.
     * @returns An array containing the first element of the given elements.
     */
    export function first(elements: BoundsAwareModelElement[]): BoundsAwareModelElement[] {
        return [elements[0]];
    }

    /**
     * Select the last element from a given set of elements.
     * @param elements The elements.
     * @returns An array containing the last element of the given elements.
     */
    export function last(elements: BoundsAwareModelElement[]): BoundsAwareModelElement[] {
        return [elements[elements.length - 1]];
    }

    /**
     * Returns the select function that corresponds to the given {@link SelectFunctionType}.
     * @param type The select function type.
     * @returns The corresponding select function.
     */
    export function get(kind: SelectFunctionType): SelectFunction {
        return SelectFunction[kind];
    }
}

/** Union type of all {@link SelectFunction} keys. */
export type SelectFunctionType = Exclude<keyof typeof SelectFunction, 'get'>;

export interface AlignElementsAction extends Action {
    kind: typeof AlignElementsAction.KIND;

    /**
     * IDs of the elements that should be aligned. If no IDs are given, the selected elements will be aligned.
     */
    elementIds: string[];
    /**
     * Alignment direction. The default is {@link Alignment.Left}
     */
    alignment: Alignment;
    /**
     * Function to selected elements that are considered during alignment calculation.
     * The default value is {@link Select.all}.
     */
    selectFunction: SelectFunctionType;
}

export namespace AlignElementsAction {
    export const KIND = 'alignElements';

    export function is(object: any): object is AlignElementsAction {
        return (
            Action.hasKind(object, KIND) &&
            hasArrayProp(object, 'elementIds') &&
            hasNumberProp(object, 'alignment') &&
            hasStringProp(object, 'selectFunction')
        );
    }

    export function create(
        options: { elementIds?: string[]; alignment?: Alignment; selectionFunction?: SelectFunctionType } = {}
    ): AlignElementsAction {
        return {
            kind: KIND,
            elementIds: [],
            alignment: Alignment.Left,
            selectFunction: 'all',
            ...options
        };
    }
}

@injectable()
export class AlignElementsActionHandler extends LayoutElementsActionHandler {
    handle(action: AlignElementsAction): void {
        const elements = this.getSelectedElements(action);
        const selectFn = SelectFunction.get(action.selectFunction);
        const calculatedElements = selectFn(elements);
        if (elements.length > 1) {
            switch (action.alignment) {
                case Alignment.Left:
                    return this.alignLeft(calculatedElements);
                case Alignment.Center:
                    return this.alignCenter(calculatedElements);
                case Alignment.Right:
                    return this.alignRight(calculatedElements);
                case Alignment.Top:
                    return this.alignTop(calculatedElements);
                case Alignment.Middle:
                    return this.alignMiddle(calculatedElements);
                case Alignment.Bottom:
                    return this.alignBottom(calculatedElements);
            }
        }
    }

    alignLeft(elements: BoundsAwareModelElement[]): void {
        const minX = elements.map(element => element.bounds.x).reduce((a, b) => Math.min(a, b));
        this.dispatchAlignActions(elements, (_, move) => (move.toPosition.x = minX));
    }

    alignCenter(elements: BoundsAwareModelElement[]): void {
        const minX = elements.map(element => element.bounds.x).reduce((a, b) => Math.min(a, b));
        const maxX = elements.map(element => element.bounds.x + element.bounds.width).reduce((a, b) => Math.max(a, b));
        const diffX = maxX - minX;
        const centerX = minX + 0.5 * diffX;
        this.dispatchAlignActions(elements, (element, move) => (move.toPosition.x = centerX - 0.5 * element.bounds.width));
    }

    alignRight(elements: BoundsAwareModelElement[]): void {
        const maxX = elements.map(element => element.bounds.x + element.bounds.width).reduce((a, b) => Math.max(a, b));
        this.dispatchAlignActions(elements, (element, move) => (move.toPosition.x = maxX - element.bounds.width));
    }

    alignTop(elements: BoundsAwareModelElement[]): void {
        const minY = elements.map(element => element.bounds.y).reduce((a, b) => Math.min(a, b));
        this.dispatchAlignActions(elements, (_, move) => (move.toPosition.y = minY));
    }

    alignMiddle(elements: BoundsAwareModelElement[]): void {
        const minY = elements.map(element => element.bounds.y).reduce((a, b) => Math.min(a, b));
        const maxY = elements.map(element => element.bounds.y + element.bounds.height).reduce((a, b) => Math.max(a, b));
        const diffY = maxY - minY;
        const middleY = minY + 0.5 * diffY;
        this.dispatchAlignActions(elements, (element, move) => (move.toPosition.y = middleY - 0.5 * element.bounds.height));
    }

    alignBottom(elements: BoundsAwareModelElement[]): void {
        const maxY = elements.map(element => element.bounds.y + element.bounds.height).reduce((a, b) => Math.max(a, b));
        this.dispatchAlignActions(elements, (element, move) => (move.toPosition.y = maxY - element.bounds.height));
    }

    dispatchAlignActions(
        elements: BoundsAwareModelElement[],
        change: (element: BoundsAwareModelElement, move: Writable<ElementMove>) => void
    ): void {
        const moves: ElementMove[] = []; // client-side move
        const elementAndBounds: ElementAndBounds[] = []; // server-side move
        elements.forEach(element => {
            const move = this.createElementMove(element, change);
            if (move) {
                // simply skip invalid changes
                moves.push(move);
                const elementAndBound = this.createElementAndBounds(element, move);
                elementAndBounds.push(elementAndBound);
            }
        });
        this.dispatchActions([MoveAction.create(moves), ChangeBoundsOperation.create(elementAndBounds)]);
    }

    createElementMove(
        element: BoundsAwareModelElement,
        change: (_element: BoundsAwareModelElement, _move: Writable<ElementMove>) => void
    ): Writable<ElementMove> | undefined {
        const move: ElementMove = {
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
        return toValidElementMove(element, move, this.movementRestrictor);
    }

    createElementAndBounds(element: BoundsAwareModelElement, move: ElementMove): ElementAndBounds {
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
    protected isActionElement(element: GModelElement): element is BoundsAwareModelElement {
        return isBoundsAwareMoveable(element);
    }
}
