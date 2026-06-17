/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
// eslint-disable-next-line no-restricted-imports -- this helper is the single sanctioned entry point for the 'uuid' dependency
import { v4, validate } from 'uuid';

/**
 * Generates a random RFC-4122 v4 UUID.
 *
 * This is the single entry point for UUID creation across all GLSP components: routing every
 * caller through `@eclipse-glsp/protocol` keeps `uuid` an isolated, auditable dependency instead
 * of letting each package pull in (and pin) its own copy.
 *
 * @returns a newly generated v4 UUID
 */
export function generateUuid(): string {
    return v4();
}

/**
 * Checks whether the given string is a well-formed RFC-4122 UUID.
 *
 * @param value the string to test
 * @returns `true` if {@link value} is a valid UUID
 */
export function isUuid(value: string): boolean {
    return validate(value);
}
