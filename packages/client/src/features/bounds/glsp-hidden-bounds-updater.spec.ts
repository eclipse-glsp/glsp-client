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
    GModelElement,
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
    Viewport
} from '@eclipse-glsp/sprotty';
import { h } from 'snabbdom';
import { describe, expect, it } from 'vitest';
import { EditorContextService } from '../../base/editor-context-service';
import { ServerAction } from '../../base/model/glsp-model-source';
import { GGraph } from '../../model';
import { getOrCreateGIssueMarker } from '../validation/issue-marker';
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

function createRoot(nodeId: string): GModelRoot {
    const root = new GGraph();
    root.id = 'root';
    root.type = 'graph';
    root.features = new Set<symbol>(GGraph.DEFAULT_FEATURES);
    const node = new GNode();
    node.id = nodeId;
    node.type = 'node';
    node.features = new Set<symbol>(GNode.DEFAULT_FEATURES);
    node.bounds = { x: 0, y: 0, width: 10, height: 10 };
    root.add(node);
    return root;
}

function serverBoundsRequest(root: GModelRoot): RequestBoundsAction {
    const action = RequestBoundsAction.create(root as unknown as GModelRootSchema);
    // the model source marks every inbound action, which is what makes it a non-local request
    ServerAction.mark(action);
    return action;
}

function computedBoundsIds(dispatcher: RecordingActionDispatcher): string[] {
    const computedBounds = dispatcher.dispatched.filter(ComputedBoundsAction.is);
    expect(computedBounds).toHaveLength(1);
    return computedBounds[0].bounds.map(bounds => bounds.elementId);
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
