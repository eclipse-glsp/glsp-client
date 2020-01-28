/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { injectable } from "inversify";
import { IContextMenuItemProvider, isDeletable, isSelected, MenuItem, Point, SModelRoot } from "sprotty/lib";

import { DeleteElementOperationAction } from "../operation/operation-actions";

@injectable()
export class DeleteElementContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected).filter(isDeletable));
        return Promise.resolve([
            {
                id: "delete",
                label: "Delete",
                sortString: "d",
                group: "edit",
                actions: [new DeleteElementOperationAction(selectedElements.map(e => e.id))],
                isEnabled: () => selectedElements.length > 0
            }
        ]);
    }
}
