/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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
export {
    Alignable,
    EdgeLayoutable,
    EdgePlacement,
    EdgeSide,
    Expandable,
    Fadeable,
    SButton as GButtonSchema,
    SCompartment as GCompartmentSchema,
    SEdge as GEdgeSchema,
    ForeignObjectElement as GForeignObjectElementSchema,
    SGraph as GGraphSchema,
    HtmlRoot as GHtmlRootSchema,
    SIssue as GIssue,
    SIssueMarker as GIssueMarkerSchema,
    SIssueSeverity as GIssueSeverity,
    SLabel as GLabelSchema,
    SModelElement as GModelElementSchema,
    SModelRoot as GModelRootSchema,
    SNode as GNodeSchema,
    SPort as GPortSchema,
    PreRenderedElement as GPreRenderedElementSchema,
    SShapeElement as GShapeElementSchema,
    ShapedPreRenderedElement as GShapedPreRenderedElementSchema,
    ViewportRootElement as GViewportRootElementSchema,
    HAlignment,
    Hoverable,
    LayoutKind,
    Locateable,
    ModelLayoutOptions,
    Projectable,
    Scrollable,
    Selectable,
    VAlignment,
    Viewport,
    Zoomable,
    isScrollable,
    isZoomable
} from 'sprotty-protocol/lib/model';
export * from 'sprotty-protocol/lib/utils/async';
export * from 'sprotty-protocol/lib/utils/geometry';
export * from 'sprotty-protocol/lib/utils/json';
export { applyBounds, cloneModel, findElement, getBasicType, getSubType } from 'sprotty-protocol/lib/utils/model-utils';
