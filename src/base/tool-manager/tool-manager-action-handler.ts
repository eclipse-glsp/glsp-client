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
import { inject, injectable, interfaces } from "inversify";
import { Action, IActionHandler, ICommand, Tool, ToolManager, TYPES } from "sprotty/lib";

import { isSetOperationsAction, OperationKind, SetOperationsAction } from "../../features/operation/set-operations";
import { EdgeCreationTool, NodeCreationTool } from "../../features/tools/creation-tool";
import { MouseDeleteTool } from "../../features/tools/delete-tool";
import { GLSP_TYPES } from "../../types";

@injectable()
export class GLSPToolManagerActionHandler implements IActionHandler {
    @inject(GLSP_TYPES.IToolFactory) readonly toolFactory: (operationKind: string) => Tool;
    @inject(TYPES.IToolManager) readonly toolManager: ToolManager;

    handle(action: Action): void | ICommand | Action {
        if (isSetOperationsAction(action)) {
            this.configure(action);
        }
    }
    configure(action: SetOperationsAction): any {
        const configuredTools = action.operations.map(op => {
            const tool = this.toolFactory(op.operationKind);
            if (isTypeAware(tool) && op.elementTypeId) {
                tool.elementTypeId = op.elementTypeId;
            }

            return tool;
        }).filter(tool => tool.id !== UNDEFINED_TOOL_ID);

        this.toolManager.registerTools(...configuredTools);
    }
}

export function isTypeAware(tool: Tool): tool is Tool & TypeAware {
    return (<any>tool)["elementTypeId"] !== undefined && typeof (<any>tool)["elementTypeId"] === "string";
}

export interface TypeAware {
    elementTypeId: string;
}
const UNDEFINED_TOOL_ID = "undefined-tool";
export function createToolFactory(): interfaces.FactoryCreator<Tool> {
    return (context: interfaces.Context) => {
        return (operationKind: string) => {
            switch (operationKind) {
                case OperationKind.CREATE_NODE:
                    return context.container.resolve(NodeCreationTool);
                case OperationKind.CREATE_CONNECTION:
                    return context.container.resolve(EdgeCreationTool);
                case OperationKind.DELETE_ELEMENT:
                    return context.container.resolve(MouseDeleteTool);
                default:
                    return {
                        id: UNDEFINED_TOOL_ID,
                        disable() { },
                        enable() { }
                    };
            }
        };
    };
}
