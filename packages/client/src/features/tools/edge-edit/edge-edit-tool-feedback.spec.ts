/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
    AnimationFrameSyncer,
    CommandExecutionContext,
    ConsoleLogger,
    GChildElement,
    GModelElement,
    GModelElementSchema,
    GModelFactory,
    GNode,
    GParentElement,
    createFeatureSet
} from '@eclipse-glsp/sprotty';
import { beforeEach, describe, expect, it } from 'vitest';
import { feedbackFeature } from '../../../base/feedback/feedback-action-dispatcher';
import { GEdge, GGraph } from '../../../model';
import { drawFeedbackEdgeSource } from './edge-edit-tool-feedback';

const EDGE_TYPE = 'edge';

/** Creates edges the way the real factory does, i.e. all elements of a type share one feature set. */
class SharedFeatureSetModelFactory extends GModelFactory {
    readonly sharedEdgeFeatures = createFeatureSet(GEdge.DEFAULT_FEATURES);

    override createElement(schema: GModelElementSchema | GModelElement): GChildElement {
        const edge = new GEdge();
        edge.id = schema.id!;
        edge.type = schema.type;
        edge.features = this.sharedEdgeFeatures;
        return edge;
    }
}

describe('drawFeedbackEdgeSource', () => {
    let factory: SharedFeatureSetModelFactory;
    let context: CommandExecutionContext;

    beforeEach(() => {
        const root = new GGraph();
        root.id = 'root';
        root.type = 'graph';
        root.features = new Set<symbol>(GGraph.DEFAULT_FEATURES);
        const target = new GNode();
        target.id = 'node0';
        target.type = 'node';
        target.features = new Set<symbol>(GNode.DEFAULT_FEATURES);
        target.bounds = { x: 0, y: 0, width: 10, height: 10 };
        root.add(target);

        factory = new SharedFeatureSetModelFactory();
        context = {
            root,
            modelFactory: factory,
            duration: 0,
            modelChanged: undefined!,
            logger: new ConsoleLogger(),
            syncer: new AnimationFrameSyncer()
        };
    });

    function feedbackEdgeOf(root: GParentElement): GEdge {
        const edge = root.children.find(child => child instanceof GEdge);
        expect(edge).toBeDefined();
        return edge as GEdge;
    }

    it('marks the drawn edge as feedback so it is not reported to the server', () => {
        drawFeedbackEdgeSource(context, 'node0', EDGE_TYPE);

        expect(feedbackEdgeOf(context.root).hasFeature(feedbackFeature)).toBe(true);
    });

    it('leaves the feature set shared with the other elements of that type untouched', () => {
        drawFeedbackEdgeSource(context, 'node0', EDGE_TYPE);

        expect(factory.sharedEdgeFeatures.has(feedbackFeature)).toBe(false);
    });
});
