/********************************************************************************
 * Copyright (c) 2020-2024 EclipseSource and others.
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
    CenterCommand,
    ClosePopupActionHandler,
    FeatureModule,
    FitToScreenCommand,
    HoverFeedbackCommand,
    HoverKeyListener,
    HoverState,
    MoveCommand,
    PopupHoverMouseListener,
    PopupPositionUpdater,
    SetPopupModelCommand,
    SetViewportCommand,
    TYPES,
    bindAsService,
    configureActionHandler,
    configureCommand
} from '@eclipse-glsp/sprotty';
import { FocusStateChangedAction } from '../../base/focus/focus-state-change-action';
import { EnableDefaultToolsAction, EnableToolsAction } from '../../base/tool-manager/tool';
import { GlspHoverMouseListener } from './hover';

export const hoverModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        bindAsService(context, TYPES.PopupVNodePostprocessor, PopupPositionUpdater);
        bindAsService(context, TYPES.MouseListener, GlspHoverMouseListener);
        bindAsService(context, TYPES.PopupMouseListener, PopupHoverMouseListener);
        bindAsService(context, TYPES.KeyListener, HoverKeyListener);

        bind<HoverState>(TYPES.HoverState).toConstantValue({
            mouseOverTimer: undefined,
            mouseOutTimer: undefined,
            popupOpen: false,
            previousPopupElement: undefined
        });
        bind(ClosePopupActionHandler).toSelf().inSingletonScope();

        configureCommand(context, HoverFeedbackCommand);
        configureCommand(context, SetPopupModelCommand);
        configureActionHandler(context, SetPopupModelCommand.KIND, ClosePopupActionHandler);
        configureActionHandler(context, FitToScreenCommand.KIND, ClosePopupActionHandler);
        configureActionHandler(context, CenterCommand.KIND, ClosePopupActionHandler);
        configureActionHandler(context, SetViewportCommand.KIND, ClosePopupActionHandler);
        configureActionHandler(context, MoveCommand.KIND, ClosePopupActionHandler);
        configureActionHandler(context, FocusStateChangedAction.KIND, ClosePopupActionHandler);
        configureActionHandler(context, EnableToolsAction.KIND, GlspHoverMouseListener);
        configureActionHandler(context, EnableDefaultToolsAction.KIND, GlspHoverMouseListener);
        configureActionHandler(context, FocusStateChangedAction.KIND, GlspHoverMouseListener);
    },
    { featureId: Symbol('hover') }
);
