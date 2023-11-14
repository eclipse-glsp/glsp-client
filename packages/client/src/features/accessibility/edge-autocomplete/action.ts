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
import { Action, hasObjectProp, hasStringProp } from '@eclipse-glsp/sprotty';

export interface SetEdgeTargetSelectionAction extends Action {
    kind: typeof SetEdgeTargetSelectionAction.KIND;
    elementId: string;
    context: string;
}

export namespace SetEdgeTargetSelectionAction {
    export const KIND = 'setEdgeTargetSelectionAction';

    export function is(object: any): object is SetEdgeTargetSelectionAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'elementId') && hasObjectProp(object, 'context');
    }

    export function create(elementId: string, context: string): SetEdgeTargetSelectionAction {
        return { kind: KIND, elementId, context };
    }
}
