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
    var Tool_Select_All_LinePoint = /** @class */ (function (_super) {
        __extends(Tool_Select_All_LinePoint, _super);
        function Tool_Select_All_LinePoint() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Tool_Select_All_LinePoint.prototype.executeToggleSelection = function (env) {
            //if (env.currentVectorLayer == null) {
            //    return;
            //}
            var viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            var existsSelectedPoints = this.isSelectedAnyPoint(viewKeyframeLayers, env);
            this.executeModifySelection(viewKeyframeLayers, existsSelectedPoints, env);
        };
        Tool_Select_All_LinePoint.prototype.executeSelectAll = function (env) {
            var viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            this.executeModifySelection(viewKeyframeLayers, false, env);
        };
        Tool_Select_All_LinePoint.prototype.executeClearSelectAll = function (env) {
            var viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            this.executeModifySelection(viewKeyframeLayers, true, env);
        };
        Tool_Select_All_LinePoint.prototype.executeModifySelection = function (editableKeyframeLayers, clearSelection, env) {
            var selectionInfo;
            if (clearSelection) {
                selectionInfo = this.createSelectionInfo_ClearAllSelection(editableKeyframeLayers, env);
            }
            else {
                selectionInfo = this.createSelectionInfo_SelectAll(editableKeyframeLayers, env);
            }
            if (selectionInfo.selectedPoints.length == 0) {
                return;
            }
            selectionInfo.updateLineSelectionState();
            this.executeCommand(selectionInfo, env);
            selectionInfo.resetModifyStates();
            env.setRedrawMainWindowEditorWindow();
        };
        Tool_Select_All_LinePoint.prototype.isSelectedAnyPoint = function (viewKeyframeLayers, env) {
            var isSelected = false;
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, function (group) {
                for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                    var line = _a[_i];
                    if (line.isSelected) {
                        isSelected = true;
                        break;
                    }
                    for (var _b = 0, _c = line.points; _b < _c.length; _b++) {
                        var point = _c[_b];
                        if (point.isSelected) {
                            isSelected = true;
                            break;
                        }
                    }
                }
            });
            return isSelected;
        };
        Tool_Select_All_LinePoint.prototype.createSelectionInfo_SelectAll = function (viewKeyframeLayers, env) {
            var selectionInfo = new ManualTracingTool.VectorLayerEditorSelectionInfo();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, function (group) {
                for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                    var line = _a[_i];
                    for (var _b = 0, _c = line.points; _b < _c.length; _b++) {
                        var point = _c[_b];
                        if (!point.isSelected) {
                            selectionInfo.selectPoint(line, point, ManualTracingTool.SelectionEditMode.setSelected);
                        }
                    }
                }
            });
            return selectionInfo;
        };
        Tool_Select_All_LinePoint.prototype.createSelectionInfo_ClearAllSelection = function (viewKeyframeLayers, env) {
            var selectionInfo = new ManualTracingTool.VectorLayerEditorSelectionInfo();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, function (group) {
                for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                    var line = _a[_i];
                    for (var _b = 0, _c = line.points; _b < _c.length; _b++) {
                        var point = _c[_b];
                        if (point.isSelected) {
                            selectionInfo.selectPoint(line, point, ManualTracingTool.SelectionEditMode.setUnselected);
                        }
                    }
                }
            });
            return selectionInfo;
        };
        Tool_Select_All_LinePoint.prototype.executeCommand = function (selectionInfo, env) {
            var command = new ManualTracingTool.Command_Select();
            command.selectionInfo = selectionInfo;
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_Select_All_LinePoint;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_Select_All_LinePoint = Tool_Select_All_LinePoint;
})(ManualTracingTool || (ManualTracingTool = {}));
