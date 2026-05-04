/********************************************************************************
 * Copyright (c) 2022-2026 EclipseSource and others.
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
    ExportResultAction,
    ExportSvgAction,
    RequestExportAction,
    RequestExportSvgAction,
    SaveModelAction,
    SetDirtyStateAction
} from './model-saving';
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

    describe('RequestExportAction', () => {
        describe('is', () => {
            it('should return true for a well-formed action carrying a `format`', () => {
                const action: RequestExportAction = {
                    kind: 'requestExport',
                    requestId: '',
                    format: 'png'
                };
                expect(RequestExportAction.is(action)).to.be.true;
            });
            it('should reject the legacy `requestExportSvg` kind to keep strict separation between the two protocols', () => {
                expect(RequestExportAction.is({ kind: 'requestExportSvg', requestId: '' })).to.be.false;
            });
            it('should return false for an action missing the `format` discriminator', () => {
                expect(RequestExportAction.is({ kind: 'requestExport', requestId: '' })).to.be.false;
            });
            it('should return false for `undefined`', () => {
                expect(RequestExportAction.is(undefined)).to.be.false;
            });
        });

        describe('create', () => {
            it('should auto-generate a `requestId` when none is supplied', () => {
                const action = RequestExportAction.create('svg');
                expect(action.kind).to.equal('requestExport');
                expect(action.format).to.equal('svg');
                expect(action.requestId).to.match(/.+/);
            });
            it('should propagate caller-supplied formatOptions and requestId', () => {
                const formatOptions = { width: 1024, skipCopyStyles: true };
                expect(RequestExportAction.create('png', { formatOptions, requestId: 'abc' })).to.deep.equals({
                    kind: 'requestExport',
                    format: 'png',
                    requestId: 'abc',
                    formatOptions
                });
            });
            it('should accept an arbitrary string format (open registry)', () => {
                const action = RequestExportAction.create('pdf');
                expect(action.format).to.equal('pdf');
            });
        });
    });

    describe('ExportResultAction', () => {
        describe('is', () => {
            it('should return true for a well-formed text-encoded result', () => {
                const action: ExportResultAction = {
                    kind: 'exportResult',
                    responseId: '',
                    format: 'svg',
                    mimeType: 'image/svg+xml',
                    encoding: 'text',
                    data: '<svg/>'
                };
                expect(ExportResultAction.is(action)).to.be.true;
            });
            it('should return true for a well-formed base64-encoded result', () => {
                const action: ExportResultAction = {
                    kind: 'exportResult',
                    responseId: '',
                    format: 'png',
                    mimeType: 'image/png',
                    encoding: 'base64',
                    data: 'aGVsbG8='
                };
                expect(ExportResultAction.is(action)).to.be.true;
            });
            it('should reject the legacy `exportSvg` kind to keep strict separation between the two protocols', () => {
                expect(ExportResultAction.is({ kind: 'exportSvg', responseId: '', svg: '<svg/>' })).to.be.false;
            });
            it('should return false when `data` is missing', () => {
                expect(
                    ExportResultAction.is({
                        kind: 'exportResult',
                        responseId: '',
                        format: 'svg',
                        mimeType: 'image/svg+xml',
                        encoding: 'text'
                    })
                ).to.be.false;
            });
        });

        describe('create', () => {
            it('should round-trip an SVG payload', () => {
                const created = ExportResultAction.create('svg', '<svg/>', { mimeType: 'image/svg+xml', encoding: 'text' });
                expect(created).to.deep.equals({
                    kind: 'exportResult',
                    responseId: '',
                    format: 'svg',
                    mimeType: 'image/svg+xml',
                    encoding: 'text',
                    data: '<svg/>'
                });
            });
            it('should round-trip a PNG payload with formatOptions echo', () => {
                const formatOptions = { width: 800 };
                const created = ExportResultAction.create('png', 'aGVsbG8=', {
                    mimeType: 'image/png',
                    encoding: 'base64',
                    responseId: 'r-1',
                    formatOptions
                });
                expect(created).to.deep.equals({
                    kind: 'exportResult',
                    responseId: 'r-1',
                    format: 'png',
                    mimeType: 'image/png',
                    encoding: 'base64',
                    data: 'aGVsbG8=',
                    formatOptions
                });
            });
        });
    });
});
