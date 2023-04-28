import {Action} from './base-protocol';
import {hasBooleanProp, hasObjectProp} from '../utils/type-util';

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
}

export namespace CollaborationAction {
    export function is(object: any): object is CollaborationAction {
        return AnyObject.is(object) && hasBooleanProp(object, 'collaboration') && (object as any).collaboration;
    }
    /**
     * Typeguard function to check wether the given object is an {@link Action} with the given `kind`.
     * @param object The object to check.
     * @param kind  The expected action kind.
     * @returns A type literal indicating wether the given object is an action with the given kind.
     */
    export function hasKind(object: any, kind: string): object is Action {
        return Action.is(object) && object.kind === kind;
    }
}

export interface DisposeSubclientAction extends CollaborationAction {
    kind: typeof DisposeSubclientAction.KIND;
}

export namespace DisposeSubclientAction {
    export const KIND = 'disposeSubclient';

    export function is(object: any): object is MouseMoveAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): DisposeSubclientAction {
        return {
            kind: KIND,
            collaboration: true
        };
    }
}

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
            ...options
        };
    }
}
