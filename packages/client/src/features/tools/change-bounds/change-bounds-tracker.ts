/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
    Bounds,
    Dimension,
    GModelElement,
    GRoutingHandle,
    Locateable,
    Movement,
    Point,
    ResolvedElementMove,
    TypeGuard,
    Vector,
    Writable,
    hasBooleanProp,
    isMoveable
} from '@eclipse-glsp/sprotty';
import { ChangeBoundsManager } from '..';
import { BoundsAwareModelElement, MoveableElement, ResizableModelElement, getElements } from '../../../utils';
import { DiagramMovementCalculator, ResizeHandleLocation, SResizeHandle } from '../../change-bounds';

export interface ElementTrackingOptions {
    /** Snap position. Default: true. */
    snap: boolean | MouseEvent | KeyboardEvent | any;
    /** Restrict position. Default: true */
    restrict: boolean | MouseEvent | KeyboardEvent | any;
    /** Validate operation. Default: true */
    validate: boolean;

    /** Skip operations that do not trigger change. Default: true */
    skipStatic: boolean;
}

export interface MoveOptions extends ElementTrackingOptions {
    /** Skip operations are invalid. Default: false */
    skipInvalid: boolean;
}

export const DEFAULT_MOVE_OPTIONS: MoveOptions = {
    snap: true,
    restrict: true,
    validate: true,

    skipStatic: true,
    skipInvalid: false
};

export type MoveableElements =
    | MoveableElement[]
    | {
          ctx: GModelElement;
          elementIDs: string[];
          guard?: TypeGuard<MoveableElement>;
      };

export interface TrackedElementMove extends ResolvedElementMove {
    moveVector: Vector;
    valid: boolean;
}

export type TypedElementMove<T extends MoveableElement> = TrackedElementMove & { element: T };

export namespace ElementMovement {
    export function empty<T extends MoveableElement>(element: T, point = Point.ORIGIN): TypedElementMove<T> {
        return {
            element,
            fromPosition: point,
            toPosition: point,
            moveVector: Vector.ZERO,
            valid: true
        };
    }
}

export interface TrackedMove extends Movement {
    elementMoves: TrackedElementMove[];
    valid: boolean;
    options: MoveOptions;
}

export namespace TrackedMove {
    export function is(obj: any): obj is TrackedMove {
        return Movement.is(obj) && hasBooleanProp(obj, 'valid');
    }
}

export interface ResizeOptions extends ElementTrackingOptions {
    /** Skip resizes that do not actually change the dimension of the element. Default: true. */
    skipStatic: boolean;

    /** Perform symmetric resize on the opposite side. Default: false. */
    symmetric: boolean | MouseEvent | KeyboardEvent | any;

    /**
     * Avoids resizes smaller than the minimum size which will yield invalid sizes.
     * The minimum size takes precedence over the snapped (grid) position.
     *
     * Default: true.
     */
    capAtMinimumSize: boolean;

    /** Skip resizes that produce an invalid size. Default: false. */
    skipInvalidSize: boolean;

    /** Skip resizes that produce an invalid move. Default: false. */
    skipInvalidMove: boolean;
}

export const DEFAULT_RESIZE_OPTIONS: ResizeOptions = {
    snap: true,
    restrict: true,
    validate: true,
    symmetric: true,

    capAtMinimumSize: true,

    skipStatic: true,
    skipInvalidSize: false,
    skipInvalidMove: false
};

export interface TrackedHandleMove extends TypedElementMove<MoveableResizeHandle> {}

export interface TrackedElementResize {
    element: BoundsAwareModelElement;
    fromBounds: Bounds;
    toBounds: Bounds;
    valid: {
        size: boolean;
        move: boolean;
    };
}

export interface TrackedResize extends Movement {
    handleMove: TrackedHandleMove;
    elementResizes: TrackedElementResize[];
    valid: {
        size: boolean;
        move: boolean;
    };
    options: ResizeOptions;
}

export class ChangeBoundsTracker {
    protected diagramMovement: DiagramMovementCalculator;

    constructor(readonly manager: ChangeBoundsManager) {
        this.diagramMovement = new DiagramMovementCalculator(manager.positionTracker);
    }

