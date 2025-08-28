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
import { Action, Event, LabeledAction, Point, RequestAction, ResponseAction } from '@eclipse-glsp/protocol';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import {
    SButtonImpl as GButton,
    SModelElementImpl as GModelElement,
    SModelRootImpl as GModelRoot,
    ICommand,
    IActionDispatcher as SIActionDispatcher,
    IActionHandler as SIActionHandler,
    IButtonHandler as SIButtonHandler,
    ICommandPaletteActionProvider as SICommandPaletteActionProvider,
    ICommandStack as SICommandStack,
    IContextMenuItemProvider as SIContextMenuItemProvider,
    IVNodePostprocessor as SIVNodePostprocessor,
    KeyListener as SKeyListener,
    MouseListener as SMouseListener
} from 'sprotty';

/*
 * The GLSP-protocol comes with its own type definition for `Action`. However, sprotty
 * also has a separate `Action` definition that is heavily integrated into core API concepts.
 * While these two definitions are fully compatible it messes up IDE support for auto import.
 * The same problem also applies  to references of sprotty's internal SModel in the API.
 * To bypass this issue we create sub types of the sprotty API concepts that use the Action/GModel definition from GLSP
 * and export them instead.
 *
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
/**
 * Manipulates a created VNode after it has been created.
 * Used to register listeners and add animations.
 */
export interface IVNodePostprocessor extends SIVNodePostprocessor {
    decorate(vnode: VNode, element: GModelElement): VNode;
}

export interface IActionDispatcher extends SIActionDispatcher {
    /**
     * Optional method to initialize the action dispatcher.
     * Implementation can use this as a hook to perform any initialization tasks,
     * like registering action handlers or setting up the initial diagram.
     * Called by the `DiagramLoader` when starting the loading process.
     */
    initialize?(): Promise<void>;
    /**
     * Dispatch an action by querying all handlers that are registered for its kind.
     * The returned promise is resolved when all handler results (commands or actions)
     * have been processed.
     */
    dispatch(action: Action): Promise<void>;
    /**
     * Calls `dispatch` on every action in the given array. The returned promise
     * is resolved when the promises of all `dispatch` calls have been resolved.
     */
    dispatchAll(actions: Action[]): Promise<void>;
    /**
     * Dispatch a request. The returned promise is resolved when a response with matching
     * identifier is dispatched. That response is _not_ passed to the registered action
     * handlers. Instead, it is the responsibility of the caller of this method to handle
     * the response properly. For example, it can be sent to the registered handlers by
     * passing it to the `dispatch` method.
     *
     * If no explicit `requestId` has been set on the action, a generated id will be set before dispatching the action.
     */
    request<Res extends ResponseAction>(action: RequestAction<Res>): Promise<Res>;
    // GLSP-specific API additions
    /**
     * Dispatch a request and waits for a response until the timeout given in `timeoutMs` (default 2000) has
     * been reached. The returned promise is resolved when a response with matching identifier
     * is dispatched or when the timeout has been reached. That response is _not_ passed to the
     * registered action handlers. Instead, it is the responsibility of the caller of this method
     * to handle the response properly. For example, it can be sent to the registered handlers by
     * passing it again to the `dispatch` method.
     * If `rejectOnTimeout` is set to false (default) the returned promise will be resolved with
     * no value, otherwise it will be rejected.
     */
    requestUntil<Res extends ResponseAction>(
        action: RequestAction<Res>,
        timeoutMs?: number,
        rejectOnTimeout?: boolean
    ): Promise<Res | undefined>;
    /**
     * Processes all given actions, by dispatching them to the corresponding handlers, after the model initialization is completed.
     */
    dispatchOnceModelInitialized(...actions: Action[]): void;

    /**
     * Returns a promise that resolves once the model initialization is completed.
     */
    onceModelInitialized(): Promise<void>;

    /**
     * Processes all given actions, by dispatching them to the corresponding handlers, after the next model update.
     * The given actions are queued until the next model update cycle has been completed i.e.
     * the `EditorContextService.onModelRootChanged` event is triggered.
     */
    dispatchAfterNextUpdate(...actions: Action[]): void;
}

export type IActionDispatcherProvider = () => Promise<IActionDispatcher>;

/**
 * Data structure that is passed to the `onCommandExecuted` event.
 */
export interface CommandExecutionData {
    /** The command that has been executed successfully */
    command: ICommand;
    /** The new model root after the command execution */
    newRoot: GModelRoot;
}

export interface ICommandStack extends SICommandStack {
    /**
     * Executes the given command on the current model and returns a
     * Promise for the new result.
     *
     * Unless it is a special command, it is pushed to the undo stack
     * such that it can be rolled back later and the redo stack is
     * cleared.
     */
    execute(command: ICommand): Promise<GModelRoot>;

    /**
     * Executes all of the given commands. As opposed to calling
     * execute() multiple times, the Viewer is only updated once after
     * the last command has been executed.
     */
    executeAll(commands: ICommand[]): Promise<GModelRoot>;

    /**
     * Client-side undo/redo is not supported in GLSP. The server is responsible for handling undo/redo requests.
     * This method is required to maintain compatibility with the sprotty API.
     * Implementation should always be a no-op that returns the current model.
     */
    undo(): Promise<GModelRoot>;

    /**
     * Client-side undo/redo is not supported in GLSP. The server is responsible for handling undo/redo requests.
     * This method is required to maintain compatibility with the sprotty API.
     * Implementation should always be a no-op that returns the current model.
     */
    redo(): Promise<GModelRoot>;

    /**
     * Event fired after a command has been successfully executed on the stack. (i.e. after the model has been updated).
     */
    onCommandExecuted: Event<CommandExecutionData>;
}

/**
 * As part of the event cylce, the ICommandStack should be injected
 * using a provider to avoid cyclic injection dependencies.
 */
export type CommandStackProvider = () => Promise<ICommandStack>;
