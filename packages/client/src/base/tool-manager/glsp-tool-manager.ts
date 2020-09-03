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
import { inject, injectable, multiInject, optional } from "inversify";
import { Tool, ToolManager } from "sprotty";

import { distinctAdd } from "../../utils/array-utils";
import { EditMode } from "../actions/edit-mode-action";
import { EditModeListener, EditorContextService, EditorContextServiceProvider } from "../editor-context";
import { GLSP_TYPES } from "../types";

export interface IGLSPToolManager extends ToolManager {
    /* Disables all actives tools and activates only default tool with non-edit function*/
    disableEditTools(): void;
}
@injectable()
export class GLSPToolManager extends ToolManager implements IGLSPToolManager, EditModeListener {
    protected editorContext?: EditorContextService;
    constructor(@multiInject(GLSP_TYPES.ITool) @optional() tools: Tool[],
        @multiInject(GLSP_TYPES.IDefaultTool) @optional() defaultTools: Tool[],
        @inject(GLSP_TYPES.IEditorContextServiceProvider) contextServiceProvider: EditorContextServiceProvider) {
        super();
        this.registerTools(...tools);
        this.registerDefaultTools(...defaultTools);
        this.enableDefaultTools();
        contextServiceProvider().then(editorContext => {
            editorContext.register(this);
            this.editorContext = editorContext;
        });
    }

    registerDefaultTools(...tools: Tool[]) {
        for (const tool of tools) {
            distinctAdd(this.defaultTools, tool);
        }
    }

    registerTools(...tools: Tool[]) {
        for (const tool of tools) {
            distinctAdd(this.tools, tool);
        }
    }

    enable(toolIds: string[]) {
        this.disableActiveTools();
        let tools = toolIds.map(id => this.tool(id));
        if (this.editorContext && this.editorContext.isReadonly) {
            tools = tools.filter(tool => tool && (!isGLSPTool(tool) || tool.isEditTool === false));
        }
        tools.forEach(tool => {
            if (tool !== undefined) {
                tool.enable();
                this.actives.push(tool);
            }
        });
    }

    disableEditTools() {
        this.disableActiveTools();
        this.enable(this.defaultTools.filter(tool => !isGLSPTool(tool) || tool.isEditTool === false).map(tool => tool.id));
    }

    editModeChanged(oldValue: string, newValue: string) {
        if (oldValue === newValue) {
            return;
        }
        if (newValue === EditMode.READONLY) {
            this.disableEditTools();
        } else if (newValue === EditMode.EDITABLE) {
            this.enableDefaultTools();
        }
    }
}

export interface GLSPTool extends Tool {
    isEditTool: boolean;
}

export function isGLSPTool(tool: Tool): tool is GLSPTool {
    return "isEditTool" in tool && typeof tool["isEditTool"] === "boolean";
}
