/********************************************************************************
 * Copyright (c) 2023-2026 EclipseSource and others.
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
import { describe, expect, it, vi, type Mock } from 'vitest';
import { Container } from 'inversify';
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
    container.bind(GLSPActionDispatcher).toConstantValue({} as unknown as GLSPActionDispatcher);
    container.bind(TYPES.IActionDispatcher).toService(GLSPActionDispatcher);
    const stub = {
        createEmitter: vi.fn(),
        registerFeedback: vi.fn()
    } as unknown as FeedbackActionDispatcher;
    (stub.createEmitter as Mock).mockReturnValue(new FeedbackEmitter(stub));
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
            expect(typeHintProvider.getShapeTypeHint('some')).toBeUndefined();
        });
        it('should return `undefined` if no hint is registered for the given type (exact type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [nodeHint], edgeHints: [] }));
            expect(typeHintProvider.getShapeTypeHint('port')).toBeUndefined();
        });
        it('should return the corresponding type hint for the given type (exact type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [nodeHint, taskHint], edgeHints: [] }));
            expect(typeHintProvider.getShapeTypeHint('node')).toBe(nodeHint);
            expect(typeHintProvider.getShapeTypeHint('node:task')).toBe(taskHint);
        });
        it('should return the corresponding type hint for the given type (sub type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [nodeHint, taskHint], edgeHints: [] }));
            expect(typeHintProvider.getShapeTypeHint('node:task:manual')).toBe(taskHint);
            expect(typeHintProvider.getShapeTypeHint('node:task:manual:foo')).toBe(taskHint);
            expect(typeHintProvider.getShapeTypeHint('node:event')).toBe(nodeHint);
            expect(typeHintProvider.getShapeTypeHint('node:event:initial')).toBe(nodeHint);
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
            expect(typeHintProvider.getEdgeTypeHint('some')).toBeUndefined();
        });
        it('should return `undefined` if no hint is registered for the given type (exact type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [], edgeHints: [edgeHint] }));
            expect(typeHintProvider.getEdgeTypeHint('link')).toBeUndefined();
        });
        it('should return the corresponding type hint for the given type (exact type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [], edgeHints: [edgeHint, fooEdgeHint] }));
            expect(typeHintProvider.getEdgeTypeHint('edge')).toBe(edgeHint);
            expect(typeHintProvider.getEdgeTypeHint('edge:foo')).toBe(fooEdgeHint);
        });
        it('should return the corresponding type hint for the given type (sub type match)', () => {
            typeHintProvider.handle(SetTypeHintsAction.create({ shapeHints: [], edgeHints: [edgeHint, fooEdgeHint] }));
            expect(typeHintProvider.getEdgeTypeHint('edge:foo:bar')).toBe(fooEdgeHint);
            expect(typeHintProvider.getEdgeTypeHint('edge:foo:bar:baz')).toBe(fooEdgeHint);
            expect(typeHintProvider.getEdgeTypeHint('edge:some')).toBe(edgeHint);
            expect(typeHintProvider.getEdgeTypeHint('edge:some:other')).toBe(edgeHint);
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

    const container = new Container();
    const modelFactory = {} as unknown as GModelFactory;
    const typeHintProviderMock = {
        getEdgeTypeHint: vi.fn(),
        getShapeTypeHint: vi.fn()
    } as unknown as ITypeHintProvider;
    container.bind(GLSPActionDispatcher).toConstantValue({} as unknown as GLSPActionDispatcher);
    container.bind(TYPES.IActionDispatcher).toService(GLSPActionDispatcher);
    container.bind(TYPES.IFeedbackActionDispatcher).toConstantValue({} as unknown as FeedbackActionDispatcher);
    container.bind(TYPES.ITypeHintProvider).toConstantValue(typeHintProviderMock);
    bindOrRebind(container, TYPES.Action).toConstantValue(ApplyTypeHintsAction.create());
    const command = container.resolve(ApplyTypeHintsCommand);

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
                (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(undefined);
                const result = command.execute(createCommandExecutionContext(createNode()));
                const element = result.children[0];
                expect(new Set(GNode.DEFAULT_FEATURES), 'Element should have default feature set').toEqual(
                    new Set(element.features as Set<symbol>)
                );
            });
            it('should add all enabled (`true`) features, derived from the applied type hint, to the model', () => {
                (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(allEnabledHint);
                const result = command.execute(createCommandExecutionContext(createNode()));
                const element = result.children[0];
                expect(isDeletable(element), 'Element should have deletable feature').toBe(true);
                expect(isReparentable(element), 'Element should have reparentable feature').toBe(true);
                expect(isMoveable(element), 'Element should have moveable feature').toBe(true);
                expect(isContainable(element), 'Element should have containable feature').toBe(true);
                expect(isResizable(element), 'Element should have resizeable feature').toBe(true);
            });
            it('should remove all disabled (`false`) features, derived from the applied type hint, from the model', () => {
                (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(allDisabledHint);
                const result = command.execute(createCommandExecutionContext(createNode()));
                const element = result.children[0];
                expect(isDeletable(element), 'Element should not have deletable feature').toBe(false);
                expect(isReparentable(element), 'Element should  not have reparentable feature').toBe(false);
                expect(isMoveable(element), 'Element should  not have moveable feature').toBe(false);
                expect(isResizable(element), 'Element should not have resizeable feature').toBe(false);
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
                    (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(shapeHint);
                    (typeHintProviderMock.getEdgeTypeHint as Mock).mockReturnValue(edgeHint);
                    const result = command.execute(createCommandExecutionContext(createNode()));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).toBe(true);
                    expect(element.canConnect(edge, 'target')).toBe(true);
                });
                it('should return `false` if element type is not in source/target elements of edge hint', () => {
                    (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(shapeHint);
                    (typeHintProviderMock.getEdgeTypeHint as Mock).mockReturnValue(edgeHint);
                    edgeHint.sourceElementTypeIds = [];
                    edgeHint.targetElementTypeIds = [];
                    const result = command.execute(createCommandExecutionContext(createNode()));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).toBe(false);
                    expect(element.canConnect(edge, 'target')).toBe(false);
                });
                it('should return `true` if element type is in source/target elements of edge hint (exact type)', () => {
                    (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(shapeHint);
                    (typeHintProviderMock.getEdgeTypeHint as Mock).mockReturnValue(edgeHint);
                    edgeHint.sourceElementTypeIds = ['node'];
                    edgeHint.targetElementTypeIds = ['node'];
                    const result = command.execute(createCommandExecutionContext(createNode()));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).toBe(true);
                    expect(element.canConnect(edge, 'target')).toBe(true);
                });
                it('should return `true` if element super type is in source/target elements of edge hint (super type)', () => {
                    (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(shapeHint);
                    (typeHintProviderMock.getEdgeTypeHint as Mock).mockReturnValue(edgeHint);
                    edgeHint.sourceElementTypeIds = ['node'];
                    edgeHint.targetElementTypeIds = ['node'];
                    const result = command.execute(createCommandExecutionContext(createNode('node:task:automated')));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).toBe(true);
                    expect(element.canConnect(edge, 'target')).toBe(true);
                });
                it('should fallback to class-level `canConnect` implementation if no edge hint is applicable to routable', () => {
                    (typeHintProviderMock.getEdgeTypeHint as Mock).mockReturnValue(undefined);
                    (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(shapeHint);
                    const node = createNode();
                    const originalCanConnectSpy = vi.spyOn(node, 'canConnect');
                    const result = command.execute(createCommandExecutionContext(node));
                    const element = result.children[0] as GNode;
                    const edge = createEdge();
                    expect(element.canConnect(edge, 'source')).toBe(true);
                    expect(element.canConnect(edge, 'target')).toBe(true);
                    expect(originalCanConnectSpy).toHaveBeenCalled();
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
                    (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(shapeHint);
                    const result = command.execute(createCommandExecutionContext(createNode('node')));
                    const element = result.children[0] as GNode & Containable;
                    expect(element.isContainableElement('other')).toBe(false);
                });
                it('should return `true` if corresponding hint has containable element with matching type', () => {
                    (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(shapeHint);
                    shapeHint.containableElementTypeIds = ['node'];
                    const result = command.execute(createCommandExecutionContext(createNode('node')));
                    const element = result.children[0] as GNode & Containable;
                    expect(element.isContainableElement('node')).toBe(true);
                });
                it('should return `true` if corresponding hint as has containable element with matching super type', () => {
                    (typeHintProviderMock.getShapeTypeHint as Mock).mockReturnValue(shapeHint);
                    shapeHint.containableElementTypeIds = ['node'];
                    const result = command.execute(createCommandExecutionContext(createNode('node')));
                    const element = result.children[0] as GNode & Containable;
                    expect(element.isContainableElement('node:task:automated')).toBe(true);
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
                (typeHintProviderMock.getEdgeTypeHint as Mock).mockReturnValue(undefined);
                const result = command.execute(createCommandExecutionContext(createEdge()));
                const element = result.children[0];
                expect(new Set(GEdge.DEFAULT_FEATURES), 'Element should have default feature set').toEqual(
                    new Set(element.features as Set<symbol>)
                );
            });
            it('should add all enabled (`true`) features, derived from the applied type hint, to the model', () => {
                (typeHintProviderMock.getEdgeTypeHint as Mock).mockReturnValue(allEnabledHint);
                const result = command.execute(createCommandExecutionContext(createEdge()));
                const element = result.children[0];
                expect(isDeletable(element), 'Element should have deletable feature').toBe(true);
                expect(element.hasFeature(editFeature), 'Element should have edit feature').toBe(true);
                expect(isReconnectable(element), 'Element should have reconnectable feature').toBe(true);
            });
            it('should remove all disabled (`false`) features, derived from the applied type hint, from the model', () => {
                (typeHintProviderMock.getEdgeTypeHint as Mock).mockReturnValue(allDisabledHint);
                const result = command.execute(createCommandExecutionContext(createEdge()));
                const element = result.children[0];
                expect(isDeletable(element), 'Element should not have deletable feature').toBe(false);
                expect(element.hasFeature(editFeature), 'Element should  not have edit feature').toBe(false);
                expect(isReconnectable(element), 'Element should  not have reconnectable feature').toBe(false);
            });
        });
    });
});
