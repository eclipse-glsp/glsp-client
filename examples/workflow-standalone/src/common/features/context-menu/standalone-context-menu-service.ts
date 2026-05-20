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

import { ActionDispatcher, ClientMenuItem, FocusStateChangedAction, IContextMenuService, TYPES, ViewerOptions } from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';

type Anchor = MouseEvent | { x: number; y: number };

@injectable()
export class StandaloneContextMenuService implements IContextMenuService {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: ActionDispatcher;

    @inject(TYPES.ViewerOptions)
    protected viewerOptions: ViewerOptions;

    protected overlay?: HTMLDivElement;
    protected onHideCallback?: () => void;

    show(items: ClientMenuItem[], anchor: Anchor, onHide?: () => void): void {
        this.hide();
        const visibleItems = items.filter(item => this.isVisible(item));
        if (visibleItems.length === 0) {
            return;
        }

        this.onHideCallback = onHide;
        this.overlay = this.createOverlay();
        const menu = this.renderMenu(visibleItems);
        this.overlay.appendChild(menu);
        document.body.appendChild(this.overlay);
        this.positionMenu(menu, anchor);
    }

    protected hide(): void {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = undefined;
            this.onHideCallback?.();
            this.onHideCallback = undefined;
            this.restoreFocus();
        }
    }

    protected restoreFocus(): void {
        this.actionDispatcher.dispatch(FocusStateChangedAction.create(true));
    }

    protected createOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.classList.add('glsp-context-menu-overlay');
        overlay.addEventListener('mousedown', event => {
            if (event.target === overlay) {
                this.hide();
            }
        });
        return overlay;
    }

    protected renderMenu(items: ClientMenuItem[]): HTMLDivElement {
        const menu = document.createElement('div');
        menu.classList.add('glsp-context-menu');
        let previousGroup: string | undefined;
        items.forEach((item, index) => {
            // insert a divider whenever the group changes (mirrors the grouping used by the Theia menus)
            if (index > 0 && item.group !== undefined && item.group !== previousGroup) {
                menu.appendChild(this.renderSeparator());
            }
            previousGroup = item.group;
            menu.appendChild(this.renderItem(item));
        });
        return menu;
    }

    protected renderSeparator(): HTMLDivElement {
        const separator = document.createElement('div');
        separator.classList.add('glsp-context-menu-separator');
        return separator;
    }

    protected renderItem(item: ClientMenuItem): HTMLDivElement {
        const element = document.createElement('div');
        element.classList.add('glsp-context-menu-item');

        const enabled = this.isEnabled(item);
        if (!enabled) {
            element.classList.add('disabled');
        }

        const indicator = document.createElement('span');
        indicator.classList.add('glsp-context-menu-indicator');
        if (this.isToggled(item)) {
            indicator.textContent = '✓';
        }
        element.appendChild(indicator);

        const label = document.createElement('span');
        label.classList.add('glsp-context-menu-label');
        label.textContent = item.label;
        element.appendChild(label);

        const visibleChildren = item.children?.filter(child => this.isVisible(child));
        if (visibleChildren && visibleChildren.length > 0) {
            const chevron = document.createElement('span');
            chevron.classList.add('glsp-context-menu-chevron');
            chevron.textContent = '▸';
            element.appendChild(chevron);

            const submenu = this.renderMenu(visibleChildren);
            submenu.classList.add('glsp-context-menu-submenu');
            element.appendChild(submenu);
            element.classList.add('has-submenu');
        } else if (enabled && item.actions.length > 0) {
            element.addEventListener('click', event => {
                event.stopPropagation();
                this.hide();
                this.actionDispatcher.dispatchAll(item.actions);
            });
        }

        return element;
    }

    protected isVisible(item: ClientMenuItem): boolean {
        return item.isVisible === undefined || item.isVisible();
    }

    protected isEnabled(item: ClientMenuItem): boolean {
        return item.isEnabled === undefined || item.isEnabled();
    }

    protected isToggled(item: ClientMenuItem): boolean {
        return item.isToggled !== undefined && item.isToggled();
    }

    protected positionMenu(menu: HTMLDivElement, anchor: Anchor): void {
        const x = anchor instanceof MouseEvent ? anchor.clientX : anchor.x;
        const y = anchor instanceof MouseEvent ? anchor.clientY : anchor.y;
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        requestAnimationFrame(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = `${x - rect.width}px`;
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = `${y - rect.height}px`;
            }
        });
    }
}
