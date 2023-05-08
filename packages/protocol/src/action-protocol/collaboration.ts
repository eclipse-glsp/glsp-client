import {Action} from './base-protocol';
import {hasArrayProp, hasBooleanProp, hasObjectProp, hasStringProp} from '../utils/type-util';

/********************************************************************************
 * Copyright (c) 2021-2023 STMicroelectronics and others.
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
import { AnyObject} from '../utils/type-util';
import {Bounds, Point} from 'sprotty-protocol';

export type SubclientInfo = { subclientId: string, name: string; color: string };
/**
 * TODO
 */
export interface CollaborationAction extends Action {
    /**
     * Flag has to be true so action is declared as a collaboration action which is not send to the server, only to other subclients;
     */
    collaboration: true;

    initialSubclientInfo?: SubclientInfo;

    visible: boolean;
}

export namespace CollaborationAction {
    export function is(object: any): object is CollaborationAction {
        return AnyObject.is(object)
            && hasBooleanProp(object, 'collaboration') && (object as any).collaboration
            && hasBooleanProp(object, 'visible');
    }
}

export type CollaborationActionKinds = typeof MouseMoveAction.KIND | typeof ViewportBoundsChangeAction.KIND | typeof SelectionChangeAction.KIND;

export interface MouseMoveAction extends CollaborationAction {
    kind: typeof MouseMoveAction.KIND;

    position: Point;
}

export namespace MouseMoveAction {
    export const KIND = 'mouseMove';

    export function is(object: any): object is MouseMoveAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'position');
    }

    export function create(options: { position: Point }): MouseMoveAction {
        return {
            kind: KIND,
            collaboration: true,
            visible: true,
            ...options
        };
    }
}

export interface ViewportBoundsChangeAction extends CollaborationAction {
    kind: typeof ViewportBoundsChangeAction.KIND;

    bounds: Bounds;
}

export namespace ViewportBoundsChangeAction {
    export const KIND = 'viewportBoundsChange';

    export function is(object: any): object is ViewportBoundsChangeAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'bounds');
    }

    export function create(options: { bounds: Bounds }): ViewportBoundsChangeAction {
        return {
            kind: KIND,
            collaboration: true,
            visible: true,
            ...options
        };
    }
}

export interface SelectionChangeAction extends CollaborationAction {
    kind: typeof SelectionChangeAction.KIND;

    selectedElements: string[];
}

export namespace SelectionChangeAction {
    export const KIND = 'selectionChange';

    export function is(object: any): object is SelectionChangeAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'selectedElements');
    }

    export function create(options: { selectedElements: string[] }): SelectionChangeAction {
        return {
            kind: KIND,
            collaboration: true,
            visible: true,
            ...options
        };
    }
}

export interface DisposeSubclientAction extends Action {
    kind: typeof DisposeSubclientAction.KIND;
    initialSubclientId: string;
}

export namespace DisposeSubclientAction {
    export const KIND = 'disposeSubclient';

    export function is(object: any): object is DisposeSubclientAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'initialSubclientId');
    }

    export function create(options: { initialSubclientId: string }): DisposeSubclientAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

export interface ToggleCollaborationFeatureAction extends Action {
    kind: typeof ToggleCollaborationFeatureAction.KIND;

    actionKind: CollaborationActionKinds;
}

export namespace ToggleCollaborationFeatureAction {
    export const KIND = 'toggleCollaborationFeature';

    export function is(object: any): object is ToggleCollaborationFeatureAction {
        return Action.hasKind(object, KIND)
            && hasStringProp(object, 'actionKind');
    }

    export function create(options: { actionKind: CollaborationActionKinds }): ToggleCollaborationFeatureAction {
        return {
            kind: KIND,
            ...options
        };
    }
}


