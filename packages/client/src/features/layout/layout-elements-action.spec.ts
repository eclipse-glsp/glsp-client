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
/* eslint-disable deprecation/deprecation */
import { expect } from 'chai';
import { Container } from 'inversify';
import 'mocha';
import 'reflect-metadata';
import {
    Action,
    AnimationFrameSyncer,
    Bounds,
    ChangeBoundsOperation,
    CommandExecutionContext,
    ConsoleLogger,
    ElementAndBounds,
    ElementMove,
    FeatureSet,
    IActionDispatcher,
    MoveAction,
    MoveCommand,
    RequestAction,
    ResponseAction,
    SChildElement,
    SGraphFactory,
    SModelRoot,
    SetBoundsAction,
    SetBoundsCommand,
    TYPES
} from '~glsp-sprotty';
import { defaultModule } from '../../base/default.module';
import { SelectionService } from '../../base/selection-service';
import { resizeFeature } from '../change-bounds/model';
import {
    AlignElementsAction,
    AlignElementsActionHandler,
    Alignment,
    ResizeDimension,
    ResizeElementsAction,
    ResizeElementsActionHandler
} from './layout-elements-action';

class MockActionDispatcher implements IActionDispatcher {
    constructor(public dispatchedActions: Action[] = []) {}
    dispatch(action: Action): Promise<void> {
        this.dispatchedActions.push(action);
        return Promise.resolve();
    }
    dispatchAll(actions: Action[]): Promise<void> {
        actions.forEach(action => this.dispatchedActions.push(action));
        return Promise.resolve();
    }
    request<Res extends ResponseAction>(action: RequestAction<Res>): Promise<Res> {
        throw new Error('Method not implemented.');
    }
}

class MockSelectionService extends SelectionService {
    constructor(public modelRoot: SModelRoot) {
        super();
    }
    override getModelRoot(): Readonly<SModelRoot> {
        return this.modelRoot;
    }
}

// Generic Test setup
const container = new Container();
container.load(defaultModule);
container.rebind(TYPES.IModelFactory).to(SGraphFactory).inSingletonScope();
const graphFactory = container.get<SGraphFactory>(TYPES.IModelFactory);

const actionDispatcher = new MockActionDispatcher();

const node1 = {
    id: 'node1',
    type: 'node:circle',
    selected: true
};
const node2 = {
    id: 'node2',
    type: 'node:circle',
    selected: true
};
const node3 = {
    id: 'node3',
    type: 'node:circle',
    selected: true
};
const model = createModel();

function createModel(): SModelRoot {
    const root = graphFactory.createRoot({
        id: 'model1',
        type: 'graph',
        children: [node1, node2, node3]
    });
    root.children.forEach(child => applyFeature(child, resizeFeature));
    return root;
}

function applyFeature(element: SChildElement, feature: symbol): void {
    (element.features as FeatureSet & Set<symbol>).add(feature);
}

const context: CommandExecutionContext = {
    root: model,
    modelFactory: graphFactory,
    duration: 0,
    modelChanged: undefined!,
    logger: new ConsoleLogger(),
    syncer: new AnimationFrameSyncer()
};

const defaultSize = { height: 10, width: 10 };

