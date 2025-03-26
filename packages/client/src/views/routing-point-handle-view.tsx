/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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
import { SRoutingHandleView, type GRoutingHandle, type RenderingContext, type RoutedPoint } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import type { VNode } from 'snabbdom';
import { isReconnectHandle } from '../features/reconnect/model';

@injectable()
export class GRoutingHandleView extends SRoutingHandleView {
    override render(handle: Readonly<GRoutingHandle>, context: RenderingContext, args?: { route?: RoutedPoint[] }): VNode {
        // We have our own handle view for the reconnect handles
        if (!isReconnectHandle(handle) && (handle.kind === 'source' || handle.kind === 'target')) {
            return undefined as any;
        }

        return super.render(handle, context, args);
    }
}
