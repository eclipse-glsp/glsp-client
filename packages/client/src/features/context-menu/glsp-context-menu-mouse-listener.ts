/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import {
    Action,
    ContextMenuProviderRegistry,
    GModelElement,
    IActionDispatcher,
    IContextMenuService,
    IContextMenuServiceProvider,
    MouseListener,
    SelectAction,
    TYPES,
    findParentByFeature,
    isSelectable
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional, postConstruct } from 'inversify';
import { FocusStateChangedAction } from '../../base/focus/focus-state-change-action';

@injectable()
export class GLSPContextMenuMouseListener extends MouseListener {
    @inject(TYPES.IContextMenuServiceProvider)
    @optional()
    protected contextMenuServiceProvider?: IContextMenuServiceProvider;

    @inject(TYPES.IContextMenuProviderRegistry)
    @optional()
    protected menuProvider?: ContextMenuProviderRegistry;

    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    protected menuService?: IContextMenuService;

    @postConstruct()
    protected initialize(): void {
        this.contextMenuServiceProvider?.().then(menuService => (this.menuService = menuService));
    }

    /**
     * Opens the context menu.
     */
    override contextMenu(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return this.openContextMenu(target, event);
    }

    /**
     * Opens the context menu.
     *
     *   - update selection state (if context menu target is selectable)
     *   - query the context menu service and the context menu elements
     *   - show the context menu
     *   - send a focus state change to indicate that the diagram becomes inactive, once the context menu is shown
     *
     * When the context menu is closed, we focus the diagram element again.
     */
    protected openContextMenu(target: GModelElement, event: MouseEvent): Promise<Action>[] {
        if (!this.menuService || !this.menuProvider) {
            return [];
        }

        return [this.showContextMenuItems(target, event)];
    }

    protected async showContextMenuItems(target: GModelElement, event: MouseEvent): Promise<Action> {
        await this.handleContextElementSelection(target, event);
        const mousePosition = { x: event.x, y: event.y };

        const menuItems = await this.menuProvider!.getItems(target.root, mousePosition);
        this.menuService!.show(menuItems, mousePosition, () => this.focusEventTarget(event));
        return FocusStateChangedAction.create(false);
    }

    // Clear selection if the context menu target is not selectable
    // Otherwise either maintain current selection if target is already selected or single select the current target.
    protected async handleContextElementSelection(target: GModelElement, event: MouseEvent): Promise<void> {
        const selectableTarget = findParentByFeature(target, isSelectable);
        if (!selectableTarget) {
            return this.actionDispatcher.dispatch(SelectAction.setSelection([]));
        }
        if (!selectableTarget.selected) {
            return this.actionDispatcher.dispatch(SelectAction.setSelection([selectableTarget.id]));
        }
        return;
    }

    protected focusEventTarget(event: MouseEvent): void {
        const targetElement = event.target instanceof SVGElement ? event.target : undefined;
        const svgParentElement = targetElement?.closest('svg');
        if (svgParentElement) {
            svgParentElement.focus();
        }
    }
}
