/********************************************************************************
 * Copyright (c) 2022-2025 EclipseSource and others.
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
    FeatureModule,
    HBoxLayouter,
    HiddenBoundsUpdater,
    LayoutRegistry,
    RequestBoundsCommand,
    SetBoundsCommand,
    TYPES,
    VBoxLayouter,
    bindAsService,
    configureActionHandler,
    configureCommand,
    configureLayout
} from '@eclipse-glsp/sprotty';
import { MoveElementRelativeAction } from '../change-bounds/move-element-action';
import { MoveElementHandler } from '../change-bounds/move-element-handler';
import { PositionSnapper } from '../change-bounds/position-snapper';
import { FreeFormLayouter } from './freeform-layout';
import { GLSPHiddenBoundsUpdater } from './glsp-hidden-bounds-updater';
import { HBoxLayouterExt } from './hbox-layout';
import { LayouterExt } from './layouter';
import { LocalComputedBoundsCommand } from './local-bounds';
import { SetBoundsFeedbackCommand } from './set-bounds-feedback-command';
import { VBoxLayouterExt } from './vbox-layout';

export const boundsModule = new FeatureModule(
    (bind, _unbind, isBound, _rebind) => {
        const context = { bind, isBound };
        configureCommand(context, SetBoundsCommand);
        configureCommand(context, RequestBoundsCommand);
        bind(HiddenBoundsUpdater).toSelf().inSingletonScope();
        bindAsService(context, TYPES.HiddenVNodePostprocessor, GLSPHiddenBoundsUpdater);

        configureCommand(context, LocalComputedBoundsCommand);
        configureCommand(context, SetBoundsFeedbackCommand);

        bind(TYPES.Layouter).to(LayouterExt).inSingletonScope();
        bind(TYPES.LayoutRegistry).to(LayoutRegistry).inSingletonScope();

        configureLayout(context, VBoxLayouter.KIND, VBoxLayouterExt);
        configureLayout(context, HBoxLayouter.KIND, HBoxLayouterExt);
        configureLayout(context, FreeFormLayouter.KIND, FreeFormLayouter);

        bind(MoveElementHandler).toSelf().inSingletonScope();
        configureActionHandler(context, MoveElementRelativeAction.KIND, MoveElementHandler);

        // backwards compatibility
        // eslint-disable-next-line deprecation/deprecation
        bind(PositionSnapper).toSelf();
    },
    { featureId: Symbol('bounds') }
);
