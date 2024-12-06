/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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
    EdgeTypeHint,
    GChildElement,
    GModelFactory,
    GModelRoot,
    GNode,
    SetTypeHintsAction,
    ShapeTypeHint,
    TYPES,
    Writable,
    bindOrRebind,
    createFeatureSet,
    editFeature,
    isDeletable,
    isMoveable
} from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { Container } from 'inversify';
import * as sinon from 'sinon';
import { GLSPActionDispatcher } from '../../base/action-dispatcher';
import { FeedbackActionDispatcher } from '../../base/feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from '../../base/feedback/feedback-emitter';
import { GEdge } from '../../model';
import { isResizable } from '../change-bounds/model';
import { isReconnectable } from '../reconnect/model';
import { Containable, isContainable, isReparentable } from './model';
import { ApplyTypeHintsAction, ApplyTypeHintsCommand, ITypeHintProvider, TypeHintProvider } from './type-hint-provider';
describe('TypeHintProvider', () => {
    const container = new Container();
    container.bind(GLSPActionDispatcher).toConstantValue(sinon.createStubInstance(GLSPActionDispatcher));
    container.bind(TYPES.IActionDispatcher).toService(GLSPActionDispatcher);
    const stub = sinon.createStubInstance(FeedbackActionDispatcher);
    stub.createEmitter.returns(new FeedbackEmitter(stub));
    container.bind(TYPES.IFeedbackActionDispatcher).toConstantValue(stub);
    const typeHintProvider = container.resolve(TypeHintProvider);

    describe('getShapeTypeHint', () => {
        const nodeHint: ShapeTypeHint = {
            deletable: true,
            elementTypeId: 'node',
            reparentable: false,
            repositionable: true,
            resizable: true
        };
        const taskHint: ShapeTypeHint = {
            deletable: true,
            elementTypeId: 'node:task',
            reparentable: false,
            repositionable: true,
            resizable: true
        };

        it('should return `undefined` if no `SetTypeHintsAction` has been handled yet', () => {
            expect(typeHintProvider.getShapeTypeHint('some')).to.be.undefined;
        });
        it('should return `undefined` if no hint is registered for the given type (exact type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [nodeHint], edgeHints: [] }));
            expect(typeHintProvider.getShapeTypeHint('port')).to.be.undefined;
        });
        it('should return the corresponding type hint for the given type (exact type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [nodeHint, taskHint], edgeHints: [] }));
            expect(typeHintProvider.getShapeTypeHint('node')).to.equal(nodeHint);
            expect(typeHintProvider.getShapeTypeHint('node:task')).to.equal(taskHint);
        });
        it('should return the corresponding type hint for the given type (sub type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [nodeHint, taskHint], edgeHints: [] }));
            expect(typeHintProvider.getShapeTypeHint('node:task:manual')).to.equal(taskHint);
            expect(typeHintProvider.getShapeTypeHint('node:task:manual:foo')).to.equal(taskHint);
            expect(typeHintProvider.getShapeTypeHint('node:event')).to.equal(nodeHint);
            expect(typeHintProvider.getShapeTypeHint('node:event:initial')).to.equal(nodeHint);
        });
    });
    describe('getEdgeTypeHint', () => {
        const edgeHint: EdgeTypeHint = {
            deletable: true,
            elementTypeId: 'edge',
            repositionable: true,
            routable: true,
            dynamic: false
        };
        const fooEdgeHint: EdgeTypeHint = {
            deletable: true,
            elementTypeId: 'edge:foo',
            repositionable: true,
            routable: true,
            dynamic: true
        };
        it('should return `undefined` if no `SetTypeHintsAction` has been handled yet', () => {
            expect(typeHintProvider.getEdgeTypeHint('some')).to.be.undefined;
        });
        it('should return `undefined` if no hint is registered for the given type (exact type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [], edgeHints: [edgeHint] }));
            expect(typeHintProvider.getEdgeTypeHint('link')).to.be.undefined;
        });
        it('should return the corresponding type hint for the given type (exact type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [], edgeHints: [edgeHint, fooEdgeHint] }));
            expect(typeHintProvider.getEdgeTypeHint('edge')).to.equal(edgeHint);
            expect(typeHintProvider.getEdgeTypeHint('edge:foo')).to.equal(fooEdgeHint);
        });
        it('should return the corresponding type hint for the given type (sub type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [], edgeHints: [edgeHint, fooEdgeHint] }));
            expect(typeHintProvider.getEdgeTypeHint('edge:foo:bar')).to.equal(fooEdgeHint);
            expect(typeHintProvider.getEdgeTypeHint('edge:foo:bar:baz')).to.equal(fooEdgeHint);
            expect(typeHintProvider.getEdgeTypeHint('edge:some')).to.equal(edgeHint);
            expect(typeHintProvider.getEdgeTypeHint('edge:some:other')).to.equal(edgeHint);
        });
    });
});
describe('ApplyTypeHintCommand', () => {
    function createCommandExecutionContext(child: GChildElement): CommandExecutionContext {
        const root = new GModelRoot();
        root.id = 'root';
        root.type = 'root';
        root.add(child);
        return {
            root,
            modelFactory,
            duration: 0,
            modelChanged: undefined!,
            logger: new ConsoleLogger(),
            syncer: new AnimationFrameSyncer()
        };
    }

    function createNode(type?: string): GNode {
        const node = new GNode();
        node.type = type ?? 'node';
        node.id = 'node';
        node.features = createFeatureSet(GNode.DEFAULT_FEATURES);
        return node;
    }

    function createEdge(type?: string): GEdge {
        const edge = new GEdge();
        edge.type = type ?? 'edge';
        edge.id = 'edge';
        edge.features = createFeatureSet(GEdge.DEFAULT_FEATURES);
        return edge;
    }

    const sandbox = sinon.createSandbox();
    const container = new Container();
    const modelFactory = sinon.createStubInstance(GModelFactory);
    const typeHintProviderMock = sandbox.stub<ITypeHintProvider>({
        getEdgeTypeHint: () => undefined,
        getShapeTypeHint: () => undefined
    });
    container.bind(GLSPActionDispatcher).toConstantValue(sandbox.createStubInstance(GLSPActionDispatcher));
    container.bind(TYPES.IActionDispatcher).toService(GLSPActionDispatcher);
    container.bind(TYPES.IFeedbackActionDispatcher).toConstantValue(sandbox.createStubInstance(FeedbackActionDispatcher));
    container.bind(TYPES.ITypeHintProvider).toConstantValue(typeHintProviderMock);
    bindOrRebind(container, TYPES.Action).toConstantValue(ApplyTypeHintsAction.create());
    const command = container.resolve(ApplyTypeHintsCommand);

    beforeEach(() => {
        sandbox.reset();
    });

    describe('test hints to model feature translation (after command execution)`', () => {
        describe('ShapeTypeHint', () => {
            const allEnabledHint: ShapeTypeHint = {
                elementTypeId: 'node',
                deletable: true,
                reparentable: true,
                repositionable: true,
                resizable: true,
                containableElementTypeIds: []
            };
            const allDisabledHint: ShapeTypeHint = {
                elementTypeId: 'node',
                deletable: false,
                reparentable: false,
                repositionable: false,
                resizable: false,
                containableElementTypeIds: []
            };
            it('should not modify feature set of model element with no applicable type hint', () => {
                typeHintProviderMock.getShapeTypeHint.returns(undefined);
                const result = command.execute(createCommandExecutionContext(createNode()));
                const element = result.children[0];
                expect(GNode.DEFAULT_FEATURES, 'Element should have default feature set').to.have.same.members([
                    ...(element.features as Set<symbol>)
                ]);
            });
            it('should add all enabled (`true`) features, derived from the applied type hint, to the model', () => {
                typeHintProviderMock.getShapeTypeHint.returns(allEnabledHint);
                const result = command.execute(createCommandExecutionContext(createNode()));
                const element = result.children[0];
                expect(isDeletable(element), 'Element should have deletable feature').to.be.true;
                expect(isReparentable(element), 'Element should have reparentable feature').to.be.true;
                expect(isMoveable(element), 'Element should have moveable feature').to.be.true;
                expect(isContainable(element), 'Element should have containable feature').to.be.true;
                expect(isResizable(element), 'Element should have resizeable feature').to.be.true;
            });
            it('should remove all disabled (`false`) features, derived from the applied type hint, from the model', () => {
                typeHintProviderMock.getShapeTypeHint.returns(allDisabledHint);
                const result = command.execute(createCommandExecutionContext(createNode()));
                const element = result.children[0];
                expect(isDeletable(element), 'Element should not have deletable feature').to.be.false;
                expect(isReparentable(element), 'Element should  not have reparentable feature').to.be.false;
                expect(isMoveable(element), 'Element should  not have moveable feature').to.be.false;
                expect(isResizable(element), 'Element should not have resizeable feature').to.be.false;
            });
            describe('`isConnectable` (after hint has been applied to element)', () => {
                const shapeHint: Writable<ShapeTypeHint> = {
                    deletable: false,
                    elementTypeId: 'node',
                    reparentable: false,
                    repositionable: false,
                    resizable: false
                };
                const edgeHint: Writable<EdgeTypeHint> = {
                    deletable: false,
                    elementTypeId: 'edge',
                    repositionable: false,
                    routable: false
                };
                it('should return `true` if source/target elements are not defined in edge hint', () => {
                    typeHintProviderMock.getShapeTypeHint.returns(shapeHint);
                    typeHintProviderMock.getEdgeTypeHint.returns(edgeHint);
                    const result = command.execute(createCommandExecutionContext(createNode()));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).to.be.true;
                    expect(element.canConnect(edge, 'target')).to.be.true;
                });
                it('should return `false` if element type is not in source/target elements of edge hint', () => {
                    typeHintProviderMock.getShapeTypeHint.returns(shapeHint);
                    typeHintProviderMock.getEdgeTypeHint.returns(edgeHint);
                    edgeHint.sourceElementTypeIds = [];
                    edgeHint.targetElementTypeIds = [];
                    const result = command.execute(createCommandExecutionContext(createNode()));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).to.be.false;
                    expect(element.canConnect(edge, 'target')).to.be.false;
                });
                it('should return `true` if element type is in source/target elements of edge hint (exact type)', () => {
                    typeHintProviderMock.getShapeTypeHint.returns(shapeHint);
                    typeHintProviderMock.getEdgeTypeHint.returns(edgeHint);
                    edgeHint.sourceElementTypeIds = ['node'];
                    edgeHint.targetElementTypeIds = ['node'];
                    const result = command.execute(createCommandExecutionContext(createNode()));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).to.be.true;
                    expect(element.canConnect(edge, 'target')).to.be.true;
                });
                it('should return `true` if element super type is in source/target elements of edge hint (super type)', () => {
                    typeHintProviderMock.getShapeTypeHint.returns(shapeHint);
                    typeHintProviderMock.getEdgeTypeHint.returns(edgeHint);
                    edgeHint.sourceElementTypeIds = ['node'];
                    edgeHint.targetElementTypeIds = ['node'];
                    const result = command.execute(createCommandExecutionContext(createNode('node:task:automated')));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).to.be.true;
                    expect(element.canConnect(edge, 'target')).to.be.true;
                });
                it('should fallback to class-level `canConnect` implementation if no edge hint is applicable to routable', () => {
                    typeHintProviderMock.getEdgeTypeHint.returns(undefined);
                    typeHintProviderMock.getShapeTypeHint.returns(shapeHint);
                    const node = createNode();
                    const originalCanConnectSpy = sinon.spy(node, 'canConnect');
                    const result = command.execute(createCommandExecutionContext(node));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).to.be.true;
                    expect(element.canConnect(edge, 'target')).to.be.true;
                    expect(originalCanConnectSpy.called).to.be.true;
                });
            });
            describe('`isContainable` (after hint has been applied to element)', () => {
                const shapeHint: Writable<ShapeTypeHint> = {
                    deletable: false,
                    elementTypeId: 'node',
                    reparentable: false,
                    repositionable: false,
                    resizable: false
                };
                it('should return `false` if corresponding hint has no containable elements defined', () => {
                    typeHintProviderMock.getShapeTypeHint.returns(shapeHint);
                    const result = command.execute(createCommandExecutionContext(createNode('node')));
                    const element = result.children[0] as GNode & Containable;
                    expect(element.isContainableElement('other')).to.be.false;
                });
                it('should return `true` if corresponding hint has containable element with matching type', () => {
                    typeHintProviderMock.getShapeTypeHint.returns(shapeHint);
                    shapeHint.containableElementTypeIds = ['node'];
                    const result = command.execute(createCommandExecutionContext(createNode('node')));
                    const element = result.children[0] as GNode & Containable;
                    expect(element.isContainableElement('node')).to.be.true;
                });
                it('should return `true` if corresponding hint as has containable element with matching super type', () => {
                    typeHintProviderMock.getShapeTypeHint.returns(shapeHint);
                    shapeHint.containableElementTypeIds = ['node'];
                    const result = command.execute(createCommandExecutionContext(createNode('node')));
                    const element = result.children[0] as GNode & Containable;
                    expect(element.isContainableElement('node:task:automated')).to.be.true;
                });
            });
        });
        describe('EdgeTypeHint', () => {
            const allEnabledHint: EdgeTypeHint = {
                elementTypeId: 'edge',
                deletable: true,
                repositionable: true,
                routable: true
            };
            const allDisabledHint: EdgeTypeHint = {
                elementTypeId: 'edge',
                deletable: false,
                repositionable: false,
                routable: false
            };
            it('should not modify feature set of model element with no applicable type hint', () => {
                typeHintProviderMock.getEdgeTypeHint.returns(undefined);
                const result = command.execute(createCommandExecutionContext(createEdge()));
                const element = result.children[0];
                expect(GEdge.DEFAULT_FEATURES, 'Element should have default feature set').to.have.same.members([
                    ...(element.features as Set<symbol>)
                ]);
            });
            it('should add all enabled (`true`) features, derived from the applied type hint, to the model', () => {
                typeHintProviderMock.getEdgeTypeHint.returns(allEnabledHint);
                const result = command.execute(createCommandExecutionContext(createEdge()));
                const element = result.children[0];
                expect(isDeletable(element), 'Element should have deletable feature').to.be.true;
                expect(element.hasFeature(editFeature), 'Element should have edit feature').to.be.true;
                expect(isReconnectable(element), 'Element should have reconnectable feature').to.be.true;
            });
            it('should remove all disabled (`false`) features, derived from the applied type hint, from the model', () => {
                typeHintProviderMock.getEdgeTypeHint.returns(allDisabledHint);
                const result = command.execute(createCommandExecutionContext(createEdge()));
                const element = result.children[0];
                expect(isDeletable(element), 'Element should not have deletable feature').to.be.false;
                expect(element.hasFeature(editFeature), 'Element should  not have edit feature').to.be.false;
                expect(isReconnectable(element), 'Element should  not have reconnectable feature').to.be.false;
            });
        });
    });
});
