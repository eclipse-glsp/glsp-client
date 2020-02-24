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

export interface Operation extends Action { }

export interface CreateOperation extends Operation {
    elementTypeId: string;
    args?: { [key: string]: string | number | boolean };
}

export function isCreateOperation(object?: any): object is CreateOperation {
    return isAction(object) && "elementTypeId" in object;
}

export class CreateNodeOperation implements CreateOperation {
    static readonly KIND = "createNode";
    readonly kind = CreateNodeOperation.KIND;

    constructor(public readonly elementTypeId: string,
        public location?: Point,
        public containerId?: string,
        public args?: { [key: string]: string | number | boolean }) { }
}

export function isCreateNodeOperation(object?: any): object is CreateNodeOperation {
    return isCreateOperation() && object.kind === CreateNodeOperation.KIND;
}

export class CreateEdgeOperation implements CreateOperation {
    static readonly KIND = "createEdge";
    readonly kind = CreateEdgeOperation.KIND;

    constructor(public readonly elementTypeId: string,
        public sourceElementId?: string,
        public targetElementId?: string,
        public args?: { [key: string]: string | number | boolean }) { }
}

export function isCreateConnectionOperation(object?: any): object is CreateEdgeOperation {
    return isCreateOperation() && object.kind === CreateEdgeOperation.KIND;
}

export class DeleteElementOperation implements Operation {
    static readonly KIND = "deleteElement";
    kind = DeleteElementOperation.KIND;
    constructor(readonly elementIds: string[]) { }
}

export class ChangeBoundsOperation implements Operation {
    static readonly KIND = "changeBounds";
    readonly kind = ChangeBoundsOperation.KIND;
    constructor(public newBounds: ElementAndBounds[]) { }
}

export class ChangeContainerOperation implements Operation {
    static readonly KIND = "changeContainer";
    readonly kind = ChangeContainerOperation.KIND;
    constructor(public readonly elementId: string,
        public readonly targetContainerId: string,
        public readonly location?: string) { }
}

export class ReconnectEdgeOperation implements Operation {
    static readonly KIND = "reconnectEdge";
    readonly kind = ReconnectEdgeOperation.KIND;
    constructor(public readonly connectionElementId: string,
        public readonly sourceElementId: string,
        public readonly targetElementId: string) { }
}

export class ChangeRoutingPointsOperation implements Operation {
    static readonly KIND = "changeRoutingPoints";
    readonly kind = ChangeRoutingPointsOperation.KIND;
    constructor(public newRoutingPoints: ElementAndRoutingPoints[]) { }
}

export interface ElementAndRoutingPoints {
    elementId: string
    newRoutingPoints?: Point[];
}

export abstract class TriggerElementCreationAction implements Action {
    abstract readonly kind: string;
    constructor(public readonly elementTypeId: string,
        readonly args?: { [key: string]: string | number | boolean }) { }
}

export class TriggerNodeCreationAction extends TriggerElementCreationAction {
    static readonly KIND = "triggerNodeCreation";
    kind = TriggerNodeCreationAction.KIND;
}

export class TriggerEdgeCreationAction extends TriggerElementCreationAction {
    static readonly KIND = "triggerEdgeCreation";
    kind = TriggerEdgeCreationAction.KIND;
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
