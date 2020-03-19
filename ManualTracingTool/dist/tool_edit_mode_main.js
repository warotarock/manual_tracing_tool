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
    var Tool_EditModeMain = /** @class */ (function (_super) {
        __extends(Tool_EditModeMain, _super);
        function Tool_EditModeMain() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '左クリックで矩形の辺や角を操作して、選択中の線または点を変形できます。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。';
            return _this;
            //toolWindowItemClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override
            //    env.setCurrentOperationUnitID(OperationUnitID.line);
            //}
            //prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override
            //    this.clearEditData(e, env);
            //    if (!this.checkTarget(e, env)) {
            //        return false;
            //    }
            //    // Current cursor location
            //    vec3.copy(this.mouseAnchorLocation, e.location);
            //    // Create edit info
            //    this.prepareEditData(e, env);
            //    return this.existsEditData();
            //}
        }
        return Tool_EditModeMain;
    }(ManualTracingTool.Tool_Transform_Lattice_LinePoint));
    ManualTracingTool.Tool_EditModeMain = Tool_EditModeMain;
})(ManualTracingTool || (ManualTracingTool = {}));
