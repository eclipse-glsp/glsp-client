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
import { AnchorComputerRegistry } from "sprotty";

import { GLSP_TYPES } from "../../base/types";
import { IMouseTool } from "../mouse-tool/mouse-tool";
import { IFeedbackActionDispatcher } from "../tool-feedback/feedback-action-dispatcher";
import { EdgeCreationTool, NodeCreationTool } from "../tools/creation-tool";
import { PaletteItem, PaletteItemSelectionProvider } from "./palette-item";

@injectable()
export class ToolPaletteNodeCreationTool extends NodeCreationTool {
    static ID = "tool_palette_create_node";
    readonly id = ToolPaletteNodeCreationTool.ID;

    constructor(@inject(GLSP_TYPES.MouseTool) protected mouseTool: IMouseTool,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher,
        @inject(PaletteItemSelectionProvider) protected readonly paletteItemSelectionProvider: PaletteItemSelectionProvider) {
        super(mouseTool, feedbackDispatcher);
    }

    enable() {
        const initAction = PaletteItem.getInitAction(this.paletteItemSelectionProvider.getSelection());
        if (initAction) {
            this.initAction = initAction;
        }
        super.enable();
    }
}

@injectable()
export class ToolPaletteEdgeCreationTool extends EdgeCreationTool {
    static ID = "tool_palette_create_edge";
    readonly id = ToolPaletteEdgeCreationTool.ID;

    constructor(@inject(GLSP_TYPES.MouseTool) protected mouseTool: IMouseTool,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher,
        @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry,
        @inject(PaletteItemSelectionProvider) protected readonly paletteItemSelectionProvider: PaletteItemSelectionProvider) {
        super(mouseTool, feedbackDispatcher, anchorRegistry);
    }

    enable() {
        const initAction = PaletteItem.getInitAction(this.paletteItemSelectionProvider.getSelection());
        if (initAction) {
            this.initAction = initAction;
        }
        super.enable();
    }
}
