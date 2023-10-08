/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { injectable } from 'inversify';
import {
    Action,
    Deferred,
    Disposable,
    Emitter,
    InitializeCanvasBoundsAction,
    SetModelAction,
    UpdateModelAction
} from '@eclipse-glsp/sprotty';

/**
 * The constraint defining when the initialization of the GLSP model is completed.
 *
 * Many actions, such as the `CenterAction`, can only be successfully processed if
 * the GLSP model initialization is completed, that is, the model has been set,
 * its bounds have been computed, the canvas bounds are available, etc.
 *
 * An injectable implementation of this constraint will be used by the
 * `GLSPActionDispatcher` to determine when the initialization is completed.
 * The action dispatcher therefore provides a promise via `onceInitialized()`
 * to trigger clients that want to dispatch an action, once the initialization
 * is done.
 *
 * For most of the cases `DefaultInitializationConstraint` can be used. In fact,
 * it is bound by default. However, custom implementations can rebind other
 * implementations of this constraint to, for instance, delay further before the
 * `onceInitialized()` promise is fulfilled by the `GLSPActionDispatcher`.
 */
@injectable()
export abstract class ModelInitializationConstraint {
    protected completion: Deferred<void> = new Deferred();

    protected _isCompleted = false;
    get isCompleted(): boolean {
        return this._isCompleted;
    }

    protected onInitializedEmitter = new Emitter<void>();

    /**
     * Register a listener that will be invoked once the initialization process
     * has been completed. If the initialization is already completed on registration
     * the given listener will be invoked right away
     * @param listener
     */
    onInitialized(listener: () => void): Disposable;

    /**
     * Retrieve a promise that resolves once the initialization process
     * has been completed.
     * @returns the initialization promise
     */
    onInitialized(): Promise<void>;
    onInitialized(listener?: () => void): Promise<void> | Disposable {
        if (!listener) {
            return this.completion.promise;
        }
        if (this.isCompleted) {
            listener();
            return Disposable.empty();
        }
        return this.onInitializedEmitter.event(listener);
    }

    protected setCompleted(): void {
        if (!this.isCompleted) {
            this._isCompleted = true;
            this.completion.resolve();
            this.onInitializedEmitter.fire();
            this.onInitializedEmitter.dispose();
        }
    }

    notifyDispatched(action: Action): void {
        if (this.isCompleted) {
            return;
        }
        if (this.isInitializedAfter(action)) {
            this.setCompleted();
        }
    }

    /**
     * Central method to check the initialization state. Is invoked
     * for every action dispatched by the `ActionDispatcher` (until the initialization has completed).
     *  Should
     * return `true` once the action has been passed which marks the end
     * of the initialization process.
     * @param action The last dispatched action
     */
    abstract isInitializedAfter(action: Action): boolean;
}

/**
 * Default initialization constraint triggers after a non-empty `UpdateModelAction`
 * and a subsequent `InitializeCanvasBoundsAction`.
 */
@injectable()
export class DefaultModelInitializationConstraint extends ModelInitializationConstraint {
    protected seenNonEmptyModelAction = false;

    isInitializedAfter(action: Action): boolean {
        if (this.isNonEmptyModelAction(action)) {
            this.seenNonEmptyModelAction = true;
        } else if (this.seenNonEmptyModelAction && action.kind === InitializeCanvasBoundsAction.KIND) {
            return true;
        }
        return false;
    }

    protected isNonEmptyModelAction(action: Action): boolean {
        if (SetModelAction.is(action) || UpdateModelAction.is(action)) {
            return action.newRoot.type !== 'NONE';
        }
        return false;
    }
}
