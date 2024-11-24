/********************************************************************************
 * Copyright (c) 2020-2024 EclipseSource and others.
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
    Action,
    ActionHandlerRegistry,
    Args,
    CenterAction,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    ILogger,
    MessageAction,
    NavigateToExternalTargetAction,
    NavigateToTargetAction,
    NavigationTarget,
    RequestNavigationTargetsAction,
    SelectAction,
    SelectAllAction,
    SetNavigationTargetsAction,
    SetResolvedNavigationTargetAction,
    SeverityLevel,
    StatusAction,
    TYPES,
    hasObjectProp,
    hasStringProp
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService, EditorContextServiceProvider } from '../../base/editor-context-service';
import { NavigationTargetResolver } from './navigation-target-resolver';

/**
 * Action for triggering a navigation of a certain target type.
 *
 * Examples for target types could be `documentation`, `implementation`, etc.
 * but this is up to the domain-specific diagram implementation to decide.
 * Such an action will eventually trigger a `RequestNavigationTargetsAction`
 * (see `NavigationActionHandler`) in order to request the navigation targets
 * from the server.
 *
 * This action is typically triggered by a user action.
 */

export interface NavigateAction extends Action {
    kind: typeof NavigateAction.KIND;
    /**
     * Navigation target type, such as `documentation`, `implementation`, etc.
     */
    targetTypeId: string;
    /**
     * Additional arguments for customization.
     */
    args?: Args;
}

export namespace NavigateAction {
    export const KIND = 'navigate';

    export function is(object: any): object is NavigateAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'targetTypeId');
    }

    export function create(targetTypeId: string, options: { args?: Args } = {}): NavigateAction {
        return {
            kind: KIND,
            targetTypeId,
            ...options
        };
    }
}

/**
 * Action to trigger the processing of additional navigation arguments.
 * The resolution of a `NavigationTarget` may entail additional arguments. In this case, this action is
 * triggered allowing the client to react to those arguments. The default `NavigationActionHandler` will
 * only process the arguments' keys `info`, `warning`, and `error` to present them to the user.
 * Customizations, however, may add domain-specific arguments and register custom handler to also process
 * other arguments and trigger some additional behavior (e.g. update other views, etc.).
 */

export interface ProcessNavigationArgumentsAction extends Action {
    kind: typeof ProcessNavigationArgumentsAction.KIND;
    /**
     * The navigation arguments.
     */
    args: Args;
}

export namespace ProcessNavigationArgumentsAction {
    export const KIND = 'processNavigationArguments';

    export function is(object: any): object is ProcessNavigationArgumentsAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'args');
    }

    export function create(args: Args): ProcessNavigationArgumentsAction {
        return {
            kind: KIND,
            args
        };
    }
}
/**
 * Default handler for all actions that are related to the navigation.
 *
 * For a `NavigateAction` this handler triggers a `RequestNavigationTargetAction` to obtain the actual
 * navigation targets for the navigation type that is specified in the `NavigateAction`.
 * Once the navigation targets are available, it will trigger a `NavigateToTargetAction` to actually
 * perform the navigation.
 *
 * In other scenarios, clients may also trigger the `NavigateToTargetAction` directly, e.g. when opening
 * the diagram.
 *
 * Depending on the URI and arguments of the navigation target we may encounter three cases:
 *   *(a)* the navigation target already specifies element IDs, in which case this action handler navigates
 *         to the specified elements directly, by the selecting them and centering them in the viewport.
 *   *(b)* the arguments of the navigation targets don't contain element IDs, but other arguments, the
 *         navigation target needs to be resolved into actual element IDs by the `NavigationTargetResolver`.
 *         This can for instance be useful, if the navigation deals with queries or some other more complex
 *         logic that can't be dealt with on the client.
 *  *(c)* the target isn't resolved by the `NavigationTargetResolver`, e.g. because the `uri` doesn't match
 *        the URI of the current diagram. In this case, the navigation request is forwarded by dispatching
 *        a `NavigateToExternalTargetAction`.
 */
@injectable()
export class NavigationActionHandler implements IActionHandler {
    readonly notificationTimeout = 5000;

    @inject(TYPES.ILogger) protected logger: ILogger;
    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;
    /** @deprecated No longer in used. The {@link ActionHandlerRegistry} is now directly injected */
    // eslint-disable-next-line deprecation/deprecation
    @inject(TYPES.ActionHandlerRegistryProvider) protected actionHandlerRegistryProvider: () => Promise<ActionHandlerRegistry>;
    /** @deprecated No longer in used. The {@link EditorContextService} is now directly injected */
    // eslint-disable-next-line deprecation/deprecation
    @inject(TYPES.IEditorContextServiceProvider) protected editorContextService: EditorContextServiceProvider;
    @inject(ActionHandlerRegistry) protected actionHandlerRegistry: ActionHandlerRegistry;
    @inject(NavigationTargetResolver) protected resolver: NavigationTargetResolver;
    @inject(EditorContextService) protected editorContext: EditorContextService;

