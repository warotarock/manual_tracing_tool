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
    var Tool_EditDocumentFrame = /** @class */ (function (_super) {
        __extends(Tool_EditDocumentFrame, _super);
        function Tool_EditDocumentFrame() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'エクスポート範囲を設定します。座標は整数値になります。<br />正確な座標値を確認するには4キーで設定ダイアログを開きます。';
            return _this;
        }
        Tool_EditDocumentFrame.prototype.isAvailable = function (env) {
            return true;
        };
        Tool_EditDocumentFrame.prototype.toolWindowItemDoubleClick = function (e, env) {
            env.openDocumentSettingDialog();
        };
        // Preparing for operation (Override methods)
        Tool_EditDocumentFrame.prototype.checkTarget = function (e, env) {
            return true;
        };
        Tool_EditDocumentFrame.prototype.prepareLatticePoints = function (env) {
            // calculate lattice points
            this.baseRectangleArea.left = env.document.documentFrame[0];
            this.baseRectangleArea.top = env.document.documentFrame[1];
            this.baseRectangleArea.right = env.document.documentFrame[2];
            this.baseRectangleArea.bottom = env.document.documentFrame[3];
            this.setLatticeLocation(env);
            return true;
        };
        Tool_EditDocumentFrame.prototype.setLatticeLocation = function (env) {
            this.latticePadding = 0.0;
            this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, this.latticePadding, env);
            this.setLatticePointsByRectangle(this.rectangleArea);
        };
        // Operation inputs
        Tool_EditDocumentFrame.prototype.keydown = function (e, env) {
            if (!env.isModalToolRunning()) {
                if (e.key == 'g') {
                    this.startLatticeAffineTransform(ManualTracingTool.TransformType.grabMove, false, env);
                    return true;
                }
                else if (e.key == 'r') {
                    this.startLatticeAffineTransform(ManualTracingTool.TransformType.rotate, false, env);
                    return true;
                }
                else if (e.key == 's') {
                    this.startLatticeAffineTransform(ManualTracingTool.TransformType.scale, false, env);
                    return true;
                }
            }
            return false;
        };
        Tool_EditDocumentFrame.prototype.executeCommand = function (env) {
            var command = new Command_EditDocumentFrame();
            command.targetDocument = env.document;
            command.newDocumentFrame[0] = Math.floor(this.latticePoints[0].location[0]);
            command.newDocumentFrame[1] = Math.floor(this.latticePoints[0].location[1]);
            command.newDocumentFrame[2] = Math.floor(this.latticePoints[2].location[0]);
            command.newDocumentFrame[3] = Math.floor(this.latticePoints[2].location[1]);
            command.executeCommand(env);
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