/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { JsonPrimitive } from 'sprotty-protocol';
import { AnyObject, hasArrayProp, hasObjectProp, hasStringProp } from '../utils/type-util';
import { Action, RequestAction, ResponseAction } from './base-protocol';
import { Args, EditorContext } from './types';

/**
 * A `NavigationTarget` identifies the object we want to navigate to via its uri and may further provide a label to display to the user.
 * The corresponding namespace offers a set of utility function to interact with `NavigationTargets`.
 */
export interface NavigationTarget {
    /**
     * URI to identify the object we want to navigate to.
     */
    uri: string;

    /**
     * Optional label to display to the user.
     */
    label?: string;

    /**
     * Domain-specific arguments that may be interpreted directly or resolved further.
     */
    args?: Args;
}

export namespace NavigationTarget {
    export function is(object: unknown): object is NavigationTarget {
        return AnyObject.is(object) && hasStringProp(object, 'uri');
    }
    /**
     *  Generic key to store element ids as additional argument
     */
    export const ELEMENT_IDS = 'elementIds';
    /**
     * The separator that is used to store he values for the {@link ELEMENT_IDS} as a single string.
     */
    export const ELEMENT_IDS_SEPARATOR = '&';
    /**
     *  Generic key ot store the line property of a {@link TextPosition} as additional argument.
     */
    export const TEXT_LINE = 'line';
    /**
     *  Generic key ot store the character property of a {@link TextPosition} as additional argument.
     */
    export const TEXT_COLUMN = 'column';

    /**
     * Denotes the position of the cursor in a text element.
     */
    export interface TextPosition {
        line: number;
        /**
         * The character number within the line. Also refereed to as column.
         */
        character: number;
    }

    /**
     * Utility function to check wether the given {@link NavigationTarget} has additional arguments defined.
     * @param target The navigation target to check.
     * @returns `true` if the navigation target has a non-empty `args` property, `false`
     */
    export function hasArguments(target: NavigationTarget): boolean {
        return target.args !== undefined && Object.keys(target.args).length > 0;
    }

    /**
     * Adds a new key-value pair to the additional arguments of the given {@link NavigationTarget}.
     * @param target The navigation target.
     * @param key The key of the new argument.
     * @param value The (primitive) value of the new argument.
     */
    export function addArgument(target: NavigationTarget, key: string, value: JsonPrimitive): void {
        if (!target.args) {
            target.args = {};
        }
        target.args[key] = value;
    }

    /**
     * Retrieves the element ids that have been stored with the generic {@link ELEMENT_IDS} key from the args of the
     * given target.
     * @param target The navigation target.
     * @returns An array with the parsed element ids. The array is empty if no {@link ELEMENT_IDS} key is present in the args
     * of the navigation target.
     */
    export function getElementIds(target: NavigationTarget): string[] {
        if (!target?.args?.[ELEMENT_IDS]) {
            return [];
        }
        const elementIdsValue = target.args[ELEMENT_IDS].toString();
        return elementIdsValue.split(ELEMENT_IDS_SEPARATOR);
    }

    /**
     * Stores the given element ids in the given {@link NavigationTarget} as additional arguments using the generic {@link ELEMENT_IDS} key.
     * @param target The navigation target.
     * @param elementIds The element ids that should be stored.
     * @returns the value of the {@link ELEMENT_IDS} key after storing the given element ids.
     */
    export function setElementIds(target: NavigationTarget, ...elementIds: string[]): string {
        if (target.args === undefined) {
            target.args = {};
        }
        return (target.args[ELEMENT_IDS] = elementIds.join(ELEMENT_IDS_SEPARATOR));
    }

    /**
     * Stores the given {@link TextPosition} in the given {@link NavigationTarget} as additional arguments using
     * the generic {@link TEXT_LINE} & {@link TEXT_COLUMN} keys.
     * @param target The navigation target.
     * @param position The text position that should be stored.
     */
    export function setTextPosition(target: NavigationTarget, position: TextPosition | undefined): void {
        if (position) {
            if (target.args === undefined) {
                target.args = {};
            }
            target.args[TEXT_LINE] = position.line;
            target.args[TEXT_COLUMN] = position.character;
        }
    }

    /**
     * Retrieves the {@link TextPosition} that have been stored with the generic {@link TEXT_LINE} & {@link TEXT_COLUMN} keys
     * from the args of the given target.
     * @param target The navigation target.
     * @returns The parsed text position or `undefined` if one of the generic text keys is not present in the args
     * of the navigation target.
     */
    export function getTextPosition(target: NavigationTarget): TextPosition | undefined {
        if (!target.args || !target.args[TEXT_LINE] || !target.args[TEXT_COLUMN]) {
            return undefined;
        }
        return {
            line: Number(target.args[TEXT_LINE]),
            character: Number(target.args[TEXT_COLUMN])
        };
    }
}

/**
 * Action that is usually sent from the client to the server to request navigation targets for a specific navigation type such as
 * `documentation` or `implementation` in the given editor context.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestNavigationTargetsActions`.
 */
export interface RequestNavigationTargetsAction extends RequestAction<SetNavigationTargetsAction> {
    kind: typeof RequestNavigationTargetsAction.KIND;

