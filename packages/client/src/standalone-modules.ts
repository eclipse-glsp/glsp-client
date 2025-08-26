/********************************************************************************
 * Copyright (c) 2023-2025 EclipseSource and others.
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
    EndProgressAction,
    FeatureModule,
    GModelElement,
    IActionHandler,
    ICommand,
    ILogger,
    KeyListener,
    MessageAction,
    ModuleConfiguration,
    StartProgressAction,
    TYPES,
    TriggerLayoutAction,
    UpdateProgressAction,
    bindAsService,
    configureActionHandler,
    matchesKeystroke
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { standaloneShortcutsModule } from './base/shortcuts/shortcuts-module';
import { standaloneResizeModule } from './features/change-bounds/resize/resize-module';
import { standaloneCopyPasteModule } from './features/copy-paste/copy-paste-modules';
import { standaloneExportModule } from './features/export/export-modules';
import { saveModule } from './features/save/save-module';
import { standaloneSelectModule } from './features/select/select-module';
import { undoRedoModule } from './features/undo-redo/undo-redo-module';
import { standaloneMarkerNavigatorModule } from './features/validation/validation-modules';
import { standaloneViewportModule } from './features/viewport/viewport-modules';

export const standaloneDefaultModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        bind(FallbackActionHandler).toSelf().inSingletonScope();
        configureActionHandler(context, MessageAction.KIND, FallbackActionHandler);
        configureActionHandler(context, StartProgressAction.KIND, FallbackActionHandler);
        configureActionHandler(context, UpdateProgressAction.KIND, FallbackActionHandler);
        configureActionHandler(context, EndProgressAction.KIND, FallbackActionHandler);
        bindAsService(context, TYPES.KeyListener, LayoutKeyListener);
    },
    { featureId: Symbol('standaloneDefault') }
);

/**
 * A fallback action handler for actions sent by features that are currently not supported by
 * default in the standalone context. Unhandled actions will be simply forwarded to the {@link ILogger}.
 */
@injectable()
export class FallbackActionHandler implements IActionHandler {
    @inject(TYPES.ILogger)
    protected logger: ILogger;

    handle(action: Action): void | Action | ICommand {
        this.logger.log(this, 'Unhandled action received:', action);
    }
}

@injectable()
export class LayoutKeyListener extends KeyListener {
    override keyDown(_element: GModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyL', 'ctrlCmd', 'shift')) {
            return [TriggerLayoutAction.create()];
        }
        return [];
    }
}

/**
 * Configuration of all `standalone` modules.
 *
 * Standalone modules compose additional features/services that are intended for the standalone deployment of GLSP (i.e. plain webapp)
 * When integrated into an application frame (e.g Theia/VS Code) this module is typically omitted and/or replaced
 * with an application native module.
 *
 * Typically standalone modules built on top of (i.e require ) a default module and are therefore conditionally loaded if the
 * required default modules have been loaded beforehand.
 */

export const STANDALONE_MODULES = [
    standaloneViewportModule,
    standaloneCopyPasteModule,
    standaloneMarkerNavigatorModule,
    standaloneSelectModule,
    standaloneExportModule,
    standaloneDefaultModule,
    standaloneShortcutsModule,
    standaloneResizeModule,
    saveModule,
    undoRedoModule
] as const;

export const STANDALONE_MODULE_CONFIG: ModuleConfiguration = {
    add: [...STANDALONE_MODULES]
};
