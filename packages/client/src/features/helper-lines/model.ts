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

import { Args, Bounds, Direction, GChildElement, GModelElement, GShapeElement, Point, Vector } from '@eclipse-glsp/sprotty';
import { v4 as uuid } from 'uuid';
import { ArgsAware } from '../../base/args-feature';
import { ResizeHandleLocation } from '../change-bounds/model';

export const HelperLineType = {
    Left: 'left',
    Right: 'right',
    Center: 'center',
    Top: 'top',
    Bottom: 'bottom',
    Middle: 'middle',
    LeftRight: 'left-right',
    RightLeft: 'right-left',
    BottomTop: 'bottom-top',
    TopBottom: 'top-bottom'
} as const;

// allow any string to be set as helper line type to support customization
export type HelperLineType = (typeof HelperLineType)[keyof typeof HelperLineType] | string;

export const HELPER_LINE = 'helper-line';

export class HelperLine extends GChildElement implements ArgsAware {
    args?: Args;

    constructor(
        readonly startPoint = Point.ORIGIN,
        readonly endPoint = Point.ORIGIN,
        readonly lineType: HelperLineType = HelperLineType.Left
    ) {
        super();
        this.id = uuid();
        this.type = HELPER_LINE;
    }

    get isLeft(): boolean {
        return this.lineType === HelperLineType.Left || this.lineType === HelperLineType.LeftRight;
    }

    get isRight(): boolean {
        return this.lineType === HelperLineType.Right || this.lineType === HelperLineType.RightLeft;
    }

    get isTop(): boolean {
        return this.lineType === HelperLineType.Top || this.lineType === HelperLineType.TopBottom;
    }

    get isBottom(): boolean {
        return this.lineType === HelperLineType.Bottom || this.lineType === HelperLineType.BottomTop;
    }

    get isMiddle(): boolean {
        return this.lineType === HelperLineType.Middle;
    }

    get isCenter(): boolean {
        return this.lineType === HelperLineType.Center;
    }
}

export function isHelperLine(element: GModelElement): element is HelperLine {
    return element.type === HELPER_LINE;
}

export const SELECTION_BOUNDS = 'selection-bounds';

export class SelectionBounds extends GShapeElement implements ArgsAware {
    args?: Args;

    constructor(bounds?: Bounds) {
        super();
        this.id = uuid();
        this.type = SELECTION_BOUNDS;
        if (bounds) {
            this.bounds = bounds;
        }
    }
}

export function isSelectionBounds(element: GModelElement): element is SelectionBounds {
    return element.type === SELECTION_BOUNDS;
}

// kept for backwards compatibility after moving the definition
export const getDirectionOf = Vector.direction;

export function getDirectionFrom(resize?: ResizeHandleLocation): Direction[] {
    if (resize === ResizeHandleLocation.TopLeft) {
        return [Direction.Up, Direction.Left];
    }
    if (resize === ResizeHandleLocation.TopRight) {
        return [Direction.Up, Direction.Right];
    }
    if (resize === ResizeHandleLocation.BottomLeft) {
        return [Direction.Down, Direction.Left];
    }
    if (resize === ResizeHandleLocation.BottomRight) {
        return [Direction.Down, Direction.Right];
    }
    return [];
}

// re-export for backwards compatibility after moving the definition
export { Direction } from '@eclipse-glsp/sprotty';
