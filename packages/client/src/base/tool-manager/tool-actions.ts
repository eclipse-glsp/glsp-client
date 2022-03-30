/********************************************************************************
 * Copyright (c) 2022 STMicroelectronics and others.
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
import { Action, hasArrayProp } from '@eclipse-glsp/protocol';
import { EnableDefaultToolsAction, EnableToolsAction } from 'sprotty/lib/base/tool-manager/tool';
/* eslint-disable no-shadow */

/**
 * Use module augmentation to add the `is` utility function to the tool action namespaces provided by sprotty
 */
declare module 'sprotty/lib/base/tool-manager/tool' {
    export namespace EnableDefaultToolsAction {
        export function is(object: any): object is EnableDefaultToolsAction;
    }
    export namespace EnableToolsAction {
        export function is(object: any): object is EnableToolsAction;
    }
}

EnableDefaultToolsAction.is = (object: any): object is EnableDefaultToolsAction => Action.hasKind(object, EnableDefaultToolsAction.KIND);

EnableToolsAction.is = (object: any): object is EnableToolsAction =>
    Action.hasKind(object, EnableToolsAction.KIND) && hasArrayProp(object, 'toolIds');

export { EnableDefaultToolsAction, EnableToolsAction };
