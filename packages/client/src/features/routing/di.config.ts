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
import { ContainerModule } from 'inversify';
import {
    AddRemoveBezierSegmentCommand,
    AnchorComputerRegistry,
    BezierDiamondAnchor,
    BezierEdgeRouter,
    BezierEllipseAnchor,
    BezierRectangleAnchor,
    DiamondAnchor,
    EdgeRouterRegistry,
    EllipseAnchor,
    ManhattanDiamondAnchor,
    ManhattanEdgeRouter,
    ManhattanEllipticAnchor,
    ManhattanRectangularAnchor,
    PolylineEdgeRouter,
    RectangleAnchor,
    TYPES,
    bindOrRebind,
    configureCommand
} from '~glsp-sprotty';
import { GLSPManhattanEdgeRouter } from './glsp-manhattan-edge-router';

/**
 * Customization of the routing module for GLSP.
 */
const glspRoutingModule = new ContainerModule((bind, _unbind, isBound, rebind) => {
    const context = { bind, isBound, rebind };

    bind(EdgeRouterRegistry).toSelf().inSingletonScope();

    bind(AnchorComputerRegistry).toSelf().inSingletonScope();

    bind(GLSPManhattanEdgeRouter).toSelf().inSingletonScope();
    bind(ManhattanEdgeRouter).toService(GLSPManhattanEdgeRouter);
    bind(TYPES.IEdgeRouter).toService(ManhattanEdgeRouter);
    bind(ManhattanEllipticAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(ManhattanEllipticAnchor);
    bind(ManhattanRectangularAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(ManhattanRectangularAnchor);
    bind(ManhattanDiamondAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(ManhattanDiamondAnchor);

    bind(PolylineEdgeRouter).toSelf().inSingletonScope();
    bind(TYPES.IEdgeRouter).toService(PolylineEdgeRouter);
    bind(EllipseAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(EllipseAnchor);
    bind(RectangleAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(RectangleAnchor);
    bind(DiamondAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(DiamondAnchor);

    bind(BezierEdgeRouter).toSelf().inSingletonScope();
    bind(TYPES.IEdgeRouter).toService(BezierEdgeRouter);
    bind(BezierEllipseAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(BezierEllipseAnchor);
    bind(BezierRectangleAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(BezierRectangleAnchor);
    bind(BezierDiamondAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(BezierDiamondAnchor);

    configureCommand({ bind, isBound }, AddRemoveBezierSegmentCommand);

    bindOrRebind(context, ManhattanEdgeRouter).toService(GLSPManhattanEdgeRouter);
});

export default glspRoutingModule;
