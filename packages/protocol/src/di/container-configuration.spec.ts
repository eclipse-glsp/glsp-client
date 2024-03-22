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
import { expect } from 'chai';
import { Container } from 'inversify';
import * as sinon from 'sinon';
import { initializeContainer } from './container-configuration';
import { FeatureModule } from './feature-module';

const sandbox = sinon.createSandbox();
const container = new Container();
const loadSpy = sandbox.spy(container, 'load');
container.snapshot();

const moduleA = new FeatureModule(() => {});
const moduleB = new FeatureModule(() => {});
const moduleC = new FeatureModule(() => {});

describe('Container configuration', () => {
    describe('initializeContainer', () => {
        beforeEach(() => {
            sandbox.reset();
            container.restore();
            container.snapshot();
        });
        it('should load the given container modules', () => {
            initializeContainer(container, moduleA, moduleB, moduleC);
            expect(loadSpy.calledOnce).to.equal(true);
            expect(loadSpy.firstCall.args).to.deep.equal([moduleA, moduleB, moduleC]);
        });
        it('should load the same container module only once', () => {
            initializeContainer(container, moduleA, moduleA);
            expect(loadSpy.calledOnce).to.equal(true);
            expect(loadSpy.firstCall.args).to.deep.equal([moduleA]);
        });
        it('should load the given container modules and add configurations', () => {
            initializeContainer(container, moduleA, { add: [moduleB, moduleC] });
            expect(loadSpy.calledOnce).to.equal(true);
            expect(loadSpy.firstCall.args).to.deep.equal([moduleA, moduleB, moduleC]);
        });
        it('should load the given container modules/add configurations and not load modules from remove configurations', () => {
            initializeContainer(container, moduleA, {
                add: [moduleB, moduleC],
                remove: moduleA
            });
            expect(loadSpy.calledOnce).to.equal(true);
            expect(loadSpy.firstCall.args).to.deep.equal([moduleB, moduleC]);
        });
        it('should load a module from a remove configuration if it is added later again', () => {
            initializeContainer(container, moduleA, { remove: moduleA }, moduleA);
            expect(loadSpy.calledOnce).to.equal(true);
            expect(loadSpy.firstCall.args).to.deep.equal([moduleA]);
        });
    });
});
