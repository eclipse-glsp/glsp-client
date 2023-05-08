import {inject, injectable} from 'inversify';
import {FeedbackCommand} from '../../tool-feedback/model';
import {TYPES} from '../../../base/types';
import {Command, CommandExecutionContext, CommandReturn, SModelRoot} from 'sprotty';
import {DefaultTypes} from '@eclipse-glsp/protocol';
import {DrawViewportRectAction, RemoveViewportRectAction} from './viewport-bounds-change-actions';
import {removeElementFromParent} from '../model';

@injectable()
export class DrawViewportRectCommand extends FeedbackCommand {
    static readonly KIND = DrawViewportRectAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawViewportRectAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = viewportRectId(context.root, this.action.initialSubclientInfo.subclientId);
        removeElementFromParent(context.root, id);
        const viewportRectSchema = {
            id,
            type: DefaultTypes.VIEWPORT_RECT,
            position: {
                x: this.action.bounds.x,
                y: this.action.bounds.y
            },
            size: {
                width: this.action.bounds.width,
                height: this.action.bounds.height
            },
            color: this.action.initialSubclientInfo.color,
            visible: this.action.visible
        };
        context.root.add(context.modelFactory.createElement(viewportRectSchema));
        return context.root;
    }
}

@injectable()
export class RemoveViewportRectCommand extends Command {
    static readonly KIND = RemoveViewportRectAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RemoveViewportRectAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = viewportRectId(context.root, this.action.initialSubclientId);
        removeElementFromParent(context.root, id);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export function viewportRectId(root: SModelRoot, subclientId: string): string {
    return root.id + '_' + DefaultTypes.VIEWPORT_RECT + '_' + subclientId;
}
