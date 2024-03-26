/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
    ActionHandlerRegistry,
    BindingContext,
    ConsoleLogger,
    ContainerConfiguration,
    DEFAULT_ALIGNABLE_ELEMENT_FILTER,
    DefaultTypes,
    DeleteElementContextMenuItemProvider,
    DiamondNodeView,
    EditorContextService,
    GCompartment,
    GCompartmentView,
    GEdge,
    GGraph,
    GLSPProjectionView,
    GLabel,
    GLabelView,
    GModelRoot,
    GridSnapper,
    IActionDispatcher,
    IActionHandler,
    IActionHandlerInitializer,
    ICommand,
    IContributionInitializer,
    IContributionProvider,
    IDiagramStartup,
    IEditModeListener,
    IGModelRootListener,
    IHelperLineOptions,
    ISelectionListener,
    ISnapper,
    IUIExtension,
    LogLevel,
    MaybePromise,
    RectangularNodeView,
    RevealNamedElementActionProvider,
    RoundedCornerNodeView,
    SelectionService,
    StructureCompartmentView,
    TYPES,
    bindAsService,
    bindOrRebind,
    configureActionHandler,
    configureDefaultModelElements,
    configureModelElement,
    editLabelFeature,
    helperLineModule,
    initializeDiagramContainer
} from '@eclipse-glsp/client';
import 'balloon-css/balloon.min.css';
import { Container, ContainerModule, inject, injectable, postConstruct } from 'inversify';
import 'sprotty/css/edit-label.css';
import '../css/diagram.css';
import { directTaskEditor } from './direct-task-editing/di.config';
import { ActivityNode, CategoryNode, Icon, TaskNode, WeightedEdge } from './model';
import { IconView, WorkflowEdgeView } from './workflow-views';

export const workflowDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    bindOrRebind(context, TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    bindOrRebind(context, TYPES.LogLevel).toConstantValue(LogLevel.warn);
    bind(TYPES.ISnapper).to(GridSnapper);
    bindAsService(context, TYPES.ICommandPaletteActionProvider, RevealNamedElementActionProvider);
    bindAsService(context, TYPES.IContextMenuItemProvider, DeleteElementContextMenuItemProvider);

    configureDefaultModelElements(context);
    configureModelElement(context, 'task:automated', TaskNode, RoundedCornerNodeView);
    configureModelElement(context, 'task:manual', TaskNode, RoundedCornerNodeView);
    configureModelElement(context, 'label:heading', GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, 'comp:comp', GCompartment, GCompartmentView);
    configureModelElement(context, 'comp:header', GCompartment, GCompartmentView);
    configureModelElement(context, 'label:icon', GLabel, GLabelView);
    configureModelElement(context, DefaultTypes.EDGE, GEdge, WorkflowEdgeView);
    configureModelElement(context, 'edge:weighted', WeightedEdge, WorkflowEdgeView);
    configureModelElement(context, 'icon', Icon, IconView);
    configureModelElement(context, 'activityNode:merge', ActivityNode, DiamondNodeView);
    configureModelElement(context, 'activityNode:decision', ActivityNode, DiamondNodeView);
    configureModelElement(context, 'activityNode:fork', ActivityNode, RectangularNodeView);
    configureModelElement(context, 'activityNode:join', ActivityNode, RectangularNodeView);
    configureModelElement(context, DefaultTypes.GRAPH, GGraph, GLSPProjectionView);
    configureModelElement(context, 'category', CategoryNode, RoundedCornerNodeView);
    configureModelElement(context, 'struct', GCompartment, StructureCompartmentView);

    bind<IHelperLineOptions>(TYPES.IHelperLineOptions).toDynamicValue(ctx => {
        const options: IHelperLineOptions = {};
        // the user needs to use twice the force (double the distance) to break through a helper line compared to moving on the grid
        const snapper = ctx.container.get<ISnapper>(TYPES.ISnapper);
        if (snapper instanceof GridSnapper) {
            options.minimumMoveDelta = { x: snapper.grid.x * 2, y: snapper.grid.y * 2 };
        }
        // skip icons for alignment as well as compartments which are only used for structure
        options.alignmentElementFilter = element =>
            DEFAULT_ALIGNABLE_ELEMENT_FILTER(element) && !(element instanceof Icon) && !(element instanceof GCompartment);
        return options;
    });

    bindCircularDepsTester(context);
});

export function createWorkflowDiagramContainer(...containerConfiguration: ContainerConfiguration): Container {
    return initializeWorkflowDiagramContainer(new Container(), ...containerConfiguration);
}

export function initializeWorkflowDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, workflowDiagramModule, directTaskEditor, helperLineModule, ...containerConfiguration);
}

@injectable()
export class CircularDepTester
    implements
        IActionHandler,
        IActionHandlerInitializer,
        ISelectionListener,
        IEditModeListener,
        IGModelRootListener,
        IUIExtension,
        IDiagramStartup,
        IContributionInitializer
{
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(EditorContextService) protected EditorContextService: EditorContextService;
    @inject(SelectionService) protected selectionService: SelectionService;

    @postConstruct()
    protected checkDefined(): void {
        if (!this.actionDispatcher) {
            throw new Error('actionDispatcher not defined');
        }
        if (!this.EditorContextService) {
            throw new Error('EditorContextService not defined');
        }
        if (!this.selectionService) {
            throw new Error('selectionService not defined');
        }
        console.log('CircularDepTester Construction success');
    }

    id(): string {
        return 'foo';
    }
    show(root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {}
    hide(): void {}
    enableOnStartup?: boolean | undefined;

    initializeContributions(provider: IContributionProvider): MaybePromise<void> {}
    preInitialize?(): MaybePromise<void> {}
    preRequestModel?(): MaybePromise<void> {}
    postRequestModel?(): MaybePromise<void> {}
    postModelInitialization?(): MaybePromise<void> {}
    rank?: number | undefined;
    modelRootChanged(root: Readonly<GModelRoot>): void {}
    editModeChanged(newValue: string, oldValue: string): void {}
    selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[], deselectedElements?: string[] | undefined): void {}
    initialize(registry: ActionHandlerRegistry): void {}
    handle(action: Action): void | Action | ICommand {}
}

export function bindCircularDepsTester(context: BindingContext): void {
    context.bind(CircularDepTester).toSelf().inSingletonScope();
    configureActionHandler(context, 'foo', CircularDepTester);
    context.bind(TYPES.IActionHandlerInitializer).toService(CircularDepTester);
    context.bind(TYPES.ISelectionListener).toService(CircularDepTester);
    context.bind(TYPES.IEditModeListener).toService(CircularDepTester);
    context.bind(TYPES.IGModelRootListener).toService(CircularDepTester);
    context.bind(TYPES.IDiagramStartup).toService(CircularDepTester);
    context.bind(TYPES.IContributionInitializer).toService(CircularDepTester);
    context.bind(TYPES.IUIExtension).toService(CircularDepTester);
}
