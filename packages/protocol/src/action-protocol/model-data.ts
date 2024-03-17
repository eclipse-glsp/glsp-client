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
import * as sprotty from 'sprotty-protocol/lib/actions';
import { GModelRootSchema } from '../model/model-schema';
import { hasObjectProp, hasStringProp } from '../utils/type-util';
import { Action, RequestAction, ResponseAction } from './base-protocol';
import { Args } from './types';

/**
 * Sent from the server to the client in order to set the model. If a model is already present, it is replaced.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestModelActions`.
 */
export interface RequestModelAction extends RequestAction<SetModelAction>, sprotty.RequestModelAction {
    kind: typeof RequestModelAction.KIND;

    /**
     * Additional options used to compute the graphical model.
     */
    options?: Args;
}

export namespace RequestModelAction {
    export const KIND = 'requestModel';

    export function is(object: unknown): object is RequestModelAction {
        return RequestAction.hasKind(object, KIND);
    }

    export function create(options: { options?: Args; requestId?: string } = {}): RequestModelAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/**
 * Sent from the server to the client in order to set the model. If a model is already present, it is replaced.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetModelActions`.
 */
export interface SetModelAction extends ResponseAction, sprotty.SetModelAction {
    kind: typeof SetModelAction.KIND;
    /**
     * The new graphical model root.
     */
    newRoot: GModelRootSchema;
}

export namespace SetModelAction {
    export const KIND = 'setModel';

    export function is(object: unknown): object is SetModelAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'newRoot');
    }

    export function create(newRoot: GModelRootSchema, options: { responseId?: string } = {}): SetModelAction {
        return {
            kind: KIND,
            responseId: '',
            newRoot,
            ...options
        };
    }
}

/**
 * Sent from the server to the client in order to update the model. If no model is present yet, this behaves the same as
 * a {@link SetModelAction}. The transition from the old model to the new one can be animated.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `UpdateModelActions`.
 */
export interface UpdateModelAction extends Action, Omit<sprotty.UpdateModelAction, 'matches' | 'cause'> {
    kind: typeof UpdateModelAction.KIND;

    newRoot: GModelRootSchema;
    /**
     * Boolean flag to indicate wether updated/changed elements should be animated in the diagram.
     */
    animate?: boolean;
}

export namespace UpdateModelAction {
    export const KIND = 'updateModel';

    export function is(action: unknown): action is UpdateModelAction {
        return Action.hasKind(action, KIND) && hasObjectProp(action, 'newRoot');
    }

    export function create(newRoot: GModelRootSchema, options: { animate?: boolean } = {}): UpdateModelAction {
        return {
            kind: KIND,
            newRoot,
            animate: true,
            ...options
        };
    }
}

/**
 * Sent from the server to the client in order to indicate that the source model has changed.
 * The source model denotes the data source from which the diagram has been originally derived (such as a file, a database, etc.).
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SourceModelChangedActions`.
 */
export interface SourceModelChangedAction extends Action {
    kind: typeof SourceModelChangedAction.KIND;

    /**
     * A human readable name of the source model (e.g. the file name).
     */
    sourceModelName: string;
}

export namespace SourceModelChangedAction {
    export const KIND = 'sourceModelChanged';

    export function is(object: unknown): object is SourceModelChangedAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'sourceModelName');
    }

    export function create(sourceModelName: string): SourceModelChangedAction {
        return {
            kind: KIND,
            sourceModelName: sourceModelName
        };
    }
}
