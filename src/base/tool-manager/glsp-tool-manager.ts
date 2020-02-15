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
import { injectable, multiInject, optional } from "inversify";
import { Tool, ToolManager } from "sprotty";

import { GLSP_TYPES } from "../../base/types";

/**
 * TODO: contributed to upstream sprotty project
 */
@injectable()
export class GLSPToolManager extends ToolManager {

    constructor(@multiInject(GLSP_TYPES.ITool) @optional() tools: Tool[],
        @multiInject(GLSP_TYPES.IDefaultTool) @optional() defaultTools: Tool[]) {
        super();
        this.registerTools(...tools);
        this.registerDefaultTools(...defaultTools);
    }
}
