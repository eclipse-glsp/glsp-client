/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
    Bounds,
    CommandExecutionContext,
    CommandReturn,
    GModelElement,
    GModelRoot,
    TYPES,
    Viewport,
    findParentByFeature,
    isBoundsAware,
    isViewport
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { partition } from 'lodash';
import '../../../css/helper-lines.css';
import { FeedbackCommand } from '../../base/feedback/feedback-command';
import {
    bottom,
    bottomCenter,
    bottomLeft,
    bottomRight,
    center,
    isAbove,
    isBefore,
    left,
    middle,
    middleLeft,
    middleRight,
    right,
    sortBy,
    top,
    topCenter,
    topLeft,
    topRight
} from '../../utils/geometry-util';
import {
    BoundsAwareModelElement,
    findTopLevelElementByFeature,
    forEachElement,
    getMatchingElements,
    isRoutable,
    isVisibleOnCanvas
} from '../../utils/gmodel-util';
import { getViewportBounds } from '../../utils/viewpoint-util';
import { HelperLine, HelperLineType, SelectionBounds, isHelperLine, isSelectionBounds } from './model';

export type ViewportLineType = typeof HelperLineType.Center | typeof HelperLineType.Middle | string;

export type AlignmentElementFilter = (element: BoundsAwareModelElement) => boolean;

export const isTopLevelBoundsAwareElement: AlignmentElementFilter = element =>
    findTopLevelElementByFeature(element, isBoundsAware, isViewport) === element;

export interface DrawHelperLinesFeedbackAction extends Action {
    kind: typeof DrawHelperLinesFeedbackAction.KIND;
    elementIds: string[];
    elementLines?: HelperLineType[];
    viewportLines?: ViewportLineType[];
    alignmentEpsilon?: number;
    alignmentElementFilter?: AlignmentElementFilter;
}

export const ALL_ELEMENT_LINE_TYPES = Object.values(HelperLineType);
export const ALL_VIEWPORT_LINE_TYPES = [HelperLineType.Center, HelperLineType.Middle];

export const DEFAULT_ELEMENT_LINES = ALL_ELEMENT_LINE_TYPES;
export const DEFAULT_VIEWPORT_LINES = ALL_VIEWPORT_LINE_TYPES;
export const DEFAULT_EPSILON = 1;
export const DEFAULT_ALIGNABLE_ELEMENT_FILTER = (element: BoundsAwareModelElement): boolean =>
    isTopLevelBoundsAwareElement(element) && isVisibleOnCanvas(element) && !isRoutable(element);

export namespace DrawHelperLinesFeedbackAction {
    export const KIND = 'drawHelperLines';

