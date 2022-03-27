/********************************************************************************
 * Copyright (c) 2021-2022 STMicroelectronics and others.
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
import { Bounds } from 'sprotty-protocol';
import * as sprotty from 'sprotty-protocol/lib/model';
import { hasStringProp } from '../utils/type-util';

/**
 * The schema of an SModelElement describes its serializable form. The actual class-based model is derived
 * its schema whenever the client or server deserializes a received schema`.
 * Each model element must have a unique ID and a type that is used on the client to  look up its view.
 */
export interface SModelElementSchema extends sprotty.SModelElement {
    /**
     * Unique identifier for this element.
     */
    id: string;
    /**
     * Type to look up the graphical representation of this element.
     */
    type: string;
    /**
     * Children of this element.
     */
    children?: SModelElementSchema[];

    /**
     * CSS classes that should be applied on the rendered SVG element representing this element.
     */
    cssClasses?: string[];
}

export namespace SModelElementSchema {
    /**
     * Typeguard function to check wether the given object is an {@link SModelElementSchema}.
     * @param object The object to check.
     * @returns A type literal indicating wether the given object is of type {@link SModelElementSchema}.
     */
    export function is(object: any): object is SModelElementSchema {
        return typeof object === 'object' && hasStringProp(object, 'type') && hasStringProp(object, 'id');
    }
}

/**
 * Serializable schema for the root element of the model tree.
 */
export interface SModelRootSchema extends SModelElementSchema {
    /**
     * Bounds of this element in the canvas.
     */
    canvasBounds?: Bounds;

    /**
     * Version of this root element.
     */
    revision?: number;
}
