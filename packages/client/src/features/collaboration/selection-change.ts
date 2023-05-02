/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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
    ActionDispatcher, Command, CommandExecutionContext, CommandReturn,
    IActionHandler, SModelRoot, SParentElement
} from 'sprotty';
import {
    Action, DefaultTypes,
    DisposeSubclientAction,
    hasObjectProp,
    hasStringProp, Point,
    SelectionChangeAction,
    SubclientInfo
} from '@eclipse-glsp/protocol';
import {inject, injectable} from 'inversify';
import {IFeedbackActionDispatcher} from '../tool-feedback/feedback-action-dispatcher';
import {TYPES} from '../../base/types';
import {SelectionListener, SelectionService} from '../select/selection-service';
import {BaseGLSPTool} from '../tools/base-glsp-tool';
import {FeedbackCommand} from '../tool-feedback/model';
import {SelectionIcon} from './model';
import {GEdge} from '../../lib/model';

@injectable()
export class SelectionChangeTool extends BaseGLSPTool implements SelectionListener {
    static ID = 'glsp.selection-change-tool';

    @inject(TYPES.SelectionService) protected selectionService: SelectionService;

    get id(): string {
        return SelectionChangeTool.ID;
    }

    enable(): void {
        this.selectionService.register(this);
    }

    disable(): void {
        this.selectionService.deregister(this);
    }

    selectionChanged(root: Readonly<SModelRoot>, selectedElements: string[], deselectedElements: string[]): void {
        this.dispatchActions([SelectionChangeAction.create({
            selectedElements,
            deselectedElements
        })]);
    }

}



export interface DrawSelectionIconAction extends Action {
    kind: typeof DrawSelectionIconAction.KIND;
    element: string;
    initialSubclientInfo: SubclientInfo;
}

export namespace DrawSelectionIconAction {
    export const KIND = 'drawSelectionIcon';

    export function is(object: any): object is DrawSelectionIconAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'element') && hasObjectProp(object, 'initialSubclientInfo');
    }

    export function create(options: { element: string, initialSubclientInfo: SubclientInfo }): DrawSelectionIconAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class DrawSelectionIconCommand extends FeedbackCommand {
    static readonly KIND = DrawSelectionIconAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawSelectionIconAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const modelElement = context.root.index.getById(this.action.element);
        if (modelElement instanceof SParentElement) {
            const id = selectionIconId(context.root, modelElement, this.action.initialSubclientInfo.subclientId);
            const existingSelectionIcon = modelElement.index.getById(id);
            if (existingSelectionIcon) {
                return context.root;
            }
            const icon = new SelectionIcon();
            icon.id = id;
            icon.color = this.action.initialSubclientInfo.color;
            if (modelElement instanceof GEdge) {
                const sourcePoint: Point = modelElement.args.edgeSourcePoint as any;
                const targetPoint: Point = modelElement.args.edgeTargetPoint as any;
                icon.position = {
                    x: (sourcePoint.x + targetPoint.x) / 2,
                    y: (sourcePoint.y + targetPoint.y) / 2
                };
            }
            modelElement.add(icon);
        }
        return context.root;
    }
}

export interface RemoveSelectionIconAction extends Action {
    kind: typeof RemoveSelectionIconAction.KIND;
    element: string;
    initialSubclientInfo: SubclientInfo;
}

export namespace RemoveSelectionIconAction {
    export const KIND = 'removeSelectionIcon';

    export function is(object: any): object is RemoveSelectionIconAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'element') && hasObjectProp(object, 'initialSubclientInfo');
    }

    export function create(options: { element: string, initialSubclientInfo: SubclientInfo }): RemoveSelectionIconAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class RemoveSelectionIconCommand extends Command {
    static readonly KIND = RemoveSelectionIconAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RemoveSelectionIconAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const modelElement = context.root.index.getById(this.action.element);
        if (modelElement instanceof SParentElement) {
            const id = selectionIconId(context.root, modelElement, this.action.initialSubclientInfo.subclientId);
            const existingSelectionIcon = modelElement.children.find(c => c.id === id);
            if (!existingSelectionIcon) {
                return context.root;
            }
            modelElement.remove(existingSelectionIcon);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export function selectionIconId(root: SModelRoot, parent: SParentElement, subclientId: string): string {
    return root.id + '_' + parent.id + '_' + DefaultTypes.SELECTION_ICON + '_' + subclientId;
}

/**
 * Catches all MouseMoveActions and creates DrawMousePointerActions for MouseMoveActions initiated from other subclients.
 * Saves LastActions per subclient and passes all lastActions to feedbackActionDispatcher
 */
@injectable()
export class SelectionIconProvider implements IActionHandler {
    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: ActionDispatcher;

    // Map<subclientId, Map<elementId, action>>
    protected lastActions: Map<string, Map<string, DrawSelectionIconAction>> = new Map();

    handle(action: Action): void {
        if (SelectionChangeAction.is(action) && action.initialSubclientInfo != null) {
            const lastActionsForSubclientId = this.lastActions.get(action.initialSubclientInfo.subclientId) || new Map<string, DrawSelectionIconAction>();
            const deleteActions: RemoveSelectionIconAction[] = [];
            action.deselectedElements.forEach(element => {
                lastActionsForSubclientId.delete(element);
                deleteActions.push(RemoveSelectionIconAction.create({
                    element,
                    initialSubclientInfo: action.initialSubclientInfo!
                }));
            });
            this.actionDispatcher.dispatchAll(deleteActions);

            action.selectedElements.forEach(element => {
                lastActionsForSubclientId.set(element, DrawSelectionIconAction.create({
                    element,
                    initialSubclientInfo: action.initialSubclientInfo!
                }));
            });
            this.lastActions.set(action.initialSubclientInfo.subclientId, lastActionsForSubclientId);
            this.feedbackActionDispatcher.registerFeedback(this, this.getActionsAsArray());
        }
        if (DisposeSubclientAction.is(action) && action.initialSubclientInfo != null) {
            const drawActions = this.lastActions.get(action.initialSubclientInfo.subclientId);
            if (drawActions) {
                const deleteActions = Array.from(drawActions.values()).map(drawAction =>
                    RemoveSelectionIconAction.create({
                        element: drawAction.element,
                        initialSubclientInfo: drawAction.initialSubclientInfo
                    })
                );
                this.actionDispatcher.dispatchAll(deleteActions);

                this.lastActions.delete(action.initialSubclientInfo.subclientId);
                this.feedbackActionDispatcher.registerFeedback(this, this.getActionsAsArray());
            }
        }
    }


    private getActionsAsArray(): DrawSelectionIconAction[] {
        return Array.from(this.lastActions.values()).map(map => Array.from(map.values())).flat();
    }
}
