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

import { EditorContextService, GLSPActionDispatcher, IContextMenuServiceProvider, IDiagramStartup, TYPES } from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';
import { createDiagramMenu } from './diagram-menu';

@injectable()
export class TitleBarToolbar implements IDiagramStartup {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    @inject(TYPES.IContextMenuServiceProvider)
    protected contextMenuServiceProvider: IContextMenuServiceProvider;

    postModelInitialization(): void {
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            this.actionDispatcher.dispatch({ kind: 'glspUndo' });
        });

        document.getElementById('redoBtn')?.addEventListener('click', () => {
            this.actionDispatcher.dispatch({ kind: 'glspRedo' });
        });

        this.registerDiagramMenu();

        const dirtyIndicator = document.getElementById('dirtyIndicator');
        this.editorContext.onDirtyStateChanged(change => {
            dirtyIndicator?.classList.toggle('active', change.isDirty);
        });
    }

    /** Wires the title bar `Diagram` menu button to a dropdown rendered via the context menu service. */
    protected registerDiagramMenu(): void {
        const button = document.getElementById('diagramMenuBtn');
        button?.addEventListener('click', async event => {
            event.stopPropagation();
            const service = await this.contextMenuServiceProvider();
            const rect = button.getBoundingClientRect();
            button.classList.add('active');
            service.show(createDiagramMenu(this.editorContext), { x: rect.left, y: rect.bottom + 4 }, () =>
                button.classList.remove('active')
            );
        });
    }
}
