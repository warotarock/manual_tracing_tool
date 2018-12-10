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
    var Tool_Select_All_LinePoint = /** @class */ (function (_super) {
        __extends(Tool_Select_All_LinePoint, _super);
        function Tool_Select_All_LinePoint() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Tool_Select_All_LinePoint.prototype.execute = function (env) {
            if (env.currentVectorLayer == null) {
                return;
            }
            var existsSelectedPoints = this.isSelectedAnyPoint(env);
            var selectionInfo;
            if (existsSelectedPoints) {
                selectionInfo = this.createSelectionInfo_ClearAllSelection(env);
            }
            else {
                selectionInfo = this.createSelectionInfo_SelectAll(env);
            }
            selectionInfo.updateLineSelectionState();
            this.executeCommand(selectionInfo, env);
            selectionInfo.resetModifyStatus();
            env.setRedrawMainWindowEditorWindow();
        };
        Tool_Select_All_LinePoint.prototype.isSelectedAnyPoint = function (env) {
            var isSelected = false;
            for (var _i = 0, _a = env.currentVectorGeometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (line.isSelected) {
                        isSelected = true;
                        break;
                    }
                    for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                        var point = _e[_d];
                        if (point.isSelected) {
                            isSelected = true;
                            break;
                        }
                    }
                }
            }
            return isSelected;
        };
        Tool_Select_All_LinePoint.prototype.createSelectionInfo_SelectAll = function (env) {
            var selectionInfo = new ManualTracingTool.VectorLayerEditorSelectionInfo();
            var editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            for (var _i = 0, editableKeyframeLayers_1 = editableKeyframeLayers; _i < editableKeyframeLayers_1.length; _i++) {
                var viewKeyframeLayer = editableKeyframeLayers_1[_i];
                for (var _a = 0, _b = viewKeyframeLayer.vectorLayerKeyframe.geometry.groups; _a < _b.length; _a++) {
                    var group = _b[_a];
                    for (var _c = 0, _d = group.lines; _c < _d.length; _c++) {
                        var line = _d[_c];
                        for (var _e = 0, _f = line.points; _e < _f.length; _e++) {
                            var point = _f[_e];
                            if (!point.isSelected) {
                                selectionInfo.selectPoint(line, point, ManualTracingTool.SelectionEditMode.setSelected);
                            }
                        }
                    }
                }
            }
            return selectionInfo;
        };
        Tool_Select_All_LinePoint.prototype.createSelectionInfo_ClearAllSelection = function (env) {
            var selectionInfo = new ManualTracingTool.VectorLayerEditorSelectionInfo();
            var editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            for (var _i = 0, editableKeyframeLayers_2 = editableKeyframeLayers; _i < editableKeyframeLayers_2.length; _i++) {
                var viewKeyframeLayer = editableKeyframeLayers_2[_i];
                for (var _a = 0, _b = viewKeyframeLayer.vectorLayerKeyframe.geometry.groups; _a < _b.length; _a++) {
                    var group = _b[_a];
                    for (var _c = 0, _d = group.lines; _c < _d.length; _c++) {
                        var line = _d[_c];
                        for (var _e = 0, _f = line.points; _e < _f.length; _e++) {
                            var point = _f[_e];
                            if (point.isSelected) {
                                selectionInfo.selectPoint(line, point, ManualTracingTool.SelectionEditMode.setUnselected);
                            }
                        }
                    }
                }
            }
            return selectionInfo;
        };
        Tool_Select_All_LinePoint.prototype.executeCommand = function (selectionInfo, env) {
            var command = new ManualTracingTool.Command_Select();
            command.selectionInfo = selectionInfo;
            command.execute(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_Select_All_LinePoint;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_Select_All_LinePoint = Tool_Select_All_LinePoint;
})(ManualTracingTool || (ManualTracingTool = {}));
