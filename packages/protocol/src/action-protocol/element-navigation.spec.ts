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
/* eslint-disable max-len */
import { expect } from 'chai';
import {
    NavigateToExternalTargetAction,
    NavigateToTargetAction,
    NavigationTarget,
    RequestNavigationTargetsAction,
    ResolveNavigationTargetAction,
    SetNavigationTargetsAction,
    SetResolvedNavigationTargetAction
} from './element-navigation';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Element navigation actions', () => {
    describe('NavigationTarget', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const target: NavigationTarget = {
                    uri: ''
                };
                expect(NavigationTarget.is(target)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(NavigationTarget.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(NavigationTarget.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('hasArguments', () => {
            it('should return true for an object having the correct type and a value for all required interface properties and a defined `args` property', () => {
                const target: NavigationTarget = { uri: 'myuri', args: { some: 'args' } };
                expect(NavigationTarget.hasArguments(target)).to.be.true;
            });
            it('should return false for an object having the correct type and a value for all required interface properties and an undefined `args property', () => {
                const target: NavigationTarget = { uri: 'myuri' };
                expect(NavigationTarget.hasArguments(target)).to.be.false;
            });
        });

        describe('addArgument', () => {
            it('should assign a new `args` property to the given target and add the given key-value pair to the args object', () => {
                const target: NavigationTarget = { uri: 'myuri' };
                NavigationTarget.addArgument(target, 'some', 'argument');
                expect(target.args?.some).to.be.equal('argument');
            });
        });
        describe('getElementIds', () => {
            it('should return the value for the ELEMENT_IDS key of the args object of the given target as a string array', () => {
                const id1 = 'someId';
                const id2 = 'anotherId';
                const target: NavigationTarget = { uri: 'myuri', args: { [NavigationTarget.ELEMENT_IDS]: `${id1}&${id2}` } };
                const elementIds = NavigationTarget.getElementIds(target);
                expect(elementIds.length).to.be.equal(2);
                expect(elementIds).to.include(id1);
                expect(elementIds).to.include(id2);
            });
            it('should return an empty array for the given target with an undefined args property', () => {
                const target: NavigationTarget = { uri: 'myuri' };
                const elementIds = NavigationTarget.getElementIds(target);
                expect(elementIds.length).to.be.equal(0);
            });
        });

        describe('setElementIds', () => {
            it('(should store the given element id array as a joined string value for the ELEMENT_IDS key', () => {
                const target: NavigationTarget = { uri: 'myuri' };
                const id1 = 'someId';
                const id2 = 'anotherId';
                NavigationTarget.setElementIds(target, id1, id2);
                expect(target.args?.[NavigationTarget.ELEMENT_IDS]).to.be.equal(`${id1}&${id2}`);
            });
        });

        describe('setTextPosition', () => {
            it('(should store the given text position in the args property of the given target with separate keys for column and line.', () => {
                const target: NavigationTarget = { uri: 'myuri' };
                const pos: NavigationTarget.TextPosition = { character: 5, line: 2 };
                const { character: column, line } = pos;
                NavigationTarget.setTextPosition(target, pos);
                expect(target.args?.[NavigationTarget.TEXT_COLUMN]).to.be.equal(column);
                expect(target.args?.[NavigationTarget.TEXT_LINE]).to.be.equal(line);
            });
        });

        describe('getTextPosition', () => {
            it('should return the text position composed of its correspond keys in the args object of the given target', () => {
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
            it('should return undefined for the given target with an undefined args property', () => {
                const target: NavigationTarget = { uri: 'myuri' };
                const result = NavigationTarget.getTextPosition(target);
                expect(result).to.be.undefined;
            });
        });
    });

    describe('RequestNavigationTargetsAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RequestNavigationTargetsAction = {
                    kind: 'requestNavigationTargets',
                    requestId: '',
                    editorContext: { selectedElementIds: [] },
                    targetTypeId: ''
                };
                expect(RequestNavigationTargetsAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestNavigationTargetsAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestNavigationTargetsAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestNavigationTargetsAction = {
                    kind: 'requestNavigationTargets',
                    requestId: '',
                    editorContext: { selectedElementIds: ['selected'] },
                    targetTypeId: 'someId'
                };
                const { editorContext, targetTypeId } = expected;
                expect(RequestNavigationTargetsAction.create({ editorContext, targetTypeId })).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
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
    });

    describe('SetNavigationTargetsAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetNavigationTargetsAction = {
                    kind: 'setNavigationTargets',
                    responseId: '',
                    targets: []
                };
                expect(SetNavigationTargetsAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SetNavigationTargetsAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetNavigationTargetsAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SetNavigationTargetsAction = {
                    kind: 'setNavigationTargets',
                    responseId: '',
                    targets: [{ uri: 'someUri' }]
                };
                const { targets } = expected;
                expect(SetNavigationTargetsAction.create(targets)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SetNavigationTargetsAction = {
                    kind: 'setNavigationTargets',
                    responseId: 'myResponse',
                    targets: [{ uri: 'someUri' }]
                };
                const { targets, responseId } = expected;
                expect(SetNavigationTargetsAction.create(targets, { responseId })).to.deep.equals(expected);
            });
        });
    });

    describe('NavigateToTargetAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: NavigateToTargetAction = {
                    kind: 'navigateToTarget',
                    target: { uri: '' }
                };
                expect(NavigateToTargetAction.is(action)).to.be.true;
            });
        });
        it('should return false for `undefined`', () => {
            expect(NavigateToTargetAction.is(undefined)).to.be.false;
        });
        it('should return false for an object that does not have all required interface properties', () => {
            expect(NavigateToTargetAction.is({ kind: 'notTheRightOne' })).to.be.false;
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
                const expected: NavigateToTargetAction = {
                    kind: 'navigateToTarget',
                    target: { uri: 'myUri' }
                };
                const { target } = expected;
                expect(NavigateToTargetAction.create(target)).to.deep.equals(expected);
            });
        });
    });

    describe('ResolveNavigationTargetAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: ResolveNavigationTargetAction = {
                    kind: 'resolveNavigationTarget',
                    requestId: '',
                    navigationTarget: { uri: '' }
                };
                expect(ResolveNavigationTargetAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(ResolveNavigationTargetAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ResolveNavigationTargetAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: ResolveNavigationTargetAction = {
                    kind: 'resolveNavigationTarget',
                    requestId: '',
                    navigationTarget: { uri: '' }
                };
                const { navigationTarget } = expected;
                expect(ResolveNavigationTargetAction.create(navigationTarget)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: ResolveNavigationTargetAction = {
                    kind: 'resolveNavigationTarget',
                    requestId: 'myRequest',
                    navigationTarget: { uri: '' }
                };
                const { navigationTarget, requestId } = expected;
                expect(ResolveNavigationTargetAction.create(navigationTarget, { requestId })).to.deep.equals(expected);
            });
        });
    });

    describe('SetResolvedNavigationTargetAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetResolvedNavigationTargetAction = {
                    kind: 'setResolvedNavigationTarget',
                    responseId: '',
                    elementIds: ['']
                };
                expect(SetResolvedNavigationTargetAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SetResolvedNavigationTargetAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetResolvedNavigationTargetAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SetResolvedNavigationTargetAction = {
                    kind: 'setResolvedNavigationTarget',
                    responseId: '',
                    elementIds: ['']
                };
                const { elementIds } = expected;
                expect(SetResolvedNavigationTargetAction.create(elementIds)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SetResolvedNavigationTargetAction = {
                    kind: 'setResolvedNavigationTarget',
                    responseId: '',
                    elementIds: ['']
                };
                const { elementIds, responseId } = expected;
                expect(SetResolvedNavigationTargetAction.create(elementIds, { responseId })).to.deep.equals(expected);
            });
        });
    });

    describe('NavigateToExternalTargetAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: NavigateToExternalTargetAction = {
                    kind: 'navigateToExternalTarget',
                    target: { uri: '' }
                };
                expect(NavigateToExternalTargetAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(NavigateToExternalTargetAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(NavigateToExternalTargetAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments', () => {
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
