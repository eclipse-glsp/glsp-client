import {Action, Bounds, hasObjectProp, SubclientInfo} from '@eclipse-glsp/protocol';
import {DrawCollaborationAction, RemoveCollaborationAction} from '../base-collaboration-actions';

export interface DrawViewportRectAction extends DrawCollaborationAction {
    kind: typeof DrawViewportRectAction.KIND;
    bounds: Bounds;
}

export namespace DrawViewportRectAction {
    export const KIND = 'drawViewportRect';

    export function is(object: any): object is DrawViewportRectAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'bounds') && DrawCollaborationAction.is(object);
    }

    export function create(options: { bounds: Bounds, initialSubclientInfo: SubclientInfo, visible: boolean }): DrawViewportRectAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

export interface RemoveViewportRectAction extends RemoveCollaborationAction {
    kind: typeof RemoveViewportRectAction.KIND;
}

export namespace RemoveViewportRectAction {
    export const KIND = 'removeViewportRect';

    export function is(object: any): object is RemoveViewportRectAction {
        return Action.hasKind(object, KIND) && RemoveCollaborationAction.is(object);
    }

    export function create(options: { initialSubclientId: string }): RemoveViewportRectAction {
        return {
            kind: KIND,
            ...options
        };
    }
}
