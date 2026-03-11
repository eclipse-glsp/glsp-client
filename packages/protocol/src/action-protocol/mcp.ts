/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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

import { Action } from './base-protocol';

/**
 * Request action for retrieving the current selection.
 */
export interface GetSelectionMcpAction extends Action {
    kind: typeof GetSelectionMcpAction.KIND;
    mcpRequestId: string;
}
export namespace GetSelectionMcpAction {
    export const KIND = 'GetSelectionMcpAction';

    export function create(mcpRequestId: string): GetSelectionMcpAction {
        return {
            kind: KIND,
            mcpRequestId
        };
    }
}

/**
 * Result for a `GetSelectionMcpAction`.
 */
export interface SelectionMcpResult extends Action {
    kind: typeof SelectionMcpResult.KIND;
    mcpRequestId: string;
    selectedElementsIDs: string[];
}
export namespace SelectionMcpResult {
    export const KIND = 'SelectionMcpResult';

    export function create(selectedElementsIDs: string[], mcpRequestId: string): SelectionMcpResult {
        return {
            kind: KIND,
            selectedElementsIDs,
            mcpRequestId
        };
    }
}
