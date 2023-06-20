/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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
import { BindingContext, configureActionHandler } from '~glsp-sprotty';
import { MoveElementAction, MoveElementHandler, MoveViewportAction, MoveViewportHandler } from './move-handler';
import { ZoomElementAction, ZoomElementHandler, ZoomViewportAction, ZoomViewportHandler } from './zoom-handler';

/**
 * Handles move and zoom actions.
 */
export const glspMoveZoomModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureMoveZoom(context);
});

export function configureMoveZoom(context: BindingContext): void {
    context.bind(MoveViewportHandler).toSelf().inSingletonScope();
    context.bind(MoveElementHandler).toSelf().inSingletonScope();

    context.bind(ZoomViewportHandler).toSelf().inSingletonScope();
    context.bind(ZoomElementHandler).toSelf().inSingletonScope();

    configureActionHandler(context, MoveViewportAction.KIND, MoveViewportHandler);
    configureActionHandler(context, MoveElementAction.KIND, MoveElementHandler);

    configureActionHandler(context, ZoomViewportAction.KIND, ZoomViewportHandler);
    configureActionHandler(context, ZoomElementAction.KIND, ZoomElementHandler);
}
