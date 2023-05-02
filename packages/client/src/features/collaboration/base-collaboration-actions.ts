import {Action, hasObjectProp, SubclientInfo} from '@eclipse-glsp/protocol';

export interface DrawCollaborationAction extends Action {
    initialSubclientInfo: SubclientInfo;
}

export namespace DrawCollaborationAction {
    export function is(object: any): object is DrawCollaborationAction {
        return hasObjectProp(object, 'initialSubclientInfo');
    }
}

export interface RemoveCollaborationAction extends Action {
    initialSubclientInfo: SubclientInfo;
}

export namespace RemoveCollaborationAction {
    export function is(object: any): object is RemoveCollaborationAction {
        return hasObjectProp(object, 'initialSubclientInfo');
    }
}
