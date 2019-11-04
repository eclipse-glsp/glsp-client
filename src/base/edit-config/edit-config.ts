/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { SEdge, SModelElement, SModelElementSchema, SNode, SParentElement } from "sprotty/lib";


export const edgeEditConfig = Symbol.for("edgeEditConfiguration");
export const nodeEditConfig = Symbol.for("nodeEditConfiguration");
export interface EditConfig {
    deletable: boolean
    repositionable: boolean
    configType: symbol
    elementTypeId?: string

}

export interface NodeEditConfig extends EditConfig {
    resizable: boolean
    isContainer(): boolean
    isContainableElement(input: SModelElement | SModelElementSchema | string): boolean
}

export interface EdgeEditConfig extends EditConfig {
    routable: boolean
    isAllowedSource(input: SModelElement | SModelElementSchema | string): boolean
    isAllowedTarget(input: SModelElement | SModelElementSchema | string): boolean
}

export interface IEditConfigProvider {
    getEditConfig(input: SModelElement | SModelElementSchema | string): EditConfig | undefined
}

export function isConfigurableElement(element: SModelElement): element is SModelElement & EditConfig {
    return (<any>element).configType !== undefined && typeof ((<any>element).configType) === "symbol";
}

export function isConfigurableEdge(element: SModelElement): element is SEdge & EdgeEditConfig {
    return element instanceof SEdge && isConfigurableElement(element) && element.configType === edgeEditConfig;
}
export function isConfigurableNode(element: SModelElement): element is SNode & NodeEditConfig {
    return element instanceof SNode && isConfigurableElement(element) && element.configType === nodeEditConfig;
}

export function isEdgeEditConfig(editConfig: EditConfig): editConfig is EdgeEditConfig {
    return editConfig.configType === edgeEditConfig;
}

export function isNodeEditConfig(editConfig: EditConfig): editConfig is NodeEditConfig {
    return editConfig.configType === nodeEditConfig;
}

export function movingAllowed(element: SModelElement): element is SNode & NodeEditConfig {
    return isConfigurableNode(element) && element.repositionable;
}

export function containmentAllowed(element: SModelElement, containableElementTypeId: string)
    : element is SParentElement & NodeEditConfig {
    return isConfigurableNode(element) && element.isContainableElement(containableElementTypeId);
}

