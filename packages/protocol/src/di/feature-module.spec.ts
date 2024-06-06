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
import { expect } from 'chai';
import { Container } from 'inversify';
import { FeatureModule } from './feature-module';
describe('FeatureModule', () => {
    const container = new Container();

    const moduleA = new FeatureModule(() => {});
    const moduleB = new FeatureModule(() => {});

    afterEach(() => {
        container.unbindAll();
    });

    describe('No or single required module', () => {
        it('Should load a feature module with no required module', () => {
            const moduleWithNoRequirements = new FeatureModule(bind => {
                bind('Foo').toConstantValue('Foo');
            });
            container.load(moduleWithNoRequirements);
            expect(container.isBound(moduleWithNoRequirements.featureId)).to.be.true;
            expect(container.isBound('Foo')).to.be.true;
        });
        it('Should load a feature module with met required module', () => {
            const moduleWithNoRequirements = new FeatureModule(
                bind => {
                    bind('Foo').toConstantValue('Foo');
                },
                { requires: moduleA }
            );
            container.load(moduleA, moduleWithNoRequirements);
            expect(container.isBound(moduleA.featureId)).to.be.true;
            expect(container.isBound(moduleWithNoRequirements.featureId)).to.be.true;
            expect(container.isBound('Foo')).to.be.true;
        });
        it('Should not load a feature module if required module is loaded afterwards', () => {
            const moduleWithNoRequirements = new FeatureModule(
                bind => {
                    bind('Foo').toConstantValue('Foo');
                },
                { requires: moduleA }
            );
            container.load(moduleWithNoRequirements, moduleA);
            expect(container.isBound(moduleA.featureId)).to.be.true;
            expect(container.isBound(moduleWithNoRequirements.featureId)).to.be.false;
            expect(container.isBound('Foo')).to.be.false;
        });
        it('Should not load a feature module with missing required module', () => {
            const moduleWithUnmetRequirements = new FeatureModule(
                bind => {
                    bind('Foo').toConstantValue('Foo');
                },
                { requires: moduleA }
            );
            container.load(moduleWithUnmetRequirements);
            expect(container.isBound(moduleWithUnmetRequirements.featureId)).to.be.false;
            expect(container.isBound('Foo')).to.be.false;
        });
        it('Should throw an error if a feature module with the same featureId is already loaded', () => {
            const loadedModule = new FeatureModule(() => {}, { featureId: moduleA.featureId });
            container.load(loadedModule);
            expect(() => container.load(moduleA)).to.throw();
        });
    });
    describe('Multiple required modules', () => {
        it('Should load feature module with loaded required modules', () => {
            const moduleWithUnmetRequirements = new FeatureModule(
                bind => {
                    bind('Foo').toConstantValue('Foo');
                },
                { requires: [moduleA, moduleB] }
            );
            container.load(moduleA, moduleWithUnmetRequirements);
            expect(container.isBound(moduleA.featureId)).to.be.true;
            expect(container.isBound(moduleWithUnmetRequirements.featureId)).to.be.false;
            expect(container.isBound('Foo')).to.be.false;
        });
    });
    it('Should not load a feature module with missing required modules', () => {
        const moduleWithUnmetRequirements = new FeatureModule(
            bind => {
                bind('Foo').toConstantValue('Foo');
            },
            { requires: [moduleA, moduleB] }
        );
        container.load(moduleWithUnmetRequirements);
        expect(container.isBound(moduleWithUnmetRequirements.featureId)).to.be.false;
        expect(container.isBound('Foo')).to.be.false;
    });
    it('Should not load a feature module with partially loaded required modules', () => {
        const moduleWithUnmetRequirements = new FeatureModule(
            bind => {
                bind('Foo').toConstantValue('Foo');
            },
            { requires: [moduleA, moduleB] }
        );
        container.load(moduleA, moduleWithUnmetRequirements);
        expect(container.isBound(moduleA.featureId)).to.be.true;
        expect(container.isBound(moduleWithUnmetRequirements.featureId)).to.be.false;
        expect(container.isBound('Foo')).to.be.false;
    });
});
