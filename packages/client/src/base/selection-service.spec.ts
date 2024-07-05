/********************************************************************************
 * Copyright (c) 2020-2024 EclipseSource and others.
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
import { Action, Command, CommandExecutionContext, Disposable, GModelRoot, GNode, TYPES, initializeContainer } from '@eclipse-glsp/sprotty';
import { AssertionError, expect } from 'chai';
import { Container, injectable } from 'inversify';
import * as sinon from 'sinon';
import { defaultModule } from './default.module';
import { IFeedbackActionDispatcher, IFeedbackEmitter } from './feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from './feedback/feedback-emitter';
import { ISelectionListener, SelectFeedbackAction, SelectionService } from './selection-service';

@injectable()
class MockFeedbackActionDispatcher implements IFeedbackActionDispatcher {
    protected feedbackEmitters: Map<IFeedbackEmitter, Action[]> = new Map();

    registerFeedback(feedbackEmitter: IFeedbackEmitter, actions: Action[]): Disposable {
        this.feedbackEmitters.set(feedbackEmitter, actions);
        return Disposable.create(() => this.deregisterFeedback(feedbackEmitter));
    }

    deregisterFeedback(feedbackEmitter: IFeedbackEmitter, _actions?: Action[]): void {
        this.feedbackEmitters.delete(feedbackEmitter);
    }

    getRegisteredFeedback(): Action[] {
        const result: Action[] = [];
        this.feedbackEmitters.forEach((value, key) => result.push(...value));
        return result;
    }

    getSingleFeedbackAction(): SelectFeedbackAction | undefined {
        const actions = this.getRegisteredFeedback();
        return actions.length === 1 ? (actions[0] as SelectFeedbackAction) : undefined;
    }

    getFeedbackCommands(): Command[] {
        return [];
    }

    createEmitter(): FeedbackEmitter {
        return new FeedbackEmitter(this);
    }

    async applyFeedbackCommands(context: CommandExecutionContext): Promise<void> {}
}

class MockSelectionListener implements ISelectionListener {
    selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[], deselectedElements: string[] | undefined): void {
        // no.op
    }
}

function createContainer(): Container {
    const container = initializeContainer(new Container(), defaultModule);
    // eslint-disable-next-line deprecation/deprecation
    container.rebind(TYPES.IFeedbackActionDispatcher).to(MockFeedbackActionDispatcher).inSingletonScope();
    return container;
}

describe('SelectionService', () => {
    // eslint-disable-next-line deprecation/deprecation
    let root: GModelRoot;
    let selectionService: SelectionService;
    let feedbackDispatcher: MockFeedbackActionDispatcher;

    beforeEach(() => {
        const container = createContainer();
        // eslint-disable-next-line deprecation/deprecation
        root = createRoot('node1', 'node2', 'node3', 'node4', 'node5');
        selectionService = container.get<SelectionService>(SelectionService);
        feedbackDispatcher = container.get<MockFeedbackActionDispatcher>(TYPES.IFeedbackActionDispatcher);
    });

    describe('Initial State', () => {
        it('On creation nothing should be selected and no feedback should be dispatched.', () => {
            assertSelectionAndFeedback([], []);
        });
    });
    describe('Single Selection', () => {
        it('Selecting a single element should be tracked correctly and trigger feedback.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1'], []);
            assertSelectionAndFeedback(['node1'], []);
        });
        it('Selecting the same element twice in one operation should not make a difference.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node1'], []);
            assertSelectionAndFeedback(['node1'], []);
        });
        it('Selecting and then deselecting the same element should result in an empty selection.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1'], []);
            selectionService.updateSelection(root, [], ['node1']);
            assertSelectionAndFeedback([], ['node1']);
        });
        it('Selecting and deselecting the same element in the same operation should have no effect.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1'], ['node1']);
            assertSelectionAndFeedback([], []);
        });
        it('Selecting and deselecting not-existing nodes should have no effect.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['not-existing'], []);
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, [], ['not-existing']);
            assertSelectionAndFeedback([], []);
        });
    });
    describe('Multi Selection', () => {
        it('Selecting multiple elements should be tracked correctly and trigger feedback.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node2'], []);
            assertSelectionAndFeedback(['node1', 'node2'], []);
        });
        it('Selecting multiple elements should have the selection order in the dispatched feedback.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node2', 'node1'], []);
            expect(() => assertSelectionAndFeedback(['node1', 'node2'], [])).to.throw(AssertionError, 'ordered members');
        });
        it('Selecting the same elements twice in one operation should not make a difference.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node1', 'node2', 'node2'], []);
            assertSelectionAndFeedback(['node1', 'node2'], []);
        });
        it('Selecting and then deselecting the same elements should result in an empty selection.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node2'], []);
            selectionService.updateSelection(root, [], ['node1', 'node2']);
            assertSelectionAndFeedback([], ['node1', 'node2']);
        });
        it('Selecting and deselecting the same elements in one operation should have no effect.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node2'], ['node1', 'node2']);
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node2', 'node3'], ['node1', 'node2']);
            assertSelectionAndFeedback(['node3'], []);
        });
        it('Selecting three elements and deselecting one should result in two selected and one deselected element.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node2', 'node3'], []);
            assertSelectionAndFeedback(['node1', 'node2', 'node3'], []);
            selectionService.updateSelection(root, [], ['node2']);
            assertSelectionAndFeedback(['node1', 'node3'], ['node2']);
        });
        it('A series of selection and deselection operations should be tracked correctly.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node2', 'node3'], []);
            assertSelectionAndFeedback(['node1', 'node2', 'node3'], []);
            selectionService.updateSelection(root, ['node4'], ['node2']);
            assertSelectionAndFeedback(['node1', 'node3', 'node4'], ['node2']);
            selectionService.updateSelection(root, ['node3', 'node1'], ['node2', 'node4']);
            assertSelectionAndFeedback(['node1', 'node3'], ['node4']);
            selectionService.updateSelection(root, ['node3'], ['node3']);
            assertSelectionAndFeedback(['node1', 'node3'], ['node4']);
        });
    });
    describe('Changing Root', () => {
        it('Changing root deselects all selected elements if there are no matching elements.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1'], []);
            assertSelectionAndFeedback(['node1'], []);

            const newRoot = createRoot('newNode1', 'newNode2', 'newNode3');
            selectionService.modelRootChanged(newRoot);
            assertSelectionAndFeedback([], ['node1']);
        });
        it('Changing root keeps selected elements if there are matching elements.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node2'], []);
            assertSelectionAndFeedback(['node1', 'node2'], []);

            const newRoot = createRoot('node1', 'newNode2', 'newNode3');
            selectionService.modelRootChanged(newRoot);
            assertSelectionAndFeedback(['node1'], ['node2']);
        });
        it('Changing root with new selection correctly selects matching elements and deselects not matching elements.', () => {
            assertSelectionAndFeedback([], []);
            selectionService.updateSelection(root, ['node1', 'node2'], []);
            assertSelectionAndFeedback(['node1', 'node2'], []);

            const newRoot = createRoot('newNode1', 'newNode2', 'newNode3');
            selectionService.updateSelection(newRoot, ['newNode1'], []);
            assertSelectionAndFeedback(['newNode1'], ['node1', 'node2']);
        });
    });
    describe('Listeners', () => {
        const sandbox = sinon.createSandbox();
        const listener = sandbox.createStubInstance(MockSelectionListener);

        beforeEach(() => {
            selectionService.onSelectionChanged(change =>
                listener.selectionChanged(change.root, change.selectedElements, change.deselectedElements)
            );
        });

        afterEach(() => {
            selectionService.dispose();
            sandbox.reset();
        });
        it('A registered listener should be notified of a single selection change.', () => {
            selectionService.updateSelection(root, ['node1', 'node1'], []);
            assertListener(listener, root, ['node1'], [], 1);
        });
        it('A registered listener should be notified of a multi-selection change.', () => {
            selectionService.updateSelection(root, ['node1', 'node2', 'node3'], []);
            assertListener(listener, root, ['node1', 'node2', 'node3'], [], 1);
        });
        it('A registered listener should be notified of series of selection changes.', () => {
            selectionService.updateSelection(root, ['node1'], []);
            assertListener(listener, root, ['node1'], [], 1);
            selectionService.updateSelection(root, ['node2'], ['node1']);
            assertListener(listener, root, ['node2'], ['node1'], 2);
            selectionService.updateSelection(root, ['node3', 'node4'], []);
            assertListener(listener, root, ['node2', 'node3', 'node4'], [], 3);
            selectionService.updateSelection(root, [], ['node4']);
            assertListener(listener, root, ['node2', 'node3'], ['node4'], 4);
        });
        it('A registered listener should NOT be notified of root changes.', () => {
            selectionService.updateSelection(root, [], []);
            assertListener(listener, root, [], [], 0);

            const newRoot = createRoot('node1', 'newNode2', 'newNode3');
            selectionService.updateSelection(newRoot, [], []);
            assertListener(listener, newRoot, [], [], 0);
        });
        it('Selecting the same elements consecutively should not trigger a listener update.', () => {
            selectionService.updateSelection(root, ['node1'], []);
            assertListener(listener, root, ['node1'], [], 1);
            selectionService.updateSelection(root, ['node1'], []);
            assertListener(listener, root, ['node1'], [], 1);
        });
        it('Selecting a not-existing elements should not trigger a listener update.', () => {
            selectionService.updateSelection(root, ['node1'], []);
            assertListener(listener, root, ['node1'], [], 1);
            selectionService.updateSelection(root, ['not-existing'], []);
            assertListener(listener, root, ['node1'], [], 1);
        });
        it('Bindings of TYPES.ISelectionListener should be registered as listener in `preLoadDiagram`', () => {
            const container = createContainer();
            const selectionListener = sandbox.createStubInstance(MockSelectionListener);
            container.bind(TYPES.ISelectionListener).toConstantValue(selectionListener);
            const testSelectionService = container.get<SelectionService>(SelectionService);
            testSelectionService.preLoadDiagram();
            testSelectionService.updateSelection(root, ['node1', 'node1'], []);
            assertListener(selectionListener, root, ['node1'], [], 1);
        });
    });

    function createRoot(...nodes: string[]): GModelRoot {
        const model = new GModelRoot();
        model.id = 'selection-service-spec';
        model.type = 'graph';
        nodes.forEach(id => {
            const node = new GNode();
            node.type = 'node:circle';
            node.id = id;
            model.add(node);
        });
        return model;
    }

    function assertSelectionAndFeedback(expectedSelection: string[], expectedDeselection: string[]): void {
        assertSelectionService(expectedSelection);
        assertDispatchedFeedback(expectedSelection, expectedDeselection);
    }

    function assertSelectionService(expectedSelection: string[]): void {
        expect(selectionService.isSingleSelection()).to.equal(expectedSelection.length === 1);
        expect(selectionService.isMultiSelection()).to.equal(expectedSelection.length > 1);
        expect(selectionService.hasSelectedElements()).to.equal(expectedSelection.length > 0);
        expect(selectionService.getSelectedElementIDs()).to.have.lengthOf(expectedSelection.length);
        if (expectedSelection.length > 0) {
            expect(selectionService.getSelectedElementIDs()).to.have.ordered.members(expectedSelection);
        }
    }

    function assertDispatchedFeedback(expectedSelection: string[], expectedDeselection: string[]): void {
        // a single feedback action reflects aggregated selection/deselection
        const hasFeedback = expectedSelection.length > 0 || expectedDeselection.length > 0;
        if (hasFeedback) {
            expect(feedbackDispatcher.getRegisteredFeedback()).to.have.lengthOf(1);
            expect(feedbackDispatcher.getSingleFeedbackAction()!.selectedElementsIDs).to.have.lengthOf(expectedSelection.length);
            expect(feedbackDispatcher.getSingleFeedbackAction()!.selectedElementsIDs).to.have.ordered.members(expectedSelection);
            expect(feedbackDispatcher.getSingleFeedbackAction()!.deselectedElementsIDs).to.have.lengthOf(expectedDeselection.length);
            expect(feedbackDispatcher.getSingleFeedbackAction()!.deselectedElementsIDs).to.have.ordered.members(expectedDeselection);
        } else {
            expect(feedbackDispatcher.getRegisteredFeedback()).to.have.lengthOf(0);
            expect(feedbackDispatcher.getSingleFeedbackAction()).to.be.undefined;
        }
    }

    function assertListener(
        listener: sinon.SinonStubbedInstance<MockSelectionListener>,
        expectedRoot: GModelRoot | undefined,
        expectedSelection: string[],
        expectedDeselection: string[],
        expectedCalled: number
    ): void {
        expect(listener.selectionChanged.callCount).to.be.equal(expectedCalled);
        if (expectedCalled > 0) {
            expect(listener.selectionChanged.lastCall.args[0]).to.be.deep.equals(expectedRoot);
            expect(listener.selectionChanged.lastCall.args[1]).to.be.deep.equals(expectedSelection);
            expect(listener.selectionChanged.lastCall.args[2]).to.be.deep.equals(expectedDeselection);
        }
    }
});
