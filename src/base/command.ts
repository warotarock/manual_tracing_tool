import { List, ListRemoveAt } from 'base/conversion';
import { VectorGroup } from 'base/data';
import { ToolEnvironment } from 'base/tool';

export class CommandBase {

    isContinued = false;

    executeCommand(env: ToolEnvironment) {

        this.execute(env);

        if (this.targetGroups != null) {

            VectorGroup.setGroupsUpdated(this.targetGroups);

            env.setLazyRedraw();
        }
    }

    protected execute(env: ToolEnvironment) { // @virtual

    }

    undo(env: ToolEnvironment) { // @virtual

    }

    redo(env: ToolEnvironment) { // @virtual

    }

    targetGroups: List<VectorGroup> = null;

    useGroup(group: VectorGroup) {

        if (!this.targetGroups) {

            this.useGroups();
        }

        this.targetGroups.push(group);
    }

    useGroups(targetGroups?: List<VectorGroup>) {

        if (targetGroups) {

            this.targetGroups = targetGroups;
        }
        else {

            this.targetGroups = new List<VectorGroup>();
        }
    }
}

export class CommandHistory {

    maxHistory = 300;

    historyList = new List<CommandBase>();
    redoList = new List<CommandBase>();

    addCommand(command: CommandBase) {

        this.historyList.push(command);

        if (this.historyList.length > this.maxHistory) {

            ListRemoveAt(this.historyList, 0);
        }

        if (this.redoList.length > 0) {
            this.redoList = new List<CommandBase>();
        }
    }

    private getUndoCommand(): CommandBase {

        if (this.historyList.length == 0) {
            return null;
        }

        return this.historyList[this.historyList.length - 1];
    }

    private getRedoCommand(): CommandBase {

        if (this.redoList.length == 0) {
            return null;
        }

        return this.redoList[this.redoList.length - 1];
    }

    undo(env: ToolEnvironment) {

        let command: CommandBase = null;

        do {

            command = this.getUndoCommand();

            if (command == null) {
                return;
            }

            command.undo(env);

            if (command.targetGroups != null) {

                VectorGroup.setGroupsUpdated(command.targetGroups);

                env.setLazyRedraw();
            }

            this.redoList.push(command);
            ListRemoveAt(this.historyList, this.historyList.length - 1);
        }
        while (command.isContinued);
    }

    redo(env: ToolEnvironment) {

        let command: CommandBase = null;

        do {

            command = this.getRedoCommand();

            if (command == null) {
                return;
            }

            command.redo(env);

            if (command.targetGroups != null) {

                VectorGroup.setGroupsUpdated(command.targetGroups);

                env.setLazyRedraw();
            }

            ListRemoveAt(this.redoList, this.redoList.length - 1);
            this.historyList.push(command);

            command = this.getRedoCommand();
        }
        while (command != null && command.isContinued);
    }
}
