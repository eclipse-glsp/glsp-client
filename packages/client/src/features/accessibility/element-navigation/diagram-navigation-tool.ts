/********************************************************************************
 * Copyright (c) 2023-2025 Business Informatics Group (TU Wien) and others.
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
    GModelElement,
    GModelRoot,
    KeyListener,
    SelectAction,
    Selectable,
    TYPES,
    findParentByFeature,
    isBoundsAware,
    isSelectable,
    isSelected,
    matchesKeystroke,
    toArray
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { messages, repeatOnMessagesUpdated } from '../../../base/messages';
import { AvailableShortcutsTool } from '../../../base/shortcuts/available-shortcuts-tool';
import type { IShortcutManager } from '../../../base/shortcuts/shortcuts-manager';
import { EnableDefaultToolsAction, EnableToolsAction } from '../../../base/tool-manager/tool';
import { GEdge } from '../../../model';
import { SelectableBoundsAware } from '../../../utils/gmodel-util';
import { BaseTool } from '../../tools/base-tools';
import { RepositionAction } from '../../viewport/reposition';
import { SearchAutocompletePaletteTool } from '../search/search-tool';
import { ShowToastMessageAction } from '../toast/toast-handler';
import { ElementNavigator } from './element-navigator';

@injectable()
export class ElementNavigatorTool extends BaseTool {
    static ID = 'glsp.diagram-navigation';
    static TOKEN = Symbol.for(ElementNavigatorTool.ID);

    get id(): string {
        return ElementNavigatorTool.ID;
    }

    @inject(TYPES.IShortcutManager) protected readonly shortcutManager: IShortcutManager;
    @inject(TYPES.IElementNavigator) readonly elementNavigator: ElementNavigator;
    @inject(TYPES.ILocalElementNavigator) readonly localElementNavigator: ElementNavigator;

    protected elementNavigatorKeyListener: ElementNavigatorKeyListener = new ElementNavigatorKeyListener(this);

    enable(): void {
        this.toDisposeOnDisable.push(
            this.keyTool.registerListener(this.elementNavigatorKeyListener),
            repeatOnMessagesUpdated(() =>
                this.shortcutManager.register(ElementNavigatorTool.TOKEN, [
                    {
                        shortcuts: ['ALT', 'N'],
                        description: messages.navigation.shortcut_local_mode,
                        group: messages.shortcut.group_navigation,
                        position: 0
                    },
                    {
                        shortcuts: ['N'],
                        description: messages.navigation.shortcut_global_mode,
                        group: messages.shortcut.group_navigation,
                        position: 1
                    }
                ])
            )
        );
    }
}

enum NavigationMode {
    POSITION = 'position',
    DEFAULT = 'default',
    NONE = 'none'
}

export class ElementNavigatorKeyListener extends KeyListener {
    protected mode = NavigationMode.NONE;
    protected previousNode?: SelectableBoundsAware;
    protected navigator?: ElementNavigator;
    protected readonly token = ElementNavigatorKeyListener.name;

    constructor(protected readonly tool: ElementNavigatorTool) {
        super();
    }

    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        this.resetOnEscape(event, element);

        if (this.getSelectedElements(element.root).length > 0) {
            if (!this.triggerPositionNavigationOnEvent(event, element)) {
                this.triggerDefaultNavigationOnEvent(event, element);
            }

            return this.navigate(element, event);
        }

        this.resetPositionNavigationOnEvent(event, element);
        this.resetDefaultNavigationOnEvent(event, element);

        return [];
    }
    protected resetOnEscape(event: KeyboardEvent, element: GModelElement): void {
        if (this.mode !== NavigationMode.NONE && this.matchesDeactivateNavigationMode(event)) {
            this.navigator?.clean?.(element.root);
            this.clean();

            if (this.mode === NavigationMode.POSITION) {
                this.tool.dispatchActions([
                    EnableDefaultToolsAction.create(),
                    ShowToastMessageAction.createWithTimeout({
                        id: Symbol.for(ElementNavigatorKeyListener.name),
                        message: messages.navigation.local_navigation_mode_deactivated
                    })
                ]);
            } else if (this.mode === NavigationMode.DEFAULT) {
                this.tool.dispatchActions([
                    EnableDefaultToolsAction.create(),
                    ShowToastMessageAction.createWithTimeout({
                        id: Symbol.for(ElementNavigatorKeyListener.name),
                        message: messages.navigation.default_navigation_mode_deactivated
                    })
                ]);
            }

            this.mode = NavigationMode.NONE;
        }
    }

    protected triggerPositionNavigationOnEvent(event: KeyboardEvent, element: GModelElement): boolean {
        if (this.matchesActivatePositionNavigation(event)) {
            if (this.mode !== NavigationMode.POSITION) {
                this.clean();
                this.tool.dispatchActions([
                    EnableToolsAction.create([ElementNavigatorTool.ID, SearchAutocompletePaletteTool.ID, AvailableShortcutsTool.ID]),
                    ShowToastMessageAction.create({
                        id: Symbol.for(ElementNavigatorKeyListener.name),
                        message: messages.navigation.local_navigation_mode_activated
                    })
                ]);
                this.navigator = this.tool.elementNavigator;
                this.mode = NavigationMode.POSITION;
            } else {
                this.resetPositionNavigationOnEvent(event, element);
            }

            return true;
        }

        return false;
    }

    protected resetPositionNavigationOnEvent(event: KeyboardEvent, element: GModelElement): void {
        if (this.mode === NavigationMode.POSITION && this.matchesActivatePositionNavigation(event)) {
            this.navigator?.clean?.(element.root);
            this.clean();
            this.mode = NavigationMode.NONE;
            this.tool.dispatchActions([
                EnableDefaultToolsAction.create(),
                ShowToastMessageAction.createWithTimeout({
                    id: Symbol.for(ElementNavigatorKeyListener.name),
                    message: messages.navigation.local_navigation_mode_deactivated
                })
            ]);
        }
    }
    protected triggerDefaultNavigationOnEvent(event: KeyboardEvent, element: GModelElement): boolean {
        if (this.matchesActivateDefaultNavigation(event)) {
            if (this.mode !== NavigationMode.DEFAULT) {
                this.clean();

                this.tool.dispatchActions([
                    EnableToolsAction.create([ElementNavigatorTool.ID, SearchAutocompletePaletteTool.ID, AvailableShortcutsTool.ID]),
                    ShowToastMessageAction.create({
                        id: Symbol.for(ElementNavigatorKeyListener.name),
                        message: messages.navigation.default_navigation_mode_activated
                    })
                ]);
                this.navigator = this.tool.localElementNavigator;
                this.mode = NavigationMode.DEFAULT;
            } else {
                this.resetDefaultNavigationOnEvent(event, element);
            }

            return true;
        }
        return false;
    }

    protected resetDefaultNavigationOnEvent(event: KeyboardEvent, element: GModelElement): void {
        if (this.mode === NavigationMode.DEFAULT && this.matchesActivateDefaultNavigation(event)) {
            this.navigator?.clean?.(element.root);
            this.clean();
            this.mode = NavigationMode.NONE;
            this.tool.dispatchActions([
                EnableDefaultToolsAction.create(),
                ShowToastMessageAction.createWithTimeout({
                    id: Symbol.for(ElementNavigatorKeyListener.name),
                    message: messages.navigation.default_navigation_mode_deactivated
                })
            ]);
        }
    }

    protected navigate(element: GModelElement, event: KeyboardEvent): Action[] {
        const selected = this.getSelectedElements(element.root);
        const current = selected.length > 0 ? selected[0] : undefined;

        if (this.mode !== NavigationMode.NONE && this.navigator !== undefined && current !== undefined && isBoundsAware(current)) {
            this.navigator.clean?.(current.root, current, this.previousNode);

            const target = this.navigateOnEvent(event, this.navigator, current);

            if (target !== undefined) {
                this.navigator.process?.(current.root, current, target as SelectableBoundsAware, this.previousNode);
            }
            const selectableTarget = target ? findParentByFeature(target, isSelectable) : undefined;

            if (selectableTarget) {
                if (!(current instanceof GEdge)) {
                    this.previousNode = current;
                }
                const deselectedElementsIDs = selected.map(e => e.id).filter(id => id !== selectableTarget.id);

                return [
                    SelectAction.create({ selectedElementsIDs: [selectableTarget.id], deselectedElementsIDs }),
                    RepositionAction.create([selectableTarget.id])
                ];
            }
        }

        return [];
    }

    protected navigateOnEvent(
        event: KeyboardEvent,
        navigator: ElementNavigator,
        current: SelectableBoundsAware
    ): GModelElement | undefined {
        if (this.matchesNavigatePrevious(event)) {
            return navigator.previous(current.root, current);
        } else if (this.matchesNavigateNext(event)) {
            return navigator.next(current.root, current);
        } else if (this.matchesNavigateUp(event)) {
            return navigator.up?.(current.root, current, this.previousNode);
        } else if (this.matchesNavigateDown(event)) {
            return navigator.down?.(current.root, current, this.previousNode);
        }

        return undefined;
    }

    protected clean(): void {
        this.previousNode = undefined;
        this.navigator = undefined;
    }

    protected getSelectedElements(root: GModelRoot): (GModelElement & Selectable)[] {
        return toArray(root.index.all().filter(e => isSelected(e))) as (GModelElement & Selectable)[];
    }

    protected matchesDeactivateNavigationMode(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Escape');
    }
    protected matchesActivateDefaultNavigation(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyN');
    }
    protected matchesActivatePositionNavigation(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyN', 'alt');
    }
    protected matchesNavigatePrevious(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowLeft');
    }
    protected matchesNavigateNext(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowRight');
    }
    protected matchesNavigateUp(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowUp');
    }
    protected matchesNavigateDown(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowDown');
    }
}
