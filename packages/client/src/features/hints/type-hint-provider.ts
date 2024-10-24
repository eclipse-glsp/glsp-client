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
    CommandExecutionContext,
    Connectable,
    EdgeTypeHint,
    GModelElement,
    GModelElementSchema,
    GModelRoot,
    GRoutableElement,
    GShapeElement,
    IActionDispatcher,
    IActionHandler,
    RequestTypeHintsAction,
    SetTypeHintsAction,
    ShapeTypeHint,
    TYPES,
    TypeHint,
    connectableFeature,
    deletableFeature,
    editFeature,
    isConnectable,
    moveFeature
} from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct } from 'inversify';

import { IFeedbackActionDispatcher } from '../../base/feedback/feedback-action-dispatcher';
import { FeedbackCommand } from '../../base/feedback/feedback-command';
import { FeedbackEmitter } from '../../base/feedback/feedback-emitter';
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { GEdge } from '../../model';
import { getElementTypeId } from '../../utils/gmodel-util';
import { resizeFeature } from '../change-bounds/model';
import { reconnectFeature } from '../reconnect/model';
import { containerFeature, isContainable, reparentFeature } from './model';

/**
 * Is dispatched by the {@link TypeHintProvider} to apply the type hints received from the server
 * onto the graphical model. The action is dispatched as persistent feedback to ensure the applied type hints
 * don't get lost after a server-side model update.
 */
export interface ApplyTypeHintsAction extends Action {
    kind: typeof ApplyTypeHintsAction.KIND;
}

export namespace ApplyTypeHintsAction {
    export const KIND = 'applyTypeHints';

    export function is(object: any): object is ApplyTypeHintsAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): ApplyTypeHintsAction {
        return { kind: KIND };
    }
}

type CanConnectFn = Connectable['canConnect'];

/**
 * Command that processes the entire model and for each model element applies its
 * type hints i.e. translates the type hint information into corresponding model features
 * and adds/removes them from the model element.
 */
@injectable()
export class ApplyTypeHintsCommand extends FeedbackCommand {
    public static KIND = ApplyTypeHintsAction.KIND;
    public override readonly rank: number = -10;

    @inject(TYPES.ITypeHintProvider)
    protected typeHintProvider: ITypeHintProvider;

    constructor(@inject(TYPES.Action) protected action: ApplyTypeHintsAction) {
        super();
    }

    execute(context: CommandExecutionContext): GModelRoot {
        context.root.index.all().forEach(element => {
            if (element instanceof GShapeElement || element instanceof GModelRoot) {
                return this.applyShapeTypeHint(element);
            }
            if (element instanceof GEdge) {
                this.applyEdgeTypeHint(element);
            }
        });
        return context.root;
    }

    protected applyEdgeTypeHint(element: GModelElement): void {
        const hint = this.typeHintProvider.getEdgeTypeHint(element);

        if (hint && element.features instanceof Set) {
            addOrRemove(element.features, deletableFeature, hint.deletable);
            addOrRemove(element.features, editFeature, hint.routable);
            addOrRemove(element.features, reconnectFeature, hint.repositionable);
        }
    }

    protected applyShapeTypeHint(element: GModelElement): void {
        const hint = this.typeHintProvider.getShapeTypeHint(element);
        if (hint && element.features instanceof Set) {
            addOrRemove(element.features, deletableFeature, hint.deletable);
            addOrRemove(element.features, moveFeature, hint.repositionable);
            addOrRemove(element.features, resizeFeature, hint.resizable);
            addOrRemove(element.features, reparentFeature, hint.reparentable);

            addOrRemove(element.features, containerFeature, true);
            if (isContainable(element)) {
                element.isContainableElement = input => this.isContainableElement(input, hint);
            }

            const fallbackCanConnect = isConnectable(element) ? element.canConnect.bind(element) : undefined;
            addOrRemove(element.features, connectableFeature, true);
            if (isConnectable(element)) {
                element.canConnect = (routable, role) => this.canConnect(routable, role, element, fallbackCanConnect);
            }
        }
    }

