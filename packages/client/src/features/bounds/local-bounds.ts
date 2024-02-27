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
    Action,
    ActionDispatcher,
    Command,
    CommandExecutionContext,
    CommandResult,
    CommandReturn,
    ComputedBoundsAction,
    ComputedBoundsApplicator,
    GModelRoot,
    GModelRootSchema,
    RequestBoundsAction,
    TYPES,
    ViewerOptions,
    hasArrayProp
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { ServerAction } from '../../base/model/glsp-model-source';

export interface LocalRequestBoundsAction extends RequestBoundsAction {
    elementIDs?: string[];
}

export namespace LocalRequestBoundsAction {
    export function is(object: unknown): object is LocalRequestBoundsAction {
        return RequestBoundsAction.is(object) && !ServerAction.is(object) && hasArrayProp(object, 'elementIDs', true);
    }

    export function create(newRoot: GModelRootSchema, elementIDs?: string[]): LocalRequestBoundsAction {
        return {
            ...RequestBoundsAction.create(newRoot),
            elementIDs
        };
    }

    export function fromCommand(
        { root }: CommandExecutionContext,
        actionDispatcher: ActionDispatcher,
        cause?: Action,
        elementIDs?: string[]
    ): CommandResult {
        // do not modify the main model (modelChanged = false) but request local bounds calculation on hidden model
        actionDispatcher.dispatch(LocalRequestBoundsAction.create(root as unknown as GModelRootSchema, elementIDs));
        return {
            model: root,
            modelChanged: false,
            cause
        };
    }
}

export namespace LocalComputedBoundsAction {
    export function is(object: unknown): object is RequestBoundsAction {
        return ComputedBoundsAction.is(object) && ServerAction.is(object);
    }

    export function mark(action: ComputedBoundsAction): ComputedBoundsAction {
        // mimic: we mark the computed bounds action as coming from the server so it is not sent to the server and handled locally
        ServerAction.mark(action);
        return action;
    }
}

@injectable()
export class LocalComputedBoundsCommand extends Command {
    static readonly KIND: string = ComputedBoundsAction.KIND;

    @inject(ComputedBoundsApplicator) protected readonly computedBoundsApplicator: ComputedBoundsApplicator;
    @inject(TYPES.ViewerOptions) protected readonly viewerOptions: ViewerOptions;

    constructor(@inject(TYPES.Action) readonly action: ComputedBoundsAction) {
        super();
    }

    override execute(context: CommandExecutionContext): GModelRoot | CommandResult {
        if (LocalComputedBoundsAction.is(this.action)) {
            if (!this.viewerOptions.needsClientLayout) {
                return context.root;
            }
            // apply computed bounds from the hidden model and return updated model to render new main model
            this.computedBoundsApplicator.apply(context.root as unknown as GModelRootSchema, this.action);
            return context.root;
        }

        // computed bounds action from server -> we do not care and do not trigger any update of the main model
        return {
            model: context.root,
            modelChanged: false
        };
    }

    override undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    override redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}
