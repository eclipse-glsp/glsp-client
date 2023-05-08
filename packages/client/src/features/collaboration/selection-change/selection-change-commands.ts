import {inject, injectable} from 'inversify';
import {FeedbackCommand} from '../../tool-feedback/model';
import {TYPES} from '../../../base/types';
import {Command, CommandExecutionContext, CommandReturn, SModelRoot, SParentElement} from 'sprotty';
import {removeElementFromParent, SelectionIcon} from '../model';
import {GEdge} from '../../../lib/model';
import {DefaultTypes, Point} from '@eclipse-glsp/protocol';
import {DrawSelectionIconAction, RemoveSelectionIconAction} from './selection-change-actions';

@injectable()
export class DrawSelectionIconCommand extends FeedbackCommand {
    static readonly KIND = DrawSelectionIconAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawSelectionIconAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const modelElement = context.root.index.getById(this.action.element);
        if (modelElement instanceof SParentElement) {
            const id = selectionIconId(context.root, modelElement, this.action.initialSubclientInfo.subclientId);
            removeElementFromParent(modelElement, id);
            /*const existingSelectionIcon = modelElement.index.getById(id);
            if (existingSelectionIcon) {
                return context.root;
            }*/
            const icon = new SelectionIcon();
            icon.id = id;
            icon.color = this.action.initialSubclientInfo.color;
            icon.visible = this.action.visible;
            if (modelElement instanceof GEdge) {
                const sourcePoint: Point = modelElement.args.edgeSourcePoint as any;
                const targetPoint: Point = modelElement.args.edgeTargetPoint as any;
                icon.position = {
                    x: (sourcePoint.x + targetPoint.x) / 2,
                    y: (sourcePoint.y + targetPoint.y) / 2
                };
            }
            modelElement.add(icon);
        }
        return context.root;
    }
}

@injectable()
export class RemoveSelectionIconCommand extends Command {
    static readonly KIND = RemoveSelectionIconAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RemoveSelectionIconAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const modelElement = context.root.index.getById(this.action.element);
        if (modelElement instanceof SParentElement) {
            const id = selectionIconId(context.root, modelElement, this.action.initialSubclientId);
            const existingSelectionIcon = modelElement.children.find(c => c.id === id);
            if (!existingSelectionIcon) {
                return context.root;
            }
            modelElement.remove(existingSelectionIcon);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export function selectionIconId(root: SModelRoot, parent: SParentElement, subclientId: string): string {
    return root.id + '_' + parent.id + '_' + DefaultTypes.SELECTION_ICON + '_' + subclientId;
}
