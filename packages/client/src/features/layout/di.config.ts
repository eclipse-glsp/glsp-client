/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { ContainerModule } from 'inversify';
import { configureActionHandler, configureLayout, HBoxLayouter, TYPES, VBoxLayouter } from 'sprotty';
import { FreeFormLayouter } from './freeform-layout';
import { HBoxLayouterExt } from './hbox-layout';
import {
    AlignElementsAction,
    AlignElementsActionHandler,
    ResizeElementsAction,
    ResizeElementsActionHandler
} from './layout-elements-action';
import { LayouterExt } from './layouter';
import { VBoxLayouterExt } from './vbox-layout';

const layoutModule = new ContainerModule((bind, _unbind, isBound, rebind) => {
    const context = { bind, isBound };
    configureActionHandler(context, ResizeElementsAction.KIND, ResizeElementsActionHandler);
    configureActionHandler(context, AlignElementsAction.KIND, AlignElementsActionHandler);

    rebind(VBoxLayouter).to(VBoxLayouterExt);
    rebind(HBoxLayouter).to(HBoxLayouterExt);
    rebind(TYPES.Layouter).to(LayouterExt);
    configureLayout({ bind, isBound }, FreeFormLayouter.KIND, FreeFormLayouter);
});

export default layoutModule;
