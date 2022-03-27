/********************************************************************************
 * Copyright (c) 2022 STMicroelectronics and others.
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
import { expect } from 'chai';
import {
    NavigateToExternalTargetAction,
    NavigateToTargetAction,
    NavigationTarget,
    RequestNavigationTargetsAction,
    ResolveNavigationTargetAction,
    SetNavigationTargetsAction,
    SetResolvedNavigationTargetAction
} from '../element-navigation';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element navigation actions', () => {
    describe('NavigationTarget', () => {
        it('NavigationTarget.is with valid object', () => {
            const target: NavigationTarget = {
                uri: ''
            };
            expect(NavigationTarget.is(target)).to.be.true;
        });
        it('NavigationTarget.is with undefined', () => {
            expect(NavigationTarget.is(undefined)).to.be.false;
        });
        it('NavigationTarget.is with invalid object', () => {
            expect(NavigationTarget.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('(Navigation.hasArguments with additional args', () => {
            const target: NavigationTarget = { uri: 'myuri', args: { some: 'args' } };
            expect(NavigationTarget.hasArguments(target)).to.be.true;
        });
        it('(Navigation.hasArguments without additional args', () => {
            const target: NavigationTarget = { uri: 'myuri' };
            expect(NavigationTarget.hasArguments(target)).to.be.false;
        });
        it('(Navigation.addArguments', () => {
            const target: NavigationTarget = { uri: 'myuri' };
            NavigationTarget.addArgument(target, 'some', 'argument');
            expect(target.args?.some).to.be.equal('argument');
        });
        it('(Navigation.getElementIds with existing ids', () => {
            const id1 = 'someId';
            const id2 = 'anotherId';
            const target: NavigationTarget = { uri: 'myuri', args: { [NavigationTarget.ELEMENT_IDS]: `${id1}&${id2}` } };
            const elementIds = NavigationTarget.getElementIds(target);
            expect(elementIds.length).to.be.equal(2);
            expect(elementIds).to.include(id1);
            expect(elementIds).to.include(id2);
        });
        it('(Navigation.getElementIds with non-existing ids', () => {
            const target: NavigationTarget = { uri: 'myuri' };
            const elementIds = NavigationTarget.getElementIds(target);
            expect(elementIds.length).to.be.equal(0);
        });
        it('(Navigation.setElementIds', () => {
            const target: NavigationTarget = { uri: 'myuri' };
            const id1 = 'someId';
            const id2 = 'anotherId';
            NavigationTarget.setElementIds(target, id1, id2);
            expect(target.args?.[NavigationTarget.ELEMENT_IDS]).to.be.equal(`${id1}&${id2}`);
        });
        it('(Navigation.setTextposition', () => {
            const target: NavigationTarget = { uri: 'myuri' };
            const pos: NavigationTarget.TextPosition = { character: 5, line: 2 };
            const { character: column, line } = pos;
            NavigationTarget.setTextPosition(target, pos);
            expect(target.args?.[NavigationTarget.TEXT_COLUMN]).to.be.equal(column);
            expect(target.args?.[NavigationTarget.TEXT_LINE]).to.be.equal(line);
        });
        it('(Navigation.getTextPosition with existing position', () => {
            const position: NavigationTarget.TextPosition = {
                character: 5,
                line: 2
            };
            const target: NavigationTarget = {
                uri: 'myuri',
                args: { [NavigationTarget.TEXT_COLUMN]: position.character, [NavigationTarget.TEXT_LINE]: position.line }
            };
            const result = NavigationTarget.getTextPosition(target);
            expect(result).to.be.not.undefined;
            expect(result).to.be.deep.equal(position);
        });
        it('(Navigation.getElementIds with non-existing ids', () => {
            const target: NavigationTarget = { uri: 'myuri' };
            const result = NavigationTarget.getTextPosition(target);
            expect(result).to.be.undefined;
        });
    });

    describe('RequestNavigationTargetsAction', () => {
        it('RequestNavigationTargetsAction.is with valid action type', () => {
            const action: RequestNavigationTargetsAction = {
                kind: 'requestNavigationTargets',
                requestId: '',
                editorContext: { selectedElementIds: [] },
                targetTypeId: ''
            };
            expect(RequestNavigationTargetsAction.is(action)).to.be.true;
        });
        it('RequestNavigationTargetsAction.is with undefined', () => {
            expect(RequestNavigationTargetsAction.is(undefined)).to.be.false;
        });
        it('RequestNavigationTargetsAction.is with invalid action type', () => {
            expect(RequestNavigationTargetsAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('RequestNavigationTargetsAction.create with required args', () => {
            const expected: RequestNavigationTargetsAction = {
                kind: 'requestNavigationTargets',
                requestId: '',
                editorContext: { selectedElementIds: ['selected'] },
                targetTypeId: 'someId'
            };
            const { editorContext, targetTypeId } = expected;
            expect(RequestNavigationTargetsAction.create({ editorContext, targetTypeId })).to.deep.equals(expected);
        });
        it('RequestNavigationTargetsAction.create with optional args', () => {
            const expected: RequestNavigationTargetsAction = {
                kind: 'requestNavigationTargets',
                requestId: 'myRequest',
                editorContext: { selectedElementIds: ['selected'] },
                targetTypeId: 'someId'
            };
            const { editorContext, targetTypeId, requestId } = expected;
            expect(RequestNavigationTargetsAction.create({ editorContext, targetTypeId, requestId })).to.deep.equals(expected);
        });
    });

    describe('SetNavigationTargetsAction', () => {
        it('SetNavigationTargetsAction.is with valid action type', () => {
            const action: SetNavigationTargetsAction = {
                kind: 'setNavigationTargets',
                responseId: '',
                targets: []
            };
            expect(SetNavigationTargetsAction.is(action)).to.be.true;
        });
        it('SetNavigationTargetsAction.is with undefined', () => {
            expect(SetNavigationTargetsAction.is(undefined)).to.be.false;
        });
        it('SetNavigationTargetsAction.is with invalid action type', () => {
            expect(SetNavigationTargetsAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('SetNavigationTargetsAction.create with required args', () => {
            const expected: SetNavigationTargetsAction = {
                kind: 'setNavigationTargets',
                responseId: '',
                targets: [{ uri: 'someUri' }]
            };
            const { targets } = expected;
            expect(SetNavigationTargetsAction.create(targets)).to.deep.equals(expected);
        });
        it('SetNavigationTargetsAction.create with optional args', () => {
            const expected: SetNavigationTargetsAction = {
                kind: 'setNavigationTargets',
                responseId: 'myResponse',
                targets: [{ uri: 'someUri' }]
            };
            const { targets, responseId } = expected;
            expect(SetNavigationTargetsAction.create(targets, { responseId })).to.deep.equals(expected);
        });
    });

    describe('NavigateToTargetAction', () => {
        it('NavigateToTargetAction.is with valid action type', () => {
            const action: NavigateToTargetAction = {
                kind: 'navigateToTarget',
                target: { uri: '' }
            };
            expect(NavigateToTargetAction.is(action)).to.be.true;
        });
        it('NavigateToTargetAction.is with undefined', () => {
            expect(NavigateToTargetAction.is(undefined)).to.be.false;
        });
        it('NavigateToTargetAction.is with invalid action type', () => {
            expect(NavigateToTargetAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('NavigateToTargetAction.create with required args', () => {
            const expected: NavigateToTargetAction = {
                kind: 'navigateToTarget',
                target: { uri: 'myUri' }
            };
            const { target } = expected;
            expect(NavigateToTargetAction.create(target)).to.deep.equals(expected);
        });
    });

    describe('ResolveNavigationTargetAction', () => {
        it('ResolveNavigationTargetAction.is with valid action type', () => {
            const action: ResolveNavigationTargetAction = {
                kind: 'resolveNavigationTarget',
                requestId: '',
                navigationTarget: { uri: '' }
            };
            expect(ResolveNavigationTargetAction.is(action)).to.be.true;
        });
        it('ResolveNavigationTargetAction.is with undefined', () => {
            expect(ResolveNavigationTargetAction.is(undefined)).to.be.false;
        });
        it('ResolveNavigationTargetAction.is with invalid action type', () => {
            expect(ResolveNavigationTargetAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });
        it('ResolveNavigationTargetAction.create with required args', () => {
            const expected: ResolveNavigationTargetAction = {
                kind: 'resolveNavigationTarget',
                requestId: '',
                navigationTarget: { uri: '' }
            };
            const { navigationTarget } = expected;
            expect(ResolveNavigationTargetAction.create(navigationTarget)).to.deep.equals(expected);
        });
        it('ResolveNavigationTargetAction.create with optional args', () => {
            const expected: ResolveNavigationTargetAction = {
                kind: 'resolveNavigationTarget',
                requestId: 'myRequest',
                navigationTarget: { uri: '' }
            };
            const { navigationTarget, requestId } = expected;
            expect(ResolveNavigationTargetAction.create(navigationTarget, { requestId })).to.deep.equals(expected);
        });

        describe('SetResolvedNavigationTargetAction', () => {
            it('SetResolvedNavigationTargetAction.is with valid action type', () => {
                const action: SetResolvedNavigationTargetAction = {
                    kind: 'setResolvedNavigationTarget',
                    responseId: '',
                    elementIds: ['']
                };
                expect(SetResolvedNavigationTargetAction.is(action)).to.be.true;
            });
            it('SetResolvedNavigationTargetAction.is with undefined', () => {
                expect(SetResolvedNavigationTargetAction.is(undefined)).to.be.false;
            });
            it('SetResolvedNavigationTargetAction.is with invalid action type', () => {
                expect(SetResolvedNavigationTargetAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
            it('SetResolvedNavigationTargetAction.create with required args', () => {
                const expected: SetResolvedNavigationTargetAction = {
                    kind: 'setResolvedNavigationTarget',
                    responseId: '',
                    elementIds: ['']
                };
                const { elementIds } = expected;
                expect(SetResolvedNavigationTargetAction.create(elementIds)).to.deep.equals(expected);
            });
            it('SetResolvedNavigationTargetAction.create with optional args', () => {
                const expected: SetResolvedNavigationTargetAction = {
                    kind: 'setResolvedNavigationTarget',
                    responseId: '',
                    elementIds: ['']
                };
                const { elementIds, responseId } = expected;
                expect(SetResolvedNavigationTargetAction.create(elementIds, { responseId })).to.deep.equals(expected);
            });
        });

        describe('NavigateToExternalTargetAction', () => {
            it('NavigateToExternalTargetAction.is with valid action type', () => {
                const action: NavigateToExternalTargetAction = {
                    kind: 'navigateToExternalTarget',
                    target: { uri: '' }
                };
                expect(NavigateToExternalTargetAction.is(action)).to.be.true;
            });
            it('NavigateToExternalTargetAction.is with undefined', () => {
                expect(NavigateToExternalTargetAction.is(undefined)).to.be.false;
            });
            it('NavigateToExternalTargetAction.is with invalid action type', () => {
                expect(NavigateToExternalTargetAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
            it('NavigateToExternalTargetAction.create with required args', () => {
                const expected: NavigateToExternalTargetAction = {
                    kind: 'navigateToExternalTarget',
                    target: { uri: '' }
                };
                const { target } = expected;
                expect(NavigateToExternalTargetAction.create(target)).to.deep.equals(expected);
            });
        });
    });
});
