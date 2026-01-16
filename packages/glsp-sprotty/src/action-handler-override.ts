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
import { Action } from '@eclipse-glsp/protocol';
import { injectable, interfaces, multiInject, optional } from 'inversify';
import { ICommand, MultiInstanceRegistry, TYPES } from 'sprotty';
import {
    ActionHandlerRegistry as SActionHandlerRegistry,
    IActionHandler as SIActionHandler,
    configureActionHandler as sconfigureActionHandler
} from 'sprotty/lib/base/actions/action-handler';

export type SyncActionHandleResult = ICommand | Action | void;
export type ASyncActionHandleResult = Promise<SyncActionHandleResult>;
export type ActionHandleResult = SyncActionHandleResult | ASyncActionHandleResult;

/**
 * An action handler accepts an action and reacts to it by returning either a command to be
 * executed, or another action to be dispatched.
 */
export interface IActionHandler {
    handle(action: Action): ActionHandleResult;
}

export interface ActionHandlerRegistration {
    actionKind: string;
    factory: () => IActionHandler;
}

export interface IActionHandlerInitializer {
    initialize(registry: ActionHandlerRegistry): void;
}

export type ActionHandler = IActionHandler & SIActionHandler;

@injectable()
export class ActionHandlerRegistry extends MultiInstanceRegistry<ActionHandler> implements SActionHandlerRegistry {
    constructor(
        @multiInject(TYPES.ActionHandlerRegistration) @optional() registrations: ActionHandlerRegistration[],
        @multiInject(TYPES.IActionHandlerInitializer) @optional() initializers: IActionHandlerInitializer[]
    ) {
        super();
        registrations.forEach(registration => this.register(registration.actionKind, registration.factory()));
        initializers.forEach(initializer => this.initializeActionHandler(initializer));
    }

    override register(key: string, instance: IActionHandler): void;
    override register(key: string, instance: SIActionHandler): void;
    override register(key: string, instance: ActionHandler): void {
        super.register(key, instance);
    }

    initializeActionHandler(initializer: IActionHandlerInitializer): void {
        initializer.initialize(this);
    }
}

export function configureActionHandler(
    context: { bind: interfaces.Bind; isBound: interfaces.IsBound },
    kind: string,
    constr: interfaces.ServiceIdentifier<IActionHandler>
): void {
    sconfigureActionHandler(context, kind, constr);
}

/**
 * Utility function to register an action handler for an action kind.
 */
export function onAction(
    context: { bind: interfaces.Bind; isBound: interfaces.IsBound },
    kind: string,
    handle: (action: Action) => ReturnType<IActionHandler['handle']>
): void {
    context.bind(TYPES.ActionHandlerRegistration).toConstantValue({
        actionKind: kind,
        factory: () => ({ handle })
    });
}
