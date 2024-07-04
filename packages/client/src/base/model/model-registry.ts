/********************************************************************************
 * Copyright (c) 2021-2024 EclipseSource and others.
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
import { GModelElement, GModelElementConstructor, SModelRegistry } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { argsFeature } from '../args-feature';

/**
 *  Model element classes registered here are considered automatically when constructing a model from its schema.
 *  Use the `configureModelElement` utility function to register a model element and its target render view in the
 *  corresponding factories.
 */
@injectable()
export class GModelRegistry extends SModelRegistry {
    /* Overwrite the `register` method to only log an info message (instead of thrown an error) if
       an existing registration is overwritten */
    override register(key: string, factory: (u: void) => GModelElement): void {
        if (key === undefined) {
            throw new Error('Key is undefined');
        }
        if (this.hasKey(key)) {
            // do not throw error but log overwriting
            console.log(`Key is already registered: ${key}.Factory for model element '${key}' will be overwritten.`);
            console.warn(
                'Implicit overwriting by registering the same key twice is deprecated' +
                    "\n Use 'overrideModelElement()' instead of 'configureModelElement()' for explicit overwriting."
            );
        }
        this.elements.set(key, factory);
    }

    protected override getDefaultFeatures(constr: GModelElementConstructor): readonly symbol[] | undefined {
        // Add the argsFeature per default to all model elements
        const features = [...(super.getDefaultFeatures(constr) ?? [])];
        if (!features.includes(argsFeature)) {
            features.push(argsFeature);
        }
        return features;
    }
}
