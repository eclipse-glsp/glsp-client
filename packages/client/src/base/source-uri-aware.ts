/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { AnyObject, hasStringProp } from '@eclipse-glsp/protocol';
/**
 * @deprecated No longer in use. Might be removed in future versions
 */
export interface SourceUriAware {
    sourceURI: string;
}

/**
 * @deprecated No longer in use. Might be removed in future versions
 */
// eslint-disable-next-line deprecation/deprecation
export function isSourceUriAware(obj: any): obj is SourceUriAware {
    return AnyObject.is(obj) && hasStringProp(obj, 'sourceURI');
}
