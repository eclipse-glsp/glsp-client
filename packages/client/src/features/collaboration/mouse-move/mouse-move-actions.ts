import {Action, hasNumberProp, hasObjectProp, Point, SubclientInfo} from '@eclipse-glsp/protocol';
import {DrawCollaborationAction, RemoveCollaborationAction} from '../base-collaboration-actions';

export interface DrawMousePointerAction extends DrawCollaborationAction {
    kind: typeof DrawMousePointerAction.KIND;
    position: Point;
    zoom: number;
}

export namespace DrawMousePointerAction {
    export const KIND = 'drawMousePointer';

    export function is(object: any): object is DrawMousePointerAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'position') && hasNumberProp(object, 'zoom') && DrawCollaborationAction.is(object);
    }

    export function create(options: { position: Point, zoom: number, initialSubclientInfo: SubclientInfo, visible: boolean }): DrawMousePointerAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

export interface RemoveMousePointerAction extends RemoveCollaborationAction {
    kind: typeof RemoveMousePointerAction.KIND;
}

export namespace RemoveMousePointerAction {
    export const KIND = 'removeMousePointer';

    export function is(object: any): object is RemoveMousePointerAction {
        return Action.hasKind(object, KIND) && RemoveCollaborationAction.is(object);
    }

    export function create(options: { initialSubclientId: string }): RemoveMousePointerAction {
        return {
            kind: KIND,
            ...options
        };
    }
}