    handle(action: Action): ICommand | Action | void {
        if (NavigateAction.is(action)) {
            this.handleNavigateAction(action);
        } else if (NavigateToTargetAction.is(action)) {
            this.handleNavigateToTarget(action);
        } else if (ProcessNavigationArgumentsAction.is(action)) {
            this.processNavigationArguments(action.args);
        } else if (NavigateToExternalTargetAction.is(action)) {
            this.handleNavigateToExternalTarget(action);
        }
    }

    protected async handleNavigateAction(action: NavigateAction): Promise<void> {
        try {
            const editorContext = this.editorContext.get(action.args);
            const response = await this.dispatcher.request(
                RequestNavigationTargetsAction.create({ targetTypeId: action.targetTypeId, editorContext })
            );
            if (SetNavigationTargetsAction.is(response) && response.targets && response.targets.length === 1) {
                if (response.targets.length > 1) {
                    this.logger.warn(
                        this,
                        'Processing of multiple targets is not supported yet. ' + 'Only the first is being processed.',
                        response.targets
                    );
                }
                return this.dispatcher.dispatch(NavigateToTargetAction.create(response.targets[0]));
            }
            this.warnAboutFailedNavigation('No valid navigation target found');
        } catch (reason) {
            this.logger.error(this, 'Failed to obtain navigation target', reason, action);
        }
    }

    protected async handleNavigateToTarget(action: NavigateToTargetAction): Promise<void> {
        try {
            const resolvedElements = await this.resolveElements(action);
            if (this.containsElementIdsOrArguments(resolvedElements)) {
                this.navigateTo(resolvedElements);
                this.handleResolutionArguments(resolvedElements);
                return;
            } else {
                this.navigateToExternal(action.target);
                return;
            }
        } catch (reason) {
            this.logger.error(this, 'Failed to navigate', reason, action);
        }
    }

    protected resolveElements(action: NavigateToTargetAction): Promise<SetResolvedNavigationTargetAction | undefined> {
        return this.resolver.resolve(action.target);
    }

    protected containsElementIdsOrArguments(
        target: SetResolvedNavigationTargetAction | undefined
    ): target is SetResolvedNavigationTargetAction {
        return target !== undefined && (this.containsElementIds(target.elementIds) || this.containsArguments(target.args));
    }

    protected containsElementIds(elementIds: string[] | undefined): elementIds is string[] {
        return elementIds !== undefined && elementIds.length > 0;
    }

    protected containsArguments(args: Args | undefined): args is Args {
        return args !== undefined && args !== undefined && Object.keys(args).length > 0;
    }

    protected navigateTo(target: SetResolvedNavigationTargetAction): void {
        const elementIds = target.elementIds;
        if (!this.containsElementIds(elementIds)) {
            return;
        }
        this.dispatcher.dispatchAll([
            SelectAllAction.create(false),
            SelectAction.create({ selectedElementsIDs: elementIds }),
            CenterAction.create(elementIds)
        ]);
    }

    protected handleResolutionArguments(target: SetResolvedNavigationTargetAction): void {
        const args = target.args;
        if (!this.containsArguments(args)) {
            return;
        }
        this.dispatcher.dispatch(ProcessNavigationArgumentsAction.create(args));
    }

    protected navigateToExternal(target: NavigationTarget): Promise<void> {
        return this.dispatcher.dispatch(NavigateToExternalTargetAction.create(target));
    }

    protected processNavigationArguments(args: Args): void {
        if (args.info && args.info.toString().length > 0) {
            this.notify('INFO', args.info.toString());
        }
        if (args.warning && args.warning.toString().length > 0) {
            this.notify('WARNING', args.warning.toString());
        }
        if (args.error && args.error.toString().length > 0) {
            this.notify('ERROR', args.error.toString());
        }
    }

    protected async handleNavigateToExternalTarget(action: NavigateToExternalTargetAction): Promise<void> {
        const handlers = this.actionHandlerRegistry.get(NavigateToExternalTargetAction.KIND);
        if (handlers.length === 1) {
            // we are the only handler so we know nobody took care of it
            this.warnAboutFailedNavigation('Could not resolve or navigate to target', action.target);
        }
    }

    protected warnAboutFailedNavigation(msg: string, target?: NavigationTarget): void {
        const message = `${msg}` + (target ? `: '${target.uri}' (arguments: ${JSON.stringify(target.args)})` : '');
        this.logger.warn(this, msg, target);
        this.notify('WARNING', message);
    }

    private notify(severity: SeverityLevel, message: string): void {
        const timeout = this.notificationTimeout;
        this.dispatcher.dispatchAll([StatusAction.create(message, { severity, timeout }), MessageAction.create(message, { severity })]);
    }
}
