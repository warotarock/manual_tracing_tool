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
    var SelectionEditMode;
    (function (SelectionEditMode) {
        SelectionEditMode[SelectionEditMode["setSelected"] = 1] = "setSelected";
        SelectionEditMode[SelectionEditMode["setUnselected"] = 2] = "setUnselected";
        SelectionEditMode[SelectionEditMode["toggle"] = 3] = "toggle";
    })(SelectionEditMode = ManualTracingTool.SelectionEditMode || (ManualTracingTool.SelectionEditMode = {}));
    var GroupSelectionInfo = /** @class */ (function () {
        function GroupSelectionInfo() {
            this.group = null;
        }
        return GroupSelectionInfo;
    }());
    ManualTracingTool.GroupSelectionInfo = GroupSelectionInfo;
    var LineSelectionInfo = /** @class */ (function () {
        function LineSelectionInfo() {
            this.line = null;
            this.selectStateAfter = false;
            this.selectStateBefore = false;
        }
        return LineSelectionInfo;
    }());
    ManualTracingTool.LineSelectionInfo = LineSelectionInfo;
    var PointSelectionInfo = /** @class */ (function () {
        function PointSelectionInfo() {
            this.point = null;
            this.selectStateAfter = false;
            this.selectStateBefore = false;
        }
        return PointSelectionInfo;
    }());
    ManualTracingTool.PointSelectionInfo = PointSelectionInfo;
    var VectorLayerEditorSelectionInfo = /** @class */ (function () {
        function VectorLayerEditorSelectionInfo() {
            this.selectedGroups = null;
            this.selectedLines = null;
            this.selectedPoints = null;
            this.clear();
        }
        VectorLayerEditorSelectionInfo.prototype.clear = function () {
            this.selectedGroups = new List();
            this.selectedLines = new List();
            this.selectedPoints = new List();
        };
        VectorLayerEditorSelectionInfo.prototype.isGroupDone = function (group) {
            return (group.modifyFlag != ManualTracingTool.VectorGroupModifyFlagID.none);
        };
        VectorLayerEditorSelectionInfo.prototype.isLineDone = function (line) {
            return (line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.none);
        };
        VectorLayerEditorSelectionInfo.prototype.isPointDone = function (point) {
            return (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.none);
        };
        VectorLayerEditorSelectionInfo.prototype.selectPoint = function (line, point, editMode) {
            if (this.isPointDone(point)) {
                return;
            }
            if (editMode == SelectionEditMode.setSelected
                || editMode == SelectionEditMode.toggle) {
                if (!point.isSelected) {
                    var selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = true;
                    selPoint.selectStateBefore = point.isSelected;
                    this.selectedPoints.push(selPoint);
                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.unselectedToSelected;
                    this.selectLine(line, editMode);
                }
            }
            if (editMode == SelectionEditMode.setUnselected
                || editMode == SelectionEditMode.toggle) {
                if (point.isSelected) {
                    var selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = false;
                    selPoint.selectStateBefore = point.isSelected;
                    this.selectedPoints.push(selPoint);
                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.selectedToUnselected;
                    this.selectLine(line, editMode);
                }
            }
        };
        VectorLayerEditorSelectionInfo.prototype.selectLinePoints = function (line, editMode) {
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.selectPoint(line, point, editMode);
            }
        };
        VectorLayerEditorSelectionInfo.prototype.selectLine = function (line, editMode) {
            if (this.isLineDone(line)) {
                return;
            }
            var selInfo = new LineSelectionInfo();
            selInfo.line = line;
            selInfo.selectStateBefore = line.isSelected;
            if (editMode == SelectionEditMode.setSelected) {
                selInfo.selectStateAfter = true;
                line.isSelected = true;
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.unselectedToSelected;
            }
            else if (editMode == SelectionEditMode.setUnselected) {
                selInfo.selectStateAfter = false;
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.selectedToUnselected;
            }
            else if (editMode == SelectionEditMode.toggle) {
                if (line.isSelected) {
                    selInfo.selectStateAfter = false;
                    line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.selectedToUnselected;
                }
                else {
                    selInfo.selectStateAfter = true;
                    line.isSelected = true;
                    line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.unselectedToSelected;
                }
            }
            this.selectedLines.push(selInfo);
        };
        VectorLayerEditorSelectionInfo.prototype.selectLinePointsForLines = function (editMode) {
            for (var _i = 0, _a = this.selectedLines; _i < _a.length; _i++) {
                var selLineInfo = _a[_i];
                for (var _b = 0, _c = selLineInfo.line.points; _b < _c.length; _b++) {
                    var point = _c[_b];
                    this.selectPoint(selLineInfo.line, point, editMode);
                }
            }
        };
        VectorLayerEditorSelectionInfo.prototype.editGroup = function (group) {
            if (this.isGroupDone(group)) {
                return;
            }
            var selInfo = new GroupSelectionInfo();
            selInfo.group = group;
            this.selectedGroups.push(selInfo);
            group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.edit;
        };
        VectorLayerEditorSelectionInfo.prototype.editLine = function (line) {
            if (this.isLineDone(line)) {
                return;
            }
            var selInfo = new LineSelectionInfo();
            selInfo.line = line;
            this.selectedLines.push(selInfo);
            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.edit;
        };
        VectorLayerEditorSelectionInfo.prototype.editPoint = function (point) {
            if (this.isPointDone(point)) {
                return;
            }
            var selInfo = new PointSelectionInfo();
            selInfo.point = point;
            this.selectedPoints.push(selInfo);
            point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.edit;
        };
        VectorLayerEditorSelectionInfo.prototype.deletePoint = function (point) {
            if (this.isPointDone(point)) {
                return;
            }
            var selInfo = new PointSelectionInfo();
            selInfo.point = point;
            this.selectedPoints.push(selInfo);
            point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
        };
        VectorLayerEditorSelectionInfo.prototype.updateLineSelectionState = function () {
            for (var _i = 0, _a = this.selectedLines; _i < _a.length; _i++) {
                var selLineInfo = _a[_i];
                var existsSelectedPoint = false;
                for (var _b = 0, _c = selLineInfo.line.points; _b < _c.length; _b++) {
                    var point = _c[_b];
                    if (point.isSelected) {
                        existsSelectedPoint = true;
                        break;
                    }
                }
                selLineInfo.selectStateAfter = existsSelectedPoint;
                selLineInfo.line.isSelected = existsSelectedPoint;
            }
        };
        VectorLayerEditorSelectionInfo.prototype.resetModifyStates = function () {
            for (var _i = 0, _a = this.selectedGroups; _i < _a.length; _i++) {
                var selGroup = _a[_i];
                selGroup.group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            }
            for (var _b = 0, _c = this.selectedPoints; _b < _c.length; _b++) {
                var selPoint = _c[_b];
                selPoint.point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
            }
            for (var _d = 0, _e = this.selectedLines; _d < _e.length; _d++) {
                var selLine = _e[_d];
                selLine.line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            }
        };
        return VectorLayerEditorSelectionInfo;
    }());
    ManualTracingTool.VectorLayerEditorSelectionInfo = VectorLayerEditorSelectionInfo;
    var Selector_LinePoint_BrushSelect = /** @class */ (function (_super) {
        __extends(Selector_LinePoint_BrushSelect, _super);
        function Selector_LinePoint_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editMode = SelectionEditMode.setSelected; // @override
            _this.selectionInfo = new VectorLayerEditorSelectionInfo(); // @override
            return _this;
        }
        Selector_LinePoint_BrushSelect.prototype.beforeHitTest = function () {
            this.selectionInfo.clear();
        };
        Selector_LinePoint_BrushSelect.prototype.onPointHited = function (group, line, point) {
            this.selectionInfo.selectPoint(line, point, this.editMode);
        };
        Selector_LinePoint_BrushSelect.prototype.afterHitTest = function () {
            this.selectionInfo.updateLineSelectionState();
            this.resetModifyStates();
        };
        Selector_LinePoint_BrushSelect.prototype.resetModifyStates = function () {
            this.selectionInfo.resetModifyStates();
        };
        return Selector_LinePoint_BrushSelect;
    }(ManualTracingTool.HitTest_LinePoint_PointToPointByDistance));
    ManualTracingTool.Selector_LinePoint_BrushSelect = Selector_LinePoint_BrushSelect;
    var Selector_Line_BrushSelect = /** @class */ (function (_super) {
        __extends(Selector_Line_BrushSelect, _super);
        function Selector_Line_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editMode = SelectionEditMode.setSelected; // @override
            _this.selectionInfo = new VectorLayerEditorSelectionInfo(); // @override
            return _this;
        }
        Selector_Line_BrushSelect.prototype.beforeHitTest = function () {
            this.selectionInfo.clear();
        };
        Selector_Line_BrushSelect.prototype.onLineSegmentHited = function (group, line, point1, point2, location, minDistanceSQ, distanceSQ) {
            this.selectionInfo.selectLine(line, this.editMode);
            this.existsPointHitTest = true;
        };
        Selector_Line_BrushSelect.prototype.afterHitTest = function () {
            this.selectionInfo.selectLinePointsForLines(this.editMode);
            this.selectionInfo.updateLineSelectionState();
            this.selectionInfo.resetModifyStates();
        };
        return Selector_Line_BrushSelect;
    }(ManualTracingTool.HitTest_Line_PointToLineByDistance));
    ManualTracingTool.Selector_Line_BrushSelect = Selector_Line_BrushSelect;
    var Selector_LineSegment_BrushSelect = /** @class */ (function (_super) {
        __extends(Selector_LineSegment_BrushSelect, _super);
        function Selector_LineSegment_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editMode = SelectionEditMode.setSelected; // @override
            _this.selectionInfo = new VectorLayerEditorSelectionInfo(); // @override
            return _this;
        }
        Selector_LineSegment_BrushSelect.prototype.beforeHitTest = function () {
            this.selectionInfo.clear();
        };
        Selector_LineSegment_BrushSelect.prototype.onLineSegmentHited = function (group, line, point1, point2, location, minDistanceSQ, distanceSQ) {
            this.selectionInfo.selectPoint(line, point1, this.editMode);
            this.selectionInfo.selectPoint(line, point2, this.editMode);
        };
        Selector_LineSegment_BrushSelect.prototype.afterHitTest = function () {
            this.selectionInfo.updateLineSelectionState();
            this.selectionInfo.resetModifyStates();
        };
        Selector_LineSegment_BrushSelect.prototype.resetModifyStates = function () {
            this.selectionInfo.resetModifyStates();
        };
        return Selector_LineSegment_BrushSelect;
    }(ManualTracingTool.HitTest_Line_PointToLineByDistance));
    ManualTracingTool.Selector_LineSegment_BrushSelect = Selector_LineSegment_BrushSelect;
})(ManualTracingTool || (ManualTracingTool = {}));
