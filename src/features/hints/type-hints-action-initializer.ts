/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import {
    Action,
    CommandExecutionContext,
    CommandReturn,
    IActionHandler,
    ICommand,
    SModelElement,
    SModelElementSchema,
    TYPES
} from "sprotty/lib";

import {
    EdgeEditConfig,
    edgeEditConfig,
    EditConfig,
    IEditConfigProvider,
    isEdgeEditConfig,
    isNodeEditConfig,
    NodeEditConfig,
    nodeEditConfig
} from "../../base/edit-config/edit-config";
import { GLSP_TYPES } from "../../types";
import { contains } from "../../utils/array-utils";
import { IFeedbackActionDispatcher } from "../tool-feedback/feedback-action-dispatcher";
import { FeedbackCommand } from "../tool-feedback/model";
import { EdgeTypeHint, isSetTypeHintsAction, NodeTypeHint } from "./action-definition";


@injectable()
export class ApplyEditConfigAction implements Action {
    readonly kind = ApplyEditConfigCommand.KIND;
    constructor(public readonly editConfigs: Map<string, EditConfig>) { }
}

@injectable()
export class ApplyEditConfigCommand extends FeedbackCommand {
    static KIND = "applyEditConfig";
    readonly priority = 10;
    constructor(@inject(TYPES.Action) protected action: ApplyEditConfigAction) {
        super();
    }
    execute(context: CommandExecutionContext): CommandReturn {
        context.root.index.all().forEach(element => {
            const config = this.action.editConfigs.get(element.type);
            if (config) {
                Object.assign(element, config);
            }
        });
        return context.root;
    }
}

@injectable()
export class TypeHintsEditConfigProvider implements IActionHandler, IEditConfigProvider {
    @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    protected editConfigs: Map<string, EditConfig> = new Map;

    handle(action: Action): ICommand | Action | void {
        if (isSetTypeHintsAction(action)) {
            action.nodeHints.forEach(hint => this.editConfigs.set(hint.elementTypeId, createNodeEditConfig(hint)));
            action.edgeHints.forEach(hint => this.editConfigs.set(hint.elementTypeId, createEdgeEditConfig(hint)));
            this.feedbackActionDispatcher.registerFeedback(this, [new ApplyEditConfigAction(this.editConfigs)]);
        }
    }

    getEditConfig(input: SModelElement | SModelElementSchema | string): EditConfig | undefined {
        return this.editConfigs.get(getElementTypeId(input));
    }

    getAllEdgeEditConfigs(): EdgeEditConfig[] {
        const configs: EdgeEditConfig[] = [];
        this.editConfigs.forEach((value, key) => {
            if (isEdgeEditConfig(value)) {
                configs.push(value);
            }
        });
        return configs;
    }

    getAllNodeEditConfigs(): NodeEditConfig[] {
        const configs: NodeEditConfig[] = [];
        this.editConfigs.forEach((value, key) => {
            if (isNodeEditConfig(value)) {
                configs.push(value);
            }
        });
        return configs;
    }
}
export function createNodeEditConfig(hint: NodeTypeHint): NodeEditConfig {
    return <NodeEditConfig>{
        elementTypeId: hint.elementTypeId,
        deletable: hint.deletable,
        repositionable: hint.repositionable,
        resizable: hint.resizable,
        configType: nodeEditConfig,
        isContainableElement: (element) => { return hint.containableElementTypeIds ? contains(hint.containableElementTypeIds, getElementTypeId(element)) : false; },
        isContainer: () => { return hint.containableElementTypeIds ? hint.containableElementTypeIds.length > 0 : false; }
    };
}

export function createEdgeEditConfig(hint: EdgeTypeHint): EdgeEditConfig {
    return <EdgeEditConfig>{
        elementTypeId: hint.elementTypeId,
        deletable: hint.deletable,
        repositionable: hint.repositionable,
        routable: hint.routable,
        configType: edgeEditConfig,
        isAllowedSource: (source) => { return contains(hint.sourceElementTypeIds, getElementTypeId(source)); },
        isAllowedTarget: (target) => { return contains(hint.targetElementTypeIds, getElementTypeId(target)); }
    };
}

function getElementTypeId(input: SModelElement | SModelElementSchema | string) {
    if (typeof input === 'string') {
        return <string>input;
    } else {
        return <string>(<any>input)["type"];
    }
}
