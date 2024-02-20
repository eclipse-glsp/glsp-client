/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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

import { expect } from 'chai';
import { MaybePromise } from './type-util';

/*
 * Utility classes used for testing.
 * Only available in the testing context. Should not be used in production code.
 */

/**
 * Creates a promise that resolves after the given timeout
 * @param timeout the timeout in milliseconds
 * @returns
 */
export async function delay(timeout: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * Consumes a maybe async function and checks for error
 * @param  method - The function to check
 * @param  message - Optional message to match with error message
 */
export async function expectToThrowAsync(toEvaluate: () => MaybePromise<unknown>, message?: string): Promise<void> {
    let err: unknown | undefined = undefined;
    try {
        await toEvaluate();
    } catch (error) {
        err = error;
    }
    if (message) {
        expect(err instanceof Error, 'The error cause should be an instance of Error').to.be.true;
        expect((err as Error)?.message).to.be.equal(message);
    } else {
        expect(err).to.be.an('Error');
    }
}
