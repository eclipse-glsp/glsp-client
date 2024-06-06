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
import { resolveContainerConfiguration } from './container-configuration';
import { FeatureModule } from './feature-module';

const moduleA = new FeatureModule(() => {}, { featureId: Symbol('moduleA') });
const moduleB = new FeatureModule(() => {}, { featureId: Symbol('moduleB') });
const moduleC = new FeatureModule(() => {}, { featureId: Symbol('moduleC'), requires: [moduleA, moduleB] });

FeatureModule.DEBUG_LOG_ENABLED = true;
const container = new Container();
container.load(moduleC);

describe('Container configuration', () => {
    describe('resolveContainerConfiguration', () => {
        it('should resolve the given container modules in incoming order', () => {
            const result = resolveContainerConfiguration(moduleA, moduleB, moduleC);
            expect(result).to.deep.equal([moduleA, moduleB, moduleC]);
        });
        it('should resolve the same container module only once', () => {
            const result = resolveContainerConfiguration(moduleA, moduleA);
            expect(result).to.deep.equal([moduleA]);
        });
        it('should resolve the given container modules and add configurations', () => {
            const result = resolveContainerConfiguration(moduleA, { add: [moduleB, moduleC] });
            expect(result).to.deep.equal([moduleA, moduleB, moduleC]);
        });
        it('should resolve the given container modules/add configurations and not load modules from remove configurations', () => {
            const result = resolveContainerConfiguration(moduleA, {
                add: [moduleB, moduleC],
                remove: moduleA
            });
            expect(result).to.deep.equal([moduleB, moduleC]);
        });
        it('should resolve a module from a remove configuration if it is re-added with a subsequent add configuration', () => {
            const result = resolveContainerConfiguration(moduleA, { remove: moduleA }, moduleA);
            expect(result).to.deep.equal([moduleA]);
        });
        it('should resolve a module from a replace configuration instead of a prior added module with the same feature id', () => {
            const replaceModule = new FeatureModule(() => {}, { featureId: moduleA.featureId });
            const result = resolveContainerConfiguration(moduleA, moduleB, { replace: replaceModule });
            expect(result).to.deep.equal([replaceModule, moduleB]);
        });
        // eslint-disable-next-line max-len
        it('should still resolve a module from a replace configuration if there is no prior added module with the same featureId to replace', () => {
            const replaceModule = new FeatureModule(() => {}, { featureId: Symbol('replaceModule') });
            const result = resolveContainerConfiguration(moduleA, moduleB, { replace: replaceModule });
            expect(result).to.deep.equal([moduleA, moduleB, replaceModule]);
        });
        it('should throw an error for a configuration that resolves to multiple feature modules with the same featureId', () => {
            const duplicateModule = new FeatureModule(() => {}, { featureId: moduleA.featureId });
            expect(() => resolveContainerConfiguration(moduleA, duplicateModule)).to.throw();
        });
    });
});
