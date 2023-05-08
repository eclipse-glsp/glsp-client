import {Action, hasBooleanProp, hasObjectProp, hasStringProp, SubclientInfo} from '@eclipse-glsp/protocol';

export interface DrawCollaborationAction extends Action {
    initialSubclientInfo: SubclientInfo;
    visible: boolean;
}

export namespace DrawCollaborationAction {
    export function is(object: any): object is DrawCollaborationAction {
        return hasObjectProp(object, 'initialSubclientInfo') && hasBooleanProp(object, 'visible');
    }
}

export interface RemoveCollaborationAction extends Action {
    initialSubclientId: string;
}

export namespace RemoveCollaborationAction {
    export function is(object: any): object is RemoveCollaborationAction {
        return hasStringProp(object, 'initialSubclientId');
    }
}
