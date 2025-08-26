/********************************************************************************
 * Copyright (c) 2021-2025 EclipseSource and others.
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
    bindAsService,
    CenterCommand,
    CenterKeyboardListener,
    configureActionHandler,
    configureCommand,
    FeatureModule,
    FitToScreenCommand,
    GetViewportCommand,
    MoveViewportAction,
    SetViewportCommand,
    TYPES,
    ZoomMouseListener
} from '@eclipse-glsp/sprotty';
import { EnableDefaultToolsAction, EnableToolsAction } from '../../base/tool-manager/tool';
import { FocusDomAction } from '../accessibility/actions';
import { GLSPScrollMouseListener } from './glsp-scroll-mouse-listener';
import { OriginViewportCommand } from './origin-viewport';
import { RepositionCommand } from './reposition';
import { MoveViewportHandler, RestoreViewportHandler, ZoomHandler } from './viewport-handler';
import { MoveViewportKeyListener, ZoomKeyListener } from './viewport-key-listener';
import { ViewportKeyTool } from './viewport-tool';
import { ZoomAction, ZoomFactors } from './zoom-viewport-action';

export const viewportModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        configureCommand(context, CenterCommand);
        configureCommand(context, FitToScreenCommand);
        configureCommand(context, GetViewportCommand);
        configureCommand(context, SetViewportCommand);
        configureCommand(context, RepositionCommand);
        configureCommand(context, OriginViewportCommand);

        bindAsService(context, TYPES.MouseListener, ZoomMouseListener);
        bindAsService(context, TYPES.MouseListener, GLSPScrollMouseListener);

        configureActionHandler(context, EnableToolsAction.KIND, GLSPScrollMouseListener);
        configureActionHandler(context, EnableDefaultToolsAction.KIND, GLSPScrollMouseListener);

        bindAsService(context, TYPES.IDiagramStartup, RestoreViewportHandler);
        configureActionHandler(context, EnableDefaultToolsAction.KIND, RestoreViewportHandler);
        configureActionHandler(context, FocusDomAction.KIND, RestoreViewportHandler);

        bind(TYPES.ZoomFactors).toConstantValue(ZoomFactors.DEFAULT);

        bindAsService(context, TYPES.IDefaultTool, ViewportKeyTool);
        bind(MoveViewportHandler).toSelf().inSingletonScope();
        bind(MoveViewportKeyListener).toSelf();
        configureActionHandler(context, MoveViewportAction.KIND, MoveViewportHandler);
        bind(ZoomHandler).toSelf().inSingletonScope();
        bind(ZoomKeyListener).toSelf();
        configureActionHandler(context, ZoomAction.KIND, ZoomHandler);
    },
    { featureId: Symbol('viewport') }
);

/**
 * Feature module that is intended for the standalone deployment of GLSP (i.e. plain webapp)
 * When integrated into an application frame (e.g Theia/VS Code) this module is typically omitted and/or replaced
 * with an application native module.
 */
export const standaloneViewportModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        bindAsService(context, TYPES.KeyListener, CenterKeyboardListener);
    },
    { featureId: Symbol('standaloneViewport'), requires: viewportModule }
);
