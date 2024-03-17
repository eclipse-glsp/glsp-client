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

import { hasStringProp } from '../utils/type-util';
import { Action } from './base-protocol';
import { Args, ElementTemplate } from './types';

/**
 * A ghost element describes an element that may be rendered as a schematic visualization of an element that may be inserted
 * during creation.
 */
export interface GhostElement {
    template: ElementTemplate;
    dynamic?: boolean;
}

/**
 * Triggers the enablement of the tool that is responsible for creating nodes and initializes it with the creation of nodes of the given
 * `elementTypeId`.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `TriggerNodeCreationActions`.
 */
export interface TriggerNodeCreationAction extends Action {
    kind: typeof TriggerNodeCreationAction.KIND;

    /**
     * The type of node that should be created by the node creation tool.
     */
    elementTypeId: string;

    /**
     * A ghost element represents the node that may be created by this action schematically.
     * It is not guaranteed that the created element will match the ghost element exactly.
     */
    ghostElement?: GhostElement;

    /**
     * Custom arguments.
     */
    args?: Args;
}

export namespace TriggerNodeCreationAction {
    export const KIND = 'triggerNodeCreation';

    export function is(object: unknown): object is TriggerNodeCreationAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'elementTypeId');
    }

    export function create(
        elementTypeId: string,
        options?: Omit<TriggerNodeCreationAction, 'kind' | 'elementTypeId'>
    ): TriggerNodeCreationAction {
        return {
            kind: KIND,
            elementTypeId,
            ...options
        };
    }
}

/**
 * Triggers the enablement of the tool that is responsible for creating edges and initializes it with the creation of edges of the given
 * `elementTypeId`.
 * <Insert documentation>
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `TriggerEdgeCreationActions`.
 */
export interface TriggerEdgeCreationAction extends Action {
    kind: typeof TriggerEdgeCreationAction.KIND;

    /**
     * The type of edge that should be created by the edge creation tool.
     */
    elementTypeId: string;

    /**
     * Custom arguments.
     */
    args?: Args;
}

export namespace TriggerEdgeCreationAction {
    export const KIND = 'triggerEdgeCreation';

    export function is(object: unknown): object is TriggerEdgeCreationAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'elementTypeId');
    }

    export function create(elementTypeId: string, options: { args?: Args } = {}): TriggerEdgeCreationAction {
        return {
            kind: KIND,
            elementTypeId,
            ...options
        };
    }
}
