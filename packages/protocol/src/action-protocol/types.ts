/********************************************************************************
 * Copyright (c) 2021-2022 STMicroelectronics and others.
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
import * as sprotty from 'sprotty-protocol';
import { Dimension, Point } from 'sprotty-protocol';
import { hasArrayProp, hasStringProp } from '../utils/type-util';
import { Action } from './base-protocol';
// A collection of convenience and utility types that are used in the GLSP action protocol.

/**
 * A key-value pair structure for primitive typed custom arguments.
 */
export interface Args {
    [key: string]: sprotty.JsonPrimitive;
}

/**
 * The ElementAndBounds type is used to associate new bounds with a model element, which is referenced via its id.
 */
export interface ElementAndBounds extends sprotty.ElementAndBounds {
    /**
     * The identifier of the element.
     */
    elementId: string;
    /**
     * The new size of the element.
     */
    newSize: Dimension;
    /**
     * The new position of the element.
     */
    newPosition?: Point;
}

/**
 * The `ElementAndAlignment` type is used to associate a new alignment with a model element, which is referenced via its id.
 * Typically used to align label relative to their parent element.
 */
export interface ElementAndAlignment extends sprotty.ElementAndAlignment {
    /**
     * The identifier of the element.
     */
    elementId: string;
    /**
     * The new alignment of the element.
     */
    newAlignment: Point;
}

/**
 * The `ElementAndRoutingPoints` type is used to associate an edge with specific routing points.
 */
export interface ElementAndRoutingPoints {
    /**
     * The identifier of an element.
     */
    elementId: string;

    /**
     * The new list of routing points.
     */
    newRoutingPoints?: Point[];
}

/**
 * The `EditorContext` may be used to represent the current state of the editor for particular actions.
 * It encompasses the last recorded mouse position, the list of selected elements, and may contain
 * custom arguments to encode additional state information.
 */
export interface EditorContext {
    /**
     * The list of selected element identifiers.
     */
    readonly selectedElementIds: string[];

    /**
     * The last recorded mouse position.
     */
    readonly lastMousePosition?: Point;

    /**
     * Custom arguments.
     */
    readonly args?: Args;
}

export namespace EditorContext {
    export function is(object: any): object is EditorContext {
        return object !== undefined && hasArrayProp(object, 'selectedElementIds');
    }
}
/**
 * Labeled actions are used to denote a group of actions in a user-interface context, e.g., to define an entry in the command palette or
 * in the context menu.
 * The corresponding namespace offers a helper function for type guard checks.
 */
export interface LabeledAction {
    /**
     * Group label.
     */
    label: string;

    /**
     * Actions in the group.
     */
    actions: Action[];
    /**
     * Optional group icon.
     */
    icon?: string;
}

export namespace LabeledAction {
    export function is(object: any): object is LabeledAction {
        return Action.is(object) && hasStringProp(object, 'label') && hasArrayProp(object, 'array');
    }

    export function toActionArray(input: LabeledAction | Action[] | Action): Action[] {
        if (Array.isArray(input)) {
            return input;
        } else if (LabeledAction.is(input)) {
            return input.actions;
        }
        return [input];
    }
}
