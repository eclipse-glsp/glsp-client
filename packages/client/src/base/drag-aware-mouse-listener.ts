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
import { Action, MouseListener, GModelElement } from '@eclipse-glsp/sprotty';

/**
 * A mouse listener that is aware of prior mouse dragging.
 *
 * Therefore, this listener distinguishes between mouse up events after dragging and
 * mouse up events without prior dragging. Subclasses may override the methods
 * `draggingMouseUp` and/or `nonDraggingMouseUp` to react to only these specific kinds
 * of mouse up events.
 */
export class DragAwareMouseListener extends MouseListener {
    protected _isMouseDown = false;
    protected _isMouseDrag = false;

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        this._isMouseDown = true;
        return [];
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        if (this._isMouseDown) {
            this._isMouseDrag = true;
        }
        return [];
    }

    override mouseUp(element: GModelElement, event: MouseEvent): Action[] {
        this._isMouseDown = false;
        if (this._isMouseDrag) {
            this._isMouseDrag = false;
            return this.draggingMouseUp(element, event);
        }

        return this.nonDraggingMouseUp(element, event);
    }

    nonDraggingMouseUp(element: GModelElement, event: MouseEvent): Action[] {
        return [];
    }

    draggingMouseUp(element: GModelElement, event: MouseEvent): Action[] {
        return [];
    }

    get isMouseDrag(): boolean {
        return this._isMouseDrag;
    }

    get isMouseDown(): boolean {
        return this._isMouseDown;
    }
}
