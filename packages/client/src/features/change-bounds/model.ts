/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    BoundsAware,
    GChildElement,
    GModelElement,
    GParentElement,
    Hoverable,
    Locateable,
    Selectable,
    hoverFeedbackFeature,
    isBoundsAware,
    isMoveable,
    isSelectable
} from '@eclipse-glsp/sprotty';
import { ensureArgs, hasArgs } from '../../base/args-feature';
import { ARG_HAS_HIDDEN_BBOX_ELEMENT } from '../bounds/glsp-hidden-bounds-updater';

export const resizeFeature = Symbol('resizeFeature');

export interface Resizable extends BoundsAware, Selectable {}

export function isResizable(element: GModelElement): element is GParentElement & Resizable {
    return isBoundsAware(element) && isSelectable(element) && element instanceof GParentElement && element.hasFeature(resizeFeature);
}

// eslint-disable-next-line no-shadow
export enum ResizeHandleLocation {
    TopLeft = 'top-left',
    TopRight = 'top-right',
    BottomLeft = 'bottom-left',
    BottomRight = 'bottom-right'
}

export function isBoundsAwareMoveable(element: GModelElement): element is GModelElement & Locateable & BoundsAware {
    return isMoveable(element) && isBoundsAware(element);
}

export class SResizeHandle extends GChildElement implements Hoverable {
    static readonly TYPE = 'resize-handle';

    constructor(
        readonly location?: ResizeHandleLocation,
        override readonly type: string = SResizeHandle.TYPE,
        readonly hoverFeedback: boolean = false
    ) {
        super();
    }

    override hasFeature(feature: symbol): boolean {
        return feature === hoverFeedbackFeature;
    }

    isNwSeResize(): boolean {
        return this.location === ResizeHandleLocation.TopLeft || this.location === ResizeHandleLocation.BottomRight;
    }

    isNeSwResize(): boolean {
        return this.location === ResizeHandleLocation.TopRight || this.location === ResizeHandleLocation.BottomLeft;
    }
}

export function addResizeHandles(element: GParentElement): void {
    removeResizeHandles(element);
    if (ensureArgs(element)) {
        element.args[ARG_HAS_HIDDEN_BBOX_ELEMENT] = true;
    }
    element.add(new SResizeHandle(ResizeHandleLocation.TopLeft));
    element.add(new SResizeHandle(ResizeHandleLocation.TopRight));
    element.add(new SResizeHandle(ResizeHandleLocation.BottomLeft));
    element.add(new SResizeHandle(ResizeHandleLocation.BottomRight));
}

export function removeResizeHandles(element: GParentElement): void {
    if (hasArgs(element)) {
        delete element.args[ARG_HAS_HIDDEN_BBOX_ELEMENT];
    }
    element.removeAll(child => child instanceof SResizeHandle);
}