describe('AlignElementsCommand', () => {
    let handler: AlignElementsActionHandler;
    const setModel = (newModel: SModelRoot): void => {
        handler['selectionService'] = new MockSelectionService(newModel);
    };

    beforeEach(() => {
        actionDispatcher.dispatchedActions = [];

        handler = new AlignElementsActionHandler();
        handler['actionDispatcher'] = actionDispatcher;
    });
    it('should align all elements left', () => {
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 111, y: 111 }, newSize: defaultSize },
            { elementId: 'node2', newPosition: { x: 222, y: 222 }, newSize: defaultSize },
            { elementId: 'node3', newPosition: { x: 333, y: 333 }, newSize: defaultSize }
        ]);
        const action = AlignElementsAction.create({ elementIds: ['node1', 'node2', 'node3'], alignment: Alignment.Left });
        setModel(newModel);
        handler.handle(action);

        assertAllBounds(
            new Map([
                ['node1', { x: 111, y: 111, width: defaultSize.width, height: defaultSize.height }],
                ['node2', { x: 111, y: 222, width: defaultSize.width, height: defaultSize.height }],
                ['node3', { x: 111, y: 333, width: defaultSize.width, height: defaultSize.height }]
            ])
        );
    });

    it('should align all elements right', () => {
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 111, y: 111 }, newSize: defaultSize },
            { elementId: 'node2', newPosition: { x: 222, y: 222 }, newSize: defaultSize },
            { elementId: 'node3', newPosition: { x: 333, y: 333 }, newSize: defaultSize }
        ]);
        const action = AlignElementsAction.create({ elementIds: ['node1', 'node2', 'node3'], alignment: Alignment.Right });
        setModel(newModel);
        handler.handle(action);
        assertAllBounds(
            new Map([
                ['node1', { x: 333, y: 111, width: defaultSize.width, height: defaultSize.height }],
                ['node2', { x: 333, y: 222, width: defaultSize.width, height: defaultSize.height }],
                ['node3', { x: 333, y: 333, width: defaultSize.width, height: defaultSize.height }]
            ])
        );
    });

    it('should align all elements center', () => {
        actionDispatcher.dispatchedActions = [];
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 111, y: 111 }, newSize: defaultSize },
            { elementId: 'node2', newPosition: { x: 222, y: 222 }, newSize: defaultSize },
            { elementId: 'node3', newPosition: { x: 333, y: 333 }, newSize: defaultSize }
        ]);
        const action = AlignElementsAction.create({ elementIds: ['node1', 'node2', 'node3'], alignment: Alignment.Center });
        setModel(newModel);
        handler.handle(action);

        assertAllBounds(
            new Map([
                ['node1', { x: 222, y: 111, width: defaultSize.width, height: defaultSize.height }],
                ['node2', { x: 222, y: 222, width: defaultSize.width, height: defaultSize.height }],
                ['node3', { x: 222, y: 333, width: defaultSize.width, height: defaultSize.height }]
            ])
        );
    });

    it('should align all elements top', () => {
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 111, y: 111 }, newSize: defaultSize },
            { elementId: 'node2', newPosition: { x: 222, y: 222 }, newSize: defaultSize },
            { elementId: 'node3', newPosition: { x: 333, y: 333 }, newSize: defaultSize }
        ]);
        const action = AlignElementsAction.create({ elementIds: ['node1', 'node2', 'node3'], alignment: Alignment.Top });
        setModel(newModel);
        handler.handle(action);

        assertAllBounds(
            new Map([
                ['node1', { x: 111, y: 111, width: defaultSize.width, height: defaultSize.height }],
                ['node2', { x: 222, y: 111, width: defaultSize.width, height: defaultSize.height }],
                ['node3', { x: 333, y: 111, width: defaultSize.width, height: defaultSize.height }]
            ])
        );
    });

    it('should align all elements bottom', () => {
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 111, y: 111 }, newSize: defaultSize },
            { elementId: 'node2', newPosition: { x: 222, y: 222 }, newSize: defaultSize },
            { elementId: 'node3', newPosition: { x: 333, y: 333 }, newSize: defaultSize }
        ]);
        const action = AlignElementsAction.create({ elementIds: ['node1', 'node2', 'node3'], alignment: Alignment.Bottom });
        setModel(newModel);
        handler.handle(action);

        assertAllBounds(
            new Map([
                ['node1', { x: 111, y: 333, width: defaultSize.width, height: defaultSize.height }],
                ['node2', { x: 222, y: 333, width: defaultSize.width, height: defaultSize.height }],
                ['node3', { x: 333, y: 333, width: defaultSize.width, height: defaultSize.height }]
            ])
        );
    });

    it('should align all elements middle', () => {
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 111, y: 111 }, newSize: defaultSize },
            { elementId: 'node2', newPosition: { x: 222, y: 222 }, newSize: defaultSize },
            { elementId: 'node3', newPosition: { x: 333, y: 333 }, newSize: defaultSize }
        ]);
        const action = AlignElementsAction.create({ elementIds: ['node1', 'node2', 'node3'], alignment: Alignment.Middle });
        setModel(newModel);
        handler.handle(action);

        assertAllBounds(
            new Map([
                ['node1', { x: 111, y: 222, width: defaultSize.width, height: defaultSize.height }],
                ['node2', { x: 222, y: 222, width: defaultSize.width, height: defaultSize.height }],
                ['node3', { x: 333, y: 222, width: defaultSize.width, height: defaultSize.height }]
            ])
        );
    });
});

