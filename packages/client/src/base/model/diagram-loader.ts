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

import {
    AnyObject,
    ApplicationIdProvider,
    Args,
    EMPTY_ROOT,
    GLSPClient,
    InitializeParameters,
    MaybePromise,
    RequestModelAction,
    SetModelAction,
    StatusAction,
    TYPES,
    hasNumberProp
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { GLSPActionDispatcher } from '../action-dispatcher';
import { IContributionProvider } from '../contribution-provider';
import { Ranked } from '../ranked';
import { GLSPModelSource } from './glsp-model-source';
import { ModelInitializationConstraint } from './model-initialization-constraint';

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
     * Multiple invocations of the provder function should always return the same `GLSPClient` instance.
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
     * Hook for services that want to execute code before the underlying GLSP client is configured and the server is initialized.
     */
    preInitialize?(): MaybePromise<void>;
    /**
     * Hook for services that want to execute code before the initial model loading request (i.e. `RequestModelAction`) but
     * after the underlying GLSP client has been configured and the server is initialized.
     */
    preRequestModel?(): MaybePromise<void>;
    /**
     * Hook for services that want to execute code after the initial model loading request (i.e. `RequestModelAction`).
     * Note that this hook is invoked directly after the `RequestModelAction` has been dispatched. It does not necessarily wait
     * until the client-server update roundtrip is completed. If you need to wait until the diagram is fully initialized use the
     * {@link postModelInitialization} hook.
     */
    postRequestModel?(): MaybePromise<void>;
    /* Hook for services that want to execute code after the diagram model is fully initialized
     * (i.e. `ModelInitializationConstraint` is completed).
     */
    postModelInitialization?(): MaybePromise<void>;
}

export namespace IDiagramStartup {
    export function is(object: unknown): object is IDiagramStartup {
        return (
            AnyObject.is(object) &&
            hasNumberProp(object, 'rank', true) &&
            ('preInitialize' in object ||
                'preRequestModel' in object ||
                'postRequestModel' in object ||
                'postModelInitialization' in object)
        );
    }
}

export interface DiagramLoadingOptions {
    /**
     * Optional custom options that should be used the initial {@link RequestModelAction}.
     * These options will be merged with the default options (`diagramType` and `sourceUri`).
     * Defaults to an empty object if not defined.
     */
    requestModelOptions?: Args;

    /**
     * Optional partial {@link InitializeParameters} that should be used for `initializeServer` request if the underlying
     * {@link GLSPClient} has not been initialized yet.
     */
    initializeParameters?: Partial<InitializeParameters>;

    /**
     * Flag to enable/disable client side notifications during the loading process.
     * Defaults to `true` if not defined
     */
    enableNotifications?: boolean;
}

export interface ResolvedDiagramLoadingOptions {
    requestModelOptions: Args;
    initializeParameters: InitializeParameters;
    enableNotifications: boolean;
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

    @inject(GLSPModelSource)
    protected modelSource: GLSPModelSource;

    @inject(ModelInitializationConstraint)
    protected modelInitializationConstraint: ModelInitializationConstraint;

    @inject(TYPES.IContributionProvider)
    protected contributionProvider: IContributionProvider;

    get diagramStartups(): IDiagramStartup[] {
        return this.contributionProvider.getAll<IDiagramStartup>(TYPES.IDiagramStartup, { sort: Ranked.sort });
    }

    async load(options: DiagramLoadingOptions = {}): Promise<void> {
        this.contributionProvider.activate();
        const resolvedOptions: ResolvedDiagramLoadingOptions = {
            requestModelOptions: {
                sourceUri: this.options.sourceUri ?? '',
                diagramType: this.options.diagramType,
                ...options.requestModelOptions
            },
            initializeParameters: {
                applicationId: ApplicationIdProvider.get(),
                protocolVersion: GLSPClient.protocolVersion,
                ...options.initializeParameters
            },
            enableNotifications: options.enableNotifications ?? true
        };
        // Set empty place holder model until actual model from server is available
        await this.actionDispatcher.dispatch(SetModelAction.create(EMPTY_ROOT));
        await this.invokeStartupHook('preInitialize');
        await this.initialize(resolvedOptions);
        await this.invokeStartupHook('preRequestModel');
        await this.requestModel(resolvedOptions);
        await this.invokeStartupHook('postRequestModel');
        this.modelInitializationConstraint.onInitialized(() => this.invokeStartupHook('postModelInitialization'));
    }

    protected async invokeStartupHook(hook: keyof Omit<IDiagramStartup, 'rank'>): Promise<void> {
        for (const startup of this.diagramStartups) {
            await startup[hook]?.();
        }
    }

    protected async requestModel(options: ResolvedDiagramLoadingOptions): Promise<void> {
        const response = await this.actionDispatcher.request<SetModelAction>(
            RequestModelAction.create({ options: options.requestModelOptions })
        );
        return this.actionDispatcher.dispatch(response);
    }

    protected async initialize(options: ResolvedDiagramLoadingOptions): Promise<void> {
        if (options.enableNotifications) {
            await this.actionDispatcher.dispatch(StatusAction.create('Initializing...', { severity: 'INFO' }));
        }

        const glspClient = await this.options.glspClientProvider();
        await glspClient.start();
        if (!glspClient.initializeResult) {
            await glspClient.initializeServer(options.initializeParameters);
        }
        this.modelSource.configure(glspClient);

        if (options.enableNotifications) {
            this.actionDispatcher.dispatch(StatusAction.create('', { severity: 'NONE' }));
        }
    }
}
