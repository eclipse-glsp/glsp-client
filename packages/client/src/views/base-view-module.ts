/********************************************************************************
 * Copyright (c) 2021-2025 EclipseSource and others.
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
    BindingContext,
    CircularNode,
    CircularNodeView,
    DefaultTypes,
    DiamondNode,
    DiamondNodeView,
    ExpandButtonView,
    FeatureModule,
    ForeignObjectView,
    GButton,
    GCompartment,
    GCompartmentView,
    GForeignObjectElement,
    GHtmlRoot,
    GLabel,
    GLabelView,
    GNode,
    GPort,
    GPreRenderedElement,
    GRoutingHandle,
    GShapedPreRenderedElement,
    GViewportRootElement,
    HtmlRootView,
    PreRenderedView,
    RectangularNode,
    RectangularNodeView,
    SvgViewportView,
    configureModelElement,
    moveFeature,
    selectFeature
} from '@eclipse-glsp/sprotty';
import { GIssueMarker } from '../features/validation/issue-marker';
import { GEdge, GGraph } from '../model';
import { GEdgeView } from './gedge-view';
import { GGraphView } from './ggraph-view';
import { GIssueMarkerView } from './issue-marker-view';
import { RoundedCornerNodeView } from './rounded-corner-view';
import { GRoutingHandleView } from './routing-point-handle-view';

export const baseViewModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        configureDefaultModelElements(context);
    },
    { featureId: Symbol('baseView') }
);

export function configureDefaultModelElements(context: Pick<BindingContext, 'bind' | 'isBound'>): void {
    // HTML elements
    configureModelElement(context, DefaultTypes.HTML, GHtmlRoot, HtmlRootView);

    // generic elements
    configureModelElement(context, DefaultTypes.FOREIGN_OBJECT, GForeignObjectElement, ForeignObjectView, {
        disable: [selectFeature, moveFeature]
    });
    configureModelElement(context, DefaultTypes.PRE_RENDERED, GPreRenderedElement, PreRenderedView);
    configureModelElement(context, DefaultTypes.SHAPE_PRE_RENDERED, GShapedPreRenderedElement, PreRenderedView);

    // SVG elements
    configureModelElement(context, DefaultTypes.SVG, GViewportRootElement, SvgViewportView);

    // graph elements
    configureModelElement(context, DefaultTypes.GRAPH, GGraph, GGraphView);
    configureModelElement(context, DefaultTypes.NODE, GNode, RoundedCornerNodeView);
    configureModelElement(context, DefaultTypes.COMPARTMENT, GCompartment, GCompartmentView);
    configureModelElement(context, DefaultTypes.COMPARTMENT_HEADER, GCompartment, GCompartmentView);
    configureModelElement(context, DefaultTypes.EDGE, GEdge, GEdgeView);
    configureModelElement(context, DefaultTypes.PORT, GPort, RectangularNodeView);
    configureModelElement(context, DefaultTypes.ROUTING_POINT, GRoutingHandle, GRoutingHandleView);
    configureModelElement(context, DefaultTypes.VOLATILE_ROUTING_POINT, GRoutingHandle, GRoutingHandleView);
    configureModelElement(context, DefaultTypes.LABEL, GLabel, GLabelView);

    // UI elements
    configureModelElement(context, DefaultTypes.BUTTON_EXPAND, GButton, ExpandButtonView);
    configureModelElement(context, DefaultTypes.ISSUE_MARKER, GIssueMarker, GIssueMarkerView);

    // shapes
    configureModelElement(context, DefaultTypes.NODE_CIRCLE, CircularNode, CircularNodeView);
    configureModelElement(context, DefaultTypes.NODE_DIAMOND, DiamondNode, DiamondNodeView);
    configureModelElement(context, DefaultTypes.NODE_RECTANGLE, RectangularNode, RectangularNodeView);
}