describe('ResizeElementsCommand', () => {
    let handler: ResizeElementsActionHandler;
    const setModel = (newModel: SModelRoot): void => {
        handler['selectionService'] = new MockSelectionService(newModel);
    };

    beforeEach(() => {
        actionDispatcher.dispatchedActions = [];

        handler = new ResizeElementsActionHandler();
        handler['actionDispatcher'] = actionDispatcher;
    });
    it('should make same width as last', () => {
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 100, y: 100 }, newSize: { height: 10, width: 10 } },
            { elementId: 'node2', newPosition: { x: 100, y: 200 }, newSize: { height: 20, width: 20 } },
            { elementId: 'node3', newPosition: { x: 100, y: 300 }, newSize: { height: 30, width: 30 } }
        ]);
        const action = ResizeElementsAction.create({
            elementIds: ['node1', 'node2', 'node3'],
            dimension: ResizeDimension.Width,
            reduceFunction: 'last'
        });
        setModel(newModel);
        handler.handle(action);

        // resize is keeping the center, so the X moves by diff / 2
        assertAllBoundsInChangeBounds(
            new Map([
                ['node1', { x: 90, y: 100, height: 10, width: 30 }],
                ['node2', { x: 95, y: 200, height: 20, width: 30 }],
                ['node3', { x: 100, y: 300, height: 30, width: 30 }]
            ])
        );
    });

    it('should make same height as last', () => {
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 100, y: 100 }, newSize: { height: 10, width: 10 } },
            { elementId: 'node2', newPosition: { x: 100, y: 200 }, newSize: { height: 20, width: 20 } },
            { elementId: 'node3', newPosition: { x: 100, y: 300 }, newSize: { height: 30, width: 30 } }
        ]);
        const action = ResizeElementsAction.create({
            elementIds: ['node1', 'node2', 'node3'],
            dimension: ResizeDimension.Height,
            reduceFunction: 'last'
        });
        setModel(newModel);
        handler.handle(action);

        // resize is keeping the center, so the Y moves by diff / 2
        assertAllBoundsInChangeBounds(
            new Map([
                ['node1', { x: 100, y: 90, height: 30, width: 10 }],
                ['node2', { x: 100, y: 195, height: 30, width: 20 }],
                ['node3', { x: 100, y: 300, height: 30, width: 30 }]
            ])
        );
    });

    it('should make same width and height as last', () => {
        const newModel = initModel([
            { elementId: 'node1', newPosition: { x: 100, y: 100 }, newSize: { height: 10, width: 10 } },
            { elementId: 'node2', newPosition: { x: 100, y: 200 }, newSize: { height: 20, width: 20 } },
            { elementId: 'node3', newPosition: { x: 100, y: 300 }, newSize: { height: 30, width: 30 } }
        ]);
        const action = ResizeElementsAction.create({
            elementIds: ['node1', 'node2', 'node3'],
            dimension: ResizeDimension.Width_And_Height,
            reduceFunction: 'last'
        });
        setModel(newModel);
        handler.handle(action);

        // resize is keeping the center, so the Y moves by diff / 2
        assertAllBoundsInChangeBounds(
            new Map([
                ['node1', { x: 90, y: 90, height: 30, width: 30 }],
                ['node2', { x: 95, y: 195, height: 30, width: 30 }],
                ['node3', { x: 100, y: 300, height: 30, width: 30 }]
            ])
        );
    });
});

function initModel(elementAndBounds: ElementAndBounds[]): SModelRoot {
    const mySetBoundsAction = SetBoundsAction.create(elementAndBounds);
    const setBoundsCommand = new SetBoundsCommand(mySetBoundsAction);
    return setBoundsCommand.execute(context) as SModelRoot;
}

function assertAllBounds(allBounds: Map<string, Bounds>): void {
    allBounds.forEach((bounds, nodeId) => assertBounds(nodeId, bounds));
}

function assertAllBoundsInChangeBounds(allBounds: Map<string, Bounds>): void {
    allBounds.forEach((bounds, nodeId) => assertBoundsInChangeBoundsActions(nodeId, bounds));
}

function assertBounds(nodeId: string, bounds: Bounds): void {
    assertBoundsInMoves(nodeId, bounds);
    assertBoundsInChangeBoundsActions(nodeId, bounds);
}

function assertBoundsInMoves(nodeId: string, bounds: Bounds): void {
    const moves = dispatchedElementMoves();
    const move = getMoveById(nodeId, moves);
    expect(move.toPosition.x).to.be.equal(bounds.x);
    expect(move.toPosition.y).to.be.equal(bounds.y);
}

function assertBoundsInChangeBoundsActions(nodeId: string, bounds: Bounds): void {
    const allChangeBounds = dispatchedChangeBounds();
    const changeBounds = getElementAndBoundsById(nodeId, allChangeBounds);
    expect(changeBounds.newPosition!.x).to.be.equal(bounds.x);
    expect(changeBounds.newPosition!.y).to.be.equal(bounds.y);
    expect(changeBounds.newSize!.height).to.be.equal(bounds.height);
    expect(changeBounds.newSize!.width).to.be.equal(bounds.width);
}

function getMoveById(id: string, moves: ElementMove[]): ElementMove {
    return moves.filter(m => m.elementId === id)[0];
}

function getElementAndBoundsById(id: string, elementAndBounds: ElementAndBounds[]): ElementAndBounds {
    return elementAndBounds.filter(m => m.elementId === id)[0];
}

function dispatchedElementMoves(): ElementMove[] {
    return actionDispatcher.dispatchedActions
        .filter(isMoveAction)
        .map(a => a.moves)
        .reduce((acc, val) => acc.concat(val), []);
}

function dispatchedChangeBounds(): ElementAndBounds[] {
    return actionDispatcher.dispatchedActions
        .filter(isChangeBounds)
        .map(a => a.newBounds)
        .reduce((acc, val) => acc.concat(val), []);
}

function isMoveAction(action: Action): action is MoveAction {
    return action.kind === MoveCommand.KIND;
}

function isChangeBounds(action: Action): action is ChangeBoundsOperation {
    return action.kind === ChangeBoundsOperation.KIND;
}
