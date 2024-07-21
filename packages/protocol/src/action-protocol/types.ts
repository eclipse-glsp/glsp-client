/********************************************************************************
 * Copyright (c) 2021-2024 STMicroelectronics and others.
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
import { GModelElementSchema } from '../model/model-schema';
import { AnyObject, hasArrayProp, hasStringProp } from '../utils/type-util';
import { Action } from './base-protocol';
import { TriggerEdgeCreationAction, TriggerNodeCreationAction } from './tool-palette';
// A collection of convenience and utility types that are used in the GLSP action protocol.

/**
 * A key-value pair structure for primitive typed custom arguments.
 */
export interface Args {
    [key: string]: sprotty.JsonPrimitive;
}

/**
 * The template for a model element, i.e., either a reference to an existing element by element id or an element schema.
 */
export type ElementTemplate = string | GModelElementSchema;

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
 * Data provided by the layouter.
 */
export interface LayoutData {
    /**
     * The computed minimum size of the element.
     */
    computedDimensions?: Dimension;
}

/**
 * The `ElementAndLayoutData` type is used to associate new layout data with a model element, which is referenced via its id.
 */
export interface ElementAndLayoutData {
    /**
     * The identifier of the element.
     */
    elementId: string;
    /**
     * The data provided by the layouter.
     */
    layoutData: LayoutData;
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
    export function is(object: unknown): object is EditorContext {
        return AnyObject.is(object) && hasArrayProp(object, 'selectedElementIds');
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
    export function is(object: unknown): object is LabeledAction {
        return AnyObject.is(object) && hasStringProp(object, 'label') && hasArrayProp(object, 'actions');
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

/**
 * A special {@link LabeledAction} that is used to denote actions that should be triggered when the user
 * click a tool palette item (e.g. a button to create a new node).,
 */
export interface PaletteItem extends LabeledAction {
    /** Technical id of the palette item. */
    readonly id: string;
    /** String indicating the order. */
    readonly sortString: string;
    /** Children of this item. If this item has children, the client will know to render them as sub group. */
    readonly children?: PaletteItem[];
}

export namespace PaletteItem {
    export function is(object: unknown): object is PaletteItem {
        return LabeledAction.is(object) && hasStringProp(object, 'id') && hasStringProp(object, 'sortString');
    }

    export function getTriggerAction(item?: PaletteItem): TriggerElementCreationAction | undefined {
        if (item) {
            const initialActions = item.actions
                .filter(a => isTriggerElementCreationAction(a))
                .map(action => action as TriggerElementCreationAction);
            return initialActions.length > 0 ? initialActions[0] : undefined;
        }
        return undefined;
    }

    export type TriggerElementCreationAction = TriggerEdgeCreationAction | TriggerNodeCreationAction;

    export function isTriggerElementCreationAction(object: unknown): object is TriggerElementCreationAction {
        return TriggerNodeCreationAction.is(object) || TriggerEdgeCreationAction.is(object);
    }
}

/**
 * A special {@link LabeledAction} that is used to denote items in a menu.
 */
export interface MenuItem extends LabeledAction {
    /** Technical id of the menu item. */
    readonly id: string;
    /** String indicating the order. */
    readonly sortString?: string;
    /** String indicating the grouping (separators). Items with equal group will be in the same group. */
    readonly group?: string;
    /**
     * The optional parent id can be used to add this element as a child of another element provided by another menu provider.
     * The `parentId` must be fully qualified in the form of `a.b.c`, whereas `a`, `b` and `c` are referring to the IDs of other elements.
     * Note that this attribute will only be considered for root items of a provider and not for children of provided items.
     */
    readonly parentId?: string;
    /** Function determining whether the element is enabled. */
    readonly isEnabled?: () => boolean;
    /** Function determining whether the element is visible. */
    readonly isVisible?: () => boolean;
    /** Function determining whether the element is toggled on or off. */
    readonly isToggled?: () => boolean;
    /** Children of this item. If this item has children, they will be added into a submenu of this item. */
    children?: MenuItem[];
}

export namespace MenuItem {
    export function is(object: unknown): object is MenuItem {
        return LabeledAction.is(object) && hasStringProp(object, 'id');
    }
}
