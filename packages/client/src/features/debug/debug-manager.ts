/********************************************************************************
 * Copyright (c) 2024 Axon Ivy AG and others.
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

import { IActionHandler, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct } from 'inversify';
import { IFeedbackActionDispatcher } from '../../base/feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from '../../base/feedback/feedback-emitter';
import { EnableDebugModeAction } from './debug-model';

export interface IDebugManager {
    /** Flag to indicate whether the debug mode is enabled. */
    readonly isDebugEnabled: boolean;
    /** Sets the debug enabled state. */
    setDebugEnabled(enabled: boolean): void;
    /** Toggles the debug enabled state. */
    toggleDebugEnabled(): void;
}

/**
 * The default {@link IDebugManager} implementation.
 * This class manages the debug mode and provides functionality to enable or disable it.
 */
@injectable()
export class DebugManager implements IActionHandler, IDebugManager {
    protected _debugEnabled: boolean = false;
    protected debugFeedback: FeedbackEmitter;

    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackDispatcher: IFeedbackActionDispatcher;

    get isDebugEnabled(): boolean {
        return this._debugEnabled;
    }

    @postConstruct()
    protected init(): void {
        this.debugFeedback = this.feedbackDispatcher.createEmitter();
    }

    handle(action: EnableDebugModeAction): void {
        this.setDebugEnabled(action.enable);
    }

    setDebugEnabled(enabled: boolean): void {
        if (this._debugEnabled && !enabled) {
            this._debugEnabled = false;
            this.debugFeedback.dispose();
        } else if (!this._debugEnabled && enabled) {
            this._debugEnabled = true;
            this.debugFeedback
                .add(EnableDebugModeAction.create({ enable: true }), EnableDebugModeAction.create({ enable: false }))
                .submit();
        }
    }

    toggleDebugEnabled(): void {
        this.setDebugEnabled(!this._debugEnabled);
    }
}
