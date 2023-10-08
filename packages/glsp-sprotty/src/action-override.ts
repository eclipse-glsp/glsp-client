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
import { Action, LabeledAction, Point } from '@eclipse-glsp/protocol';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import {
    SButtonImpl as GButton,
    SModelElementImpl as GModelElement,
    SModelRootImpl as GModelRoot,
    ICommand,
    IActionHandler as SIActionHandler,
    IButtonHandler as SIButtonHandler,
    ICommandPaletteActionProvider as SICommandPaletteActionProvider,
    IContextMenuItemProvider as SIContextMenuItemProvider,
    KeyListener as SKeyListener,
    MouseListener as SMouseListener
} from 'sprotty';

/*
 * The GLSP-protocol comes with its own type definition for `Action`. However, sprotty
 * also has a separate `Action` definition that is heavily integrated into core API concepts.
 * While these two definitions are fully compatible it messes up IDE support for auto import
 * when implementing/overriding these API Concepts. To bypass this issue we create sub types
 * of the sprotty API concepts that use the Action definition from GLSP and export them instead.
 */

/**
 * An action handler accepts an action and reacts to it by returning either a command to be
 * executed, or another action to be dispatched.
 */
export interface IActionHandler extends SIActionHandler {
    handle(action: Action): ICommand | Action | void;
}

export interface IButtonHandler extends SIButtonHandler {
    buttonPressed(button: GButton): (Action | Promise<Action>)[];
}

export interface ICommandPaletteActionProvider extends SICommandPaletteActionProvider {
    getActions(root: Readonly<GModelRoot>, text: string, lastMousePosition?: Point, index?: number): Promise<LabeledAction[]>;
}

export interface IContextMenuItemProvider extends SIContextMenuItemProvider {
    getItems(root: Readonly<GModelRoot>, lastMousePosition?: Point): Promise<LabeledAction[]>;
}

@injectable()
export class KeyListener extends SKeyListener {
    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        return [];
    }

    override keyUp(element: GModelElement, event: KeyboardEvent): Action[] {
        return [];
    }
}

@injectable()
export class MouseListener extends SMouseListener {
    override mouseOver(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override mouseOut(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override mouseEnter(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override mouseLeave(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override mouseDown(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override mouseMove(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override mouseUp(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override wheel(target: GModelElement, event: WheelEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override doubleClick(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override contextMenu(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override dragOver(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override drop(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    override decorate(vnode: VNode, element: GModelElement): VNode {
        return vnode;
    }
}
