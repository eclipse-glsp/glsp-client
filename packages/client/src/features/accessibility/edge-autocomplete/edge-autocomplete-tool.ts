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
import { Action, GModelElement, KeyListener, KeyTool, matchesKeystroke, SetUIExtensionVisibilityAction } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { Tool } from '../../../base/tool-manager/tool';
import { EdgeAutocompletePaletteMetadata } from './edge-autocomplete-palette';

@injectable()
export class EdgeAutocompletePaletteTool implements Tool {
    static readonly ID = 'glsp.edge-autocomplete-palette-tool';

    protected readonly keyListener = new EdgeAutocompletePaletteKeyListener();

    @inject(KeyTool) protected keyTool: KeyTool;

    get id(): string {
        return EdgeAutocompletePaletteTool.ID;
    }

    enable(): void {
        this.keyTool.register(this.keyListener);
    }

    disable(): void {
        this.keyTool.deregister(this.keyListener);
    }
}

export class EdgeAutocompletePaletteKeyListener extends KeyListener {
    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'Escape')) {
            return [
                SetUIExtensionVisibilityAction.create({
                    extensionId: EdgeAutocompletePaletteMetadata.ID,
                    visible: false,
                    contextElementsId: []
                })
            ];
        }
        return [];
    }
}