    startTracking(): this {
        this.diagramMovement.init();
        return this;
    }

    updateTrackingPosition(param: Vector | Movement | TrackedMove): void {
        const update = TrackedMove.is(param) ? Vector.max(...param.elementMoves.map(move => move.moveVector)) : param;
        this.diagramMovement.updatePosition(update);
    }

    isTracking(): boolean {
        return this.diagramMovement.hasPosition;
    }

    stopTracking(): this {
        this.diagramMovement.dispose();
        return this;
    }

    //
    // MOVE
    //

    moveElements(elements: MoveableElements, opts?: Partial<MoveOptions>): TrackedMove {
        const options = this.resolveMoveOptions(opts);
        const update = this.calculateDiagramMovement();
        const move: TrackedMove = { ...update, elementMoves: [], valid: true, options };

        if (Vector.isZero(update.vector)) {
            // no movement detected so elements won't be moved, exit early
            return move;
        }

        // calculate move for each element
        const elementsToMove = this.getMoveableElements(elements, options);
        for (const element of elementsToMove) {
            const elementMove = this.calculateElementMove(element, update.vector, options);
            if (!this.skipElementMove(elementMove, options)) {
                move.elementMoves.push(elementMove);
                move.valid &&= elementMove.valid;
            }
        }
        return move;
    }

    protected resolveMoveOptions(opts?: Partial<MoveOptions>): MoveOptions {
        return {
            ...DEFAULT_MOVE_OPTIONS,
            ...opts,
            snap: this.manager.usePositionSnap(opts?.snap ?? DEFAULT_MOVE_OPTIONS.snap),
            restrict: this.manager.useMovementRestriction(opts?.restrict ?? DEFAULT_MOVE_OPTIONS.restrict)
        };
    }

    protected calculateDiagramMovement(): Movement {
        return this.diagramMovement.calculateMoveToCurrent();
    }

    protected getMoveableElements(elements: MoveableElements, options: MoveOptions): MoveableElement[] {
        return Array.isArray(elements) ? elements : getElements(elements.ctx.index, elements.elementIDs, elements.guard ?? isMoveable);
    }

    protected skipElementMove(elementMove: TrackedElementMove, options: MoveOptions): boolean {
        return (options.skipInvalid && !elementMove.valid) || (options.skipStatic && Vector.isZero(elementMove.moveVector));
    }

    protected calculateElementMove<T extends MoveableElement>(element: T, vector: Vector, options: MoveOptions): TypedElementMove<T> {
        const fromPosition = element.position;
        const toPosition = Point.add(fromPosition, vector);
        const move: TypedElementMove<T> = { element, fromPosition, toPosition, valid: true, moveVector: Vector.ZERO };

        if (options.snap) {
            move.toPosition = this.snapPosition(move, options);
        }

        if (options.restrict) {
            move.toPosition = this.restrictMovement(move, options);
        }

        if (options.validate) {
            move.valid = this.validateElementMove(move, options);
        }

        move.moveVector = Point.vector(move.fromPosition, move.toPosition);
        return move;
    }

    protected snapPosition(elementMove: TrackedElementMove, opts: MoveOptions): Point {
        return this.manager.snapPosition(elementMove.element, elementMove.toPosition);
    }

    protected restrictMovement(elementMove: TrackedElementMove, opts: MoveOptions): Point {
        const movement = Point.move(elementMove.fromPosition, elementMove.toPosition);
        return this.manager.restrictMovement(elementMove.element, movement).to;
    }

    protected validateElementMove(elementMove: TrackedElementMove, opts: MoveOptions): boolean {
        return this.manager.hasValidPosition(elementMove.element, elementMove.toPosition);
    }

    //
    // RESIZE
    //

