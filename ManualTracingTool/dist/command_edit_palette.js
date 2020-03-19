var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var Command_Palette_CommandBase = /** @class */ (function (_super) {
        __extends(Command_Palette_CommandBase, _super);
        function Command_Palette_CommandBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Command_Palette_CommandBase.prototype.isAvailable = function (env) {
            return false;
        };
        Command_Palette_CommandBase.prototype.execute = function (env) {
            this.executeCommand(env);
            env.setRedrawMainWindowEditorWindow();
        };
        Command_Palette_CommandBase.prototype.undo = function (env) {
            env.setRedrawMainWindowEditorWindow();
        };
        Command_Palette_CommandBase.prototype.redo = function (env) {
            env.setRedrawMainWindowEditorWindow();
        };
        return Command_Palette_CommandBase;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Palette_CommandBase = Command_Palette_CommandBase;
})(ManualTracingTool || (ManualTracingTool = {}));
