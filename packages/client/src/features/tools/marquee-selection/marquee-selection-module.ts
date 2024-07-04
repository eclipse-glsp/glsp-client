/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { FeatureModule, TYPES, bindAsService, configureCommand, configureModelElement } from '@eclipse-glsp/sprotty';
import { MarqueeMouseTool } from './marquee-mouse-tool';
import { MarqueeTool } from './marquee-tool';
import { DrawMarqueeCommand, MARQUEE, RemoveMarqueeCommand } from './marquee-tool-feedback';
import { MarqueeNode } from './model';
import { MarqueeView } from './view';
import { MarqueeUtil } from './marquee-behavior';

export const marqueeSelectionToolModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        context.bind(MarqueeUtil).toSelf().inSingletonScope();
        bindAsService(context, TYPES.IDefaultTool, MarqueeTool);
        bindAsService(context, TYPES.ITool, MarqueeMouseTool);

        configureCommand(context, DrawMarqueeCommand);
        configureCommand(context, RemoveMarqueeCommand);

        configureModelElement(context, MARQUEE, MarqueeNode, MarqueeView);
    },
    { featureId: Symbol('marqueeSelectionTool') }
);
