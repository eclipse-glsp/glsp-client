/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { Action, DeleteMarkersAction, hasArrayProp, Marker, SetMarkersAction } from '@eclipse-glsp/protocol';
import { inject, injectable, optional } from 'inversify';
import {
    Command,
    CommandExecutionContext,
    CommandReturn,
    IActionDispatcher,
    SIssue,
    SIssueMarker,
    SModelElement,
    SModelRoot,
    SParentElement
} from 'sprotty';
import { EditorContextService } from '../../base/editor-context-service';
import { TYPES } from '../../base/types';
import { removeCssClasses } from '../../utils/smodel-util';
import { getSeverity } from '../hover/hover';
import { IFeedbackActionDispatcher, IFeedbackEmitter } from '../tool-feedback/feedback-action-dispatcher';
import { FeedbackCommand } from '../tool-feedback/model';
import { createSIssue, getOrCreateSIssueMarker, getSIssueMarker } from './issue-marker';

/**
 * Feedback emitter sending actions for visualizing model validation feedback and
 * re-establishing this feedback visualization after the model has been updated.
 */
@injectable()
export class ValidationFeedbackEmitter implements IFeedbackEmitter {
    @inject(TYPES.IFeedbackActionDispatcher) protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    @inject(TYPES.IActionDispatcherProvider) protected actionDispatcher: () => Promise<IActionDispatcher>;

    private registeredAction: ApplyMarkersAction;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     * Register the action that should be emitted for visualizing validation feedback.
     * @param action the action that should be emitted when the model is updated and that will visualize the model validation feedback.
     */
    registerValidationFeedbackAction(action: ApplyMarkersAction): void {
        // De-register old action responsible for applying markers and re-applying them when the model is updated
        this.feedbackActionDispatcher.deregisterFeedback(this, []);

        // Clear existing markers
        if (this.registeredAction !== undefined) {
            const deleteMarkersAction = DeleteMarkersAction.create(this.registeredAction.markers);
            this.actionDispatcher().then(dispatcher => dispatcher.dispatch(deleteMarkersAction));
        }

        // Register new action responsible for applying markers and re-applying them when the model is updated
        this.feedbackActionDispatcher.registerFeedback(this, [action]);
        this.registeredAction = action;
    }
}

/**
 * Manages current markers for the outside of the GLSP.
 *
 * Typically this is rebound by the surrounding tool, e.g. Theia, to be aware of
 * and propagate current markers.
 */
@injectable()
export abstract class ExternalMarkerManager {
    languageLabel: string;

    protected actionDispatcher?: IActionDispatcher;

    connect(actionDispatcher: IActionDispatcher): void {
        this.actionDispatcher = actionDispatcher;
    }

    removeMarkers(markers: Marker[]): void {
        if (this.actionDispatcher) {
            this.actionDispatcher.dispatch(DeleteMarkersAction.create(markers));
        }
    }

    abstract setMarkers(markers: Marker[], sourceUri?: string): void;
}

/**
 * Command for handling `SetMarkersAction`
 */
@injectable()
export class SetMarkersCommand extends Command {
    @inject(ValidationFeedbackEmitter) protected validationFeedbackEmitter: ValidationFeedbackEmitter;
    @inject(ExternalMarkerManager) @optional() protected externalMarkerManager?: ExternalMarkerManager;
    @inject(EditorContextService) protected editorContextService: EditorContextService;

    static readonly KIND = SetMarkersAction.KIND;

    constructor(@inject(TYPES.Action) public action: SetMarkersAction) {
        super();
    }

    async execute(context: CommandExecutionContext): Promise<SModelRoot> {
        const markers: Marker[] = this.action.markers;
        const uri = await this.editorContextService.getSourceUri();
        if (this.externalMarkerManager) {
            this.externalMarkerManager.setMarkers(markers, uri);
        }
        const applyMarkersAction = ApplyMarkersAction.create(markers);
        this.validationFeedbackEmitter.registerValidationFeedbackAction(applyMarkersAction);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Action for applying makers to a model
 */
export interface ApplyMarkersAction extends Action {
    kind: typeof ApplyMarkersAction.KIND;
    markers: Marker[];
}

export namespace ApplyMarkersAction {
    export const KIND = 'applyMarkers';

    export function is(object: any): object is ApplyMarkersAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'markers');
    }

    export function create(markers: Marker[]): ApplyMarkersAction {
        return {
            kind: KIND,
            markers
        };
    }
}

/**
 * Command for handling `ApplyMarkersAction`
 */
@injectable()
export class ApplyMarkersCommand extends FeedbackCommand {
    static KIND = ApplyMarkersAction.KIND;
    override readonly priority = 0;

    constructor(@inject(TYPES.Action) protected action: ApplyMarkersAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const markers: Marker[] = this.action.markers;
        for (const marker of markers) {
            const modelElement: SModelElement | undefined = context.root.index.getById(marker.elementId);
            if (modelElement instanceof SParentElement) {
                const issueMarker: SIssueMarker = getOrCreateSIssueMarker(modelElement);
                const issue: SIssue = createSIssue(marker);
                issueMarker.issues.push(issue);
                addMaxSeverityCSSClassToIssueParent(modelElement, issueMarker);
            }
        }
        return context.root;
    }

    override undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    override redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

function addMaxSeverityCSSClassToIssueParent(modelElement: SParentElement, issueMarker: SIssueMarker): void {
    const maxSeverityCSSClass = getSeverity(issueMarker);

    if (!modelElement.cssClasses) {
        modelElement.cssClasses = [maxSeverityCSSClass];
    } else {
        modelElement.cssClasses = modelElement.cssClasses.filter((value: string) => !value.match('info|warning|error'));
        modelElement.cssClasses.push(maxSeverityCSSClass);
    }
}

function removeCSSClassFromIssueParent(modelElement: SParentElement, issueMarker: SIssueMarker): void {
    removeCssClasses(modelElement, [getSeverity(issueMarker)]);
}

/**
 * Command for handling `DeleteMarkersAction`
 */
@injectable()
export class DeleteMarkersCommand extends Command {
    static KIND = DeleteMarkersAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DeleteMarkersAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const markers: Marker[] = this.action.markers;
        for (const marker of markers) {
            const modelElement: SModelElement | undefined = context.root.index.getById(marker.elementId);
            if (modelElement instanceof SParentElement) {
                const issueMarker: SIssueMarker | undefined = getSIssueMarker(modelElement);
                if (issueMarker !== undefined) {
                    removeCSSClassFromIssueParent(modelElement, issueMarker);
                    for (let index = 0; index < issueMarker.issues.length; ++index) {
                        const issue: SIssue = issueMarker.issues[index];
                        if (issue.message === marker.description) {
                            issueMarker.issues.splice(index--, 1);
                        }
                    }
                    if (issueMarker.issues.length === 0) {
                        modelElement.remove(issueMarker);
                    } else {
                        addMaxSeverityCSSClassToIssueParent(modelElement, issueMarker);
                    }
                }
            }
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}
