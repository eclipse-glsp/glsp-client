/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { BringToFrontAction } from 'sprotty-protocol/lib/actions';
import {
    Action,
    SButton,
    SModelElement,
    SModelRoot,
    SRoutableElement,
    SRoutingHandle,
    SelectAction,
    SelectMouseListener,
    SwitchEditModeAction,
    findParentByFeature,
    isCtrlOrCmd,
    isSelectable,
    toArray
} from '~glsp-sprotty';
import { DEFAULT_RANK, Ranked } from '../rank/model';

/**
 * Ranked select mouse listener that is executed before default mouse listeners when using the RankedMouseTool.
 * This ensures that default mouse listeners are working on a model that has selection changes already applied.
 */
export class RankedSelectMouseListener extends SelectMouseListener implements Ranked {
    rank: number = DEFAULT_RANK - 1; /* we want to be executed before all default mouse listeners */

    override mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        if (this.buttonHandlerRegistry !== undefined && target instanceof SButton && target.enabled) {
            const buttonHandler = this.buttonHandlerRegistry.get(target.type);
            if (buttonHandler !== undefined) {
                return buttonHandler.buttonPressed(target);
            }
        }
        const selectableTarget = findParentByFeature(target, isSelectable);
        if (selectableTarget !== undefined || target instanceof SModelRoot) {
            this.hasDragged = false;
            let deselect: SModelElement[] = [];
            // multi-selection?
            if (!isCtrlOrCmd(event)) {
                deselect = toArray(
                    target.root.index
                        .all()
                        .filter(
                            element =>
                                isSelectable(element) &&
                                element.selected &&
                                !(selectableTarget instanceof SRoutingHandle && element === (selectableTarget.parent as SModelElement))
                        )
                );
            }
            if (selectableTarget !== undefined) {
                if (!selectableTarget.selected) {
                    this.wasSelected = false;
                    result.push(
                        SelectAction.create({
                            selectedElementsIDs: [selectableTarget.id],
                            deselectedElementsIDs: deselect.map(e => e.id)
                        })
                    );
                    result.push(BringToFrontAction.create([selectableTarget.id]));
                    const routableDeselect = deselect.filter(e => e instanceof SRoutableElement).map(e => e.id);
                    if (selectableTarget instanceof SRoutableElement) {
                        result.push(
                            SwitchEditModeAction.create({
                                elementsToActivate: [selectableTarget.id],
                                elementsToDeactivate: routableDeselect
                            })
                        );
                    } else if (routableDeselect.length > 0) {
                        result.push(SwitchEditModeAction.create({ elementsToDeactivate: routableDeselect }));
                    }
                } else if (isCtrlOrCmd(event)) {
                    this.wasSelected = false;
                    result.push(SelectAction.create({ deselectedElementsIDs: [selectableTarget.id] }));
                    if (selectableTarget instanceof SRoutableElement) {
                        result.push(SwitchEditModeAction.create({ elementsToDeactivate: [selectableTarget.id] }));
                    }
                } else {
                    this.wasSelected = true;
                }
            } else {
                result.push(SelectAction.create({ deselectedElementsIDs: deselect.map(e => e.id) }));
                const routableDeselect = deselect.filter(e => e instanceof SRoutableElement).map(e => e.id);
                if (routableDeselect.length > 0) {
                    result.push(SwitchEditModeAction.create({ elementsToDeactivate: routableDeselect }));
                }
            }
        }
        return result;
    }
}
