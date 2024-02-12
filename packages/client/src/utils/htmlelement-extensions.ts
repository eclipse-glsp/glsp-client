/********************************************************************************
 * Copyright (c) 2023-2024 Business Informatics Group (TU Wien) and others.
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
declare global {
    interface HTMLElement {
        next(): HTMLElement;
        previous(): HTMLElement;
        first(): HTMLElement;
        last(): HTMLElement;
    }
}

// HTMLElement extensions for readability and convenience (reduce casting)
HTMLElement.prototype.next = function (): HTMLElement {
    return this.nextElementSibling as HTMLElement;
};

HTMLElement.prototype.previous = function (): HTMLElement {
    return this.previousElementSibling as HTMLElement;
};

HTMLElement.prototype.first = function (): HTMLElement {
    return this.firstElementChild as HTMLElement;
};

HTMLElement.prototype.last = function (): HTMLElement {
    return this.lastElementChild as HTMLElement;
};

export {};
