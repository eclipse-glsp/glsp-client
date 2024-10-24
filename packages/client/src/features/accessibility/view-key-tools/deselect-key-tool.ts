/********************************************************************************
 * Copyright (c) 2023-2024 Business Informatics Group (TU Wien) and others.
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
    GRoutableElement,
    KeyListener,
    KeyTool,
    SelectAction,
    TYPES,
    isSelectable,
    matchesKeystroke,
    toArray
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { Tool } from '../../../base/tool-manager/tool';
import { IToolManager } from '../../../base/tool-manager/tool-manager';
import { SwitchRoutingModeAction } from '../../tools/edge-edit/edge-edit-tool-feedback';

/**
 * Deselects currently selected elements on Escape if the default tools are currently active.
 */
@injectable()
export class DeselectKeyTool implements Tool {
    static ID = 'glsp.deselect-key-tool';

    isEditTool = true;

    protected readonly deselectKeyListener = new DeselectKeyListener();

    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(TYPES.IToolManager) protected toolManager: IToolManager;

    get id(): string {
        return DeselectKeyTool.ID;
    }

    enable(): void {
        this.keytool.register(this.deselectKeyListener);
    }

    disable(): void {
        this.keytool.deregister(this.deselectKeyListener);
    }
}

export class DeselectKeyListener extends KeyListener {
    override keyDown(target: GModelElement, event: KeyboardEvent): Action[] {
        if (this.matchesDeselectKeystroke(event)) {
            const deselect = toArray(target.root.index.all().filter(element => isSelectable(element) && element.selected));
            const actions: Action[] = [];

            if (deselect.length > 0) {
                actions.push(SelectAction.create({ deselectedElementsIDs: deselect.map(e => e.id) }));
            }

            const routableDeselect = deselect.filter(e => e instanceof GRoutableElement).map(e => e.id);
            if (routableDeselect.length > 0) {
                actions.push(SwitchRoutingModeAction.create({ elementsToDeactivate: routableDeselect }));
            }

            return actions;
        }
        return [];
    }

    protected matchesDeselectKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Escape');
    }
}
