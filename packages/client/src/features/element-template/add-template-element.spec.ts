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
    AnimationFrameSyncer,
    CommandExecutionContext,
    ConsoleLogger,
    DefaultTypes,
    GModelElementRegistration,
    GModelElementSchema,
    GModelFactory,
    GNode,
    GParentElement,
    IActionDispatcher,
    RequestAction,
    ResponseAction,
    TYPES
} from '@eclipse-glsp/sprotty';
import { Container } from 'inversify';
import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { feedbackFeature } from '../../base/feedback/feedback-action-dispatcher';
import { GModelRegistry } from '../../base/model/model-registry';
import { GGraph } from '../../model';
import { AddTemplateElementsAction, AddTemplateElementsFeedbackCommand } from './add-template-element';

const CHILD_ID = 'template_child';
const TEMPLATE_ID = 'template';

class StubActionDispatcher implements IActionDispatcher {
    readonly dispatched: Action[] = [];

    async dispatch(action: Action): Promise<void> {
        this.dispatched.push(action);
    }

    async dispatchAll(actions: Action[]): Promise<void> {
        this.dispatched.push(...actions);
    }

    // the remaining API is not exercised by the feedback command

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

class TestAddTemplateElementsFeedbackCommand extends AddTemplateElementsFeedbackCommand {
    constructor(action: AddTemplateElementsAction, dispatcher: IActionDispatcher) {
        super(action);
        this.actionDispatcher = dispatcher;
    }
}

/**
 * Wires the real model factory so template elements are built the way the client builds them, i.e.
 * every element of a type shares the feature set derived from its registration.
 */
function createModelFactory(): GModelFactory {
    const container = new Container();
    const registrations: GModelElementRegistration[] = [
        { type: DefaultTypes.GRAPH, constr: GGraph },
        { type: DefaultTypes.NODE, constr: GNode }
    ];
    registrations.forEach(registration => container.bind(TYPES.SModelElementRegistration).toConstantValue(registration));
    container.bind(TYPES.SModelRegistry).to(GModelRegistry).inSingletonScope();
    container.bind(TYPES.IModelFactory).to(GModelFactory).inSingletonScope();
    return container.get<GModelFactory>(TYPES.IModelFactory);
}

/** A template with a child, which is the shape the node-creation tool uses for its ghost elements. */
function nestedTemplate(): GModelElementSchema {
    return {
        type: DefaultTypes.NODE,
        id: TEMPLATE_ID,
        children: [{ type: DefaultTypes.NODE, id: CHILD_ID }]
    };
}

describe('AddTemplateElementsFeedbackCommand', () => {
    let factory: GModelFactory;
    let context: CommandExecutionContext;

    beforeEach(() => {
        const root = new GGraph();
        root.id = 'root';
        root.type = DefaultTypes.GRAPH;
        root.features = new Set<symbol>(GGraph.DEFAULT_FEATURES);

        factory = createModelFactory();
        context = {
            root,
            modelFactory: factory,
            duration: 0,
            modelChanged: undefined!,
            logger: new ConsoleLogger(),
            syncer: new AnimationFrameSyncer()
        };
    });

    function execute(): void {
        const action = AddTemplateElementsAction.create({ templates: [nestedTemplate()] });
        new TestAddTemplateElementsFeedbackCommand(action, new StubActionDispatcher()).execute(context);
    }

    it('marks the added template element as feedback so it is not reported to the server', () => {
        execute();

        expect(context.root.index.getById(TEMPLATE_ID)?.hasFeature(feedbackFeature)).toBe(true);
    });

    it('marks the children of the added template element as well', () => {
        execute();

        expect(context.root.index.getById(CHILD_ID)?.hasFeature(feedbackFeature)).toBe(true);
    });

    it('leaves the feature set shared with the other elements of that type untouched', () => {
        execute();

        // a regular node of the same type must not turn into a feedback element
        const regularNode = factory.createElement({ type: DefaultTypes.NODE, id: 'node0' });
        expect(regularNode.hasFeature(feedbackFeature)).toBe(false);
    });

    it('adds the template element and its children to the root', () => {
        execute();

        const templateElement = context.root.children.find(child => child.id === TEMPLATE_ID);
        expect(templateElement).toBeDefined();
        expect((templateElement as GParentElement).children.map(child => child.id)).toEqual([CHILD_ID]);
    });
});
