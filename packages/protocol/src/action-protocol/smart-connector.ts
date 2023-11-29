import { hasStringProp } from '../utils/type-util';
import { Action } from './base-protocol';

/**
 * Action that opens the smart connector at the position of the element
 */
export interface OpenSmartConnectorAction extends Action {
    kind: typeof OpenSmartConnectorAction.KIND;

    /**
     * The identifier of the element where the smart connector is to be opened.
     */
    selectedElementID: string;
}

export namespace OpenSmartConnectorAction {
    export const KIND = 'openSmartConnector';

    export function is(object: any): object is OpenSmartConnectorAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'selectedElementID');
    }

    export function create(selectedElementID: string): OpenSmartConnectorAction {
        return {
            kind: KIND,
            selectedElementID,
        };
    }
}

/**
 * Action that closes the smart connector
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