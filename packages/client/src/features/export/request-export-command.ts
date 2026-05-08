/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
    CommandExecutionContext,
    CommandResult,
    HiddenCommand,
    isExportable,
    isHoverable,
    isSelectable,
    isViewport,
    RequestExportAction,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject } from 'inversify';

/**
 * {@link HiddenCommand} for the unified {@link RequestExportAction} kind. Performs the same
 * pre-render preparation as sprotty's `ExportSvgCommand` (clone the root, reset
 * viewport, drop selection/hover) so the rendered SVG used by every
 * `DiagramExporter` strategy is independent of UI state.
 */
export class RequestExportCommand extends HiddenCommand {
    static readonly KIND = RequestExportAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RequestExportAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        if (!isExportable(context.root)) {
            return { model: context.root, modelChanged: false };
        }
        const root = context.modelFactory.createRoot(context.root);
        if (!isExportable(root)) {
            return { model: context.root, modelChanged: false };
        }
        if (isViewport(root)) {
            root.zoom = 1;
            root.scroll = { x: 0, y: 0 };
        }
        root.index.all().forEach(element => {
            if (isSelectable(element) && element.selected) {
                element.selected = false;
            }
            if (isHoverable(element) && element.hoverFeedback) {
                element.hoverFeedback = false;
            }
        });
        return { model: root, modelChanged: true, cause: this.action };
    }
}
