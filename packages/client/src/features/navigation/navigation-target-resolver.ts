/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { inject, injectable } from "inversify";
import { Action, generateRequestId, IActionDispatcher, RequestAction, ResponseAction, TYPES } from "sprotty";

import { Args } from "../../base/args";
import { EditorContextServiceProvider } from "../../base/editor-context";
import { GLSP_TYPES } from "../../base/types";

export interface NavigationTarget {
    uri: string;
    label?: string;
    args?: Args;
}

export namespace NavigationTarget {

    export const ELEMENT_IDS = 'elementIds';
    export const ELEMENT_IDS_SEPARATOR = '&';
    export const TEXT_LINE = 'line';
    export const TEXT_COLUMN = 'column';

    export function hasArguments(target: NavigationTarget): boolean {
        return target.args !== undefined && Object.keys(target.args).length > 0;
    }

    export function addArgument(target: NavigationTarget, key: string, value: string | number | boolean) {
        if (target.args === undefined) {
            target.args = {};
        }
        target.args[key] = value;
    }

    export function getElementIds(target: NavigationTarget): string[] {
        if (target.args === undefined || target.args[NavigationTarget.ELEMENT_IDS] === undefined) {
            return [];
        }
        const elementIdsValue = target.args[NavigationTarget.ELEMENT_IDS].toString();
        return elementIdsValue.split(NavigationTarget.ELEMENT_IDS_SEPARATOR);
    }

    export function setElementIds(target: NavigationTarget, elementIds: string[]) {
        if (target.args === undefined) {
            target.args = {};
        }
        return target.args[NavigationTarget.ELEMENT_IDS] = elementIds.join(NavigationTarget.ELEMENT_IDS_SEPARATOR);
    }

    export function setTextPosition(target: NavigationTarget, position: TextPosition | undefined) {
        if (position) {
            if (target.args === undefined) {
                target.args = {};
            }
            target.args[NavigationTarget.TEXT_LINE] = position.line;
            target.args[NavigationTarget.TEXT_COLUMN] = position.character;
        }
    }

    export function getTextPosition(target: NavigationTarget): TextPosition | undefined {
        if (target.args === undefined
            || target.args[NavigationTarget.TEXT_LINE] === undefined
            || target.args[NavigationTarget.TEXT_COLUMN] === undefined) {
            return undefined;
        }
        return {
            line: Number(target.args[NavigationTarget.TEXT_LINE]),
            character: Number(target.args[NavigationTarget.TEXT_COLUMN])
        };
    }
}

export interface TextPosition {
    line: number;
    character: number;
}

export class ResolveNavigationTargetAction implements RequestAction<SetResolvedNavigationTargetAction> {
    static readonly KIND = 'resolveNavigationTarget';
    kind = ResolveNavigationTargetAction.KIND;
    constructor(readonly navigationTarget: NavigationTarget, public readonly requestId: string = generateRequestId()) { }
}

export class SetResolvedNavigationTargetAction implements ResponseAction {
    static readonly KIND = 'setResolvedNavigationTarget';
    kind = SetResolvedNavigationTargetAction.KIND;
    constructor(readonly elementIds: string[] = [], readonly args?: Args, readonly responseId: string = '') { }
}

export function isSetResolvedNavigationTargets(action: Action): action is SetResolvedNavigationTargetAction {
    return action !== undefined && (action.kind === SetResolvedNavigationTargetAction.KIND);
}

/**
 * Resolves `NavigationTargets` to element ids.
 *
 * If the `NavigationTarget` doesn't have element ids itself, this resolver queries the server via a
 * `ResolveNavigationTargetAction` for element ids.
 */
@injectable()
export class NavigationTargetResolver {

    @inject(GLSP_TYPES.IEditorContextServiceProvider) protected editorContextService: EditorContextServiceProvider;
    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;

    async resolve(navigationTarget: NavigationTarget): Promise<SetResolvedNavigationTargetAction | undefined> {
        const contextService = await this.editorContextService();
        const sourceUri = await contextService.getSourceUri();
        return this.resolveWithSourceUri(sourceUri, navigationTarget);
    }

    async resolveWithSourceUri(sourceUri: string | undefined, target: NavigationTarget): Promise<SetResolvedNavigationTargetAction | undefined> {
        if (sourceUri && sourceUri !== target.uri && `file://${sourceUri}` !== target.uri) {
            // different URI, so we can't resolve it locally
            return undefined;
        }
        if (NavigationTarget.getElementIds(target).length > 0) {
            return new SetResolvedNavigationTargetAction(NavigationTarget.getElementIds(target));
        }
        const response = await this.requestResolution(target);
        if (isSetResolvedNavigationTargets(response)) {
            return response;
        }
        return undefined;
    }

    protected requestResolution(target: NavigationTarget) {
        return this.dispatcher.request(new ResolveNavigationTargetAction(target));
    }
}

