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
    Action,
    Bounds,
    ComputedBoundsAction,
    DefaultTypes,
    EdgeRouterRegistry,
    GModelElement,
    GModelElementRegistration,
    GModelFactory,
    GModelRoot,
    GModelRootSchema,
    GNode,
    GParentElement,
    IActionDispatcher,
    Layouter,
    NullLogger,
    Point,
    RequestAction,
    RequestBoundsAction,
    RequestExportAction,
    ResponseAction,
    TYPES,
    Viewport,
    createFeatureSet
} from '@eclipse-glsp/sprotty';
import { Container } from 'inversify';
import 'reflect-metadata';
import { h } from 'snabbdom';
import { describe, expect, it } from 'vitest';
import { EditorContextService } from '../../base/editor-context-service';
import { feedbackFeature } from '../../base/feedback/feedback-action-dispatcher';
import { ServerAction } from '../../base/model/glsp-model-source';
import { GModelRegistry } from '../../base/model/model-registry';
import { GEdge, GGraph } from '../../model';
import { enableFeatures } from '../../utils/gmodel-util';
import { routingModule } from '../routing/routing-module';
import { MARQUEE } from '../tools/marquee-selection/marquee-tool-feedback';
import { MarqueeNode } from '../tools/marquee-selection/model';
import { InsertIndicator } from '../tools/node-creation/insert-indicator';
import { GIssueMarker, getOrCreateGIssueMarker } from '../validation/issue-marker';
import { GLSPHiddenBoundsUpdater } from './glsp-hidden-bounds-updater';
import { LocalRequestBoundsAction } from './local-bounds';

class RecordingActionDispatcher implements IActionDispatcher {
    readonly dispatched: Action[] = [];

    async dispatch(action: Action): Promise<void> {
        this.dispatched.push(action);
    }

    async dispatchAll(actions: Action[]): Promise<void> {
        this.dispatched.push(...actions);
    }

    // the remaining API is not exercised by the bounds pass

    async request<Res extends ResponseAction>(_action: RequestAction<Res>): Promise<Res> {
        throw new Error('not used in this spec');
    }

    async requestUntil<Res extends ResponseAction>(_action: RequestAction<Res>): Promise<Res | undefined> {
        throw new Error('not used in this spec');
    }

    dispatchOnceModelInitialized(...actions: Action[]): void {
        this.dispatched.push(...actions);
    }

    async onceModelInitialized(): Promise<void> {
        // nothing to wait for
    }

    dispatchAfterNextUpdate(...actions: Action[]): void {
        this.dispatched.push(...actions);
    }
}

class NoopLayouter extends Layouter {
    failNext = false;

    override layout(): void {
        // the leak is about which elements are reported, not about their layout
        if (this.failNext) {
            this.failNext = false;
            throw new Error('layout failed');
        }
    }
}

class StubEditorContextService extends EditorContextService {
    override get viewportData(): Readonly<Viewport> {
        return { scroll: Point.ORIGIN, zoom: 1 };
    }

    override get canvasBounds(): Readonly<Bounds> {
        return Bounds.EMPTY;
    }
}

class TestHiddenBoundsUpdater extends GLSPHiddenBoundsUpdater {
    readonly noopLayouter = new NoopLayouter();

    constructor(readonly recordingDispatcher: RecordingActionDispatcher) {
        super();
        this.logger = new NullLogger();
        this.layouter = this.noopLayouter;
        this.actionDispatcher = recordingDispatcher;
        this.editorContext = new StubEditorContextService();
    }

    /** Stand-in for the real DOM measurement: every registered element reports a changed size. */
    protected override getBoundsFromDOM(): void {
        this.getElement2BoundsData().forEach(boundsData => {
            boundsData.bounds = { x: 0, y: 0, width: 20, height: 20 };
            boundsData.boundsChanged = true;
        });
    }

    /**
     * Mimics a hidden rendering. The real viewer decorates bottom-up, so children come first and
     * the root last, which is what we replicate here.
     */
    renderHidden(root: GModelRoot): void {
        root.children.forEach(child => this.decorateRecursively(child));
        this.decorate(h('g'), root);
    }

