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

import { Container } from 'inversify';
import 'mocha';
import {
    BoundsData,
    ConsoleLogger,
    Dimension,
    LayoutRegistry,
    Point,
    SCompartment,
    SLabel,
    SModelElement,
    SNode,
    SParentElement,
    TYPES,
    createFeatureSet,
    layoutableChildFeature
} from '~glsp-sprotty';
import { initializeDiagramContainer } from '../../default-modules';
import { GLSPGraph } from '../../lib/model';
import { StatefulLayouterExt } from './layouter';

export function gModel(): GLSPGraph {
    return new GLSPGraph();
}

export function sNode(
    type: string,
    nodeLayout?: string,
    size?: Dimension,
    position?: Point,
    layoutOptions?: { [key: string]: string | number | boolean }
): SNode {
    const node = new SNode();
    node.features = createFeatureSet(SNode.DEFAULT_FEATURES, { enable: [layoutableChildFeature] });
    node.position = position || {
        x: 0,
        y: 0
    };
    if (size) {
        node.size = size;
    }
    node.type = type;
    if (nodeLayout) {
        node.layout = nodeLayout;
    }
    node.layoutOptions = layoutOptions;
    return node;
}

export function sComp(type: string, compLayout: string, layoutOptions?: { [key: string]: string | number | boolean }): SCompartment {
    const comp = new SCompartment();
    comp.features = createFeatureSet(SCompartment.DEFAULT_FEATURES);
    comp.type = type;
    comp.layout = compLayout;
    comp.layoutOptions = layoutOptions;
    return comp;
}

export function sLabel(
    labelText: string,
    layoutOptions?: { [key: string]: string | number | boolean },
    position?: Point,
    size?: Dimension
): SLabel {
    const label = new SLabel();
    label.features = createFeatureSet(SLabel.DEFAULT_FEATURES);
    if (position) {
        label.position = position;
    }
    if (size) {
        label.size = size;
    }
    label.layoutOptions = layoutOptions;
    label.text = labelText;
    label.type = 'label';
    return label;
}

export function addToMap(map: Map<SModelElement, BoundsData>, element: SModelElement): void {
    map.set(element, {
        bounds: (element as any).bounds,
        boundsChanged: true,
        alignmentChanged: true
    });
    if (element instanceof SParentElement) {
        element.children.forEach(c => addToMap(map, c));
    }
}

export function layout(
    layoutRegistry: LayoutRegistry,
    log: ConsoleLogger,
    map: Map<SModelElement, BoundsData>,
    model: SNode | GLSPGraph
): void {
    map.clear();
    addToMap(map, model);
    const layouter = new StatefulLayouterExt(map, layoutRegistry, log);
    layouter.layout();
}

export function setupLayoutRegistry(): LayoutRegistry {
    // Generic Test setup
    // create client container that registers all default modules including the layoutModule
    const layoutContainer = initializeDiagramContainer(new Container());
    return layoutContainer.get<LayoutRegistry>(TYPES.LayoutRegistry);
}
