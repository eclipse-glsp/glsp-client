/********************************************************************************
 * Copyright (c) 2024-2026 EclipseSource and others.
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
import { beforeEach, describe, expect, it } from 'vitest';
import { Container } from 'inversify';
import { LazyInjector, bindLazyInjector } from './lazy-injector';

class ServiceA {}
class ServiceB {}
class MultiService {}

const container = new Container();
bindLazyInjector(container);
container
    .bind(ServiceA)
    .toDynamicValue(() => new ServiceA())
    .inSingletonScope();
container.bind(ServiceB).toDynamicValue(() => new ServiceB());
container.bind(MultiService).toDynamicValue(() => new MultiService());
container.bind(MultiService).toDynamicValue(() => new MultiService());
container.snapshot();

describe('LazyInjector', () => {
    let lazyInjector: LazyInjector;
    beforeEach(() => {
        container.restore();
        container.snapshot();
        lazyInjector = container.get(LazyInjector);
    });
    describe('get', () => {
        it('should return the service for a bound id', () => {
            const service = lazyInjector.get(ServiceA);
            expect(service).toBeDefined();
            expect(service instanceof ServiceA).toBe(true);
        });
        it('should throw an error if the service id is not bound', () => {
            expect(() => lazyInjector.get('UnboundService')).toThrow();
        });
        it('should throw an error if multiple services are bound to the given id', () => {
            container.bind(ServiceA).toConstantValue('ServiceA');
            expect(() => lazyInjector.get(ServiceA)).toThrow();
        });
        it('should return the same service instance for a bound id on subsequent calls', () => {
            const serviceA1 = lazyInjector.get(ServiceA);
            const serviceA2 = lazyInjector.get(ServiceA);
            const serviceB1 = lazyInjector.get(ServiceB);
            const serviceB2 = lazyInjector.get(ServiceB);
            expect(serviceA1).toBe(serviceA2);
            expect(serviceB1).toBe(serviceB2);
        });
    });
    describe('getOptional', () => {
        it('should return the service for a bound id', () => {
            const service = lazyInjector.getOptional(ServiceA);
            expect(service).toBeDefined();
            expect(service instanceof ServiceA).toBe(true);
        });
        it('should return undefined if the service id is not bound', () => {
            const service = lazyInjector.getOptional('UnboundService');
            expect(service).toBeUndefined();
        });
        it('should throw an error if multiple services are bound to the given id', () => {
            container.bind(ServiceA).toConstantValue('ServiceA');
            expect(() => lazyInjector.get(ServiceA)).toThrow();
        });
        it('should return the same service instance for a bound id on subsequent calls', () => {
            const serviceA1 = lazyInjector.getOptional(ServiceA);
            const serviceA2 = lazyInjector.getOptional(ServiceA);
            const serviceB1 = lazyInjector.getOptional(ServiceB);
            const serviceB2 = lazyInjector.getOptional(ServiceB);
            expect(serviceA1).toBeDefined();
            expect(serviceA1).toBe(serviceA2);
            expect(serviceB1).toBeDefined();
            expect(serviceB1).toBe(serviceB2);
        });
        it('should return undefined if the service id was initially not bound but is bound on subsequent calls', () => {
            const serviceC1 = lazyInjector.getOptional('ServiceC');
            container.bind('ServiceC').toConstantValue('ServiceC');
            const serviceC2 = lazyInjector.getOptional('ServiceC');
            expect(serviceC1).toBeUndefined();
            expect(serviceC2).toBeUndefined();
        });
    });

    describe('getAll', () => {
        it('should return all services for a multi bound id', () => {
            const services = lazyInjector.getAll(MultiService);
            expect(services).toHaveLength(2);
            expect(services[0] instanceof MultiService).toBe(true);
            expect(services[1] instanceof MultiService).toBe(true);
        });
        it('should return the service for a single bound id', () => {
            const services = lazyInjector.getAll(ServiceA);
            expect(services).toHaveLength(1);
            expect(services[0] instanceof ServiceA).toBe(true);
        });
        it('should return an empty array if the service id is not bound', () => {
            const services = lazyInjector.getAll('UnboundService');
            expect(services).toHaveLength(0);
        });
        it('should return an empty array if the service id was initially not bound but is bound on subsequent calls', () => {
            const services1 = lazyInjector.getAll('ServiceC');
            container.bind('ServiceC').toConstantValue('ServiceC');
            const services2 = lazyInjector.getAll('ServiceC');
            expect(services1).toHaveLength(0);
            expect(services2).toHaveLength(0);
        });
    });
});
