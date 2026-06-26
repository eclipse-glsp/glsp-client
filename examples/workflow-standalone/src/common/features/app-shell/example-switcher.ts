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

import { LazyInjector } from '@eclipse-glsp/client';
import { Container } from 'inversify';
import { ExampleEntry, resolveExample } from '../../examples-manifest';
import { AppShell } from './app-shell';
import { SOURCE_PARAM, renderExampleSelector } from './example-selector';

/** Extra per-load context. Currently only flags a reconnect so the server can be told. */
export interface ExampleLoadContext {
    isReconnecting?: boolean;
}

/**
 * Creates a diagram container for the example (reusing the shared GLSP connection), loads its model,
 * and returns the ready container. Supplied by the host because it is integration-specific: the
 * connection kind and the `sourceUri` differ between the node (web socket) and browser (web worker)
 * entry points.
 */
export type ExampleLoader = (entry: ExampleEntry, context: ExampleLoadContext) => Promise<Container>;

/**
 * Owns the example selector and the in-place switching between examples.
 *
 * Selecting an entry disposes the current diagram container, creates a fresh one via the host
 * {@link ExampleLoader}, and re-points the {@link AppShell} at it. Loads are serialized so a dispose
 * never races a still-in-flight load. The selector panel and the app shell live outside the diagram
 * container, so they survive every switch.
 */
export class ExampleSwitcher {
    /** Starts from the `?source=` parameter, defaulting to the first manifest entry. */
    protected currentEntry = resolveExample(new URLSearchParams(window.location.search).get(SOURCE_PARAM));
    protected container?: Container;
    /** Serializes (re)loads so they never overlap; rapid switches simply queue. */
    protected loadChain: Promise<void> = Promise.resolve();

    constructor(
        protected readonly appShell: AppShell,
        protected readonly loader: ExampleLoader
    ) {
        const panel = document.getElementById('exampleSelector');
        if (panel) {
            renderExampleSelector(panel, this.currentEntry.id, entry => this.switchTo(entry));
        }
    }

    /** The diagram container currently displayed, or `undefined` before the first load. */
    get currentContainer(): Container | undefined {
        return this.container;
    }

    /** (Re)loads the current example. Call once the GLSP connection is (re)established. */
    reload(context: ExampleLoadContext = {}): Promise<void> {
        return this.enqueue(this.currentEntry, context);
    }

    /** Switches to a different example in place (no page reload); no-op if it is already current. */
    switchTo(entry: ExampleEntry): void {
        if (entry.id === this.currentEntry.id) {
            return;
        }
        this.currentEntry = entry;
        this.enqueue(entry, {});
    }

    protected enqueue(entry: ExampleEntry, context: ExampleLoadContext): Promise<void> {
        this.loadChain = this.loadChain
            .then(() => this.load(entry, context))
            .catch(error => console.error('Failed to load example:', error));
        return this.loadChain;
    }

    protected async load(entry: ExampleEntry, context: ExampleLoadContext): Promise<void> {
        this.disposeContainer();
        // Start the new viewer from a clean canvas (the diagram renders into the '#sprotty' div).
        document.getElementById('sprotty')?.replaceChildren();
        this.container = await this.loader(entry, context);
        // Re-point the persistent app shell at the freshly loaded container's services.
        this.appShell.connect(this.container.get<LazyInjector>(LazyInjector));
    }

    protected disposeContainer(): void {
        if (this.container) {
            // Disposes the GLSP model source (@preDestroy), which sends a DisposeClientSession to the server.
            this.container.unbindAll();
            this.container = undefined;
        }
    }
}
