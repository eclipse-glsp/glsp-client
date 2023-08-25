/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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

import { inject, injectable, multiInject, optional, postConstruct } from 'inversify';
import {
    AnyObject,
    ApplicationIdProvider,
    Args,
    EMPTY_ROOT,
    GLSPClient,
    MaybePromise,
    RequestModelAction,
    ServerStatusAction,
    SetModelAction,
    TYPES,
    hasNumberProp
} from '~glsp-sprotty';
import { GLSPActionDispatcher } from '../action-dispatcher';
import { Ranked } from '../ranked';

/**
 * Configuration options for a specific GLSP diagram instance.
 */
export interface IDiagramOptions {
    /**
     * Unique id associated with this diagram. Used on the server side to identify the
     * corresponding client session.
     */
    clientId: string;
    /**
     * The diagram type i.e. diagram language this diagram is associated with.
     */
    diagramType: string;
    /**
     * The provider function to retrieve the GLSP client used by this diagram to communicate with the server.
     */
    glspClientProvider: () => Promise<GLSPClient>;
    /**
     * The file source URI associated with this diagram.
     */
    sourceUri?: string;
    /**
     * The initial edit mode of diagram. Defaults to `editable`.
     */
    editMode?: string;
}

/**
 * Services that implement startup hooks which are invoked during the {@link DiagramLoader.load} process.
 * Typically used to dispatch additional initial actions and/or activate UI extensions on startup.
 * Execution order is derived by the `rank` property of the service. If not present, the {@link Ranked.DEFAULT_RANK} will be assumed.
 */
export interface IDiagramStartup extends Partial<Ranked> {
    /**
     * Hook for services that should be executed before the underlying GLSP client is configured and the server is initialized.
     */
    preInitialize?(): MaybePromise<void>;
    /**
     * Hook for services that should be executed before the initial model loading request (i.e. `RequestModelAction`) but
     * after the underlying GLSP client has been configured and the server is initialized.
     */
    preRequestModel?(): MaybePromise<void>;
    /**
     * Hook for services that should be executed after the initial model loading request (i.e. `RequestModelAction`).
     * Note that this hook is invoked directly after the `RequestModelAction` has been dispatched. It does not necessarily wait
     * until the client-server update roundtrip is completed. If you need to wait until the diagram is fully initialized use the
     * {@link GLSPActionDispatcher.onceModelInitialized} constraint.
     */
    postRequestModel?(): MaybePromise<void>;
}

export namespace IDiagramStartup {
    export function is(object: unknown): object is IDiagramStartup {
        return (
            AnyObject.is(object) &&
            hasNumberProp(object, 'rank', true) &&
            ('preInitialize' in object || 'preRequestModel' in object || 'postRequestModel' in object)
        );
    }
}

/**
 * The central component responsible for initializing the diagram and loading the graphical model
 * from the GLSP server.
 * Invoking the {@link DiagramLoader.load} method is typically the first operation that is executed after
 * a diagram DI container has been created.
 */
@injectable()
export class DiagramLoader {
    @inject(TYPES.IDiagramOptions)
    protected options: IDiagramOptions;

    @inject(GLSPActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    @multiInject(TYPES.IDiagramStartup)
    @optional()
    protected diagramStartups: IDiagramStartup[] = [];

    protected enableLoadingNotifications = true;

    @postConstruct()
    protected postConstruct(): void {
        this.diagramStartups.sort((a, b) => Ranked.getRank(a) - Ranked.getRank(b));
    }

    async load(requestModelOptions: Args = {}): Promise<void> {
        // Set placeholder model until real model from server is available
        await this.actionDispatcher.dispatch(SetModelAction.create(EMPTY_ROOT));
        await this.invokeStartupHook('preInitialize');
        await this.configureGLSPClient();
        await this.invokeStartupHook('preRequestModel');
        await this.requestModel(requestModelOptions);
        await this.invokeStartupHook('postRequestModel');
    }

    protected async invokeStartupHook(hook: keyof Omit<IDiagramStartup, 'rank'>): Promise<void> {
        for (const startup of this.diagramStartups) {
            await startup[hook]?.();
        }
    }

    protected requestModel(requestModelOptions: Args = {}): Promise<void> {
        const options = { sourceUri: this.options.sourceUri, diagramType: this.options.diagramType, ...requestModelOptions } as Args;
        const result = this.actionDispatcher.dispatch(RequestModelAction.create({ options }));
        if (this.enableLoadingNotifications) {
            this.actionDispatcher.dispatch(ServerStatusAction.create('', { severity: 'NONE' }));
        }
        return result;
    }

    protected async configureGLSPClient(): Promise<void> {
        const glspClient = await this.options.glspClientProvider();

        if (this.enableLoadingNotifications) {
            this.actionDispatcher.dispatch(ServerStatusAction.create('Initializing...', { severity: 'INFO' }));
        }

        await glspClient.start();

        if (!glspClient.initializeResult) {
            await glspClient.initializeServer({
                applicationId: ApplicationIdProvider.get(),
                protocolVersion: GLSPClient.protocolVersion
            });
        }
    }
}