    /**
     * Type hints aware wrapper function for  `Connectable.canConnect`. After type hints have been applied
     * the `canConnect` implementation of `connectable` model elements  (with a matching hint) will forward to this method.
     */
    protected canConnect(
        routable: GRoutableElement,
        role: 'source' | 'target',
        element: GModelElement,
        fallbackCanConnect?: CanConnectFn
    ): boolean {
        const edgeHint = this.typeHintProvider.getEdgeTypeHint(routable.type);
        if (!edgeHint) {
            return fallbackCanConnect?.(routable, role) ?? false;
        }
        const validElementIds = role === 'source' ? edgeHint.sourceElementTypeIds : edgeHint.targetElementTypeIds;
        // If no source/target element ids are defined in the hint all elements are considered valid
        if (!validElementIds) {
            return true;
        }
        const elementType = element.type + ':';
        return validElementIds.some(type => elementType.startsWith(type));
    }

    /**
     * Type hints aware wrapper function for  `Containable.isContainableElement`. After type hints have been applied
     * the `isContainableElement` implementation of `containable` model elements (with a matching hint) will forward to this method.
     */
    protected isContainableElement(input: GModelElement | GModelElementSchema | string, hint: ShapeTypeHint): boolean {
        const elemenType = getElementTypeId(input) + ':';
        return hint.containableElementTypeIds?.some(type => elemenType.startsWith(type)) ?? false;
    }
}

function addOrRemove(features: Set<symbol>, feature: symbol, add: boolean): void {
    if (add && !features.has(feature)) {
        features.add(feature);
    } else if (!add && features.has(feature)) {
        features.delete(feature);
    }
}

/**
 * Provides query methods for retrieving the type hint that is applicable for a given model element.
 * If there is no type hint registered for the given element type the hint of the most concrete subtype (if any)
 * is returned instead. Subtypes are declared with a `:` delimiter.
 * For example consider the type `node:task:manual`. Then the provider fist checks wether there is
 * a type hint registered for `node:task:manual`. If not it checks wether there is one registered
 * for `node:task` and finally it checks wether there is a type hint for `node`.
 */
export interface ITypeHintProvider {
    /**
     * Retrieve the most applicable {@link ShapeTypeHint} for the given model element.
     *
     * @param input The model element whose type hint should be retrieved
     * @returns The most applicable hint of the given element or `undefined` if no matching hint is registered.
     */
    getShapeTypeHint(input: GModelElement | GModelElementSchema | string): ShapeTypeHint | undefined;
    /**
     * Retrieve the most applicable {@link EdgeTypeHint} for the given model element.
     *
     * @param input The model element whose type hint should be retrieved
     * @returns The most applicable hint of the given element or `undefined` if no matching hint is registered.
     */
    getEdgeTypeHint(input: GModelElement | GModelElementSchema | string): EdgeTypeHint | undefined;
}

@injectable()
export class TypeHintProvider implements IActionHandler, ITypeHintProvider, IDiagramStartup {
    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    protected typeHintsFeedback: FeedbackEmitter;
    protected shapeHints: Map<string, ShapeTypeHint> = new Map();
    protected edgeHints: Map<string, EdgeTypeHint> = new Map();

    @postConstruct()
    protected init(): void {
        this.typeHintsFeedback = this.feedbackActionDispatcher.createEmitter();
    }

    handle(action: SetTypeHintsAction): void {
        this.shapeHints.clear();
        this.edgeHints.clear();
        action.shapeHints.forEach(hint => this.shapeHints.set(hint.elementTypeId, hint));
        action.edgeHints.forEach(hint => this.edgeHints.set(hint.elementTypeId, hint));
        this.typeHintsFeedback.add(ApplyTypeHintsAction.create()).submit();
    }

    getShapeTypeHint(input: GModelElement | GModelElementSchema | string): ShapeTypeHint | undefined {
        return this.getTypeHint(input, this.shapeHints);
    }

    getEdgeTypeHint(input: GModelElement | GModelElementSchema | string): EdgeTypeHint | undefined {
        return this.getTypeHint(input, this.edgeHints);
    }

    protected getTypeHint<T extends TypeHint>(input: GModelElement | GModelElementSchema | string, hints: Map<string, T>): T | undefined {
        const type = getElementTypeId(input);
        let hint = hints.get(type);
        // Check subtypes
        if (hint === undefined) {
            const subtypes = type.split(':');
            while (hint === undefined && subtypes.length > 0) {
                subtypes.pop();
                hint = hints.get(subtypes.join(':'));
                if (hint) {
                    // add received subtype hint to map to avoid future recomputation
                    hints.set(type, hint);
                    break;
                }
            }
        }
        return hint;
    }

    async postRequestModel(): Promise<void> {
        const setTypeHintsAction = await this.actionDispatcher.request(RequestTypeHintsAction.create());
        this.handle(setTypeHintsAction);
    }
}
