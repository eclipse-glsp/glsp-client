/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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

import { Disposable, Emitter, type Event } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';

export interface ShortcutRegistration {
    shortcuts: string[];
    description: string;
    group: string;
    position: number;
}

export interface IShortcutManager {
    onDidChange: Event<ReadonlyMap<symbol, ShortcutRegistration[]>>;

    register(token: symbol, shortcuts: ShortcutRegistration[]): Disposable;
    deregister(token: symbol): void;

    getShortcuts(): ReadonlyMap<symbol, ShortcutRegistration[]>;
    getRegistrations(): ShortcutRegistration[];
}

@injectable()
export class ShortcutManager implements IShortcutManager {
    protected readonly registrations = new Map<symbol, ShortcutRegistration[]>();
    protected readonly onDidChangeEmitter = new Emitter<ReadonlyMap<symbol, ShortcutRegistration[]>>();
    onDidChange = this.onDidChangeEmitter.event;

    getShortcuts(): ReadonlyMap<symbol, ShortcutRegistration[]> {
        return this.registrations;
    }

    getRegistrations(): ShortcutRegistration[] {
        return Array.from(this.registrations.values()).flat();
    }

    register(token: symbol, shortcuts: ShortcutRegistration[]): Disposable {
        this.registrations.set(token, shortcuts);
        this.onDidChangeEmitter.fire(this.registrations);

        return Disposable.create(() => {
            this.deregister(token);
        });
    }

    deregister(token: symbol): void {
        this.registrations.delete(token);
        this.onDidChangeEmitter.fire(this.registrations);
    }
}
