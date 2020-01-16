/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { Action, ElementAndBounds, Point } from "sprotty/lib";

import { OperationKind } from "./set-operations";

export class CreateNodeOperationAction implements Action {
    readonly kind = OperationKind.CREATE_NODE;

    constructor(public readonly elementTypeId: string,
        public readonly location?: Point,
        public readonly containerId?: string) { }
}

export class CreateConnectionOperationAction implements Action {
    readonly kind = OperationKind.CREATE_CONNECTION;

    constructor(public readonly elementTypeId: string,
        public readonly sourceElementId?: string,
        public readonly targetElementId?: string) { }
}

export class DeleteElementOperationAction implements Action {
    kind = OperationKind.DELETE_ELEMENT;

    constructor(readonly elementIds: string[]) { }
}

export class ChangeBoundsOperationAction implements Action {
    readonly kind = OperationKind.CHANGE_BOUNDS;

    constructor(public newBounds: ElementAndBounds[]) { }
}

export class ChangeContainerOperation implements Action {
    readonly kind = OperationKind.CHANGE_CONTAINER;

    constructor(public readonly elementId: string,
        public readonly targetContainerId: string,
        public readonly location?: string) { }
}

export class ReconnectConnectionOperationAction implements Action {
    readonly kind = OperationKind.RECONNECT_CONNECTION;

    constructor(public readonly connectionElementId: string,
        public readonly sourceElementId: string,
        public readonly targetElementId: string) { }
}

export class ChangeRoutingPointsOperation implements Action {
    readonly kind = OperationKind.CHANGE_ROUTING_POINTS;
    constructor(public newRoutingPoints: ElementAndRoutingPoints[]) { }
}

export class GenericOperationAction implements Action {
    readonly kind = OperationKind.GENERIC;

    constructor(public readonly id: string,
        public readonly elementId?: string,
        public readonly location?: Point) { }
}

export interface ElementAndRoutingPoints {
    elementId: string
    newRoutingPoints?: Point[];
}
