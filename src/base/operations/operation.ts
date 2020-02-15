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
}

export function isCreateOperation(object?: any): object is CreateOperation {
    return isAction(object) && "elementTypeId" in object;
}

export class CreateNodeOperation implements CreateOperation {
    static readonly KIND = "createNode";
    readonly kind = CreateNodeOperation.KIND;

    constructor(public readonly elementTypeId: string,
        public location?: Point,
        public containerId?: string) { }
}

export function isCreateNodeOperation(object?: any): object is CreateNodeOperation {
    return isCreateOperation() && object.kind === CreateNodeOperation.KIND;
}

export class CreateConnectionOperation implements CreateOperation {
    static readonly KIND = "createConnection";
    readonly kind = CreateConnectionOperation.KIND;


    constructor(public readonly elementTypeId: string,
        public sourceElementId?: string,
        public targetElementId?: string) { }
}

export function isCreateConnectionOperation(object?: any): object is CreateConnectionOperation {
    return isCreateOperation() && object.kind === CreateConnectionOperation.KIND;
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

export class ReconnectConnectionOperation implements Operation {
    static readonly KIND = "reconnectOperationAction";
    readonly kind = ReconnectConnectionOperation.KIND;
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

export class InitCreateOperationAction implements Action {
    static KIND = "initCreateOperation";
    readonly kind = InitCreateOperationAction.KIND;
    constructor(public operationKind: string,
        public elementTypeId: string = "unkown",
        readonly args?: { [key: string]: string | number | boolean }) { }

}

export function isInitCreateOperationAction(object?: any): object is InitCreateOperationAction {
    return isAction(object) && object.kind === InitCreateOperationAction.KIND
        && "operationKind" in object && "elementTypeId" in object;
}
