/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    GModelElement,
    GRoutableElement,
    GRoutingHandle,
    RoutingHandleKind,
    edgeInProgressID,
    edgeInProgressTargetHandleID,
    selectFeature
} from '@eclipse-glsp/sprotty';

export const reconnectFeature = Symbol('reconnectFeature');

/**
 * Feature extension interface for {@link reconnectFeature}.
 */
export interface Reconnectable {}

export function isReconnectable(element: GModelElement): element is GRoutableElement & Reconnectable {
    return element instanceof GRoutableElement && element.hasFeature(reconnectFeature);
}

const ROUTING_HANDLE_SOURCE_INDEX = -2;

export function isReconnectHandle(element: GModelElement | undefined): element is GReconnectHandle {
    return element !== undefined && element instanceof GReconnectHandle;
}

export function addReconnectHandles(element: GRoutableElement): void {
    removeReconnectHandles(element);
    createReconnectHandle(element, 'source', ROUTING_HANDLE_SOURCE_INDEX);
    createReconnectHandle(element, 'target', element.routingPoints.length);
}

export function removeReconnectHandles(element: GRoutableElement): void {
    element.removeAll(child => child instanceof GReconnectHandle);
}

export function isSourceRoutingHandle(edge: GRoutableElement, routingHandle: GReconnectHandle): boolean {
    return routingHandle.pointIndex === ROUTING_HANDLE_SOURCE_INDEX;
}

export function isTargetRoutingHandle(edge: GRoutableElement, routingHandle: GReconnectHandle): boolean {
    return routingHandle.pointIndex === edge.routingPoints.length;
}

export function createReconnectHandle(edge: GRoutableElement, kind: RoutingHandleKind, routingPointIndex: number): GReconnectHandle {
    const handle = new GReconnectHandle();
    handle.kind = kind;
    handle.pointIndex = routingPointIndex;
    handle.type = 'routing-point';
    if (kind === 'target' && edge.id === edgeInProgressID) {
        handle.id = edgeInProgressTargetHandleID;
    }
    edge.add(handle);
    return handle;
}

export class GReconnectHandle extends GRoutingHandle {
    override hasFeature(feature: symbol): boolean {
        return feature !== selectFeature && super.hasFeature(feature);
    }
}
