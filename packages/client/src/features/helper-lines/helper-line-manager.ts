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
    GModelElement,
    GModelRoot,
    IActionHandler,
    MoveAction,
    Point,
    SetBoundsAction,
    TYPES,
    Vector,
    Writable
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional, postConstruct } from 'inversify';
import { IFeedbackActionDispatcher } from '../../base/feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from '../../base/feedback/feedback-emitter';
import { ISelectionListener, SelectionService } from '../../base/selection-service';
import { SetBoundsFeedbackAction } from '../bounds/set-bounds-feedback-command';
import { GResizeHandle, ResizeHandleLocation } from '../change-bounds/model';
import { Grid } from '../grid/grid';
import { MoveFinishedEventAction, MoveInitializedEventAction } from '../tools/change-bounds/change-bounds-tool-feedback';
import {
    AlignmentElementFilter,
    DEFAULT_ALIGNABLE_ELEMENT_FILTER,
    DEFAULT_DEBUG,
    DEFAULT_ELEMENT_LINES,
    DEFAULT_EPSILON,
    DEFAULT_VIEWPORT_LINES,
    DrawHelperLinesFeedbackAction,
    RemoveHelperLinesFeedbackAction,
    ViewportLineType
} from './helper-line-feedback';
import { Direction, HelperLine, HelperLineType, isHelperLine } from './model';

export interface IHelperLineManager {
    /**
     * Calculates the minimum move delta on one axis that is necessary to break through a helper line.
     *
     * @param element element that is being moved
     * @param isSnap whether snapping is active or not
     * @param direction direction in which the target element is moving
     */
    getMinimumMoveDelta(element: GModelElement, isSnap: boolean, direction: Direction): number;

    /**
     * Calculates the minimum move vector that is necessary to break through a helper line.
     *
     * @param element element that is being moved
     * @param isSnap whether snapping is active or not
     * @param directions directions in which the target element is moving
     */
    getMinimumMoveVector(element: GModelElement, isSnap: boolean, directions: Direction[]): Vector | undefined;
}

export interface IHelperLineOptions {
    /**
     * A list of helper line types that should be rendered when elements are aligned.
     * Defaults to all possible alignments.
     */
    elementLines?: HelperLineType[];
    /**
     * A list of helper line types that should be rendered when an element is aligned with the viewport.
     * Defaults to middle and center alignment.
     */
    viewportLines?: ViewportLineType[];
    /**
     * The minimum difference between two coordinates
     * Defaults to 1 or zero (perfect match) if the optional grid module is loaded.
     */
    alignmentEpsilon?: number;
    /**
     * A filter that is applied to determine on which elements the alignment calculation is performed.
     * By default all top-level bounds-aware, non-routable elements that are visible on the canvas are considered.
     */
    alignmentElementFilter?: AlignmentElementFilter;
    /**
     * The minimum move delta that is necessary for an element to break through a helper line.
     * Defaults to { x: 1, y: 1 } whereas the x represents the horizontal distance and y represents the vertical distance.
     * If the optional grid module is loaded, defaults to twice the grid size, i.e., two grid moves to break through a helper line.
     */
    minimumMoveDelta?: Point;

    /**
     * Produces debug output.
     * Defaults to false.
     */
    debug?: boolean;
}

export const DEFAULT_MOVE_DELTA = { x: 1, y: 1 };

export const DEFAULT_HELPER_LINE_OPTIONS: Required<IHelperLineOptions> = {
    elementLines: DEFAULT_ELEMENT_LINES,
    viewportLines: DEFAULT_VIEWPORT_LINES,
    alignmentEpsilon: DEFAULT_EPSILON,
    alignmentElementFilter: DEFAULT_ALIGNABLE_ELEMENT_FILTER,
    minimumMoveDelta: DEFAULT_MOVE_DELTA,
    debug: DEFAULT_DEBUG
};

