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
import { inject, injectable, postConstruct } from 'inversify';
import { CommandPaletteKeyListener, KeyListener, KeyTool } from '@eclipse-glsp/sprotty';
import { Tool } from '../../base/tool-manager/tool';

@injectable()
export class CommandPaletteTool implements Tool {
    static ID = 'glsp.command-palette-tool';

    protected commandPaletteKeyListener: KeyListener;
    @inject(KeyTool) protected keyTool: KeyTool;

    @postConstruct()
    protected postConstruct(): void {
        this.commandPaletteKeyListener = this.createCommandPaletteKeyListener();
    }

    get id(): string {
        return CommandPaletteTool.ID;
    }

    enable(): void {
        this.keyTool.register(this.commandPaletteKeyListener);
    }

    disable(): void {
        this.keyTool.deregister(this.commandPaletteKeyListener);
    }

    protected createCommandPaletteKeyListener(): KeyListener {
        return new CommandPaletteKeyListener();
    }
}
