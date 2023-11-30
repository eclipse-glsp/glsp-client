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

/**
 * Action that opens the smart connector at the position of the element
 */
export interface OpenSmartConnectorAction extends Action {
    kind: typeof OpenSmartConnectorAction.KIND;

    /**
     * The identifier of the element where the smart connector is to be opened.
     */
    selectedElementID: string;
}

export namespace OpenSmartConnectorAction {
    export const KIND = 'openSmartConnector';

    export function is(object: any): object is OpenSmartConnectorAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'selectedElementID');
    }

    export function create(selectedElementID: string): OpenSmartConnectorAction {
        return {
            kind: KIND,
            selectedElementID
        };
    }
}

/**
 * Action that closes the smart connector
 */
export interface CloseSmartConnectorAction extends Action {
    kind: typeof CloseSmartConnectorAction.KIND;
}

export namespace CloseSmartConnectorAction {
    export const KIND = 'closeSmartConnector';

    export function is(object: any): object is CloseSmartConnectorAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): CloseSmartConnectorAction {
        return {
            kind: KIND
        };
    }
}
