import {Action, hasStringProp, SubclientInfo} from '@eclipse-glsp/protocol';
import {DrawCollaborationAction, RemoveCollaborationAction} from '../base-collaboration-actions';

export interface DrawSelectionIconAction extends DrawCollaborationAction {
    kind: typeof DrawSelectionIconAction.KIND;
    element: string;
}

export namespace DrawSelectionIconAction {
    export const KIND = 'drawSelectionIcon';

    export function is(object: any): object is DrawSelectionIconAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'element') && DrawCollaborationAction.is(object);
    }

    export function create(options: { element: string, initialSubclientInfo: SubclientInfo, visible: boolean}): DrawSelectionIconAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

export interface RemoveSelectionIconAction extends RemoveCollaborationAction {
    kind: typeof RemoveSelectionIconAction.KIND;
    element: string;
}

export namespace RemoveSelectionIconAction {
    export const KIND = 'removeSelectionIcon';

    export function is(object: any): object is RemoveSelectionIconAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'element') && RemoveCollaborationAction.is(object);
    }

    export function create(options: { element: string, initialSubclientId: string }): RemoveSelectionIconAction {
        return {
            kind: KIND,
            ...options
        };
    }
}
