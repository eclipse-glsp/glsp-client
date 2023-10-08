/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
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
    SCompartment as GCompartmentSchema,
    SEdge as GEdgeSchema,
    ForeignObjectElement as GForeignObjectElementSchema,
    SGraph as GGraphSchema,
    HtmlRoot as GHtmlRootSchema,
    SLabel as GLabelSchema,
    SModelElement as GModelElementSchema,
    SModelRoot as GModelRootSchema,
    SNode as GNodeSchema,
    SPort as GPortSchema,
    PreRenderedElement as GPreRenderedElementSchema,
    SShapeElement as GShapeElementSchema,
    ShapedPreRenderedElement as GShapePreRenderedElementSchema,
    ViewportRootElement as GViewPortRootElementSchema
} from 'sprotty-protocol/lib/model';
import { hasStringProp } from '../utils/type-util';

/** Serializable representation of GModel elements. This is the transfer format
 * used to exchange model information between client and server. Both the client and
 * server have a deserialization mechanism in place to convert a GModelElementSchema
 * into the corresponding class-based model (or EMF-based in case of the Java Server).
 *
 * To ensure sprotty compatibility all types are just aliases of the corresponding Sprotty SModel API element.
 */

export function isGModelElementSchema(object: any): object is GModelElementSchema {
    return typeof object === 'object' && hasStringProp(object, 'type') && hasStringProp(object, 'id');
}

export {
    GCompartmentSchema,
    GEdgeSchema,
    GForeignObjectElementSchema,
    GGraphSchema,
    GHtmlRootSchema,
    GLabelSchema,
    GModelElementSchema,
    GModelRootSchema,
    GNodeSchema,
    GPortSchema,
    GPreRenderedElementSchema,
    GShapeElementSchema,
    GShapePreRenderedElementSchema,
    GViewPortRootElementSchema
};