    protected decorateRecursively(element: GModelElement): void {
        if (element instanceof GParentElement) {
            element.children.forEach(child => this.decorateRecursively(child));
        }
        this.decorate(h('g'), element);
    }
}

/** Bounds updater wired with the real routers, so an edge is routed as it is in a running client. */
class RoutingTestHiddenBoundsUpdater extends TestHiddenBoundsUpdater {
    protected override readonly edgeRouterRegistry = createRouterRegistry();
}

function createRoot(nodeId: string): GModelRoot {
    const root = new GGraph();
    root.id = 'root';
    root.type = 'graph';
    root.features = new Set<symbol>(GGraph.DEFAULT_FEATURES);
    addNode(root, nodeId);
    return root;
}

function addNode(root: GModelRoot, nodeId: string, position: Point = Point.ORIGIN): GNode {
    const node = new GNode();
    node.id = nodeId;
    node.type = 'node';
    node.features = new Set<symbol>(GNode.DEFAULT_FEATURES);
    node.bounds = { ...position, width: 10, height: 10 };
    root.add(node);
    return node;
}

function addEdge(root: GModelRoot, sourceId: string, targetId: string): GEdge {
    const edge = new GEdge();
    edge.id = `${sourceId}-${targetId}`;
    edge.type = 'edge';
    edge.features = createFeatureSet(GEdge.DEFAULT_FEATURES);
    edge.sourceId = sourceId;
    edge.targetId = targetId;
    root.add(edge);
    return edge;
}

function createRouterRegistry(): EdgeRouterRegistry {
    const container = new Container();
    container.load(routingModule);
    return container.get<EdgeRouterRegistry>(EdgeRouterRegistry);
}

/**
 * Wires the real model factory the way the client does, so a model built through it is subject to
 * the same feature handling as in production, i.e. every element of a type shares the feature set
 * derived from its registration.
 */
function createModelFactory(): GModelFactory {
    const container = new Container();
    const registrations: GModelElementRegistration[] = [
        { type: DefaultTypes.GRAPH, constr: GGraph },
        { type: DefaultTypes.NODE, constr: GNode },
        { type: DefaultTypes.ISSUE_MARKER, constr: GIssueMarker },
        { type: MARQUEE, constr: MarqueeNode }
    ];
    registrations.forEach(registration => container.bind(TYPES.SModelElementRegistration).toConstantValue(registration));
    container.bind(TYPES.SModelRegistry).to(GModelRegistry).inSingletonScope();
    container.bind(TYPES.IModelFactory).to(GModelFactory).inSingletonScope();
    return container.get<GModelFactory>(TYPES.IModelFactory);
}

/** Stand-in for the dangling edge the edge-creation tool draws while the user is connecting. */
function addFeedbackEdge(root: GModelRoot): GEdge {
    const edge = new GEdge();
    edge.id = 'feedback_edge';
    edge.type = 'edge';
    edge.features = createFeatureSet(GEdge.DEFAULT_FEATURES);
    enableFeatures(edge, feedbackFeature);
    root.add(edge);
    return edge;
}

function serverBoundsRequest(root: GModelRoot): RequestBoundsAction {
    const action = RequestBoundsAction.create(root as unknown as GModelRootSchema);
    // the model source marks every inbound action, which is what makes it a non-local request
    ServerAction.mark(action);
    return action;
}

function computedBounds(dispatcher: RecordingActionDispatcher): ComputedBoundsAction {
    const dispatched = dispatcher.dispatched.filter(ComputedBoundsAction.is);
    expect(dispatched).toHaveLength(1);
    return dispatched[0];
}

function computedBoundsIds(dispatcher: RecordingActionDispatcher): string[] {
    return computedBounds(dispatcher).bounds.map(bounds => bounds.elementId);
}

function computedRouteIds(dispatcher: RecordingActionDispatcher): string[] {
    return (computedBounds(dispatcher).routes ?? []).map(route => route.elementId);
}

