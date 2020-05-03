/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable, optional } from "inversify";
import {
    Action,
    Command,
    CommandExecutionContext,
    CommandReturn,
    IActionDispatcher,
    SDecoration,
    SIssue,
    SIssueMarker,
    SModelElement,
    SParentElement,
    TYPES
} from "sprotty";

import { EditorContextService } from "../../base/editor-context";
import { GLSP_TYPES } from "../../base/types";
import { Marker, MarkerKind } from "../../utils/marker";
import { addCssClasses, removeCssClasses } from "../../utils/smodel-util";
import { getSeverity } from "../hover/hover";
import { IFeedbackActionDispatcher, IFeedbackEmitter } from "../tool-feedback/feedback-action-dispatcher";
import { FeedbackCommand } from "../tool-feedback/model";

/**
* Action to retrieve markers for a model
*/
export class RequestMarkersAction implements Action {

    static readonly KIND = 'requestMarkers';
    readonly kind = RequestMarkersAction.KIND;

    constructor(public readonly elementsIDs: string[] = []) { }
}

/**
 * Feedback emitter sending actions for visualizing model validation feedback and
 * re-establishing this feedback visualization after the model has been updated.
 */
@injectable()
export class ValidationFeedbackEmitter implements IFeedbackEmitter {

    @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackActionDispatcher: IFeedbackActionDispatcher;

    @inject(TYPES.IActionDispatcherProvider) protected actionDispatcher: () => Promise<IActionDispatcher>;

    private registeredAction: MarkersAction;

    private constructor() { }

    /**
     * Register the action that should be emitted for visualizing validation feedback.
     * @param action the action that should be emitted when the model is updated and that will visualize the model validation feedback.
     */
    registerValidationFeedbackAction(action: MarkersAction) {
        // De-register old action responsible for applying markers and re-applying them when the model is updated
        this.feedbackActionDispatcher.deregisterFeedback(this, []);

        // Clear existing markers
        if (this.registeredAction !== undefined) {
            const clearMarkersAction = new ClearMarkersAction(this.registeredAction.markers);
            this.actionDispatcher().then(dispatcher => dispatcher.dispatch(clearMarkersAction));
        }

        // Register new action responsible for applying markers and re-applying them when the model is updated
        this.feedbackActionDispatcher.registerFeedback(this, [action]);
        this.registeredAction = action;
    }

}

/**
 * Interface for actions processing markers
 */
export interface MarkersAction extends Action {
    readonly markers: Marker[];
}

/**
 * Action to set markers for a model
 */
export class SetMarkersAction implements MarkersAction {
    readonly kind = SetMarkersCommand.KIND;
    constructor(public readonly markers: Marker[]) { }
}

export function isSetMarkersAction(action: Action): action is SetMarkersAction {
    return SetMarkersCommand.KIND === action.kind && ('markers' in action);
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

    connect(actionDispatcher: IActionDispatcher) {
        this.actionDispatcher = actionDispatcher;
    }

    removeMarkers(markers: Marker[]) {
        if (this.actionDispatcher) {
            this.actionDispatcher.dispatch(new ClearMarkersAction(markers));
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

    static readonly KIND = 'setMarkers';

    constructor(@inject(TYPES.Action) public action: SetMarkersAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const markers: Marker[] = this.action.markers;
        if (this.externalMarkerManager) this.externalMarkerManager.setMarkers(markers, this.editorContextService.getSourceUri());
        const applyMarkersAction: ApplyMarkersAction = new ApplyMarkersAction(markers);
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
@injectable()
export class ApplyMarkersAction implements MarkersAction {
    readonly kind = ApplyMarkersCommand.KIND;
    constructor(public readonly markers: Marker[]) { }
}

/**
 * Command for handling `ApplyMarkersAction`
 */
@injectable()
export class ApplyMarkersCommand extends FeedbackCommand {

    static KIND = "applyMarkers";
    readonly priority = 0;

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
                addCSSClassToIssueParent(modelElement, issueMarker);
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

function addCSSClassToIssueParent(modelElement: SParentElement, issueMarker: SIssueMarker) {
    addCssClasses(modelElement, [getSeverity(issueMarker)]);
}

function removeCSSClassFromIssueParent(modelElement: SParentElement, issueMarker: SIssueMarker) {
    removeCssClasses(modelElement, [getSeverity(issueMarker)]);
}

/**
 * Retrieves the `SIssueMarker` contained by the provided model element as
 * direct child or a newly instantiated `SIssueMarker` if no child
 * `SIssueMarker` exists.
 * @param modelElement for which the `SIssueMarker` should be retrieved or created.
 * @returns the child `SIssueMarker` or a new `SIssueMarker` if no such child exists.
 */
function getOrCreateSIssueMarker(modelElement: SParentElement): SIssueMarker {
    let issueMarker: SIssueMarker | undefined;

    issueMarker = getSIssueMarker(modelElement);

    if (issueMarker === undefined) {
        issueMarker = new GIssueMarker();
        issueMarker.type = "marker";
        issueMarker.issues = new Array<SIssue>();
        modelElement.add(issueMarker);
    }

    return issueMarker;
}

/**
 * Retrieves the `SIssueMarker` contained by the provided model element as
 * direct child or `undefined` if such an `SIssueMarker` does not exist.
 * @param modelElement for which the `SIssueMarker` should be retrieved.
 * @returns the child `SIssueMarker` or `undefined` if no such child exists.
 */
function getSIssueMarker(modelElement: SParentElement): SIssueMarker | undefined {
    let issueMarker: SIssueMarker | undefined;

    for (const child of modelElement.children) {
        if (child instanceof SIssueMarker) {
            issueMarker = child;
        }
    }

    return issueMarker;
}

/**
 * Creates an `SIssue` with `severity` and `message` set according to
 * the `kind` and `description` of the provided `Marker`.
 * @param marker `Marker` for that an `SIssue` should be created.
 * @returns the created `SIssue`.
 */
function createSIssue(marker: Marker): SIssue {
    const issue: SIssue = new SIssue();
    issue.message = marker.description;

    switch (marker.kind) {
        case MarkerKind.ERROR: {
            issue.severity = 'error';
            break;
        }
        case MarkerKind.INFO: {
            issue.severity = 'info';
            break;
        }
        case MarkerKind.WARNING: {
            issue.severity = 'warning';
            break;
        }
    }

    return issue;
}

/**
 * Action for clearing makers of a model
 */
@injectable()
export class ClearMarkersAction implements MarkersAction {
    readonly kind = ClearMarkersCommand.KIND;
    constructor(public readonly markers: Marker[]) { }
}

/**
 * Command for handling `ClearMarkersAction`
 */
@injectable()
export class ClearMarkersCommand extends Command {
    static KIND = "clearMarkers";

    constructor(@inject(TYPES.Action) protected action: ClearMarkersAction) {
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
                        addCSSClassToIssueParent(modelElement, issueMarker);
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

export class GIssueMarker extends SIssueMarker {
    constructor() {
        super();
        this.features = new Set<symbol>(SDecoration.DEFAULT_FEATURES);
    }
}

