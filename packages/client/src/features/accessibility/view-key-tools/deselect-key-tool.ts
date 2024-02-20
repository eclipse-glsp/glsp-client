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

import { inject, injectable } from 'inversify';
import { toArray } from 'sprotty/lib/utils/iterable';
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';
import {
    Action,
    KeyListener,
    KeyTool,
    GModelElement,
    GRoutableElement,
    SelectAction,
    SwitchEditModeAction,
    isSelectable
} from '@eclipse-glsp/sprotty';
import { Tool } from '../../../base/tool-manager/tool';
import { SResizeHandle } from '../../change-bounds/model';

/**
 * Deselects the element if there is no interaction possible with element.
 */
@injectable()
export class DeselectKeyTool implements Tool {
    static ID = 'glsp.deselect-key-tool';

    isEditTool = true;

    protected readonly deselectKeyListener = new DeselectKeyListener();

    @inject(KeyTool) protected readonly keytool: KeyTool;

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
            const isResizeHandleActive = toArray(target.root.index.all().filter(el => el instanceof SResizeHandle)).length > 0;

            if (isResizeHandleActive) {
                return [];
            }

            const deselect = toArray(target.root.index.all().filter(element => isSelectable(element) && element.selected));
            const actions: Action[] = [];

            if (deselect.length > 0) {
                actions.push(SelectAction.create({ deselectedElementsIDs: deselect.map(e => e.id) }));
            }

            const routableDeselect = deselect.filter(e => e instanceof GRoutableElement).map(e => e.id);
            if (routableDeselect.length > 0) {
                actions.push(SwitchEditModeAction.create({ elementsToDeactivate: routableDeselect }));
            }

            return actions;
        }
        return [];
    }

    protected matchesDeselectKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Escape');
    }
}
