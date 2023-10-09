/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
/* eslint-disable @typescript-eslint/no-shadow */

import {
    BringToFrontAction,
    CollapseExpandAction,
    CollapseExpandAllAction,
    GetSelectionAction,
    GetViewportAction,
    HoverFeedbackAction,
    MoveAction,
    OpenAction,
    SelectionResult,
    SetBoundsAction,
    SetViewportAction,
    ViewportResult
} from 'sprotty-protocol/lib/actions';
import { Action, RequestAction } from './action-protocol/base-protocol';
import { hasArrayProp, hasBooleanProp, hasObjectProp, hasStringProp } from './utils/type-util';

/*
 * Subset of the actions defined in sprotty-protocol that are reused as is i.e. they don't have a dedicated
 * replacement in the GLSP action protocol.
 *
 * Module augmentation is used to provide utility functions (typeguards etc.) via corresponding namespace.
 */

declare module 'sprotty-protocol/lib/actions' {
    namespace BringToFrontAction {
        function is(object: unknown): object is BringToFrontAction;
    }
    namespace CollapseExpandAction {
        function is(object: unknown): object is CollapseExpandAction;
    }
    namespace CollapseExpandAllAction {
        function is(object: unknown): object is CollapseExpandAllAction;
    }
    namespace GetSelectionAction {
        function is(object: unknown): object is GetSelectionAction;
    }
    namespace GetViewportAction {
        function is(object: unknown): object is GetViewportAction;
    }
    namespace HoverFeedbackAction {
        function is(object: unknown): object is HoverFeedbackAction;
    }
    namespace MoveAction {
        function is(object: unknown): object is MoveAction;
    }
    namespace OpenAction {
        function is(object: unknown): object is OpenAction;
    }
    namespace SelectionResult {
        function is(object: unknown): object is SelectionResult;
    }
    namespace SetBoundsAction {
        function is(object: unknown): object is SetBoundsAction;
    }
    namespace SetViewportAction {
        function is(object: unknown): object is SetViewportAction;
    }
    namespace ViewportResult {
        function is(object: unknown): object is ViewportResult;
    }
}

CollapseExpandAction.is = (object): object is CollapseExpandAction =>
    Action.hasKind(object, CollapseExpandAction.KIND) && hasArrayProp(object, 'expandIds') && hasArrayProp(object, 'collapseIds');

CollapseExpandAllAction.is = (object): object is CollapseExpandAllAction =>
    Action.hasKind(object, CollapseExpandAllAction.KIND) && hasBooleanProp(object, 'expand');

GetSelectionAction.is = (object): object is GetSelectionAction => RequestAction.hasKind(object, GetSelectionAction.KIND);

GetViewportAction.is = (object): object is GetViewportAction => RequestAction.hasKind(object, GetViewportAction.KIND);

HoverFeedbackAction.is = (object): object is HoverFeedbackAction =>
    Action.hasKind(object, HoverFeedbackAction.KIND) && hasStringProp(object, 'mouseoverElement') && hasBooleanProp(object, 'mouseIsOver');

MoveAction.is = (object): object is MoveAction =>
    Action.hasKind(object, MoveAction.KIND) &&
    hasArrayProp(object, 'moves') &&
    hasBooleanProp(object, 'animate') &&
    hasBooleanProp(object, 'finished');

OpenAction.is = (object): object is OpenAction => Action.hasKind(object, OpenAction.KIND) && hasStringProp(object, 'elementId');

SelectionResult.is = (object): object is SelectionResult =>
    Action.hasKind(object, SelectionResult.KIND) && hasArrayProp(object, 'selectedElementsIDs');

SetBoundsAction.is = (object): object is SetBoundsAction => Action.hasKind(object, SetBoundsAction.KIND) && hasObjectProp(object, 'bounds');

SetViewportAction.is = (object): object is SetViewportAction =>
    Action.hasKind(object, SetViewportAction.KIND) &&
    hasStringProp(object, 'elementId') &&
    hasObjectProp(object, 'newViewport') &&
    hasBooleanProp(object, 'animate');

ViewportResult.is = (object): object is ViewportResult =>
    Action.hasKind(object, ViewportResult.KIND) && hasObjectProp(object, 'viewport') && hasObjectProp(object, 'canvasBounds');

export {
    BringToFrontAction,
    CollapseExpandAction,
    CollapseExpandAllAction,
    GetSelectionAction,
    GetViewportAction,
    HoverFeedbackAction,
    MoveAction,
    OpenAction,
    SelectionResult,
    SetBoundsAction,
    SetViewportAction,
    ViewportResult
};
