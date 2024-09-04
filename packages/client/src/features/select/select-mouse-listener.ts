/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { Action, BringToFrontAction, GModelElement, SelectAction, SelectMouseListener, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { Ranked } from '../../base/ranked';
import { SelectableElement } from '../../utils/gmodel-util';
import { GResizeHandle } from '../change-bounds/model';
import { IChangeBoundsManager } from '../tools/change-bounds/change-bounds-manager';

/**
 * Ranked select mouse listener that is executed before default mouse listeners when using the RankedMouseTool.
 * This ensures that default mouse listeners are working on a model that has selection changes already applied.
 */
@injectable()
export class RankedSelectMouseListener extends SelectMouseListener implements Ranked {
    rank: number = Ranked.DEFAULT_RANK - 100; /* we want to be executed before all default mouse listeners */

    @inject(TYPES.IChangeBoundsManager) @optional() readonly changeBoundsManager?: IChangeBoundsManager;

    protected override handleSelectTarget(
        selectableTarget: SelectableElement,
        deselectedElements: GModelElement[],
        event: MouseEvent
    ): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(
            SelectAction.create({
                selectedElementsIDs: [selectableTarget.id],
                deselectedElementsIDs: deselectedElements.map(e => e.id)
            })
        );
        result.push(BringToFrontAction.create([selectableTarget.id]));

        return result;
    }

    protected override handleDeselectTarget(selectableTarget: SelectableElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(SelectAction.create({ selectedElementsIDs: [], deselectedElementsIDs: [selectableTarget.id] }));
        return result;
    }

    protected override handleDeselectAll(deselectedElements: GModelElement[], event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(SelectAction.create({ selectedElementsIDs: [], deselectedElementsIDs: deselectedElements.map(e => e.id) }));
        return result;
    }

    protected override handleButton(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] | undefined {
        if (target instanceof GResizeHandle && this.changeBoundsManager?.useSymmetricResize(event)) {
            // avoid de-selecting elements when resizing with a modifier key
            return [];
        }
        return super.handleButton(target, event);
    }
}
