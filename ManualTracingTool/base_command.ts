
namespace ManualTracingTool {

    export interface IEditCommand {

        isContinued: boolean;
        execute(env: ToolEnvironment);
        undo(env: ToolEnvironment);
        redo(env: ToolEnvironment);
    }

    export class CommandBase implements IEditCommand {

        isContinued = false;

        execute(env: ToolEnvironment) { // @override method

        }

        undo(env: ToolEnvironment) { // @override method

        }

        redo(env: ToolEnvironment) { // @override method

        }
    }

    export class CommandHistory {

        maxHistory = 300;

        historyList = new List<IEditCommand>();
        redoList = new List<IEditCommand>();

        addCommand(command: IEditCommand) {

            this.historyList.push(command);

            if (this.historyList.length > this.maxHistory) {

                ListRemoveAt(this.historyList, 0);
            }

            if (this.redoList.length > 0) {
                this.redoList = new List<IEditCommand>();
            }
        }

        private getLastCommand(): IEditCommand {

            if (this.historyList.length == 0) {
                return null;
            }

            return this.historyList[this.historyList.length - 1];
        }

        private getRedoCommand(): IEditCommand {

            if (this.redoList.length == 0) {
                return null;
            }

            return this.redoList[this.redoList.length - 1];
        }

        undo(env: ToolEnvironment) {

            let command: IEditCommand = null;

            do {

                command = this.getLastCommand();

                if (command == null) {
                    return;
                }

                command.undo(env);

                this.redoList.push(command);
                ListRemoveAt(this.historyList, this.historyList.length - 1);
            }
            while (command.isContinued);
        }

        redo(env: ToolEnvironment) {

            let command: IEditCommand = null;

            do {

                command = this.getRedoCommand();

                if (command == null) {
                    return;
                }

                command.redo(env);

                ListRemoveAt(this.redoList, this.redoList.length - 1);
                this.historyList.push(command);
            }
            while (command.isContinued);
        }
    }
}
