import {inject, injectable} from 'inversify';
import {FeedbackCommand} from '../../tool-feedback/model';
import {TYPES} from '../../../base/types';
import {Command, CommandExecutionContext, CommandReturn, SModelRoot} from 'sprotty';
import {DefaultTypes} from '@eclipse-glsp/protocol';
import {DrawMousePointerAction, RemoveMousePointerAction} from './mouse-move-actions';
import {removeElementFromRoot} from '../model';

@injectable()
export class DrawMousePointerCommand extends FeedbackCommand {
    static readonly KIND = DrawMousePointerAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawMousePointerAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = mousePointerId(context.root, this.action.initialSubclientInfo.subclientId);
        removeElementFromRoot(context.root, id);
        const mousePointerSchema = {
            id,
            type: DefaultTypes.MOUSE_POINTER,
            position: {
                x: this.action.position.x,
                y: this.action.position.y
            },
            color: this.action.initialSubclientInfo.color,
            name: this.action.initialSubclientInfo.name
        };
        context.root.add(context.modelFactory.createElement(mousePointerSchema));
        return context.root;
    }
}

@injectable()
export class RemoveMousePointerCommand extends Command {
    static readonly KIND = RemoveMousePointerAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RemoveMousePointerAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = mousePointerId(context.root, this.action.initialSubclientInfo.subclientId);
        removeElementFromRoot(context.root, id);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export function mousePointerId(root: SModelRoot, subclientId: string): string {
    return root.id + '_' + DefaultTypes.MOUSE_POINTER + '_' + subclientId;
}
