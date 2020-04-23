/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable, optional } from "inversify";
import {
    Action,
    ContextMenuProviderRegistry,
    findParentByFeature,
    IContextMenuServiceProvider,
    isSelectable,
    MouseListener,
    SModelElement,
    TYPES
} from "sprotty";

import { GLSP_TYPES } from "../../base/types";
import { SelectionService } from "../select/selection-service";

@injectable()
export class SelectionServiceAwareContextMenuMouseListener extends MouseListener {

    constructor(
        @inject(TYPES.IContextMenuServiceProvider) @optional() protected readonly contextMenuService: IContextMenuServiceProvider,
        @inject(TYPES.IContextMenuProviderRegistry) @optional() protected readonly menuProvider: ContextMenuProviderRegistry,
        @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService) {
        super();
    }

    mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (event.button === 2 && this.contextMenuService && this.menuProvider) {
            const mousePosition = { x: event.x, y: event.y };
            let isTargetSelected = false;
            const selectableTarget = findParentByFeature(target, isSelectable);
            if (selectableTarget) {
                isTargetSelected = selectableTarget.selected;
                selectableTarget.selected = true;
                this.selectionService.updateSelection(target.root, [selectableTarget.id], []);
            }
            const restoreSelection = () => {
                if (selectableTarget) {
                    selectableTarget.selected = isTargetSelected;
                    if (!isTargetSelected) {
                        this.selectionService.updateSelection(target.root, [], [selectableTarget.id]);
                    }
                }
            };
            Promise.all([this.contextMenuService(), this.menuProvider.getItems(target.root, mousePosition)])
                .then(([menuService, menuItems]) => menuService.show(menuItems, mousePosition, restoreSelection));
        }
        return [];
    }
}
