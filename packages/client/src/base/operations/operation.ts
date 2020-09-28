/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { Action, ElementAndBounds, isAction, Point } from "sprotty";

import { Args } from "../args";

/**
 * Operations are actions that denote requests from the client to _modify_ the model. Model modifications are always performed by the server.
 * After a successful modification, the server sends the updated model back to the client using the `UpdateModelAction`.
 */
export interface Operation extends Action { }

export interface CreateOperation extends Operation {
    elementTypeId: string;
    args?: Args;
}

export function isCreateOperation(object?: any): object is CreateOperation {
    return isAction(object) && "elementTypeId" in object;
}

export class CreateNodeOperation implements CreateOperation {
    static readonly KIND = "createNode";

    constructor(public readonly elementTypeId: string,
        public location?: Point,
        public containerId?: string,
        public args?: Args,
        public readonly kind: string = CreateNodeOperation.KIND) { }
}

export function isCreateNodeOperation(object?: any): object is CreateNodeOperation {
    return isCreateOperation() && object.kind === CreateNodeOperation.KIND;
}

export class CreateEdgeOperation implements CreateOperation {
    static readonly KIND = "createEdge";

    constructor(public readonly elementTypeId: string,
        public sourceElementId?: string,
        public targetElementId?: string,
        public args?: Args,
        public readonly kind: string = CreateEdgeOperation.KIND) { }
}

export function isCreateConnectionOperation(object?: any): object is CreateEdgeOperation {
    return isCreateOperation() && object.kind === CreateEdgeOperation.KIND;
}

export class DeleteElementOperation implements Operation {
    static readonly KIND = "deleteElement";
    constructor(readonly elementIds: string[], public readonly kind: string = DeleteElementOperation.KIND) { }
}

export class ChangeBoundsOperation implements Operation {
    static readonly KIND = "changeBounds";
    constructor(public newBounds: ElementAndBounds[], public readonly kind: string = ChangeBoundsOperation.KIND) { }
}

export class ChangeContainerOperation implements Operation {
    static readonly KIND = "changeContainer";
    constructor(public readonly elementId: string,
        public readonly targetContainerId: string,
        public readonly location?: string,
        public readonly kind: string = ChangeContainerOperation.KIND) { }
}

export class ReconnectEdgeOperation implements Operation {
    static readonly KIND = "reconnectEdge";
    constructor(public readonly connectionElementId: string,
        public readonly sourceElementId: string,
        public readonly targetElementId: string,
        public readonly kind: string = ReconnectEdgeOperation.KIND) { }
}

export class ChangeRoutingPointsOperation implements Operation {
    static readonly KIND = "changeRoutingPoints";
    constructor(public newRoutingPoints: ElementAndRoutingPoints[], public readonly kind: string = ChangeRoutingPointsOperation.KIND) { }
}

export class CompoundOperation implements Operation {
    static readonly KIND = "compound";
    constructor(public operationList: Operation[], public readonly kind: string = CompoundOperation.KIND) { }
}

export interface ElementAndRoutingPoints {
    elementId: string
    newRoutingPoints?: Point[];
}

export abstract class TriggerElementCreationAction implements Action {
    constructor(public readonly elementTypeId: string, readonly args?: Args, public readonly kind: string = 'unknown') { }
}

export class TriggerNodeCreationAction extends TriggerElementCreationAction {
    static readonly KIND = "triggerNodeCreation";

    constructor(public readonly elementTypeId: string, readonly args?: Args, public readonly kind = TriggerNodeCreationAction.KIND) {
        super(elementTypeId, args, kind);
    }
}

export class TriggerEdgeCreationAction extends TriggerElementCreationAction {
    static readonly KIND = "triggerEdgeCreation";

    constructor(public readonly elementTypeId: string, readonly args?: Args, public readonly kind: string = TriggerEdgeCreationAction.KIND) {
        super(elementTypeId, args, kind);
    }
}

export function isTriggerElementTypeCreationAction(object?: any): object is TriggerElementCreationAction {
    return isAction(object) && "elementTypeId" in object;
}

export function isTriggerNodeCreationAction(object?: any): object is TriggerNodeCreationAction {
    return isTriggerElementTypeCreationAction(object) && object.kind === TriggerNodeCreationAction.KIND;
}

export function isTriggerEdgeCreationAction(object?: any): object is TriggerEdgeCreationAction {
    return isTriggerElementTypeCreationAction(object) && object.kind === TriggerEdgeCreationAction.KIND;
}
