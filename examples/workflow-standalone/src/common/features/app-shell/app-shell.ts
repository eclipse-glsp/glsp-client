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

import {
    DisposableCollection,
    EditorContextService,
    IActionDispatcher,
    IContextMenuServiceProvider,
    InitializeCanvasBoundsAction,
    LazyInjector,
    TYPES
} from '@eclipse-glsp/client';
import { createDiagramMenu } from './diagram-menu';

/**
 * Controls the persistent app shell: the title bar (undo/redo, the `Diagram` menu, the dirty
 * indicator) and the full screen toggle for the app card.
 *
 * The shell outlives every diagram container. The standalone host disposes and rebuilds the
 * container on each example switch, so all DOM listeners are attached once in the constructor and
 * act on whichever diagram is current. {@link connect} only re-points the shell at the freshly
 * (re)loaded container's services, so nothing accumulates across switches.
 */
export class AppShell {
    protected toDisposeOnConnect: DisposableCollection = new DisposableCollection();
    protected dirtyIndicator = document.getElementById('dirtyIndicator');
    protected _lazyInjector?: LazyInjector;

    protected get lazyInjector(): LazyInjector {
        if (!this._lazyInjector) {
            throw new Error('AppShell not connected to a diagram container');
        }
        return this._lazyInjector;
    }

    protected get actionDispatcher(): IActionDispatcher {
        return this.lazyInjector.get<IActionDispatcher>(TYPES.IActionDispatcher);
    }

    protected get editorContext(): EditorContextService {
        return this.lazyInjector.get(EditorContextService);
    }

    protected get contextMenuServiceProvider(): IContextMenuServiceProvider {
        return this.lazyInjector.get(TYPES.IContextMenuServiceProvider);
    }

    constructor() {
        this.registerTitleBar();
        this.registerFullscreenToggle();
    }

    /** Re-point the shell controls at the services of the diagram container that was just (re)loaded. */
    connect(injector: LazyInjector): void {
        this.toDisposeOnConnect.dispose();
        this._lazyInjector = injector;

        // Re-subscribe the dirty indicator in the new diagram container
        this.updateDirtyIndicator(this.editorContext.isDirty);
        this.toDisposeOnConnect.push(this.editorContext.onDirtyStateChanged(change => this.updateDirtyIndicator(change.isDirty)));
    }

    // --- Title bar ------------------------------------------------------------------------------

    protected registerTitleBar(): void {
        const undoButton = document.getElementById('undoBtn');
        const redoButton = document.getElementById('redoBtn');
        const menuButton = document.getElementById('diagramMenuBtn');

        // Keep the diagram focused when these command buttons are clicked: suppressing the mousedown
        [undoButton, redoButton, menuButton].forEach(button => button?.addEventListener('mousedown', event => event.preventDefault()));

        undoButton?.addEventListener('click', () => this.actionDispatcher?.dispatch({ kind: 'glspUndo' }));
        redoButton?.addEventListener('click', () => this.actionDispatcher?.dispatch({ kind: 'glspRedo' }));

        // Open the `Diagram` dropdown rendered via the context menu service.
        menuButton?.addEventListener('click', async event => {
            event.stopPropagation();
            if (!this.contextMenuServiceProvider || !this.editorContext) {
                return;
            }
            const service = await this.contextMenuServiceProvider();
            const rect = menuButton.getBoundingClientRect();
            menuButton.classList.add('active');
            service.show(createDiagramMenu(this.editorContext), { x: rect.left, y: rect.bottom + 4 }, () =>
                menuButton.classList.remove('active')
            );
        });
    }

    protected updateDirtyIndicator(isDirty: boolean): void {
        this.dirtyIndicator?.classList.toggle('active', isDirty);
        this.dirtyIndicator?.setAttribute('title', isDirty ? 'Unsaved changes' : 'All changes saved');
    }

    /**
     * Toggles the card between the default centered layout and full screen, where it fills the shell
     * (the css `.fullscreen` rule drops the card's size caps; the shell padding stays as a margin).
     */
    protected registerFullscreenToggle(): void {
        const shell = document.querySelector<HTMLElement>('.app-shell');
        const button = document.getElementById('fullscreenBtn');
        if (!shell || !button) {
            return;
        }
        const icon = button.querySelector('.codicon');
        // Like the other title-bar buttons, do not let the click steal focus from the diagram.
        button.addEventListener('mousedown', event => event.preventDefault());
        button.addEventListener('click', () => {
            const fullscreen = shell.classList.toggle('fullscreen');
            button.classList.toggle('active', fullscreen);
            button.setAttribute('title', fullscreen ? 'Exit full screen' : 'Full screen');
            icon?.classList.toggle('codicon-screen-full', !fullscreen);
            icon?.classList.toggle('codicon-screen-normal', fullscreen);
            // The card just grew or shrank, so re-measure the canvas for the new `#sprotty` bounds.
            requestAnimationFrame(() => this.resizeCanvas());
        });
    }

    /** Re-measure `#sprotty` and tell the diagram about its new canvas bounds. */
    protected resizeCanvas(): void {
        const sprotty = document.getElementById('sprotty');
        if (!sprotty || !this._lazyInjector) {
            return;
        }
        const rect = sprotty.getBoundingClientRect();
        const newBounds = {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        };
        this.actionDispatcher.dispatch(InitializeCanvasBoundsAction.create(newBounds));
    }
}