    export function create(options: Omit<DrawHelperLinesFeedbackAction, 'kind'>): DrawHelperLinesFeedbackAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class DrawHelperLinesFeedbackCommand extends FeedbackCommand {
    static readonly KIND = DrawHelperLinesFeedbackAction.KIND;

    protected elementIds: string[];
    protected elementLines: HelperLineType[];
    protected viewportLines: ViewportLineType[];
    protected alignmentEpsilon: number;
    protected alignableElementFilter: AlignmentElementFilter;
    protected isAlignableElementPredicate: (element: GModelElement) => element is BoundsAwareModelElement;

    constructor(@inject(TYPES.Action) action: DrawHelperLinesFeedbackAction) {
        super();
        this.elementIds = action.elementIds;
        this.elementLines = action.elementLines ?? DEFAULT_ELEMENT_LINES;
        this.viewportLines = action.viewportLines ?? DEFAULT_VIEWPORT_LINES;
        this.alignmentEpsilon = action.alignmentEpsilon ?? DEFAULT_EPSILON;
        this.alignableElementFilter = action.alignmentElementFilter ?? DEFAULT_ALIGNABLE_ELEMENT_FILTER;
        this.isAlignableElementPredicate = this.isAlignableElement.bind(this);
    }

    execute(context: CommandExecutionContext): CommandReturn {
        removeHelperLines(context.root);
        removeSelectionBounds(context.root);
        const alignableElements = getMatchingElements(context.root.index, this.isAlignableElementPredicate);
        const [referenceElements, elements] = partition(alignableElements, element => this.elementIds.includes(element.id));
        if (referenceElements.length === 0) {
            return context.root;
        }
        const referenceBounds = this.calcReferenceBounds(referenceElements);
        const helperLines = this.calcHelperLines(elements, referenceBounds, context);
        if (referenceElements.length > 1) {
            context.root.add(new SelectionBounds(referenceBounds));
        }
        helperLines.forEach(helperLine => context.root.add(helperLine));
        return context.root;
    }

    protected isAlignableElement(element: GModelElement): element is BoundsAwareModelElement {
        return isBoundsAware(element) && this.alignableElementFilter(element);
    }

    protected calcReferenceBounds(referenceElements: BoundsAwareModelElement[]): Bounds {
        return referenceElements.map(element => element.bounds).reduce(Bounds.combine, Bounds.EMPTY);
    }

    protected calcHelperLines(elements: BoundsAwareModelElement[], bounds: Bounds, context: CommandExecutionContext): HelperLine[] {
        const helperLines: HelperLine[] = [];
        const viewport = findParentByFeature(context.root, isViewport);
        if (viewport) {
            helperLines.push(...this.calcHelperLinesForViewport(viewport, bounds, this.viewportLines));
        }
        elements
            .flatMap(element => this.calcHelperLinesForElement(element, bounds, this.elementLines))
            .forEach(line => helperLines.push(line));
        return helperLines;
    }

    protected calcHelperLinesForViewport(root: Viewport & GModelRoot, bounds: Bounds, lineTypes: HelperLineType[]): HelperLine[] {
        const helperLines: HelperLine[] = [];
        const viewportBounds = getViewportBounds(root, root.canvasBounds);
        if (lineTypes.includes(HelperLineType.Center) && this.isAligned(center, viewportBounds, bounds, 2)) {
            helperLines.push(new HelperLine(topCenter(viewportBounds), bottomCenter(viewportBounds), HelperLineType.Center));
        }
        if (lineTypes.includes(HelperLineType.Middle) && this.isAligned(middle, viewportBounds, bounds, 2)) {
            helperLines.push(new HelperLine(middleLeft(viewportBounds), middleRight(viewportBounds), HelperLineType.Middle));
        }
        return helperLines;
    }

    protected calcHelperLinesForElement(element: BoundsAwareModelElement, bounds: Bounds, lineTypes: HelperLineType[]): HelperLine[] {
        return this.calcHelperLinesForBounds(element.bounds, bounds, lineTypes);
    }

    protected calcHelperLinesForBounds(elementBounds: Bounds, bounds: Bounds, lineTypes: HelperLineType[]): HelperLine[] {
        const helperLines: HelperLine[] = [];

        if (lineTypes.includes(HelperLineType.Left) && this.isAligned(left, elementBounds, bounds, this.alignmentEpsilon)) {
            const [above, below] = sortBy(top, elementBounds, bounds); // higher top-value ==> lower
            helperLines.push(new HelperLine(bottomLeft(below), topLeft(above), HelperLineType.Left));
        }

        if (lineTypes.includes(HelperLineType.Center) && this.isAligned(center, elementBounds, bounds, this.alignmentEpsilon)) {
            const [above, below] = sortBy(top, elementBounds, bounds); // higher top-value ==> lower
            helperLines.push(new HelperLine(topCenter(above), bottomCenter(below), HelperLineType.Center));
        }

        if (lineTypes.includes(HelperLineType.Right) && this.isAligned(right, elementBounds, bounds, this.alignmentEpsilon)) {
            const [above, below] = sortBy(top, elementBounds, bounds); // higher top-value ==> lower
            helperLines.push(new HelperLine(bottomRight(below), topRight(above), HelperLineType.Right));
        }

        if (lineTypes.includes(HelperLineType.Bottom) && this.isAligned(bottom, elementBounds, bounds, this.alignmentEpsilon)) {
            const [before, after] = sortBy(left, elementBounds, bounds); // higher left-value ==> more to the right
            helperLines.push(new HelperLine(bottomLeft(before), bottomRight(after), HelperLineType.Bottom));
        }

        if (lineTypes.includes(HelperLineType.Middle) && this.isAligned(middle, elementBounds, bounds, this.alignmentEpsilon)) {
            const [before, after] = sortBy(left, elementBounds, bounds); // higher left-value ==> more to the right
            helperLines.push(new HelperLine(middleLeft(before), middleRight(after), HelperLineType.Middle));
        }

        if (lineTypes.includes(HelperLineType.Top) && this.isAligned(top, elementBounds, bounds, this.alignmentEpsilon)) {
            const [before, after] = sortBy(left, elementBounds, bounds); // higher left-value ==> more to the right
            helperLines.push(new HelperLine(topLeft(before), topRight(after), HelperLineType.Top));
        }

        if (lineTypes.includes(HelperLineType.LeftRight) && this.isMatch(left(elementBounds), right(bounds), this.alignmentEpsilon)) {
            if (isAbove(bounds, elementBounds)) {
                helperLines.push(new HelperLine(bottomLeft(elementBounds), topRight(bounds), HelperLineType.RightLeft));
            } else {
                helperLines.push(new HelperLine(topLeft(elementBounds), bottomRight(bounds), HelperLineType.RightLeft));
            }
        }

        if (lineTypes.includes(HelperLineType.LeftRight) && this.isMatch(right(elementBounds), left(bounds), this.alignmentEpsilon)) {
            if (isAbove(bounds, elementBounds)) {
                helperLines.push(new HelperLine(bottomRight(elementBounds), topLeft(bounds), HelperLineType.LeftRight));
            } else {
                helperLines.push(new HelperLine(topRight(elementBounds), bottomLeft(bounds), HelperLineType.LeftRight));
            }
        }

        if (lineTypes.includes(HelperLineType.TopBottom) && this.isMatch(top(elementBounds), bottom(bounds), this.alignmentEpsilon)) {
            if (isBefore(bounds, elementBounds)) {
                helperLines.push(new HelperLine(topRight(elementBounds), bottomLeft(bounds), HelperLineType.BottomTop));
            } else {
                helperLines.push(new HelperLine(topLeft(elementBounds), bottomRight(bounds), HelperLineType.BottomTop));
            }
        }

        if (lineTypes.includes(HelperLineType.TopBottom) && this.isMatch(bottom(elementBounds), top(bounds), this.alignmentEpsilon)) {
            if (isBefore(bounds, elementBounds)) {
                helperLines.push(new HelperLine(bottomRight(elementBounds), topLeft(bounds), HelperLineType.TopBottom));
            } else {
                helperLines.push(new HelperLine(bottomLeft(elementBounds), topRight(bounds), HelperLineType.TopBottom));
            }
        }

        return helperLines;
    }

    protected isAligned(coordinate: (elem: Bounds) => number, leftBounds: Bounds, rightBounds: Bounds, epsilon: number): boolean {
        return this.isMatch(coordinate(leftBounds), coordinate(rightBounds), epsilon);
    }

    protected isMatch(leftCoordinate: number, rightCoordinate: number, epsilon: number): boolean {
        return Math.abs(leftCoordinate - rightCoordinate) < epsilon;
    }
}

export interface RemoveHelperLinesFeedbackAction extends Action {
    kind: typeof RemoveHelperLinesFeedbackAction.KIND;
}

export namespace RemoveHelperLinesFeedbackAction {
    export const KIND = 'removeHelperLines';

    export function create(options: Omit<RemoveHelperLinesFeedbackAction, 'kind'> = {}): RemoveHelperLinesFeedbackAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class RemoveHelperLinesFeedbackCommand extends FeedbackCommand {
    static readonly KIND = RemoveHelperLinesFeedbackAction.KIND;

    constructor(@inject(TYPES.Action) public action: RemoveHelperLinesFeedbackAction) {
        super();
    }
    override execute(context: CommandExecutionContext): CommandReturn {
        removeHelperLines(context.root);
        removeSelectionBounds(context.root);
        return context.root;
    }
}

export function removeHelperLines(root: GModelRoot): void {
    forEachElement(root.index, isHelperLine, line => root.remove(line));
}

export function removeSelectionBounds(root: GModelRoot): void {
    forEachElement(root.index, isSelectionBounds, line => root.remove(line));
}
