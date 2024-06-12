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
    Bounds,
    Direction,
    GChildElement,
    GModelElement,
    GParentElement,
    Hoverable,
    Point,
    hoverFeedbackFeature,
    isBoundsAware,
    isMoveable,
    isSelectable
} from '@eclipse-glsp/sprotty';
import { CursorCSS } from '../../base/feedback/css-feedback';
import { BoundsAwareModelElement, MoveableElement, ResizableModelElement } from '../../utils/gmodel-util';

export const resizeFeature = Symbol('resizeFeature');

export function isResizable(element: GModelElement): element is ResizableModelElement {
    return isBoundsAware(element) && isSelectable(element) && element instanceof GParentElement && element.hasFeature(resizeFeature);
}

// eslint-disable-next-line no-shadow
export enum ResizeHandleLocation {
    TopLeft = 'top-left',
    Top = 'top',
    TopRight = 'top-right',
    Right = 'right',
    BottomRight = 'bottom-right',
    Bottom = 'bottom',
    BottomLeft = 'bottom-left',
    Left = 'left'
}

export namespace ResizeHandleLocation {
    export const CORNERS: ResizeHandleLocation[] = [
        ResizeHandleLocation.TopLeft,
        ResizeHandleLocation.TopRight,
        ResizeHandleLocation.BottomRight,
        ResizeHandleLocation.BottomLeft
    ];
    export const CROSS: ResizeHandleLocation[] = [
        ResizeHandleLocation.Top,
        ResizeHandleLocation.Right,
        ResizeHandleLocation.Bottom,
        ResizeHandleLocation.Left
    ];
    export const ALL: ResizeHandleLocation[] = [...ResizeHandleLocation.CORNERS, ...ResizeHandleLocation.CROSS];

    export function opposite(location: ResizeHandleLocation): ResizeHandleLocation {
        switch (location) {
            case ResizeHandleLocation.TopLeft:
                return ResizeHandleLocation.BottomRight;
            case ResizeHandleLocation.Top:
                return ResizeHandleLocation.Bottom;
            case ResizeHandleLocation.TopRight:
                return ResizeHandleLocation.BottomLeft;
            case ResizeHandleLocation.Right:
                return ResizeHandleLocation.Left;
            case ResizeHandleLocation.BottomRight:
                return ResizeHandleLocation.TopLeft;
            case ResizeHandleLocation.Bottom:
                return ResizeHandleLocation.Top;
            case ResizeHandleLocation.BottomLeft:
                return ResizeHandleLocation.TopRight;
            case ResizeHandleLocation.Left:
                return ResizeHandleLocation.Right;
        }
    }

    export function direction(location: ResizeHandleLocation): Direction[] {
        switch (location) {
            case ResizeHandleLocation.TopLeft:
                return [Direction.Up, Direction.Left];
            case ResizeHandleLocation.Top:
                return [Direction.Up];
            case ResizeHandleLocation.TopRight:
                return [Direction.Up, Direction.Right];
            case ResizeHandleLocation.Right:
                return [Direction.Right];
            case ResizeHandleLocation.BottomRight:
                return [Direction.Down, Direction.Right];
            case ResizeHandleLocation.Bottom:
                return [Direction.Down];
            case ResizeHandleLocation.BottomLeft:
                return [Direction.Down, Direction.Left];
            case ResizeHandleLocation.Left:
                return [Direction.Left];
        }
    }
}

export function isBoundsAwareMoveable(element: GModelElement): element is BoundsAwareModelElement & MoveableElement {
    return isMoveable(element) && isBoundsAware(element);
}

export class GResizeHandle extends GChildElement implements Hoverable {
    static readonly TYPE = 'resize-handle';

    override readonly parent: ResizableModelElement;

    constructor(
        readonly location: ResizeHandleLocation,
        override readonly type: string = GResizeHandle.TYPE,
        readonly hoverFeedback: boolean = false
    ) {
        super();
    }

    override hasFeature(feature: symbol): boolean {
        return feature === hoverFeedbackFeature;
    }

