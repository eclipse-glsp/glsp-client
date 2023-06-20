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
import { inject, injectable, optional } from 'inversify';
import {
    Action,
    CommandExecutionContext,
    CommandReturn,
    DeleteMarkersAction,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    Marker,
    SIssueMarker,
    SParentElement,
    SetMarkersAction,
    TYPES,
    hasArrayProp
} from '~glsp-sprotty';
import { EditorContextService } from '../../base/editor-context-service';
import { removeCssClasses } from '../../utils/smodel-util';
import { IFeedbackActionDispatcher, IFeedbackEmitter } from '../tool-feedback/feedback-action-dispatcher';
import { FeedbackCommand } from '../tool-feedback/model';
import { GIssueMarker, createSIssue, getOrCreateSIssueMarker, getSIssueMarker, getSeverity } from './issue-marker';

/**
 * Feedback emitter sending actions for visualizing model validation feedback and
 * re-establishing this feedback visualization after the model has been updated.
 */
@injectable()
export class ValidationFeedbackEmitter implements IFeedbackEmitter {
    @inject(TYPES.IFeedbackActionDispatcher) protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    @inject(TYPES.IActionDispatcherProvider) protected actionDispatcher: () => Promise<IActionDispatcher>;

    protected registeredFeedbackByReason: Map<string, ApplyMarkersAction> = new Map();

    /**
     * Register the action that should be emitted for visualizing validation feedback.
     * @param action the action that should be emitted when the model is updated and that will visualize the model validation feedback.
     * @param reason the reason for this validation feedback.
     */
    registerValidationFeedbackAction(action: ApplyMarkersAction, reason = ''): void {
        // De-register feedback and clear existing markers with the same reason
        const previousFeedbackWithSameReason = this.registeredFeedbackByReason.get(reason);
        if (previousFeedbackWithSameReason) {
            this.feedbackActionDispatcher.deregisterFeedback(this, [previousFeedbackWithSameReason]);
            const deleteMarkersAction = DeleteMarkersAction.create(previousFeedbackWithSameReason.markers);
            this.actionDispatcher().then(dispatcher => dispatcher.dispatch(deleteMarkersAction));
        }

        // Register new action responsible for applying markers and re-applying them when the model is updated
        this.registeredFeedbackByReason.set(reason, action);
        this.feedbackActionDispatcher.registerFeedback(this, [...this.registeredFeedbackByReason.values()]);
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

    abstract setMarkers(markers: Marker[], reason?: string, sourceUri?: string): void;
}

@injectable()
export class SetMarkersActionHandler implements IActionHandler {
    @inject(ValidationFeedbackEmitter)
    protected validationFeedbackEmitter: ValidationFeedbackEmitter;

    @inject(ExternalMarkerManager)
    @optional()
    protected externalMarkerManager?: ExternalMarkerManager;

    @inject(EditorContextService)
    protected editorContextService: EditorContextService;

    handle(action: SetMarkersAction): void | Action | ICommand {
        const markers: Marker[] = action.markers;
        this.setMarkers(markers, action.reason);
    }

    async setMarkers(markers: Marker[], reason: string | undefined): Promise<void> {
        const uri = await this.editorContextService.getSourceUri();
        this.externalMarkerManager?.setMarkers(markers, reason, uri);
        const applyMarkersAction = ApplyMarkersAction.create(markers);
        this.validationFeedbackEmitter.registerValidationFeedbackAction(applyMarkersAction, reason);
    }
}

/**
 * Action for applying makers to the graphical model.
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
 * Handles {@link ApplyMarkersAction}s by creating the corresponding {@link SIssueMarker}s and
 * adding them to the graphical model.
 */
@injectable()
export class ApplyMarkersCommand extends FeedbackCommand {
    static KIND = ApplyMarkersAction.KIND;

    constructor(@inject(TYPES.Action) protected action: ApplyMarkersAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.action.markers.forEach(marker => {
            const modelElement = context.root.index.getById(marker.elementId);
            if (modelElement instanceof SParentElement) {
                const issueMarker = getOrCreateSIssueMarker(modelElement);
                const issue = createSIssue(marker);
                issueMarker.issues.push(issue);
                if (issueMarker instanceof GIssueMarker) {
                    issueMarker.computeProjectionCssClasses();
                }
                addMaxSeverityCSSClassToIssueParent(modelElement, issueMarker);
            }
        });
        return context.root;
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
    const severity = getSeverity(issueMarker);
    removeCssClasses(modelElement, [severity]);
}

/**
 * Command for handling `DeleteMarkersAction`
 */
@injectable()
export class DeleteMarkersCommand extends FeedbackCommand {
    static KIND = DeleteMarkersAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DeleteMarkersAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.action.markers.forEach(marker => {
            const modelElement = context.root.index.getById(marker.elementId);
            if (modelElement instanceof SParentElement) {
                const issueMarker = getSIssueMarker(modelElement);
                if (issueMarker) {
                    removeCSSClassFromIssueParent(modelElement, issueMarker);
                    for (let index = 0; index < issueMarker.issues.length; ++index) {
                        const issue = issueMarker.issues[index];
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
        });

        return context.root;
    }
}
