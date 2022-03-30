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
import { hasArrayProp, hasBooleanProp } from '../utils/type-util';
import { Action } from './base-protocol';

/**
 * Centers the viewport on the elements with the given identifiers. It changes the scroll setting of the viewport accordingly and resets
 * the zoom to its default. This action is usually be created on the client but it can also be sent by the server in order to perform such
 * a viewport change remotely.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `CenterActions`.
 */
export interface CenterAction extends Action, sprotty.CenterAction {
    kind: typeof CenterAction.KIND;

    /**
     * The identifier of the elements on which the viewport should be centered.
     * If empty the root element will be used.
     */
    elementIds: string[];

    /**
     * Indicate if the modification of the viewport should be realized with or without support of animations.
     */
    animate: boolean;

    /**
     * Indicates whether the zoom level should be kept.
     */
    retainZoom: boolean;
}

export namespace CenterAction {
    export const KIND = 'center';

    export function is(object: any): object is CenterAction {
        return Action.hasKind(object, KIND) && hasBooleanProp(object, 'animate') && hasBooleanProp(object, 'retainZoom');
    }

    export function create(elementIds: string[], options: { animate?: boolean; retainZoom?: boolean } = {}): CenterAction {
        return {
            kind: KIND,
            animate: true,
            retainZoom: false,
            elementIds,
            ...options
        };
    }
}

/**
 * Triggers to fit all or a list of elements into the available diagram canvas.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `CenterActions`.
 */
export interface FitToScreenAction extends Action, sprotty.FitToScreenAction {
    kind: typeof FitToScreenAction.KIND;

    /**
     * The identifier of the elements to fit on screen.
     */
    elementIds: string[];

    /**
     * The padding that should be visible on the viewport.
     */
    padding?: number;

    /**
     * The max zoom level authorized.
     */
    maxZoom?: number;

    /**
     * Indicate if the action should be performed with animation support or not.
     */
    animate: boolean;
}

export namespace FitToScreenAction {
    export const KIND = 'fit';

    export function is(object: any): object is FitToScreenAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'elementIds') && hasBooleanProp(object, 'animate');
    }

    export function create(
        elementIds: string[],
        options: { padding?: number; maxZoom?: number; animate?: boolean } = {}
    ): FitToScreenAction {
        return {
            kind: KIND,
            animate: true,
            elementIds,
            ...options
        };
    }
}