    resizeElements(handle: SResizeHandle, opts?: Partial<ResizeOptions>): TrackedResize {
        const options = this.resolveResizeOptions(opts);
        const update = this.calculateDiagramMovement();
        const handleMove = this.calculateHandleMove(new MoveableResizeHandle(handle), update.vector, options);
        const resize: TrackedResize = { ...update, valid: { move: true, size: true }, options, handleMove, elementResizes: [] };
        if (Vector.isZero(handleMove.moveVector)) {
            // no movement detected so elements won't be moved, exit early
            return resize;
        }

        // symmetic handle move applies the diagram movement to the opposite handle
        const symmetricHandleMove = options.symmetric
            ? this.calculateHandleMove(handleMove.element.opposite(), Vector.reverse(update.vector), options)
            : undefined;

        // calculate resize for each element (typically only one element is resized at a time but customizations are possible)
        const elementsToResize = this.getResizeableElements(handle, options);
        for (const element of elementsToResize) {
            const elementResize = this.calculateElementResize(element, handleMove, options, symmetricHandleMove);
            if (!this.skipElementResize(elementResize, options)) {
                resize.elementResizes.push(elementResize);
                resize.valid.move = resize.valid.move && elementResize.valid.move;
                resize.valid.size = resize.valid.size && elementResize.valid.size;
                // handleMove.toPosition = SResizeHandle.getHandlePosition(elementResize.toBounds, handle.location);
                // handleMove.moveVector = Point.vector(handleMove.fromPosition, handleMove.toPosition);
            }
        }
        return resize;
    }

    protected resolveResizeOptions(opts?: Partial<ResizeOptions>): ResizeOptions {
        return {
            ...DEFAULT_RESIZE_OPTIONS,
            ...opts,
            snap: this.manager.usePositionSnap(opts?.snap ?? DEFAULT_RESIZE_OPTIONS.snap),
            restrict: this.manager.useMovementRestriction(opts?.restrict ?? DEFAULT_RESIZE_OPTIONS.restrict),
            symmetric: this.manager.useSymmetricResize(opts?.symmetric ?? DEFAULT_RESIZE_OPTIONS.symmetric)
        };
    }

    protected calculateHandleMove(handle: MoveableResizeHandle, diagramMovement: Vector, opts?: Partial<ResizeOptions>): TrackedHandleMove {
        const moveOptions = this.resolveMoveOptions({ ...opts, validate: false });
        return this.calculateElementMove(handle, diagramMovement, moveOptions);
    }

    protected getResizeableElements(handle: SResizeHandle, options: ResizeOptions): ResizableModelElement[] {
        return [handle.parent];
    }

    protected skipElementResize(elementResize: TrackedElementResize, options: ResizeOptions): boolean {
        return (
            (options.skipInvalidMove && !elementResize.valid.move) ||
            (options.skipInvalidSize && !elementResize.valid.size) ||
            (options.skipStatic && Dimension.equals(elementResize.fromBounds, elementResize.toBounds))
        );
    }

    protected calculateElementResize(
        element: ResizableModelElement,
        handleMove: TrackedHandleMove,
        options: ResizeOptions,
        symmetricHandleMove?: TrackedHandleMove
    ): TrackedElementResize {
        const fromBounds = element.bounds;
        const toBounds = this.calculateElementBounds(element, handleMove, options, symmetricHandleMove);
        const resize: TrackedElementResize = { element, fromBounds, toBounds, valid: { size: true, move: true } };

        if (options.validate) {
            resize.valid.size = this.manager.hasValidSize(resize.element, resize.toBounds);
            resize.valid.move = handleMove.valid && this.manager.hasValidPosition(resize.element, resize.toBounds);
        }

        return resize;
    }

    private calculateElementBounds(
        element: ResizableModelElement,
        handleMove: TrackedHandleMove,
        options: ResizeOptions,
        symmetricHandleMove?: TrackedHandleMove
    ): Bounds {
        if (options.capAtMinimumSize) {
            const minimum = this.manager.getMinimumSize(element);
            const vector = this.capMoveVector(element.bounds, handleMove, minimum);
            let toBounds = this.calculateBounds(element.bounds, handleMove.element.location, vector);
            if (symmetricHandleMove) {
                const symmetricVector = this.capMoveVector(toBounds, symmetricHandleMove, minimum);
                toBounds = this.calculateBounds(toBounds, symmetricHandleMove.element.location, symmetricVector);
            }
            return toBounds;
        } else {
            const vector = handleMove.moveVector;
            let toBounds = this.calculateBounds(element.bounds, handleMove.element.location, vector);
            if (symmetricHandleMove) {
                toBounds = this.calculateBounds(toBounds, symmetricHandleMove.element.location, symmetricHandleMove.moveVector);
            }
            return toBounds;
        }
    }

