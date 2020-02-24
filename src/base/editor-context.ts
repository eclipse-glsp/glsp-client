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
import { MousePositionTracker, Point } from "sprotty";

import { SelectionService } from "../features/select/selection-service";
import { GLSP_TYPES } from "./types";

export interface EditorContext {
    readonly selectedElementIds: string[];
    readonly lastMousePosition?: Point;
    readonly args?: { [key: string]: string | number | boolean };
}

@injectable()
export class EditorContextService {

    @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService;
    @inject(MousePositionTracker) protected mousePositionTracker: MousePositionTracker;

    get(args?: { [key: string]: string | number | boolean }): EditorContext {
        return {
            selectedElementIds: Array.from(this.selectionService.getSelectedElementIDs()),
            lastMousePosition: this.mousePositionTracker.lastPositionOnDiagram,
            args
        };
    }

    getWithSelection(selectedElementIds: string[], args?: { [key: string]: string | number | boolean }): EditorContext {
        return {
            selectedElementIds,
            lastMousePosition: this.mousePositionTracker.lastPositionOnDiagram,
            args
        };
    }
}
