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

import {
    Action,
    SelectAction,
    findParentByFeature,
    isBoundsAware,
    isSelectable,
    isSelected,
    KeyListener,
    KeyTool,
    SEdge,
    Selectable,
    SModelElement,
    SModelRoot,
    TYPES,
    EnableToolsAction,
    EnableDefaultToolsAction
} from '~glsp-sprotty';
import { inject, injectable } from 'inversify';
import { toArray } from 'sprotty/lib/utils/iterable';
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';
import { SelectableBoundsAware } from '../../../utils/smodel-util';
import { GLSPActionDispatcher } from '../../../base/action-dispatcher';
import { GLSPTool } from '../../../base/tool-manager/glsp-tool-manager';
import * as messages from '../toast/messages.json';
import { ShowToastMessageAction } from '../toast/toast-handler';
import { RepositionAction } from '../../viewport/reposition';
import { ElementNavigator } from './element-navigator';
import { SetAccessibleKeyShortcutAction } from '../key-shortcut/accessible-key-shortcut';
import { SearchAutocompletePaletteTool } from '../search/search-tool';
import { AccessibleKeyShortcutTool } from '../key-shortcut/accessible-key-shortcut-tool';

@injectable()
export class ElementNavigatorTool implements GLSPTool {
    static ID = 'glsp.diagram-navigation';

    isEditTool = false;

    protected elementNavigatorKeyListener: ElementNavigatorKeyListener = new ElementNavigatorKeyListener(this);
    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(TYPES.IElementNavigator) readonly elementNavigator: ElementNavigator;
    @inject(TYPES.ILocalElementNavigator) readonly localElementNavigator: ElementNavigator;
    @inject(TYPES.IActionDispatcher) readonly actionDispatcher: GLSPActionDispatcher;

    get id(): string {
        return ElementNavigatorTool.ID;
    }

    enable(): void {
        this.keytool.register(this.elementNavigatorKeyListener);
        this.elementNavigatorKeyListener.registerShortcutKey();
    }

    disable(): void {
        this.keytool.deregister(this.elementNavigatorKeyListener);
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

    registerShortcutKey(): void {
        this.tool.actionDispatcher.onceModelInitialized().then(() => {
            this.tool.actionDispatcher.dispatchAll([
                SetAccessibleKeyShortcutAction.create({
                    token: this.token,
                    keys: [
                        { shortcuts: ['N'], description: 'Activate default navigation', group: 'Navigation', position: 0 },
                        {
                            shortcuts: ['ALT', 'N'],
                            description: 'Activate position based navigation',
                            group: 'Navigation',
                            position: 1
                        },
                        {
                            shortcuts: ['⬅  ⬆  ➡  ⬇'],
                            description: 'Navigate by relation or neighbors according to navigation mode',
                            group: 'Navigation',
                            position: 2
                        }
                    ]
                })
            ]);
        });
    }

    override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
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
    protected resetOnEscape(event: KeyboardEvent, element: SModelElement): void {
        if (this.mode !== NavigationMode.NONE && this.matchesDeactivateNavigationMode(event)) {
            this.navigator?.clean?.(element.root);
            this.clean();

            if (this.mode === NavigationMode.POSITION) {
                this.tool.actionDispatcher.dispatchAll([
                    EnableDefaultToolsAction.create(),
                    ShowToastMessageAction.createWithTimeout({
                        id: Symbol.for(ElementNavigatorKeyListener.name),
                        message: messages.navigation.local_navigation_mode_deactivated
                    })
                ]);
            } else if (this.mode === NavigationMode.DEFAULT) {
                this.tool.actionDispatcher.dispatchAll([
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

    protected triggerPositionNavigationOnEvent(event: KeyboardEvent, element: SModelElement): boolean {
        if (this.matchesActivatePositionNavigation(event)) {
            if (this.mode !== NavigationMode.POSITION) {
                this.clean();
                this.tool.actionDispatcher.dispatchAll([
                    EnableToolsAction.create([ElementNavigatorTool.ID, SearchAutocompletePaletteTool.ID, AccessibleKeyShortcutTool.ID]),
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

    protected resetPositionNavigationOnEvent(event: KeyboardEvent, element: SModelElement): void {
        if (this.mode === NavigationMode.POSITION && this.matchesActivatePositionNavigation(event)) {
            this.navigator?.clean?.(element.root);
            this.clean();
            this.mode = NavigationMode.NONE;
            this.tool.actionDispatcher.dispatchAll([
                EnableDefaultToolsAction.create(),
                ShowToastMessageAction.createWithTimeout({
                    id: Symbol.for(ElementNavigatorKeyListener.name),
                    message: messages.navigation.local_navigation_mode_deactivated
                })
            ]);
        }
    }
    protected triggerDefaultNavigationOnEvent(event: KeyboardEvent, element: SModelElement): boolean {
        if (this.matchesActivateDefaultNavigation(event)) {
            if (this.mode !== NavigationMode.DEFAULT) {
                this.clean();

                this.tool.actionDispatcher.dispatchAll([
                    EnableToolsAction.create([ElementNavigatorTool.ID, SearchAutocompletePaletteTool.ID, AccessibleKeyShortcutTool.ID]),
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

    protected resetDefaultNavigationOnEvent(event: KeyboardEvent, element: SModelElement): void {
        if (this.mode === NavigationMode.DEFAULT && this.matchesActivateDefaultNavigation(event)) {
            this.navigator?.clean?.(element.root);
            this.clean();
            this.mode = NavigationMode.NONE;
            this.tool.actionDispatcher.dispatchAll([
                EnableDefaultToolsAction.create(),
                ShowToastMessageAction.createWithTimeout({
                    id: Symbol.for(ElementNavigatorKeyListener.name),
                    message: messages.navigation.default_navigation_mode_deactivated
                })
            ]);
        }
    }

    protected navigate(element: SModelElement, event: KeyboardEvent): Action[] {
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
                if (!(current instanceof SEdge)) {
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
    ): SModelElement | undefined {
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

    protected getSelectedElements(root: SModelRoot): (SModelElement & Selectable)[] {
        return toArray(root.index.all().filter(e => isSelected(e))) as (SModelElement & Selectable)[];
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
