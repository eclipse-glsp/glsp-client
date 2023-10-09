/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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

import { Action } from '@eclipse-glsp/sprotty';

export interface HideToastAction extends Action {
    kind: typeof HideToastAction.KIND;
    options: HideToastAction.Options;
}

export namespace HideToastAction {
    export const KIND = 'hideToastMessageAction';

    export type Options = Pick<ToastOptions, 'id' | 'timeout'>;

    export function is(object: any): object is HideToastAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: Options): HideToastAction {
        return { kind: KIND, options };
    }
}

export interface ShowToastMessageAction extends Action {
    kind: typeof ShowToastMessageAction.KIND;
    options: ToastOptions;
}

export namespace ShowToastMessageAction {
    export const KIND = 'showToastMessageAction';
    export const TIMEOUT = 2000;

    export type CreateOptions = Partial<ToastOptions> & Required<Pick<ToastOptions, 'message'>>;

    export function is(object: any): object is ShowToastMessageAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: CreateOptions): ShowToastMessageAction {
        return { kind: KIND, options: { ...options, position: options.position ?? 'center', id: options.id ?? Symbol('toast id') } };
    }
    export function createWithTimeout(options: CreateOptions): ShowToastMessageAction {
        return {
            kind: KIND,
            options: { timeout: TIMEOUT, ...options, position: options.position ?? 'center', id: options.id ?? Symbol('toast id') }
        };
    }
}

export interface ToastOptions {
    id: symbol;
    timeout?: number;
    position: 'left' | 'center' | 'right';
    message: string;
}
