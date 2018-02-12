var ManualTracingTool;
(function (ManualTracingTool) {
    var CommandBase = /** @class */ (function () {
        function CommandBase() {
            this.isContinuing = false;
            this.isContinued = false;
        }
        CommandBase.prototype.execute = function (env) {
        };
        CommandBase.prototype.undo = function (env) {
        };
        CommandBase.prototype.redo = function (env) {
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
        CommandHistory.prototype.getLastCommand = function () {
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
                command = this.getLastCommand();
                if (command == null) {
                    return;
                }
                command.undo(env);
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
                ListRemoveAt(this.redoList, this.redoList.length - 1);
                this.historyList.push(command);
            } while (command.isContinued);
        };
        return CommandHistory;
    }());
    ManualTracingTool.CommandHistory = CommandHistory;
})(ManualTracingTool || (ManualTracingTool = {}));
