/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { inject, injectable, optional } from 'inversify';
import { Action, ContextMenuProviderRegistry, IContextMenuServiceProvider, MouseListener, SModelElement, TYPES } from '~glsp-sprotty';
import { FocusStateChangedAction } from '../../base/focus/focus-state-change-action';

@injectable()
export class GLSPContextMenuMouseListener extends MouseListener {
    @inject(TYPES.IContextMenuServiceProvider)
    @optional()
    protected readonly contextMenuService?: IContextMenuServiceProvider;

    @inject(TYPES.IContextMenuProviderRegistry)
    @optional()
    protected readonly menuProvider?: ContextMenuProviderRegistry;

    /**
     * Opens the context menu.
     */
    override contextMenu(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return this.openContextMenu(target, event);
    }

    /**
     * Opens the context menu.
     *
     *   - query the context menu service and the context menu elements
     *   - show the context menu
     *   - send a focus state change to indicate that the diagram becomes inactive, once the context menu is shown
     *
     * When the context menu is closed, we focus the diagram element again.
     */
    protected openContextMenu(target: SModelElement, event: MouseEvent): Promise<Action>[] {
        if (!this.contextMenuService || !this.menuProvider) {
            return [];
        }

        const mousePosition = { x: event.x, y: event.y };

        const result = Promise.all([this.contextMenuService(), this.menuProvider.getItems(target.root, mousePosition)])
            .then(([menuService, menuItems]) => menuService.show(menuItems, mousePosition, () => this.focusEventTarget(event)))
            .then((): Action => FocusStateChangedAction.create(false));

        return [result];
    }

    protected focusEventTarget(event: MouseEvent): void {
        const targetElement = event.target instanceof SVGElement ? event.target : undefined;
        const svgParentElement = targetElement?.closest('svg');
        if (svgParentElement) {
            svgParentElement.focus();
        }
    }
}
