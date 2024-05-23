/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
import { Action, Command, CommandExecutionContext, Disposable } from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { IFeedbackActionDispatcher, IFeedbackEmitter } from './feedback-action-dispatcher';
import { FeedbackEmitter } from './feedback-emitter';

class MockFeedbackActionDispatcher implements IFeedbackActionDispatcher {
    protected feedbackEmitters: Map<IFeedbackEmitter, Action[]> = new Map();

    registerFeedback(feedbackEmitter: IFeedbackEmitter, actions: Action[]): Disposable {
        this.feedbackEmitters.set(feedbackEmitter, actions);
        return Disposable.create(() => this.deregisterFeedback(feedbackEmitter));
    }

    deregisterFeedback(feedbackEmitter: IFeedbackEmitter, _actions?: Action[]): void {
        this.feedbackEmitters.delete(feedbackEmitter);
    }

    getRegisteredFeedback(): Action[] {
        const result: Action[] = [];
        this.feedbackEmitters.forEach((value, key) => result.push(...value));
        return result;
    }

    getFeedbackCommands(): Command[] {
        return [];
    }

    createEmitter(): FeedbackEmitter {
        return new FeedbackEmitter(this);
    }

    async applyFeedbackCommands(context: CommandExecutionContext): Promise<void> {}
}

describe('FeedbackEmitter', () => {
    describe('Initial State', () => {
        it('On creation nothing should be submitted.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            feedback.submit();
            expect(feedbackActionDispatcher['feedbackEmitters']).to.be.empty;
        });
    });

    describe('Adding Feedback', () => {
        it('Should add an action as part of the emitter feedback.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            feedback.add(action);
            expect(feedback['feedbackActions']).to.deep.equal([action]);
        });

        it('Should add an action and cleanup action as part of the emitter feedback.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            const cleanupAction: Action = { kind: 'cleanup' };
            feedback.add(action, cleanupAction);
            expect(feedback['feedbackActions']).to.deep.equal([action]);
            expect(feedback['cleanupActions']).to.deep.equal([cleanupAction]);
        });
    });

    describe('Merging Feedback', () => {
        it('Should merge the feedback of another emitter into this emitter.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback1 = feedbackActionDispatcher.createEmitter();
            const feedback2 = feedbackActionDispatcher.createEmitter();
            const action1: Action = { kind: 'action1' };
            const action2: Action = { kind: 'action2' };
            feedback1.add(action1);
            feedback2.add(action2);
            feedback1.merge(feedback2);
            expect(feedback1['feedbackActions']).to.deep.equal([action1, action2]);
        });
    });

    describe('Removing Feedback', () => {
        it('Should remove the action from the emitter feedback.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            feedback.add(action);
            feedback.remove(action);
            expect(feedback['feedbackActions']).to.be.empty;
        });

        it('Should remove the action together with the cleanup action from the emitter feedback.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            const cleanupAction: Action = { kind: 'cleanup' };
            feedback.add(action, cleanupAction);
            feedback.remove(action);
            expect(feedback['feedbackActions']).to.be.empty;
            expect(feedback['cleanupActions']).to.be.empty;
        });
    });

    describe('Clearing Feedback', () => {
        it('Should clear any pending feedback actions and cleanup actions.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            const cleanupAction: Action = { kind: 'cleanup' };
            feedback.add(action, cleanupAction);
            feedback.clear();
            expect(feedback['feedbackActions']).to.be.empty;
            expect(feedback['cleanupActions']).to.be.empty;
        });
    });

    describe('Submitting Feedback', () => {
        it('Should register any pending actions as feedback.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            feedback.add(action);
            feedback.submit();
            expect(feedbackActionDispatcher['feedbackEmitters'].size).to.equal(1);
            expect(feedbackActionDispatcher['feedbackEmitters'].get(feedback)).to.deep.equal([action]);
        });
    });

    describe('Discarding Feedback', () => {
        it('Should remove the registered feedback without calling any cleanup actions.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            feedback.add(action);
            feedback.submit();
            feedback.discard();
            expect(feedbackActionDispatcher['feedbackEmitters']).to.be.empty;
        });
    });

    describe('Reverting Feedback', () => {
        it('Should remove the registered feedback and call the registered cleanup actions.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            const cleanupAction: Action = { kind: 'cleanup' };
            feedback.add(action, cleanupAction);
            feedback.submit();
            feedback.revert();
            expect(feedbackActionDispatcher['feedbackEmitters']).to.be.empty;
        });
    });

    describe('Disposing Feedback', () => {
        it('Should dispose the registered feedback and any pending feedback actions.', () => {
            const feedbackActionDispatcher = new MockFeedbackActionDispatcher();
            const feedback = feedbackActionDispatcher.createEmitter();
            const action: Action = { kind: 'action' };
            feedback.add(action);
            feedback.dispose();
            expect(feedbackActionDispatcher['feedbackEmitters']).to.be.empty;
        });
    });
});
