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
import { Action, GModelElement, KeyListener } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { SelectionService } from '../../../base/selection-service';
import { EnableToolsAction } from '../../../base/tool-manager/tool';
import { BaseEditTool } from '../base-tools';
import { MarqueeMouseTool } from './marquee-mouse-tool';

@injectable()
export class MarqueeTool extends BaseEditTool {
    static ID = 'glsp.marquee-tool';

    @inject(SelectionService) protected selectionService: SelectionService;

    protected marqueeKeyListener: MarqueeKeyListener;

    get id(): string {
        return MarqueeTool.ID;
    }

    enable(): void {
        if (!this.marqueeKeyListener) {
            this.marqueeKeyListener = new MarqueeKeyListener(this.selectionService);
        }
        this.toDisposeOnDisable.push(this.keyTool.registerListener(this.marqueeKeyListener));
    }
}

@injectable()
export class MarqueeKeyListener extends KeyListener {
    constructor(protected selectionService: SelectionService) {
        super();
    }

    override keyDown(_element: GModelElement, event: KeyboardEvent): Action[] {
        if (event.shiftKey && !this.selectionService.hasSelectedElements()) {
            return [EnableToolsAction.create([MarqueeMouseTool.ID])];
        }
        return [];
    }
}
