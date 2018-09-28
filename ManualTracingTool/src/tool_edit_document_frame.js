var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var Tool_EditDocumentFrame = /** @class */ (function (_super) {
        __extends(Tool_EditDocumentFrame, _super);
        function Tool_EditDocumentFrame() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '4キーで設定ダイアログを開きます。';
            return _this;
        }
        Tool_EditDocumentFrame.prototype.isAvailable = function (env) {
            return true;
        };
        Tool_EditDocumentFrame.prototype.toolWindowItemDoubleClick = function (e, env) {
            env.openDocumentSettingDialog();
        };
        Tool_EditDocumentFrame.prototype.checkTarget = function (e, env) {
            return true;
        };
        Tool_EditDocumentFrame.prototype.prepareLatticePoints = function (env) {
            // calculate lattice points
            vec3.set(this.latticePoints[0].baseLocation, env.document.documentFrame[0], env.document.documentFrame[1], 0.0);
            vec3.set(this.latticePoints[1].baseLocation, env.document.documentFrame[2], env.document.documentFrame[1], 0.0);
            vec3.set(this.latticePoints[2].baseLocation, env.document.documentFrame[2], env.document.documentFrame[3], 0.0);
            vec3.set(this.latticePoints[3].baseLocation, env.document.documentFrame[0], env.document.documentFrame[3], 0.0);
            this.resetLatticePointLocationToBaseLocation();
            return true;
        };
        Tool_EditDocumentFrame.prototype.keydown = function (e, env) {
            // prevent modal operation
        };
        Tool_EditDocumentFrame.prototype.mouseDown = function (e, env) {
            // prevent modal operation
        };
        Tool_EditDocumentFrame.prototype.onDrawEditor = function (env, drawEnv) {
            if (this.latticePoints == null) {
                this.createLatticePoints(this.latticePointCount);
            }
            this.prepareLatticePoints(env);
            this.drawLatticeLine(env, drawEnv);
        };
        Tool_EditDocumentFrame.prototype.executeCommand = function (env) {
            var command = new Command_EditDocumentFrame();
            command.targetDocument = env.document;
            command.newDocumentFrame[0] = this.latticePoints[0].baseLocation[0];
            command.newDocumentFrame[1] = this.latticePoints[0].baseLocation[1];
            command.newDocumentFrame[2] = this.latticePoints[2].baseLocation[0];
            command.newDocumentFrame[3] = this.latticePoints[2].baseLocation[1];
            command.execute(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_EditDocumentFrame;
    }(ManualTracingTool.Tool_Transform_Lattice));
    ManualTracingTool.Tool_EditDocumentFrame = Tool_EditDocumentFrame;
    var Command_EditDocumentFrame = /** @class */ (function (_super) {
        __extends(Command_EditDocumentFrame, _super);
        function Command_EditDocumentFrame() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetDocument = null;
            _this.newDocumentFrame = vec4.create();
            _this.oldDocumentFrame = vec4.create();
            return _this;
        }
        Command_EditDocumentFrame.prototype.execute = function (env) {
            this.errorCheck();
            vec4.copy(this.oldDocumentFrame, this.targetDocument.documentFrame);
            this.redo(env);
        };
        Command_EditDocumentFrame.prototype.undo = function (env) {
            vec4.copy(this.targetDocument.documentFrame, this.oldDocumentFrame);
        };
        Command_EditDocumentFrame.prototype.redo = function (env) {
            vec4.copy(this.targetDocument.documentFrame, this.newDocumentFrame);
        };
        Command_EditDocumentFrame.prototype.errorCheck = function () {
            if (this.targetDocument == null) {
                throw ('Command_EditDocumentFrame: targetDocument is null!');
            }
        };
        return Command_EditDocumentFrame;
    }(ManualTracingTool.CommandBase));
})(ManualTracingTool || (ManualTracingTool = {}));
