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
import { Action, GModelElement, GModelRoot, KeyListener, SelectAction, isSelected, typeGuard } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { GEdge } from '../../../model';
import { BoundsAwareModelElement, getMatchingElements, isSelectableAndBoundsAware } from '../../../utils/gmodel-util';
import { getAbsolutePosition } from '../../../utils/viewpoint-util';
import { BaseEditTool } from '../base-tools';
import { MarqueeUtil } from './marquee-behavior';
import { RemoveMarqueeAction } from './marquee-tool-feedback';

@injectable()
export class MarqueeMouseTool extends BaseEditTool {
    static ID = 'glsp.marquee-mouse-tool';

    @inject(MarqueeUtil) protected marqueeUtil: MarqueeUtil;

    protected shiftKeyListener: ShiftKeyListener = new ShiftKeyListener();

    get id(): string {
        return MarqueeMouseTool.ID;
    }

    enable(): void {
        this.toDisposeOnDisable.push(
            this.mouseTool.registerListener(new MarqueeMouseListener(this.editorContext.modelRoot, this.marqueeUtil)),
            this.keyTool.registerListener(this.shiftKeyListener),
            this.createFeedbackEmitter().add(cursorFeedbackAction(CursorCSS.MARQUEE), cursorFeedbackAction()).submit()
        );
    }

    override get isEditTool(): boolean {
        return false;
    }
}

export class MarqueeMouseListener extends DragAwareMouseListener {
    protected nodes: BoundsAwareModelElement[];
    protected edges: GEdge[];
    protected previouslySelected: string[];
    protected isActive = false;

    constructor(
        root: GModelRoot,
        protected marqueeUtil: MarqueeUtil
    ) {
        super();
        // pre-calculate all markable node and edges to improve performance
        this.nodes = this.marqueeUtil.getMarkableNodes(root);
        this.edges = this.marqueeUtil.getMarkableEdges(root);
    }

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        this.isActive = true;
        this.marqueeUtil.updateStartPoint(getAbsolutePosition(target, event));
        if (event.ctrlKey) {
            this.previouslySelected = getMatchingElements(target.index, typeGuard(isSelectableAndBoundsAware, isSelected)).map(e => e.id);
        }
        return [];
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        this.marqueeUtil.updateCurrentPoint(getAbsolutePosition(target, event));
        if (this.isActive) {
            const nodeIdsSelected = this.nodes.filter(e => this.marqueeUtil.isMarked(e)).map(e => e.id);
            const edgeIdsSelected = this.edges.filter(e => this.marqueeUtil.isMarked(e)).map(e => e.id);
            const currentSelected = nodeIdsSelected.concat(edgeIdsSelected);
            const selection = currentSelected.concat(this.previouslySelected);
            return [SelectAction.setSelection(selection), this.marqueeUtil.drawMarqueeAction()];
        }
        return [];
    }

    override mouseUp(target: GModelElement, event: MouseEvent): Action[] {
        this.isActive = false;
        return this.marqueeUtil.isContinuousMode(target, event)
            ? [RemoveMarqueeAction.create()]
            : [RemoveMarqueeAction.create(), EnableDefaultToolsAction.create()];
    }
}

@injectable()
export class ShiftKeyListener extends KeyListener {
    override keyUp(element: GModelElement, event: KeyboardEvent): Action[] {
        if (event.shiftKey) {
            return [];
        }
        return [RemoveMarqueeAction.create(), EnableDefaultToolsAction.create()];
    }
}
