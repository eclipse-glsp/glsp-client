/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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

import { inject, injectable, multiInject, optional } from 'inversify';
import {
    Action,
    EditMode,
    IActionHandler,
    ICommand,
    KeyListener,
    GModelElement,
    TYPES,
    distinctAdd,
    matchesKeystroke
} from '@eclipse-glsp/sprotty';
import { EditorContextService, EditorContextServiceProvider } from '../editor-context-service';
import { EnableDefaultToolsAction, EnableToolsAction, Tool } from './tool';
/**
 * A tool manager coordinates the state of tools in the context of an editor.
 *
 * One instance of a tool manager is intended per editor, coordinating the state of all tools within
 * this editor. A tool can be active or not. A tool manager ensures that activating a set of tools
 * will disable all other tools, allowing them to invoke behavior when they become enabled or disabled.
 */
export interface IToolManager {
    /** All tools managed by this tool manager. */
    readonly managedTools: Tool[];

    /** The tools that are enabled by default, whenever no other tool is enabled. */
    readonly defaultTools: Tool[];

    /** The currently active tools, which are either specifically enabled tools, or the default tools. */
    readonly activeTools: Tool[];

    /**
     * Enables the tools with the specified `toolIds`.
     * Therefore, this manager first disables currently active tools and then enable the
     * tools indicated in `toolIds`, making them the currently active tools. If this manager
     * doesn't manage one or more tools specified in `toolIds`, it'll do nothing. If not a
     * single tool that shall be enabled was found in the managed tools, it'll fall back to
     * the default tools.
     *
     * @param tools The tools to be enabled.
     */
    enable(toolIds: string[]): void;

    /**
     * Enables all default tools.
     */
    enableDefaultTools(): void;

    /** Disables all currently active tools. After this call, no tool will be active anymore. */
    disableActiveTools(): void;

    registerDefaultTools(...tools: Tool[]): void;

    registerTools(...tools: Tool[]): void;
}

/**
 * The default {@link IToolManager} implementation. Allows
 * registration of tools via Dependency Injection.
 */
@injectable()
export class ToolManager implements IToolManager {
    readonly actives: Tool[] = [];

    protected editorContext?: EditorContextService;

    constructor(
        @multiInject(TYPES.ITool)
        @optional()
        readonly tools: Tool[] = [],
        @multiInject(TYPES.IDefaultTool)
        @optional()
        readonly defaultTools: Tool[],
        @inject(TYPES.IEditorContextServiceProvider) protected contextServiceProvider: EditorContextServiceProvider
    ) {
        this.registerTools(...this.tools);
        this.registerDefaultTools(...this.defaultTools);
        this.enableDefaultTools();
        this.contextServiceProvider().then(editorContext => {
            editorContext.onEditModeChanged(change => this.editModeChanged(change.newValue, change.oldValue));
            this.editorContext = editorContext;
        });
    }

    get managedTools(): Tool[] {
        return this.defaultTools.concat(this.tools);
    }

    get activeTools(): Tool[] {
        return this.actives;
    }

    registerDefaultTools(...tools: Tool[]): void {
        distinctAdd(this.defaultTools, ...tools);
    }

    registerTools(...tools: Tool[]): void {
        distinctAdd(this.tools, ...tools);
    }

    disableActiveTools(): void {
        this.actives.forEach(tool => tool.disable());
        this.actives.splice(0, this.actives.length);
    }

    enableDefaultTools(): void {
        this.enable(this.defaultTools.map(tool => tool.id));
    }

    enable(toolIds: string[]): void {
        this.disableActiveTools();
        let tools = toolIds.map(id => this.tool(id));
        if (this.editorContext && this.editorContext.isReadonly) {
            tools = tools.filter(tool => !tool?.isEditTool);
        }
        tools.forEach(tool => {
            if (tool !== undefined) {
                tool.enable();
                this.actives.push(tool);
            }
        });
    }

    tool(toolId: string): Tool | undefined {
        return this.managedTools.find(tool => tool.id === toolId);
    }

    disableEditTools(): void {
        this.disableActiveTools();
        this.enable(this.defaultTools.filter(tool => !tool.isEditTool).map(tool => tool.id));
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

@injectable()
export class ToolManagerActionHandler implements IActionHandler {
    @inject(TYPES.IToolManager)
    readonly toolManager: IToolManager;

    handle(action: Action): void | ICommand | Action {
        if (EnableDefaultToolsAction.is(action)) {
            this.toolManager.enableDefaultTools();
        } else if (EnableToolsAction.is(action)) {
            this.toolManager.enable((action as EnableToolsAction).toolIds);
        }
    }
}

@injectable()
export class DefaultToolsEnablingKeyListener extends KeyListener {
    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'Escape')) {
            return [EnableDefaultToolsAction.create()];
        }
        return [];
    }
}
