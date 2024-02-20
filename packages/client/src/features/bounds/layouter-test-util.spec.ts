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
    GCompartment,
    GLabel,
    GModelElement,
    GNode,
    GParentElement,
    TYPES,
    createFeatureSet,
    layoutableChildFeature
} from '@eclipse-glsp/sprotty';
import { initializeDiagramContainer } from '../../default-modules';
import { StatefulLayouterExt } from './layouter';
import { GGraph } from '../../model';

export function createGraph(): GGraph {
    return new GGraph();
}

export function createNode(
    type: string,
    nodeLayout?: string,
    size?: Dimension,
    position?: Point,
    layoutOptions?: { [key: string]: string | number | boolean }
): GNode {
    const node = new GNode();
    node.features = createFeatureSet(GNode.DEFAULT_FEATURES, { enable: [layoutableChildFeature] });
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

export function createCompartment(
    type: string,
    compLayout: string,
    layoutOptions?: { [key: string]: string | number | boolean }
): GCompartment {
    const comp = new GCompartment();
    comp.features = createFeatureSet(GCompartment.DEFAULT_FEATURES);
    comp.type = type;
    comp.layout = compLayout;
    comp.layoutOptions = layoutOptions;
    return comp;
}

export function createLabel(
    labelText: string,
    layoutOptions?: { [key: string]: string | number | boolean },
    position?: Point,
    size?: Dimension
): GLabel {
    const label = new GLabel();
    label.features = createFeatureSet(GLabel.DEFAULT_FEATURES);
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

export function addToMap(map: Map<GModelElement, BoundsData>, element: GModelElement): void {
    map.set(element, {
        bounds: (element as any).bounds,
        boundsChanged: true,
        alignmentChanged: true
    });
    if (element instanceof GParentElement) {
        element.children.forEach(c => addToMap(map, c));
    }
}

export function layout(
    layoutRegistry: LayoutRegistry,
    log: ConsoleLogger,
    map: Map<GModelElement, BoundsData>,
    model: GNode | GGraph
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
