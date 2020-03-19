var ManualTracingTool;
(function (ManualTracingTool) {
    var CommandBase = /** @class */ (function () {
        function CommandBase() {
            this.isContinued = false;
            this.targetGroups = null;
        }
        CommandBase.prototype.executeCommand = function (env) {
            this.execute(env);
            if (this.targetGroups != null) {
                ManualTracingTool.VectorGroup.setGroupsUpdated(this.targetGroups);
                env.setLazyRedraw();
            }
        };
        CommandBase.prototype.execute = function (env) {
        };
        CommandBase.prototype.undo = function (env) {
        };
        CommandBase.prototype.redo = function (env) {
        };
        CommandBase.prototype.useGroup = function (group) {
            if (!this.targetGroups) {
                this.useGroups();
            }
            this.targetGroups.push(group);
        };
        CommandBase.prototype.useGroups = function (targetGroups) {
            if (targetGroups) {
                this.targetGroups = targetGroups;
            }
            else {
                this.targetGroups = new List();
            }
        };
        return CommandBase;
    }());
    ManualTracingTool.CommandBase = CommandBase;
    var CommandHistory = /** @class */ (function () {
        function CommandHistory() {
            this.maxHistory = 300;
            this.historyList = new List();
            this.redoList = new List();
        }
        CommandHistory.prototype.addCommand = function (command) {
            this.historyList.push(command);
            if (this.historyList.length > this.maxHistory) {
                ListRemoveAt(this.historyList, 0);
            }
            if (this.redoList.length > 0) {
                this.redoList = new List();
            }
        };
        CommandHistory.prototype.getUndoCommand = function () {
            if (this.historyList.length == 0) {
                return null;
            }
            return this.historyList[this.historyList.length - 1];
        };
        CommandHistory.prototype.getRedoCommand = function () {
            if (this.redoList.length == 0) {
                return null;
            }
            return this.redoList[this.redoList.length - 1];
        };
        CommandHistory.prototype.undo = function (env) {
            var command = null;
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
        };
        CommandHistory.prototype.redo = function (env) {
            var command = null;
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
        };
        return CommandHistory;
    }());
    ManualTracingTool.CommandHistory = CommandHistory;
})(ManualTracingTool || (ManualTracingTool = {}));