    /**
     * Identifier of the type of navigation targets we want to retrieve, e.g., 'documentation', 'implementation', etc.
     */
    targetTypeId: string;

    editorContext: EditorContext;
}

export namespace RequestNavigationTargetsAction {
    export const KIND = 'requestNavigationTargets';

    export function is(object: unknown): object is RequestNavigationTargetsAction {
        return RequestAction.hasKind(object, KIND) && hasStringProp(object, 'targetTypeId') && hasObjectProp(object, 'editorContext');
    }

    export function create(options: {
        targetTypeId: string;
        editorContext: EditorContext;
        requestId?: string;
    }): RequestNavigationTargetsAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/**
 * Response action from the server following a {@link RequestNavigationTargetsAction}. It contains all available navigation targets for the
 * queried target type in the provided editor context. The server may also provide additional information using the arguments, e.g.,
 * warnings, that can be interpreted by the client.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetNavigationTargetsActions`.
 */
export interface SetNavigationTargetsAction extends ResponseAction {
    kind: typeof SetNavigationTargetsAction.KIND;

    targets: NavigationTarget[];

    /**
     * Custom arguments that may be interpreted by the client.
     */
    args?: Args;
}

export namespace SetNavigationTargetsAction {
    export const KIND = 'setNavigationTargets';

    export function is(object: unknown): object is SetNavigationTargetsAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'targets');
    }

    export function create(targets: NavigationTarget[], options: { args?: Args; responseId?: string } = {}): SetNavigationTargetsAction {
        return {
            kind: KIND,
            responseId: '',
            targets,
            ...options
        };
    }
}

/**
 * Action that triggers the navigation to a particular navigation target, such as element IDs, queries, etc..
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `NavigateToTargetActions`.
 */
export interface NavigateToTargetAction extends Action {
    kind: typeof NavigateToTargetAction.KIND;

    target: NavigationTarget;
}

export namespace NavigateToTargetAction {
    export const KIND = 'navigateToTarget';

    export function is(object: unknown): object is NavigateToTargetAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'target');
    }

    export function create(target: NavigationTarget): NavigateToTargetAction {
        return {
            kind: KIND,
            target
        };
    }
}

/**
 * If a client cannot navigate to a target directly, a {@link ResolveNavigationTargetAction} may be sent to the server to resolve the
 * navigation target to one or more model elements. This may be useful in cases where the resolution of each target is expensive or the
 * client architecture requires an indirection.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ResolveNavigationTargetActions`.
 */
export interface ResolveNavigationTargetAction extends RequestAction<SetResolvedNavigationTargetAction> {
    kind: typeof ResolveNavigationTargetAction.KIND;

    /**
     * The navigation target to resolve.
     */
    navigationTarget: NavigationTarget;
}

export namespace ResolveNavigationTargetAction {
    export const KIND = 'resolveNavigationTarget';

    export function is(object: unknown): object is ResolveNavigationTargetAction {
        return RequestAction.hasKind(object, KIND) && hasObjectProp(object, 'navigationTarget');
    }

    export function create(navigationTarget: NavigationTarget, options: { requestId?: string } = {}): ResolveNavigationTargetAction {
        return {
            kind: KIND,
            requestId: '',
            navigationTarget,
            ...options
        };
    }
}

/**
 * An action sent from the server in response to a {@link ResolveNavigationTargetAction}. The response contains the resolved element ids
 * for the given target and may contain additional information in the args property.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetResolvedNavigationTargetActions`.
 */
export interface SetResolvedNavigationTargetAction extends ResponseAction {
    kind: typeof SetResolvedNavigationTargetAction.KIND;

    /**
     * The element ids of the resolved navigation target.
     */
    elementIds: string[];

    /**
     * Custom arguments that may be interpreted by the client.
     */
    args?: Args;
}

export namespace SetResolvedNavigationTargetAction {
    export const KIND = 'setResolvedNavigationTarget';

    export function is(object: unknown): object is SetResolvedNavigationTargetAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'elementIds');
    }

    export function create(elementIds: string[], options: { args?: Args; responseId?: string } = {}): SetResolvedNavigationTargetAction {
        return {
            kind: KIND,
            responseId: '',
            elementIds,
            ...options
        };
    }
}

/**
 * If a {@link NavigationTarget} cannot be resolved or the resolved target is something that is not part of our source model, e.g.,
 * a separate documentation file, a {@link NavigateToExternalTargetAction} may be sent. Since the target it outside of the model scope such
 * an action would be typically handled by an integration layer (such as the surrounding IDE).
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `NavigateToExternalTargetActions`.
 */
export interface NavigateToExternalTargetAction extends Action {
    kind: typeof NavigateToExternalTargetAction.KIND;

    /**
     * The diagram-external target to which the client shall navigate.
     */
    target: NavigationTarget;
}

export namespace NavigateToExternalTargetAction {
    export const KIND = 'navigateToExternalTarget';

    export function is(object: unknown): object is NavigateToExternalTargetAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'target');
    }

    export function create(target: NavigationTarget): NavigateToExternalTargetAction {
        return {
            kind: KIND,
            target
        };
    }
}
