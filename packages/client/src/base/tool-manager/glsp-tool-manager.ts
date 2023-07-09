/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { AnyObject, EditMode, TYPES, Tool, ToolManager, distinctAdd, hasBooleanProp, hasFunctionProp, hasStringProp } from '~glsp-sprotty';
import { EditorContextService, EditorContextServiceProvider, IEditModeListener } from '../editor-context-service';

@injectable()
export class GLSPToolManager extends ToolManager implements IEditModeListener {
    protected editorContext?: EditorContextService;

    @multiInject(TYPES.ITool) @optional() override tools: Tool[];
    @multiInject(TYPES.IDefaultTool) @optional() override defaultTools: Tool[];
    @inject(TYPES.IEditorContextServiceProvider) contextServiceProvider: EditorContextServiceProvider;

    @postConstruct()
    protected initialize(): void {
        this.registerTools(...this.tools);
        this.registerDefaultTools(...this.defaultTools);
        this.enableDefaultTools();
        this.contextServiceProvider().then(editorContext => {
            editorContext.onEditModeChanged(change => this.editModeChanged(change.newValue, change.oldValue));
            this.editorContext = editorContext;
        });
    }

    override registerDefaultTools(...tools: Tool[]): void {
        for (const tool of tools) {
            distinctAdd(this.defaultTools, tool);
        }
    }

    override registerTools(...tools: Tool[]): void {
        for (const tool of tools) {
            distinctAdd(this.tools, tool);
        }
    }

    override enable(toolIds: string[]): void {
        this.disableActiveTools();
        let tools = toolIds.map(id => this.tool(id));
        if (this.editorContext && this.editorContext.isReadonly) {
            tools = tools.filter(tool => tool && (!GLSPTool.is(tool) || tool.isEditTool === false));
        }
        tools.forEach(tool => {
            if (tool !== undefined) {
                tool.enable();
                this.actives.push(tool);
            }
        });
    }

    disableEditTools(): void {
        this.disableActiveTools();
        this.enable(this.defaultTools.filter(tool => !GLSPTool.is(tool) || tool.isEditTool === false).map(tool => tool.id));
    }

    editModeChanged(newValue: string, oldValue: string): void {
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

export namespace GLSPTool {
    export function is(object: unknown): object is GLSPTool {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasFunctionProp(object, 'enable') &&
            hasFunctionProp(object, 'disable') &&
            hasBooleanProp(object, 'isEditTool')
        );
    }
}
