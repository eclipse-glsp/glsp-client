import { hasStringProp } from '../utils/type-util';
import { Bounds } from 'sprotty-protocol';
import { Action } from './base-protocol';

/**
 * TODO
 */
export interface OpenSmartConnectorAction extends Action {
    kind: typeof OpenSmartConnectorAction.KIND;

    /**
     * The identifier of the element where the smart connector is to be opened.
     */
    selectedElementID: string;
    /**
     * Bounds of the node where the smart connector is to be opened.
     */
    bounds: Bounds;
}

export namespace OpenSmartConnectorAction {
    export const KIND = 'openSmartConnector';

    export function is(object: any): object is OpenSmartConnectorAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'selectedElementID');
    }

    export function create(selectedElementID: string, bounds: Bounds): OpenSmartConnectorAction {
        return {
            kind: KIND,
            selectedElementID,
            bounds
        };
    }
}

/**
 * TODO
 */
export interface CloseSmartConnectorAction extends Action {
    kind: typeof CloseSmartConnectorAction.KIND;
}

export namespace CloseSmartConnectorAction {
    export const KIND = 'closeSmartConnector';

    export function is(object: any): object is CloseSmartConnectorAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): CloseSmartConnectorAction {
        return {
            kind: KIND
        };
    }
}