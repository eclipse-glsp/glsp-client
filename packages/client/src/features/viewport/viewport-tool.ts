/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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

import { TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import type { IShortcutManager } from '../shortcuts/shortcuts-manager';
import { BaseTool } from '../tools/base-tools';
import { MoveViewportKeyListener, ZoomKeyListener } from './viewport-key-listener';

@injectable()
export class ViewportTool extends BaseTool {
    static readonly ID = 'glsp.viewport-tool';
    static readonly TOKEN = Symbol.for(ViewportTool.ID);

    get id(): string {
        return ViewportTool.ID;
    }

    @inject(TYPES.IShortcutManager)
    protected readonly shortcutManager: IShortcutManager;
    @inject(ZoomKeyListener)
    protected readonly zoomKeyListener: ZoomKeyListener;
    @inject(MoveViewportKeyListener)
    protected readonly moveKeyListener: MoveViewportKeyListener;

    enable(): void {
        this.toDisposeOnDisable.push(
            this.keyTool.registerListener(this.moveKeyListener),
            this.keyTool.registerListener(this.zoomKeyListener),
            this.shortcutManager.register(ViewportTool.TOKEN, [
                { shortcuts: ['⬅ ⬆ ➡ ⬇'], description: 'Move viewport', group: 'Move', position: 0 },
                { shortcuts: ['+ -'], description: 'Zoom viewport', group: 'Zoom', position: 0 },
                { shortcuts: ['+ -'], description: 'Zoom element', group: 'Zoom', position: 0 }
            ])
        );
    }
}
