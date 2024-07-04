/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
    AddRemoveBezierSegmentCommand,
    AnchorComputerRegistry,
    BezierDiamondAnchor,
    BezierEllipseAnchor,
    BezierRectangleAnchor,
    DiamondAnchor,
    EdgeRouterRegistry,
    EllipseAnchor,
    FeatureModule,
    ManhattanDiamondAnchor,
    ManhattanEllipticAnchor,
    ManhattanRectangularAnchor,
    RectangleAnchor,
    TYPES,
    bindAsService,
    configureCommand
} from '@eclipse-glsp/sprotty';
import { GLSPBezierEdgeRouter, GLSPManhattanEdgeRouter, GLSPPolylineEdgeRouter } from './edge-router';

export const routingModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        bind(EdgeRouterRegistry).toSelf().inSingletonScope();
        bind(AnchorComputerRegistry).toSelf().inSingletonScope();

        bindAsService(context, TYPES.IEdgeRouter, GLSPManhattanEdgeRouter);
        bindAsService(context, TYPES.IAnchorComputer, ManhattanEllipticAnchor);
        bindAsService(context, TYPES.IAnchorComputer, ManhattanRectangularAnchor);
        bindAsService(context, TYPES.IAnchorComputer, ManhattanDiamondAnchor);

        bindAsService(context, TYPES.IEdgeRouter, GLSPPolylineEdgeRouter);
        bindAsService(context, TYPES.IAnchorComputer, EllipseAnchor);
        bindAsService(context, TYPES.IAnchorComputer, RectangleAnchor);
        bindAsService(context, TYPES.IAnchorComputer, DiamondAnchor);

        bindAsService(context, TYPES.IEdgeRouter, GLSPBezierEdgeRouter);
        bindAsService(context, TYPES.IAnchorComputer, BezierEllipseAnchor);
        bindAsService(context, TYPES.IAnchorComputer, BezierRectangleAnchor);
        bindAsService(context, TYPES.IAnchorComputer, BezierDiamondAnchor);

        configureCommand({ bind, isBound }, AddRemoveBezierSegmentCommand);
    },
    { featureId: Symbol('routing') }
);
