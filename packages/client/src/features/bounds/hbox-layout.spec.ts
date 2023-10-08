/********************************************************************************
 * Copyright (c) 2022-2023 TypeFox, STMicroelectronics and others.
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
/* eslint-disable deprecation/deprecation */
import { expect } from 'chai';
import 'mocha';
import 'reflect-metadata';
import { BoundsData, ConsoleLogger, Dimension, GModelElement, GNode } from '@eclipse-glsp/sprotty';
import { createLabel, createNode, layout, setupLayoutRegistry } from './layouter-test-util.spec';

describe('HBoxLayouter', () => {
    const layoutRegistry = setupLayoutRegistry();
    const log = new ConsoleLogger();
    const map = new Map<GModelElement, BoundsData>();

    function createModel(): GNode {
        const model = createNode('node', undefined, Dimension.EMPTY);
        model.children = [
            createLabel('label1', undefined, undefined, { width: 1, height: 2 }),
            createLabel('label2', undefined, undefined, { width: 2, height: 1 }),
            createLabel('label3', undefined, undefined, { width: 3, height: 3 })
        ];
        model.layout = 'hbox';
        return model;
    }

    it('defaultParams', () => {
        const model = createModel();
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 18, height: 13 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 5.5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 7, y: 6, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 10, y: 5, width: 3, height: 3 });
    });

    it('alignTop', () => {
        const model = createModel();
        model.layoutOptions = {
            vAlign: 'top'
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 18, height: 13 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 7, y: 5, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 10, y: 5, width: 3, height: 3 });
    });

    it('alignCenter', () => {
        const model = createModel();
        model.layoutOptions = {
            vAlign: 'center'
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 18, height: 13 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 5.5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 7, y: 6, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 10, y: 5, width: 3, height: 3 });
    });

    it('alignBottom', () => {
        const model = createModel();
        model.layoutOptions = {
            vAlign: 'bottom'
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 18, height: 13 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 6, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 7, y: 7, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 10, y: 5, width: 3, height: 3 });
    });

    it('padding', () => {
        const model = createModel();
        model.layoutOptions = {
            paddingTop: 7,
            paddingBottom: 8,
            paddingLeft: 9,
            paddingRight: 10
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 27, height: 18 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 9, y: 7.5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 11, y: 8, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 14, y: 7, width: 3, height: 3 });
    });

    it('hGap', () => {
        const model = createModel();
        model.layoutOptions = {
            hGap: 4
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 24, height: 13 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 5.5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 10, y: 6, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 16, y: 5, width: 3, height: 3 });
    });

    it('paddingFactor', () => {
        const model = createModel();
        model.layoutOptions = {
            paddingFactor: 2
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 18, height: 13 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 9, y: 8.5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 11, y: 9, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 14, y: 8, width: 3, height: 3 });
    });

    it('minWidth', () => {
        const model = createModel();
        model.layoutOptions = {
            minWidth: 25
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 25, height: 13 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 5.5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 7, y: 6, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 10, y: 5, width: 3, height: 3 });
    });

    it('minHeight', () => {
        const model = createModel();
        model.layoutOptions = {
            minHeight: 25
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 18, height: 25 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 11.5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 7, y: 12, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 10, y: 11, width: 3, height: 3 });
    });

    it('prefWidth', () => {
        const model = createModel();
        model.layoutOptions = {
            prefWidth: 20
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 20, height: 13 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 5.5, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 7, y: 6, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 10, y: 5, width: 3, height: 3 });
    });

    it('prefHeight', () => {
        const model = createModel();
        model.layoutOptions = {
            prefHeight: 20
        };
        layout(layoutRegistry, log, map, model);
        expect(map.get(model)!.bounds).to.deep.equal({ x: 0, y: 0, width: 18, height: 20 });
        expect(map.get(model.children[0])!.bounds).to.deep.equal({ x: 5, y: 9, width: 1, height: 2 });
        expect(map.get(model.children[1])!.bounds).to.deep.equal({ x: 7, y: 9.5, width: 2, height: 1 });
        expect(map.get(model.children[2])!.bounds).to.deep.equal({ x: 10, y: 8.5, width: 3, height: 3 });
    });
});
