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
    IActionDispatcher,
    ILogger,
    NavigationTarget,
    ResolveNavigationTargetAction,
    ResponseAction,
    SetResolvedNavigationTargetAction,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { IDiagramOptions } from '../../base/model/diagram-loader';

/**
 * Resolves `NavigationTargets` to element ids.
 *
 * If the `NavigationTarget` doesn't have element ids itself, this resolver queries the server via a
 * `ResolveNavigationTargetAction` for element ids.
 */
@injectable()
export class NavigationTargetResolver {
    @inject(TYPES.IActionDispatcher)
    protected dispatcher: IActionDispatcher;

    @inject(TYPES.ILogger)
    protected logger: ILogger;

    @inject(TYPES.IDiagramOptions)
    protected diagramOptions: IDiagramOptions;

    async resolve(navigationTarget: NavigationTarget): Promise<SetResolvedNavigationTargetAction | undefined> {
        return this.resolveWithSourceUri(this.diagramOptions.sourceUri, navigationTarget);
    }

    async resolveWithSourceUri(
        sourceUri: string | undefined,
        target: NavigationTarget
    ): Promise<SetResolvedNavigationTargetAction | undefined> {
        const targetUri = decodeURIComponent(target.uri);
        const normalizedSourceUri = sourceUri?.replace(/^file:\/\//, '');
        const normalizedTargetUri = targetUri.replace(/^file:\/\//, '');

        if (normalizedSourceUri && normalizedSourceUri !== normalizedTargetUri) {
            // different URI, so we can't resolve it locally
            this.logger.info("Source and Target URI are different. Can't resolve locally.", normalizedSourceUri, normalizedTargetUri);
            return undefined;
        }
        if (NavigationTarget.getElementIds(target).length > 0) {
            return SetResolvedNavigationTargetAction.create(NavigationTarget.getElementIds(target));
        }
        const response = await this.requestResolution(target);
        if (SetResolvedNavigationTargetAction.is(response)) {
            return response;
        }
        return undefined;
    }

    protected requestResolution(target: NavigationTarget): Promise<ResponseAction> {
        return this.dispatcher.request(ResolveNavigationTargetAction.create(target));
    }
}