    isNwResize(): boolean {
        return this.location === ResizeHandleLocation.TopLeft;
    }

    isNResize(): boolean {
        return this.location === ResizeHandleLocation.Top;
    }

    isNeResize(): boolean {
        return this.location === ResizeHandleLocation.TopRight;
    }

    isEResize(): boolean {
        return this.location === ResizeHandleLocation.Right;
    }

    isSeResize(): boolean {
        return this.location === ResizeHandleLocation.BottomRight;
    }

    isSResize(): boolean {
        return this.location === ResizeHandleLocation.Bottom;
    }

    isSwResize(): boolean {
        return this.location === ResizeHandleLocation.BottomLeft;
    }

    isWResize(): boolean {
        return this.location === ResizeHandleLocation.Left;
    }

    isNwSeResize(): boolean {
        return this.isNwResize() || this.isSeResize();
    }

    isNeSwResize(): boolean {
        return this.isNeResize() || this.isSwResize();
    }

    static getHandlePosition(handle: GResizeHandle): Point;
    static getHandlePosition(parent: ResizableModelElement, location: ResizeHandleLocation): Point;
    static getHandlePosition(bounds: Bounds, location: ResizeHandleLocation): Point;
    static getHandlePosition(first: ResizableModelElement | GResizeHandle | Bounds, second?: ResizeHandleLocation): Point {
        const bounds = GResizeHandle.is(first) ? first.parent.bounds : first instanceof GModelElement ? first.bounds : first;
        const location = GResizeHandle.is(first) ? first.location : second!;
        switch (location) {
            case ResizeHandleLocation.TopLeft:
                return Bounds.topLeft(bounds);
            case ResizeHandleLocation.Top:
                return Bounds.topCenter(bounds);
            case ResizeHandleLocation.TopRight:
                return Bounds.topRight(bounds);
            case ResizeHandleLocation.Right:
                return Bounds.middleRight(bounds);
            case ResizeHandleLocation.BottomRight:
                return Bounds.bottomRight(bounds);
            case ResizeHandleLocation.Bottom:
                return Bounds.bottomCenter(bounds);
            case ResizeHandleLocation.BottomLeft:
                return Bounds.bottomLeft(bounds);
            case ResizeHandleLocation.Left:
                return Bounds.middleLeft(bounds);
        }
    }

    static getCursorCss(handle: GResizeHandle): string {
        switch (handle.location) {
            case ResizeHandleLocation.TopLeft:
                return CursorCSS.RESIZE_NW;
            case ResizeHandleLocation.Top:
                return CursorCSS.RESIZE_N;
            case ResizeHandleLocation.TopRight:
                return CursorCSS.RESIZE_NE;
            case ResizeHandleLocation.Right:
                return CursorCSS.RESIZE_E;
            case ResizeHandleLocation.BottomRight:
                return CursorCSS.RESIZE_SE;
            case ResizeHandleLocation.Bottom:
                return CursorCSS.RESIZE_S;
            case ResizeHandleLocation.BottomLeft:
                return CursorCSS.RESIZE_SW;
            case ResizeHandleLocation.Left:
                return CursorCSS.RESIZE_W;
        }
    }

    static is(handle: unknown): handle is GResizeHandle {
        return typeof handle === 'object' && !!handle && 'type' in handle && handle.type === GResizeHandle.TYPE;
    }
}

export function addResizeHandles(element: ResizableModelElement, locations: ResizeHandleLocation[] = ResizeHandleLocation.CORNERS): void {
    for (const location of ResizeHandleLocation.ALL) {
        const existing = element.children.find(child => child instanceof GResizeHandle && child.location === location);
        if (locations.includes(location) && !existing) {
            // add missing handle
            element.add(new GResizeHandle(location));
        } else if (!locations.includes(location) && existing) {
            // remove existing handle
            element.remove(existing);
        }
    }
}

export function removeResizeHandles(element: GParentElement): void {
    element.removeAll(child => child instanceof GResizeHandle);
}

export {
    /** @deprecated Use {@link GResizeHandle} instead */
    GResizeHandle as SResizeHandle
};
