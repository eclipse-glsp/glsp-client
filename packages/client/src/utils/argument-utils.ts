/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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
import { GModelElement } from '@eclipse-glsp/sprotty';
import { hasArgs } from '../base/args-feature';

export namespace GArgument {
    export function asNumber(argValue: string | number | boolean): number | undefined {
        return typeof argValue === 'number' ? argValue : undefined;
    }

    export function asNumbers(argValues: (string | number | boolean)[]): (number | undefined)[] {
        return argValues.map(asNumber);
    }

    export function asString(argValue: string | number | boolean): string | undefined {
        return typeof argValue === 'string' ? argValue : undefined;
    }

    export function asStrings(argValues: (string | number | boolean)[]): (string | undefined)[] {
        return argValues.map(asString);
    }

    export function asBoolean(argValue: string | number | boolean): boolean | undefined {
        return typeof argValue === 'boolean' ? argValue : undefined;
    }

    export function asBooleans(argValues: (string | number | boolean)[]): (boolean | undefined)[] {
        return argValues.map(asBoolean);
    }

    export function getArgument(element: GModelElement | undefined, key: string): string | number | boolean | undefined {
        return hasArgs(element) ? element.args[key] : undefined;
    }

    export function getNumber(element: GModelElement | undefined, key: string): number | undefined {
        return hasArgs(element) ? asNumber(element.args[key]) : undefined;
    }

    export function getString(element: GModelElement | undefined, key: string): string | undefined {
        return hasArgs(element) ? asString(element.args[key]) : undefined;
    }

    export function getBoolean(element: GModelElement | undefined, key: string): boolean | undefined {
        return hasArgs(element) ? asBoolean(element.args[key]) : undefined;
    }

    export function getArguments(element: GModelElement | undefined, ...keys: string[]): (number | boolean | string)[] | undefined {
        if (!hasArgs(element)) {
            return undefined;
        }
        const values = [];
        for (const key of keys) {
            const value = element.args[key];
            if (value) {
                values.push(value);
            }
        }
        return values;
    }

    export function getNumbers(element: GModelElement | undefined, ...keys: string[]): (number | undefined)[] | undefined {
        const values = getArguments(element, ...keys);
        return values ? asNumbers(values) : undefined;
    }

    export function getStrings(element: GModelElement | undefined, ...keys: string[]): (string | undefined)[] | undefined {
        const values = getArguments(element, ...keys);
        return values ? asStrings(values) : undefined;
    }

    export function getBooleans(element: GModelElement | undefined, ...keys: string[]): (boolean | undefined)[] | undefined {
        const values = getArguments(element, ...keys);
        return values ? asBooleans(values) : undefined;
    }

    export function hasNValues<T>(values: (T | undefined)[], length: number): values is T[] {
        return values.length === length && values.filter(e => e === undefined).length === 0;
    }
}

export namespace EdgePadding {
    const KEY = 'edgePadding';

    export function from(element: GModelElement | undefined): number | undefined {
        return GArgument.getNumber(element, KEY);
    }
}

export class CornerRadius {
    static NO_RADIUS = new CornerRadius(0);

    static KEY_RADIUS_TOP_LEFT = 'radiusTopLeft';
    static KEY_RADIUS_TOP_RIGHT = 'radiusTopRight';
    static KEY_RADIUS_BOTTOM_RIGHT = 'radiusBottomRight';
    static KEY_RADIUS_BOTTOM_LEFT = 'radiusBottomLeft';

    constructor(
        public readonly topLeft: number = 0,
        public readonly topRight: number = topLeft,
        public readonly bottomRight: number = topLeft,
        public readonly bottomLeft: number = topRight
    ) {}

    static from(element: GModelElement | undefined): CornerRadius | undefined {
        const radius = GArgument.getNumbers(
            element,
            this.KEY_RADIUS_TOP_LEFT,
            this.KEY_RADIUS_TOP_RIGHT,
            this.KEY_RADIUS_BOTTOM_RIGHT,
            this.KEY_RADIUS_BOTTOM_LEFT
        );
        if (radius === undefined || radius[0] === undefined) {
            return undefined;
        }
        return GArgument.hasNValues(radius, 4) ? new CornerRadius(radius[0], radius[1], radius[2], radius[3]) : new CornerRadius(radius[0]);
    }
}
