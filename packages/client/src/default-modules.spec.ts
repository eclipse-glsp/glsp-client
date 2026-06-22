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
import { FeatureModule } from '@eclipse-glsp/sprotty';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Container } from 'inversify';
import { defaultModule } from './base/default.module';
import { DEFAULT_MODULES, initializeDiagramContainer } from './default-modules';

describe('default-modules', () => {
    // InitializeDiagramContainer internally uses `resolveContainerConfiguration` so we only test functionality
    // that is not covered by the tests of `resolveContainerConfiguration`.
    describe('initializeDiagramContainer', () => {
        const container = new Container();
        let loadSpy: ReturnType<typeof vi.spyOn>;
        container.snapshot();

        beforeEach(() => {
            container.restore();
            container.snapshot();
            loadSpy = vi.spyOn(container, 'load');
        });
        it('should initialize the diagram container with the default modules in addition to the given config and load them first', () => {
            const extraModule = new FeatureModule(() => {});
            initializeDiagramContainer(container, { add: extraModule });
            expect(loadSpy).toHaveBeenCalledOnce();
            const callArgs = [...loadSpy.mock.calls[0]];
            const lastModule = callArgs.pop();
            expect(callArgs).toEqual(DEFAULT_MODULES);
            expect(lastModule).toBe(extraModule);
        });
        it('should throw an error if the base (default) module is removed via configuration', () => {
            expect(() => initializeDiagramContainer(container, { remove: defaultModule })).toThrow(/Invalid module configuration/);
        });

        it('should throw an error if the base (default) module is not the first module of the resolved configured (removed and added again)', () => {
            expect(() => initializeDiagramContainer(container, { remove: defaultModule, add: defaultModule })).toThrow(
                /Invalid module configuration/
            );
        });
    });
});
