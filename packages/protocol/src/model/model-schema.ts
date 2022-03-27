/********************************************************************************
 * Copyright (c) 2022 STMicroelectronics and others.
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
/**
 * Reexport of the sprotty-protocol model definitions with a `Schema` suffix. We use a class based
 * model representation on client and server side. The `Schema` suffix is used for type that represent
 * the serializable description of these graphical model elements.
 * The basic types `SModelElementSchema` and `SRootElementSchema` are already exported by the base action protocol so
 * we only have to reexport the advanced model element interfaces from sprotty-protocol.
 */
export {
    HtmlRoot as HtmlRootSchema,
    PreRenderedElement as PreRenderedElementSchema,
    SCompartment as SCompartmentSchema,
    SEdge as SEdgeSchema,
    SGraph as SGraphSchema,
    ShapedPreRenderedElement as ShapedPreRenderedElementSchema,
    SLabel as SLabelSchema,
    SNode as SNodeSchema,
    SPort as SPortSchema,
    SShapeElement as SShapeElementSchema
} from 'sprotty-protocol/lib/model';
