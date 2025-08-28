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
import {
    BoundsAwareViewportCommand,
    Disposable,
    DisposableCollection,
    Emitter,
    Event,
    GModelRoot,
    ICommand,
    ICommandStack,
    LazyInjector,
    SetModelCommand,
    SetViewportCommand,
    TYPES,
    UpdateModelCommand,
    Viewport,
    almostEquals,
    isViewport
} from '@eclipse-glsp/sprotty';
import { inject, postConstruct, preDestroy } from 'inversify';

/**
 * Service that tracks changes to the model root and the viewport.
 * Allows to register listeners that are notified when the model root or the viewport changes.
 * The current model root can be queried at any time.
 */
export interface IModelChangeService {
    /** The current model root */
    readonly currentRoot: Readonly<GModelRoot> | undefined;
    /**
     * Event that is fired when the model root of the diagram changes i.e. after the `CommandStack` has processed a model update.
     */
    onModelRootChanged: Event<Readonly<GModelRoot>>;

    /**
     * Event that is fired when the viewport of the diagram changes i.e. after the `CommandStack` has processed a viewport update.
     * By default, this event is only fired if the viewport was changed via a `SetViewportCommand` or `BoundsAwareViewportCommand`
     */
    onViewportChanged: Event<ViewportChange>;
}

/**
 * Event data for the {@link IModelChangeService.onViewportChanged} event.
 */
export interface ViewportChange {
    /** The new viewport */
    newViewport: Readonly<Viewport>;
    /** The old viewport */
    oldViewport?: Readonly<Viewport>;
}

export class ModelChangeService implements IModelChangeService, Disposable {
    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;
    protected _currentRoot?: Readonly<GModelRoot>;
    protected lastViewport?: Readonly<Viewport>;
    protected toDispose = new DisposableCollection();

    get currentRoot(): Readonly<GModelRoot> | undefined {
        return this._currentRoot;
    }

    protected get commandStack(): ICommandStack {
        return this.lazyInjector.get<ICommandStack>(TYPES.ICommandStack);
    }

    protected onModelRootChangedEmitter = new Emitter<Readonly<GModelRoot>>();
    get onModelRootChanged(): Event<Readonly<GModelRoot>> {
        return this.onModelRootChangedEmitter.event;
    }

    protected onViewportChangedEmitter = new Emitter<ViewportChange>();
    get onViewportChanged(): Event<ViewportChange> {
        return this.onViewportChangedEmitter.event;
    }

    @postConstruct()
    protected initialize(): void {
        this.toDispose.push(this.onModelRootChangedEmitter, this.onViewportChangedEmitter);
        this.commandStack.onCommandExecuted(data => this.handleCommandExecution(data.command, data.newRoot));
    }

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
    }

    protected handleCommandExecution(command: ICommand, newRoot: GModelRoot): void {
        if (this.isModelRootChangeCommand(command)) {
            this.handleModelRootChangeCommand(command, newRoot);
        }
        if (this.isViewportChangeCommand(command)) {
            this.handleViewportChangeCommand(command, newRoot);
        }
    }

    protected isModelRootChangeCommand(command: ICommand): boolean {
        return command instanceof SetModelCommand || command instanceof UpdateModelCommand;
    }

    protected isViewportChangeCommand(command: ICommand): boolean {
        return command instanceof SetViewportCommand || command instanceof BoundsAwareViewportCommand;
    }

    protected handleModelRootChangeCommand(command: ICommand, newRoot: GModelRoot): void {
        this._currentRoot = newRoot;
        this.lastViewport = this.toViewport(newRoot);
        this.onModelRootChangedEmitter.fire(newRoot);
    }

    protected handleViewportChangeCommand(command: ICommand, newRoot: GModelRoot): void {
        const viewport = this.toViewport(newRoot);
        if (!viewport) {
            return;
        }

        if (this.hasViewportChanged(viewport)) {
            this.onViewportChangedEmitter.fire({ newViewport: viewport, oldViewport: this.lastViewport });
            this.lastViewport = viewport;
        }
    }

    protected hasViewportChanged(newViewport: Readonly<Viewport>): boolean {
        if (!this.lastViewport) {
            return true;
        }
        return !(
            almostEquals(newViewport.zoom, this.lastViewport.zoom) &&
            almostEquals(newViewport.scroll.x, this.lastViewport.scroll.x) &&
            almostEquals(newViewport.scroll.y, this.lastViewport.scroll.y)
        );
    }

    protected toViewport(root: Readonly<GModelRoot>): Readonly<Viewport> | undefined {
        return isViewport(root) ? { scroll: root.scroll, zoom: root.zoom } : undefined;
    }
}