    protected capMoveVector(src: Bounds, handleMove: TrackedHandleMove, minimum: Dimension): Vector {
        const vector = handleMove.moveVector as Writable<Vector>;
        switch (handleMove.element.location) {
            case ResizeHandleLocation.TopLeft:
                vector.x = src.width - vector.x < minimum.width ? src.width - minimum.width : vector.x;
                vector.y = src.height - vector.y < minimum.height ? src.height - minimum.height : vector.y;
                break;
            case ResizeHandleLocation.Top:
                vector.y = src.height - vector.y < minimum.height ? src.height - minimum.height : vector.y;
                break;
            case ResizeHandleLocation.TopRight:
                vector.x = src.width + vector.x < minimum.width ? minimum.width - src.width : vector.x;
                vector.y = src.height - vector.y < minimum.height ? src.height - minimum.height : vector.y;
                break;
            case ResizeHandleLocation.Right:
                vector.x = src.width + vector.x < minimum.width ? minimum.width - src.width : vector.x;
                break;
            case ResizeHandleLocation.BottomRight:
                vector.x = src.width + vector.x < minimum.width ? minimum.width - src.width : vector.x;
                vector.y = src.height + vector.y < minimum.height ? minimum.height - src.height : vector.y;
                break;
            case ResizeHandleLocation.Bottom:
                vector.y = src.height + vector.y < minimum.height ? minimum.height - src.height : vector.y;
                break;
            case ResizeHandleLocation.BottomLeft:
                vector.x = src.width - vector.x < minimum.width ? src.width - minimum.width : vector.x;
                vector.y = src.height + vector.y < minimum.height ? minimum.height - src.height : vector.y;
                break;
            case ResizeHandleLocation.Left:
                vector.x = src.width - vector.x < minimum.width ? src.width - minimum.width : vector.x;
                break;
        }
        return vector;
    }

    protected calculateBounds(src: Bounds, location: ResizeHandleLocation, vector: Vector): Writable<Bounds> {
        if (Vector.isZero(vector)) {
            return src;
        }
        switch (location) {
            case ResizeHandleLocation.TopLeft:
                return { x: src.x + vector.x, y: src.y + vector.y, width: src.width - vector.x, height: src.height - vector.y };
            case ResizeHandleLocation.Top:
                return { ...src, y: src.y + vector.y, height: src.height - vector.y };
            case ResizeHandleLocation.TopRight:
                return { ...src, y: src.y + vector.y, width: src.width + vector.x, height: src.height - vector.y };
            case ResizeHandleLocation.Right:
                return { ...src, width: src.width + vector.x };
            case ResizeHandleLocation.BottomRight:
                return { ...src, width: src.width + vector.x, height: src.height + vector.y };
            case ResizeHandleLocation.Bottom:
                return { ...src, height: src.height + vector.y };
            case ResizeHandleLocation.BottomLeft:
                return { ...src, x: src.x + vector.x, width: src.width - vector.x, height: src.height + vector.y };
            case ResizeHandleLocation.Left:
                return { ...src, x: src.x + vector.x, width: src.width - vector.x };
        }
    }

    dispose(): void {
        this.stopTracking();
    }
}

export class MoveableResizeHandle extends SResizeHandle implements Locateable {
    constructor(
        protected handle: SResizeHandle,
        override location: ResizeHandleLocation = handle.location,
        readonly position = SResizeHandle.getHandlePosition(handle.parent, location)
    ) {
        super(location, handle.type, handle.hoverFeedback);
        this.id = handle.id;
        // this only acts as a wrapper so we do not actually add this to the parent but still want the parent reference
        (this as any).parent = handle.parent;
    }

    opposite(): MoveableResizeHandle {
        return new MoveableResizeHandle(this.handle, ResizeHandleLocation.opposite(this.location));
    }
}

export class MoveableRoutingHandle extends GRoutingHandle implements Locateable {
    constructor(
        protected handle: GRoutingHandle,
        readonly position: Point
    ) {
        super();
        this.id = handle.id;
        // this only acts as a wrapper so we do not actually add this to the parent but still want the parent reference
        (this as any).parent = handle.parent;
    }
}
