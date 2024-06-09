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
    hasObjectProp,
    isBoundsAware,
    isMoveable
} from '@eclipse-glsp/sprotty';
import { BoundsAwareModelElement, MoveableElement, ResizableModelElement, getElements } from '../../../utils/gmodel-util';
import { GResizeHandle, ResizeHandleLocation } from '../../change-bounds/model';
import { DiagramMovementCalculator } from '../../change-bounds/tracker';
import { ChangeBoundsManager } from './change-bounds-manager';

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
    sourceVector: Vector;
    valid: boolean;
}

export namespace TrackedElementMove {
    export function is(obj: any): obj is TrackedElementMove {
        return (
            hasObjectProp(obj, 'element') &&
            hasObjectProp(obj, 'fromPosition') &&
            hasObjectProp(obj, 'toPosition') &&
            hasBooleanProp(obj, 'valid')
        );
    }
}

export type TypedElementMove<T extends MoveableElement> = TrackedElementMove & { element: T };

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
     * Avoids resizes smaller than the minimum size which will result in invalid sizes.
     * Please note that the snapping will be applied before the constraining so an element may still be resized to an unsnapped size.
     *
     * Default: true.
     */
    constrainResize: boolean;

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

    constrainResize: true,

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

export namespace TrackedElementResize {
    export function is(obj: any): obj is TrackedElementResize {
        return (
            isBoundsAware(obj.element) && hasObjectProp(obj, 'fromBounds') && hasObjectProp(obj, 'toBounds') && hasObjectProp(obj, 'valid')
        );
    }
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

        if (Vector.isZero(update.vector) && options.skipStatic) {
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
        const move: TypedElementMove<T> = { element, fromPosition, toPosition, valid: true, moveVector: vector, sourceVector: vector };

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

    resizeElements(handle: GResizeHandle, opts?: Partial<ResizeOptions>): TrackedResize {
        const options = this.resolveResizeOptions(opts);
        const update = this.calculateDiagramMovement();
        const handleMove = this.calculateHandleMove(new MoveableResizeHandle(handle), update.vector, options);
        const resize: TrackedResize = { ...update, valid: { move: true, size: true }, options, handleMove, elementResizes: [] };
        if (Vector.isZero(handleMove.moveVector) && options.skipStatic) {
            // no movement detected so elements won't be moved, exit early
            return resize;
        }

        // calculate resize for each element (typically only one element is resized at a time but customizations are possible)
        const elementsToResize = this.getResizableElements(handle, options);
        for (const element of elementsToResize) {
            const elementResize = this.calculateElementResize(element, handleMove, options);
            if (!this.skipElementResize(elementResize, options)) {
                resize.elementResizes.push(elementResize);
                resize.valid.move = resize.valid.move && elementResize.valid.move;
                resize.valid.size = resize.valid.size && elementResize.valid.size;
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

    protected getResizableElements(handle: GResizeHandle, options: ResizeOptions): ResizableModelElement[] {
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
        options: ResizeOptions
    ): TrackedElementResize {
        const fromBounds = element.bounds;
        const toBounds = this.calculateElementBounds(element, handleMove, options);
        const resize: TrackedElementResize = { element, fromBounds, toBounds, valid: { size: true, move: true } };

        if (options.validate) {
            resize.valid.size = this.manager.hasValidSize(resize.element, resize.toBounds);
            resize.valid.move = handleMove.valid && this.manager.hasValidPosition(resize.element, resize.toBounds);
        }

        return resize;
    }

    protected calculateElementBounds(element: ResizableModelElement, handleMove: TrackedHandleMove, options: ResizeOptions): Bounds {
        let toBounds = this.calculateBounds(element.bounds, handleMove);
        if (options.symmetric) {
            const symmetricHandleMove = this.calculateSymmetricHandleMove(handleMove, options);
            toBounds = this.calculateBounds(toBounds, symmetricHandleMove);
        }
        if (!options.constrainResize || this.manager.hasValidSize(element, toBounds)) {
            return toBounds;
        }

        // we need to adjust to the minimum size but it is not enough to simply set the size
        // we need to make sure that the element is still at the expected position
        // we therefore constrain the movement vector to actually avoid going below the minimum size
        const minimum = this.manager.getMinimumSize(element);
        handleMove.moveVector = this.constrainResizeVector(element.bounds, handleMove, minimum);
        if (options.symmetric) {
            // if we have symmetric resize we want to distribute the constrained movement vector to both sides
            // but only for the dimension that was actually resized beyond the minimum
            handleMove.moveVector.x = element.bounds.width > minimum.width ? handleMove.moveVector.x / 2 : handleMove.moveVector.x;
            handleMove.moveVector.y = element.bounds.height > minimum.height ? handleMove.moveVector.y / 2 : handleMove.moveVector.y;
        }
        toBounds = this.calculateBounds(element.bounds, handleMove);
        if (options.symmetric) {
            // since we already distributed the available movement vector, we do not want to snap the symmetric handle move
            const symmetricHandleMove = this.calculateSymmetricHandleMove(handleMove, { ...options, snap: false });
            toBounds = this.calculateBounds(toBounds, symmetricHandleMove);
        }
        return toBounds;
    }

    protected calculateSymmetricHandleMove(handleMove: TrackedHandleMove, options: ResizeOptions): TrackedHandleMove {
        const moveOptions = this.resolveMoveOptions({ ...options, validate: false, restrict: false });
        return this.calculateElementMove(handleMove.element.opposite(), Vector.reverse(handleMove.moveVector), moveOptions);
    }

    protected calculateBounds(src: Readonly<Bounds>, handleMove?: TrackedHandleMove): Bounds {
        if (!handleMove || Vector.isZero(handleMove.moveVector)) {
            return src;
        }
        return this.doCalculateBounds(src, handleMove.moveVector, handleMove.element.location);
    }

    protected doCalculateBounds(src: Readonly<Bounds>, vector: Vector, location: ResizeHandleLocation): Bounds {
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

    protected constrainResizeVector(src: Readonly<Bounds>, handleMove: TrackedHandleMove, minimum: Dimension): Vector {
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

    dispose(): void {
        this.stopTracking();
    }
}

export class MoveableResizeHandle extends GResizeHandle implements Locateable {
    constructor(
        protected handle: GResizeHandle,
        override location: ResizeHandleLocation = handle.location,
        readonly position = GResizeHandle.getHandlePosition(handle.parent, location)
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
