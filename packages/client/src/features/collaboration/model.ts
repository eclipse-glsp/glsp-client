/********************************************************************************
 * Copyright (c) 2021-2022 EclipseSource and others.
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

import {SChildElement, SParentElement, SShapeElement} from 'sprotty';
import {DefaultTypes} from '@eclipse-glsp/protocol';

export class CollaborationElement extends SShapeElement {
    color: string;
    visible: boolean;
}

export class MousePointer extends CollaborationElement {
    override type = DefaultTypes.MOUSE_POINTER;
    name: string;
    zoom: number;
}

export class ViewportRect extends CollaborationElement {
    override type = DefaultTypes.VIEWPORT_RECT;
}

export class SelectionIcon extends CollaborationElement {
    override type = DefaultTypes.SELECTION_ICON;
    elementType: 'Node' | 'Edge';
}

export function removeElementFromParent(parent: SParentElement, id: string): void {
    const child = parent.index.getById(id);
    if (child instanceof SChildElement) {
        parent.remove(child);
    }
}