@injectable()
export class HelperLineManager implements IActionHandler, ISelectionListener, IHelperLineManager {
    @inject(TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher;
    @inject(SelectionService) protected selectionService: SelectionService;
    @optional() @inject(TYPES.IHelperLineOptions) protected userOptions?: IHelperLineOptions;
    @optional() @inject(TYPES.Grid) protected grid?: Grid;

    protected options: Required<IHelperLineOptions>;
    protected feedback: FeedbackEmitter;

    @postConstruct()
    protected init(): void {
        this.feedback = this.feedbackDispatcher.createEmitter();
        const dynamicOptions: IHelperLineOptions = {};
        if (this.grid) {
            dynamicOptions.alignmentEpsilon = 0;
            dynamicOptions.minimumMoveDelta = Point.multiplyScalar(this.grid, 2);
        }
        this.options = { ...DEFAULT_HELPER_LINE_OPTIONS, ...dynamicOptions, ...this.userOptions };
        this.selectionService.addListener(this);
    }

    handle(action: Action): void {
        if (MoveInitializedEventAction.is(action)) {
            this.handleMoveInitializedAction(action);
        } else if (MoveAction.is(action)) {
            this.handleMoveAction(action);
        } else if (MoveFinishedEventAction.is(action)) {
            this.handleMoveFinishedAction(action);
        } else if (SetBoundsAction.is(action) || SetBoundsFeedbackAction.is(action)) {
            this.handleSetBoundsAction(action);
        }
    }

    protected handleMoveInitializedAction(_action: MoveInitializedEventAction): void {
        this.submitHelperLineFeedback();
    }

    protected handleMoveFinishedAction(_action: MoveFinishedEventAction): void {
        this.feedback.dispose();
    }

    protected handleMoveAction(action: MoveAction): void {
        if (!action.finished) {
            this.submitHelperLineFeedback(action.moves.map(move => move.elementId));
        } else {
            this.feedback.dispose();
        }
    }

    protected submitHelperLineFeedback(elementIds: string[] = this.selectionService.getSelectedElementIDs()): void {
        const feedback = this.createHelperLineFeedback(elementIds);
        this.feedback.add(feedback, [RemoveHelperLinesFeedbackAction.create()]).submit();
    }

    protected createHelperLineFeedback(elementIds: string[]): DrawHelperLinesFeedbackAction {
        return DrawHelperLinesFeedbackAction.create({ elementIds, ...this.options });
    }

    protected handleSetBoundsAction(action: SetBoundsAction | SetBoundsFeedbackAction): void {
        this.submitHelperLineFeedback(action.bounds.map(bound => bound.elementId));
    }

    selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[], deselectedElements?: string[] | undefined): void {
        this.feedback.dispose();
    }

    getMinimumMoveDelta(element: GModelElement, isSnap: boolean, direction: Direction): number {
        if (!isSnap) {
            return 0;
        }
        const minimumMoveDelta = this.options.minimumMoveDelta;
        return direction === Direction.Left || direction === Direction.Right ? minimumMoveDelta.x : minimumMoveDelta.y;
    }

    getMinimumMoveVector(element: GModelElement, isSnap: boolean, move: Direction[]): Vector | undefined {
        if (!isSnap) {
            return undefined;
        }

        const state = this.getHelperLineState(element);
        if (state.helperLines.length === 0) {
            return undefined;
        }

        const minimum: Writable<Vector> = { ...Vector.ZERO };
        const resize =
            element instanceof GResizeHandle
                ? ResizeHandleLocation.direction(element.location)
                : [Direction.Left, Direction.Right, Direction.Up, Direction.Down];

        if ((state.types.left || state.types.center) && move.includes(Direction.Left) && resize.includes(Direction.Left)) {
            minimum.x = this.getMinimumMoveDelta(element, isSnap, Direction.Left);
        } else if ((state.types.right || state.types.center) && move.includes(Direction.Right) && resize.includes(Direction.Right)) {
            minimum.x = this.getMinimumMoveDelta(element, isSnap, Direction.Right);
        }
        if ((state.types.top || state.types.middle) && move.includes(Direction.Up) && resize.includes(Direction.Up)) {
            minimum.y = this.getMinimumMoveDelta(element, isSnap, Direction.Up);
        } else if ((state.types.bottom || state.types.middle) && move.includes(Direction.Down) && resize.includes(Direction.Down)) {
            minimum.y = this.getMinimumMoveDelta(element, isSnap, Direction.Down);
        }
        return Vector.isZero(minimum) ? undefined : minimum;
    }

    protected getHelperLineState(element: GModelElement): HelperLineState {
        const helperLines = element.root.children.filter(isHelperLine) || [];
        const types = {
            left: false,
            right: false,
            top: false,
            bottom: false,
            center: false,
            middle: false
        };
        for (const line of helperLines) {
            switch (line.lineType) {
                case HelperLineType.Left:
                case HelperLineType.LeftRight:
                    types.left = true;
                    break;
                case HelperLineType.Right:
                case HelperLineType.RightLeft:
                    types.right = true;
                    break;
                case HelperLineType.Top:
                case HelperLineType.TopBottom:
                    types.top = true;
                    break;
                case HelperLineType.Bottom:
                case HelperLineType.BottomTop:
                    types.bottom = true;
                    break;
                case HelperLineType.Center:
                    types.center = true;
                    break;
                case HelperLineType.Middle:
                    types.middle = true;
                    break;
            }
        }
        return { helperLines, types };
    }
}

export interface HelperLineState {
    helperLines: HelperLine[];
    types: {
        left: boolean;
        right: boolean;
        top: boolean;
        bottom: boolean;
        center: boolean;
        middle: boolean;
    };
}
