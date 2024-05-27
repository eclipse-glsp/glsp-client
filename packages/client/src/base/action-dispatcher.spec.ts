/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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
import { ActionHandlerRegistry, IActionHandler, RequestAction, ResponseAction, TYPES } from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { Container } from 'inversify';

import { GLSPActionDispatcher } from './action-dispatcher';
import { defaultModule } from './default.module';
import { IDiagramOptions } from './model/diagram-loader';

const container = new Container();
container.load(defaultModule);
container.bind(TYPES.IDiagramOptions).toConstantValue(<IDiagramOptions>(<unknown>{
    clientId: 'client1',
    diagramType: 'diagramType',
    glspClientProvider: async () => ({}) as any
}));
const registry = container.get(ActionHandlerRegistry);
const actionDispatcher = container.get(GLSPActionDispatcher);

let testHandlerDelay = 0;
const testHandler: IActionHandler = {
    handle: action => {
        const request = action as RequestAction<ResponseAction>;
        new Promise(resolve => setTimeout(resolve, testHandlerDelay)).then(() =>
            actionDispatcher.dispatch(<ResponseAction>{
                kind: 'response',
                responseId: request.requestId
            })
        );
    }
};
registry.register('request', testHandler);
// eslint-disable-next-line @typescript-eslint/no-empty-function
registry.register('response', { handle: () => {} });
actionDispatcher.initialize().then(() => {
    actionDispatcher['blockUntil'] = undefined;
});

describe('GLSPActionDispatcher', () => {
    describe('requestUntil', () => {
        it('should resolve successfully if response dispatched within timeout', async () => {
            testHandlerDelay = 15;
            const requestAction = { kind: 'request', requestId: '' };
            const response = await actionDispatcher.requestUntil(requestAction, 150);
            expect(response?.responseId).to.be.equal(requestAction.requestId);
        });
        it('should resolve to `undefined` if no response dispatched within timeout & `rejectOnTimeout` flag is false', async () => {
            testHandlerDelay = 30;
            const requestAction = { kind: 'request', requestId: '' };
            const response = await actionDispatcher.requestUntil(requestAction, 5);
            expect(response).to.be.undefined;
        });
        it('should be rejected if no response dispatched within timeout & `rejectOnTimeout` flag is true', async () => {
            testHandlerDelay = 30;
            const requestAction = { kind: 'request', requestId: '' };
            const gotRejected = await actionDispatcher.requestUntil(requestAction, 5, true).then(
                () => false,
                () => true
            );
            expect(gotRejected, 'Response promise should be rejected').to.be.true;
        });
    });
    describe('request & re-dispatch', () => {
        it('should be possible to re-dispatch the response of a `request` call', async () => {
            const requestAction = { kind: 'request', requestId: '' };
            const response = await actionDispatcher.request(requestAction);
            const dispatchSuccessful = await actionDispatcher.dispatch(response).then(
                () => true,
                err => false
            );
            expect(dispatchSuccessful, 'Promise of re-dispatch should resolve successfully').to.be.true;
        });
    });
});
