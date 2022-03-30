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
import * as sprotty from 'sprotty-protocol/lib/actions';
import { hasObjectProp, hasStringProp } from '../utils/type-util';
import { Action, RequestAction, ResponseAction } from './base-protocol';
import { SModelRootSchema } from './model-structure';
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

    export function is(object: any): object is RequestModelAction {
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
 * Sent from the model source to the client in order to set the model. If a model is already present, it is replaced.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetModelActions`.
 */
export interface SetModelAction extends ResponseAction, sprotty.SetModelAction {
    kind: typeof SetModelAction.KIND;
    /**
     * The new graphical model root.
     */
    newRoot: SModelRootSchema;
}

export namespace SetModelAction {
    export const KIND = 'setModel';

    export function is(object: any): object is SetModelAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'newRoot');
    }

    export function create(newRoot: SModelRootSchema, options: { responseId?: string } = {}): SetModelAction {
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

    newRoot: SModelRootSchema;
    /**
     * Boolean flag to indicate wether updated/changed elements should be animated in the diagram.
     */
    animate?: boolean;
}

export namespace UpdateModelAction {
    export const KIND = 'updateModel';

    export function is(action: any): action is UpdateModelAction {
        return Action.hasKind(action, KIND) && hasObjectProp(action, 'newRoot');
    }

    export function create(newRoot: SModelRootSchema, options: { animate?: boolean } = {}): UpdateModelAction {
        return {
            kind: KIND,
            newRoot,
            animate: true,
            ...options
        };
    }
}

/**
 * Sent from the server to the client in order to indicate that the model source has changed.
 * The model source denotes the data source from which the diagram has been originally derived (such as a file, a database, etc.).
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ModelSourceChangedActions`.
 */
export interface ModelSourceChangedAction extends Action {
    kind: typeof ModelSourceChangedAction.KIND;

    /**
     * A human readable name of the model source (e.g. the file name).
     */
    modelSourceName: string;
}

export namespace ModelSourceChangedAction {
    export const KIND = 'modelSourceChanged';

    export function is(object: any): object is ModelSourceChangedAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'modelSourceName');
    }

    export function create(modelSourceName: string): ModelSourceChangedAction {
        return {
            kind: KIND,
            modelSourceName
        };
    }
}
