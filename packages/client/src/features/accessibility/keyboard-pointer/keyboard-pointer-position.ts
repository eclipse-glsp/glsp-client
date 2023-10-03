/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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
import { findChildrenAtPosition, findParentByFeature, SModelElement, Point } from '~glsp-sprotty';
import { Containable, isContainable } from '../../hints/model';
import { getAbsolutePositionByPoint } from '../../../utils/viewpoint-util';
import { KeyboardPointerMetadata } from './constants';
import { KeyboardPointer } from './keyboard-pointer';
import { CursorCSS } from '../../../base/feedback/css-feedback';

export class KeyboardPointerPosition {
    public renderPosition: Point = { x: 20, y: 20 };

    constructor(protected readonly keyboardPointer: KeyboardPointer) {}

    get centerizedRenderPosition(): Point {
        return {
            x: this.renderPosition.x + KeyboardPointerMetadata.CIRCLE_WIDTH / 2,
            y: this.renderPosition.y + KeyboardPointerMetadata.CRICLE_HEIGHT / 2
        };
    }

    get diagramPosition(): Point {
        return getAbsolutePositionByPoint(this.keyboardPointer.editorContextService.modelRoot, this.centerizedRenderPosition);
    }

    childrenAtDiagramPosition(): SModelElement[] {
        const position = this.diagramPosition;

        return [
            this.keyboardPointer.editorContextService.modelRoot,
            ...findChildrenAtPosition(this.keyboardPointer.editorContextService.modelRoot, position)
        ];
    }

    containableParentAtDiagramPosition(elementTypeId: string): {
        container: (SModelElement & Containable) | undefined;
        status: CursorCSS;
    } {
        const children = this.childrenAtDiagramPosition();

        return this.containableParentOf(children.reverse()[0], elementTypeId);
    }

    calcRelativeRenderPosition(x: number, y: number): Point {
        return {
            x: this.renderPosition.x + x,
            y: this.renderPosition.y + y
        };
    }

    private containableParentOf(
        target: SModelElement,
        elementTypeId: string
    ): { container: (SModelElement & Containable) | undefined; status: CursorCSS } {
        const container = findParentByFeature(target, isContainable);
        return {
            container,
            status: this.isCreationAllowed(container, elementTypeId) ? CursorCSS.NODE_CREATION : CursorCSS.OPERATION_NOT_ALLOWED
        };
    }

    private isCreationAllowed(container: (SModelElement & Containable) | undefined, elementTypeId: string): boolean | undefined {
        return container && container.isContainableElement(elementTypeId);
    }
}
