/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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
import { ExportSvgAction, RequestExportSvgAction, SaveModelAction, SetDirtyStateAction } from './model-saving';
/**
 * Tests for the utility functions declared in the namespaces of the protocol
 * action definitions.
 */

describe('Model saving actions', () => {
    describe('SaveModelAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SaveModelAction = {
                    kind: 'saveModel'
                };
                expect(SaveModelAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SaveModelAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SaveModelAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SaveModelAction = {
                    kind: 'saveModel'
                };

                expect(SaveModelAction.create()).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SaveModelAction = {
                    kind: 'saveModel',
                    fileUri: 'myUri'
                };
                const { fileUri } = expected;
                expect(SaveModelAction.create({ fileUri })).to.deep.equals(expected);
            });
        });
    });

    describe('SetDirtyStateAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: SetDirtyStateAction = {
                    kind: 'setDirtyState',
                    isDirty: true
                };
                expect(SetDirtyStateAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(SetDirtyStateAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(SetDirtyStateAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: SetDirtyStateAction = {
                    kind: 'setDirtyState',
                    isDirty: true
                };
                const { isDirty } = expected;
                expect(SetDirtyStateAction.create(isDirty)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: SetDirtyStateAction = {
                    kind: 'setDirtyState',
                    isDirty: false,
                    reason: 'save'
                };
                const { isDirty, reason } = expected;
                expect(SetDirtyStateAction.create(isDirty, { reason })).to.deep.equals(expected);
            });
        });
    });

    describe('RequestExportSvgAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: RequestExportSvgAction = {
                    kind: 'requestExportSvg',
                    requestId: ''
                };
                expect(RequestExportSvgAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(RequestExportSvgAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(RequestExportSvgAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: RequestExportSvgAction = {
                    kind: 'requestExportSvg',
                    requestId: ''
                };
                expect(RequestExportSvgAction.create()).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: RequestExportSvgAction = {
                    kind: 'requestExportSvg',
                    requestId: 'myRequest'
                };
                const { requestId } = expected;
                expect(RequestExportSvgAction.create({ requestId })).to.deep.equals(expected);
            });
        });
    });

    describe('ExportSvgAction', () => {
        describe('is', () => {
            it('should return true for an object having the correct type and a value for all required interface properties', () => {
                const action: ExportSvgAction = {
                    kind: 'exportSvg',
                    responseId: '',
                    svg: ''
                };
                expect(ExportSvgAction.is(action)).to.be.true;
            });
            it('should return false for `undefined`', () => {
                expect(ExportSvgAction.is(undefined)).to.be.false;
            });
            it('should return false for an object that does not have all required interface properties', () => {
                expect(ExportSvgAction.is({ kind: 'notTheRightOne' })).to.be.false;
            });
        });

        describe('create', () => {
            it('should return an object conforming to the interface with matching properties for the given required arguments and default values for the optional arguments', () => {
                const expected: ExportSvgAction = {
                    kind: 'exportSvg',
                    responseId: '',
                    svg: 'someSvg'
                };
                const { svg } = expected;
                expect(ExportSvgAction.create(svg)).to.deep.equals(expected);
            });
            it('should return an object conforming to the interface with matching properties for the given required and optional arguments', () => {
                const expected: ExportSvgAction = {
                    kind: 'exportSvg',
                    responseId: 'responseId',
                    svg: 'someSvg'
                };
                const { svg, responseId } = expected;
                expect(ExportSvgAction.create(svg, { responseId })).to.deep.equals(expected);
            });
        });
    });
});
