/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { SetBoundsAction, SetViewportAction } from 'sprotty-protocol/lib/actions';
import { Action } from './action-protocol';
import { hasBooleanProp, hasObjectProp, hasStringProp } from './utils/type-util';

// Add the is() function to the namespace declarations of sprotty-protocol actions
declare module 'sprotty-protocol/lib/actions' {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    namespace SetViewportAction {
        export function is(object: any): object is SetViewportAction;
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow
    namespace SetBoundsAction {
        export function is(object: any): object is SetBoundsAction;
    }
}

SetViewportAction.is = (object: any): object is SetViewportAction =>
    Action.hasKind(object, SetViewportAction.KIND) &&
    hasStringProp(object, 'elementId') &&
    hasObjectProp(object, 'newViewport') &&
    hasBooleanProp(object, 'animate');

SetBoundsAction.is = (object: any): object is SetBoundsAction =>
    Action.hasKind(object, SetBoundsAction.KIND) && hasObjectProp(object, 'bounds');

// Partial reexport of sprotty-protocol
export { Viewport } from 'sprotty-protocol/lib/model';
export * from 'sprotty-protocol/lib/utils/async';
export * from 'sprotty-protocol/lib/utils/geometry';
export * from 'sprotty-protocol/lib/utils/json';
export * from 'sprotty-protocol/lib/utils/model-utils';
// Default export of @eclipse-glsp/protocol
export * from './action-protocol';
export * from './client-server-protocol/base-glsp-client';
export * from './client-server-protocol/glsp-client';
export * from './client-server-protocol/glsp-server';
export * from './client-server-protocol/jsonrpc/base-jsonrpc-glsp-client';
export * from './client-server-protocol/jsonrpc/glsp-jsonrpc-client';
export * from './client-server-protocol/jsonrpc/glsp-jsonrpc-server';
export * from './client-server-protocol/jsonrpc/websocket-connection';
export * from './client-server-protocol/jsonrpc/ws-connection-provider';
export * from './client-server-protocol/types';
export * from './model/default-types';
export * from './model/model-schema';
export * from './utils/array-util';
export * from './utils/di-util';
export * from './utils/disposable';
export * from './utils/event';
export * from './utils/type-util';
export { SetBoundsAction, SetViewportAction };
