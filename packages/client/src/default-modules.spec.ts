/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
import { FeatureModule } from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { Container } from 'inversify';
import * as sinon from 'sinon';
import { defaultModule } from './base/default.module';
import { DEFAULT_MODULES, initializeDiagramContainer } from './default-modules';

describe('default-modules', () => {
    // InitializeDiagramContainer internally uses `resolveContainerConfiguration` so we only test functionality
    // that is not covered by the tests of `resolveContainerConfiguration`.
    describe('initializeDiagramContainer', () => {
        const sandbox = sinon.createSandbox();
        const container = new Container();
        const loadSpy = sandbox.spy(container, 'load');
        container.snapshot();

        beforeEach(() => {
            sandbox.reset();
            container.restore();
            container.snapshot();
        });
        it('should initialize the diagram container with the default modules in addition to the given config and load them first', () => {
            const extraModule = new FeatureModule(() => {});
            initializeDiagramContainer(container, { add: extraModule });
            expect(loadSpy.calledOnce).to.be.true;
            const callArgs = loadSpy.firstCall.args;
            const lastModule = callArgs.pop();
            expect(callArgs).to.be.deep.equal(DEFAULT_MODULES).ordered;
            expect(lastModule).to.be.equal(extraModule);
        });
        it('should throw an error if the base (default) module is removed via configuration', () => {
            expect(() => initializeDiagramContainer(container, { remove: defaultModule })).to.throw(/Invalid module configuration/);
        });
        // eslint-disable-next-line max-len
        it('should throw an error if the base (default) module is not the first module of the resolved configured (removed and added again)', () => {
            expect(() => initializeDiagramContainer(container, { remove: defaultModule, add: defaultModule })).to.throw(
                /Invalid module configuration/
            );
        });
    });
});
