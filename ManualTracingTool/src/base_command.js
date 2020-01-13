var ManualTracingTool;
(function (ManualTracingTool) {
    class CommandBase {
        constructor() {
            this.isContinued = false;
            this.targetGroups = null;
        }
        executeCommand(env) {
            this.execute(env);
            if (this.targetGroups != null) {
                ManualTracingTool.VectorGroup.setGroupsUpdated(this.targetGroups);
                env.setLazyRedraw();
            }
        }
        execute(env) {
        }
        undo(env) {
        }
        redo(env) {
        }
        useGroup(group) {
            if (!this.targetGroups) {
                this.useGroups();
            }
            this.targetGroups.push(group);
        }
        useGroups(targetGroups) {
            if (targetGroups) {
                this.targetGroups = targetGroups;
            }
            else {
                this.targetGroups = new List();
            }
        }
    }
    ManualTracingTool.CommandBase = CommandBase;
    class CommandHistory {
        constructor() {
            this.maxHistory = 300;
            this.historyList = new List();
            this.redoList = new List();
        }
        addCommand(command) {
            this.historyList.push(command);
            if (this.historyList.length > this.maxHistory) {
                ListRemoveAt(this.historyList, 0);
            }
            if (this.redoList.length > 0) {
                this.redoList = new List();
            }
        }
        getUndoCommand() {
            if (this.historyList.length == 0) {
                return null;
            }
            return this.historyList[this.historyList.length - 1];
        }
        getRedoCommand() {
            if (this.redoList.length == 0) {
                return null;
            }
            return this.redoList[this.redoList.length - 1];
        }
        undo(env) {
            let command = null;
            do {
                command = this.getUndoCommand();
                if (command == null) {
                    return;
                }
                command.undo(env);
                if (command.targetGroups != null) {
                    ManualTracingTool.VectorGroup.setGroupsUpdated(command.targetGroups);
                    env.setLazyRedraw();
                }
                this.redoList.push(command);
                ListRemoveAt(this.historyList, this.historyList.length - 1);
            } while (command.isContinued);
        }
        redo(env) {
            let command = null;
            do {
                command = this.getRedoCommand();
                if (command == null) {
                    return;
                }
                command.redo(env);
                if (command.targetGroups != null) {
                    ManualTracingTool.VectorGroup.setGroupsUpdated(command.targetGroups);
                    env.setLazyRedraw();
                }
                ListRemoveAt(this.redoList, this.redoList.length - 1);
                this.historyList.push(command);
                command = this.getRedoCommand();
            } while (command != null && command.isContinued);
        }
    }
    ManualTracingTool.CommandHistory = CommandHistory;
})(ManualTracingTool || (ManualTracingTool = {}));