describe('GLSPHiddenBoundsUpdater', () => {
    it('reports the bounds of the elements of the rendered model', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);
        const serverModel = createRoot('node0');

        updater.renderHidden(serverModel);
        updater.postUpdate(serverBoundsRequest(serverModel));

        expect(computedBoundsIds(dispatcher)).toEqual(['node0']);
    });

    it('does not report issue marker bounds for a server bounds request', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        const model = createRoot('node0');
        const marker = getOrCreateGIssueMarker(model.children[0] as GNode);
        marker.issues.push({ message: 'invalid', severity: 'error' });

        updater.renderHidden(model);
        updater.postUpdate(serverBoundsRequest(model));

        expect(computedBoundsIds(dispatcher)).toEqual(['node0']);
    });

    it('does not report issue marker bounds of a factory-built hidden model for a server bounds request', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        const liveModel = createRoot('node0');
        const marker = getOrCreateGIssueMarker(liveModel.children[0] as GNode);
        marker.issues.push({ message: 'invalid', severity: 'error' });

        // the hidden rendering runs on a factory copy of the live root, and the marker registration
        // contributes no feedback feature, so the marking only survives because the factory takes
        // over the features of the element it is handed
        const hiddenModel = createModelFactory().createRoot(liveModel);
        const copiedMarker = (hiddenModel.children[0] as GParentElement).children.find(child => child instanceof GIssueMarker);
        expect(copiedMarker?.hasFeature(feedbackFeature)).toBe(true);

        updater.renderHidden(hiddenModel);
        updater.postUpdate(serverBoundsRequest(hiddenModel));

        expect(computedBoundsIds(dispatcher)).toEqual(['node0']);
    });

    it('does not report the bounds of the client-only elements the tools add for a server bounds request', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        const model = createRoot('node0');
        const indicator = new InsertIndicator();
        indicator.id = 'insert-indicator';
        model.add(indicator);
        // the marquee gets its features from its registration, just like in a running client
        const marquee = createModelFactory().createElement({ type: MARQUEE, id: 'marquee' });
        model.add(marquee);

        updater.renderHidden(model);
        updater.postUpdate(serverBoundsRequest(model));

        expect(computedBoundsIds(dispatcher)).toEqual(['node0']);
    });

    it('does not report the route of a feedback edge for a server bounds request', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        const model = createRoot('node0');
        const feedbackEdge = addFeedbackEdge(model);

        updater.renderHidden(model);
        updater.postUpdate(serverBoundsRequest(model));

        expect(computedRouteIds(dispatcher)).not.toContain(feedbackEdge.id);
    });

    it('leaves out the route of an edge the router cannot route', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new RoutingTestHiddenBoundsUpdater(dispatcher);

        const model = createRoot('node0');
        // the target is not part of the model, so the router reports an empty route
        const edge = addEdge(model, 'node0', 'missing');

        updater.renderHidden(model);
        updater.postUpdate(serverBoundsRequest(model));

        expect(computedRouteIds(dispatcher)).not.toContain(edge.id);
    });

    it('reports the route of an edge the router can route', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new RoutingTestHiddenBoundsUpdater(dispatcher);

        const model = createRoot('node0');
        addNode(model, 'node1', { x: 100, y: 100 });
        const edge = addEdge(model, 'node0', 'node1');

        updater.renderHidden(model);
        updater.postUpdate(serverBoundsRequest(model));

        expect(computedRouteIds(dispatcher)).toContain(edge.id);
    });

    it('leaves out the routes an overridden calcElementRoute declines', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new (class extends TestHiddenBoundsUpdater {
            protected override calcElementRoute(): undefined {
                return undefined;
            }
        })(dispatcher);

        const model = createRoot('node0');
        addFeedbackEdge(model);

        updater.renderHidden(model);
        updater.postUpdate(LocalRequestBoundsAction.create(model));

        // a local request reports feedback routes, so an empty result is down to the override alone
        expect(computedBounds(dispatcher).routes).toBeUndefined();
    });

    it('reports the route of a feedback edge for a local bounds request', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        const model = createRoot('node0');
        const feedbackEdge = addFeedbackEdge(model);

        updater.renderHidden(model);
        updater.postUpdate(LocalRequestBoundsAction.create(model));

        expect(computedRouteIds(dispatcher)).toContain(feedbackEdge.id);
    });

    it('does not report client-side issue marker bounds to the server after an export (GLSP-1717)', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        // the client model carries a validation marker that only exists client-side
        const clientModel = createRoot('node0');
        const marker = getOrCreateGIssueMarker(clientModel.children[0] as GNode);
        marker.issues.push({ message: 'invalid', severity: 'error' });
        expect(marker.id).toBeTruthy();

        // 1) the export renders the client model (including the marker) through the hidden viewer
        updater.renderHidden(clientModel);
        updater.postUpdate(RequestExportAction.create('svg'));
        expect(dispatcher.dispatched.filter(ComputedBoundsAction.is)).toHaveLength(0);

        // 2) the server then asks for the bounds of a model that has no marker in it
        const serverModel = createRoot('node0');
        updater.renderHidden(serverModel);
        updater.postUpdate(serverBoundsRequest(serverModel));

        const reportedIds = computedBoundsIds(dispatcher);
        expect(reportedIds).not.toContain(marker.id);
        expect(reportedIds).toEqual(['node0']);
    });

    it('does not report issue marker bounds to the server after a successful local bounds request', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        const clientModel = createRoot('node0');
        const marker = getOrCreateGIssueMarker(clientModel.children[0] as GNode);
        marker.issues.push({ message: 'invalid', severity: 'error' });

        // 1) a local bounds request measures the live model, markers included
        updater.renderHidden(clientModel);
        updater.postUpdate(LocalRequestBoundsAction.create(clientModel));
        const localComputedBounds = dispatcher.dispatched.filter(ComputedBoundsAction.is);
        expect(localComputedBounds).toHaveLength(1);
        expect(localComputedBounds[0].bounds.map(bounds => bounds.elementId)).toContain(marker.id);
        // it stays local, so it is never forwarded to the server
        expect(ServerAction.is(localComputedBounds[0])).toBe(true);

        // 2) the next server request must not inherit anything from it
        dispatcher.dispatched.length = 0;
        const serverModel = createRoot('node0');
        updater.renderHidden(serverModel);
        updater.postUpdate(serverBoundsRequest(serverModel));

        expect(computedBoundsIds(dispatcher)).toEqual(['node0']);
    });

    it('does not report issue marker bounds to the server after an interrupted hidden rendering', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        const clientModel = createRoot('node0');
        const marker = getOrCreateGIssueMarker(clientModel.children[0] as GNode);
        marker.issues.push({ message: 'invalid', severity: 'error' });

        // 1) a hidden rendering that dies in the viewer, e.g. in a view or in the snabbdom patch,
        // before `HiddenModelViewer.update` gets to call `postUpdate`
        updater.renderHidden(clientModel);

        // 2) the server then asks for the bounds of a model that has no marker in it
        const serverModel = createRoot('node0');
        updater.renderHidden(serverModel);
        updater.postUpdate(serverBoundsRequest(serverModel));

        const reportedIds = computedBoundsIds(dispatcher);
        expect(reportedIds).not.toContain(marker.id);
        expect(reportedIds).toEqual(['node0']);
    });

    it('does not report issue marker bounds to the server after a failed local bounds request', () => {
        const dispatcher = new RecordingActionDispatcher();
        const updater = new TestHiddenBoundsUpdater(dispatcher);

        const clientModel = createRoot('node0');
        const marker = getOrCreateGIssueMarker(clientModel.children[0] as GNode);
        marker.issues.push({ message: 'invalid', severity: 'error' });

        // 1) a local bounds request that fails while computing, e.g. in the layouter
        updater.renderHidden(clientModel);
        updater.noopLayouter.failNext = true;
        expect(() => updater.postUpdate(LocalRequestBoundsAction.create(clientModel))).toThrow('layout failed');
        expect(dispatcher.dispatched.filter(ComputedBoundsAction.is)).toHaveLength(0);

        // 2) the server then asks for the bounds of a model that has no marker in it
        const serverModel = createRoot('node0');
        updater.renderHidden(serverModel);
        updater.postUpdate(serverBoundsRequest(serverModel));

        const reportedIds = computedBoundsIds(dispatcher);
        expect(reportedIds).not.toContain(marker.id);
        expect(reportedIds).toEqual(['node0']);
    });
});
