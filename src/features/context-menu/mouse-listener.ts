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
import { inject, optional } from "inversify";
import { Action, findParentByFeature, isSelectable, MouseListener, SModelElement, TYPES } from "sprotty/lib";
import { DOMHelper } from "sprotty/lib/base/views/dom-helper";

import { GLSP_TYPES } from "../../types";
import { IContextMenuServiceProvider } from "./context-menu-service";
import { ContextMenuProviderRegistry } from "./menu-providers";

export class ContextMenuMouseListener extends MouseListener {

    constructor(
        @inject(GLSP_TYPES.IContextMenuServiceProvider) @optional() protected readonly contextMenuService: IContextMenuServiceProvider,
        @inject(GLSP_TYPES.IContextMenuProviderRegistry) @optional() protected readonly menuProvider: ContextMenuProviderRegistry,
        @inject(TYPES.DOMHelper) protected domHelper: DOMHelper) {
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
            }
            const restoreSelection = () => { if (selectableTarget) selectableTarget.selected = isTargetSelected; };
            Promise.all([this.contextMenuService(), this.menuProvider.getItems(target.root, mousePosition)])
                .then(([menuService, menuItems]) => menuService.show(menuItems, mousePosition, restoreSelection));
        }
        return [];
    }
}
