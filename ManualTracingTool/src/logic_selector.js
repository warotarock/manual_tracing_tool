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
    var SelectionEditMode;
    (function (SelectionEditMode) {
        SelectionEditMode[SelectionEditMode["setSelected"] = 1] = "setSelected";
        SelectionEditMode[SelectionEditMode["setUnselected"] = 2] = "setUnselected";
        SelectionEditMode[SelectionEditMode["toggle"] = 3] = "toggle";
    })(SelectionEditMode = ManualTracingTool.SelectionEditMode || (ManualTracingTool.SelectionEditMode = {}));
    var LineSelectionInfo = (function () {
        function LineSelectionInfo() {
            this.line = null;
            this.selectStateAfter = false;
            this.selectStateBefore = false;
        }
        return LineSelectionInfo;
    }());
    ManualTracingTool.LineSelectionInfo = LineSelectionInfo;
    var PointSelectionInfo = (function () {
        function PointSelectionInfo() {
            this.point = null;
            this.selectStateAfter = false;
            this.selectStateBefore = false;
        }
        return PointSelectionInfo;
    }());
    ManualTracingTool.PointSelectionInfo = PointSelectionInfo;
    var VectorLineSelectionEditingInfo = (function () {
        function VectorLineSelectionEditingInfo() {
            this.selectedLines = null;
            this.selectedPoints = null;
        }
        VectorLineSelectionEditingInfo.prototype.clear = function () {
            this.selectedLines = new List();
            this.selectedPoints = new List();
        };
        VectorLineSelectionEditingInfo.prototype.selectPoint = function (line, point, editMode) {
            if (editMode == SelectionEditMode.setSelected
                || editMode == SelectionEditMode.toggle) {
                if (!point.isSelected && point.modifyFlag == ManualTracingTool.ModifyFlagID.none) {
                    var selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = true;
                    selPoint.selectStateBefore = point.isSelected;
                    this.selectedPoints.push(selPoint);
                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = ManualTracingTool.ModifyFlagID.unselectedToSelected;
                    if (line.modifyFlag == ManualTracingTool.ModifyFlagID.none) {
                        var selLine = new LineSelectionInfo();
                        selLine.line = line;
                        selLine.selectStateAfter = true;
                        selLine.selectStateBefore = line.isSelected;
                        line.isSelected = selLine.selectStateAfter;
                        line.modifyFlag = ManualTracingTool.ModifyFlagID.unselectedToSelected;
                        this.selectedLines.push(selLine);
                    }
                }
            }
            if (editMode == SelectionEditMode.setUnselected
                || editMode == SelectionEditMode.toggle) {
                if (point.isSelected && point.modifyFlag == ManualTracingTool.ModifyFlagID.none) {
                    var selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = false;
                    selPoint.selectStateBefore = point.isSelected;
                    this.selectedPoints.push(selPoint);
                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = ManualTracingTool.ModifyFlagID.selectedToUnselected;
                    if (line.modifyFlag == ManualTracingTool.ModifyFlagID.none) {
                        var selLine = new LineSelectionInfo();
                        selLine.line = line;
                        selLine.selectStateBefore = line.isSelected;
                        line.modifyFlag = ManualTracingTool.ModifyFlagID.selectedToUnselected;
                        this.selectedLines.push(selLine);
                    }
                }
            }
        };
        VectorLineSelectionEditingInfo.prototype.selectLinePoints = function (line, editMode) {
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.selectPoint(line, point, editMode);
            }
        };
        VectorLineSelectionEditingInfo.prototype.releaseEditState = function () {
            for (var _i = 0, _a = this.selectedPoints; _i < _a.length; _i++) {
                var selPoint = _a[_i];
                selPoint.point.modifyFlag = ManualTracingTool.ModifyFlagID.none;
            }
            for (var _b = 0, _c = this.selectedLines; _b < _c.length; _b++) {
                var selLine = _c[_b];
                selLine.line.modifyFlag = ManualTracingTool.ModifyFlagID.none;
            }
        };
        return VectorLineSelectionEditingInfo;
    }());
    ManualTracingTool.VectorLineSelectionEditingInfo = VectorLineSelectionEditingInfo;
    var Selector_LinePoint_BrushSelect = (function (_super) {
        __extends(Selector_LinePoint_BrushSelect, _super);
        function Selector_LinePoint_BrushSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editMode = SelectionEditMode.setSelected;
            _this.selectionInfo = new VectorLineSelectionEditingInfo();
            return _this;
        }
        Selector_LinePoint_BrushSelect.prototype.beforeHitTest = function () {
            this.selectionInfo.clear();
        };
        Selector_LinePoint_BrushSelect.prototype.onPointHited = function (line, point) {
            this.selectionInfo.selectPoint(line, point, this.editMode);
        };
        Selector_LinePoint_BrushSelect.prototype.afterHitTest = function () {
            for (var _i = 0, _a = this.selectionInfo.selectedLines; _i < _a.length; _i++) {
                var selLine = _a[_i];
                var existsSelectedPoint = false;
                for (var _b = 0, _c = selLine.line.points; _b < _c.length; _b++) {
                    var point = _c[_b];
                    if (point.isSelected) {
                        existsSelectedPoint = true;
                        break;
                    }
                }
                selLine.selectStateAfter = existsSelectedPoint;
                selLine.line.isSelected = existsSelectedPoint;
            }
            this.selectionInfo.releaseEditState();
        };
        return Selector_LinePoint_BrushSelect;
    }(ManualTracingTool.HitTest_LinePoint_PointDistanceBase));
    ManualTracingTool.Selector_LinePoint_BrushSelect = Selector_LinePoint_BrushSelect;
    var Selector_LinePoint_LineClosingHitTest = (function (_super) {
        __extends(Selector_LinePoint_LineClosingHitTest, _super);
        function Selector_LinePoint_LineClosingHitTest() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.isChanged = false;
            return _this;
        }
        Selector_LinePoint_LineClosingHitTest.prototype.beforeHitTest = function () {
            this.isChanged = false;
        };
        Selector_LinePoint_LineClosingHitTest.prototype.onLineSegmentHited = function (line, point1, point2) {
            if (!line.isClosingToMouse) {
                this.isChanged = true;
            }
            line.isClosingToMouse = true;
            this.exitPointHitTest = true;
        };
        Selector_LinePoint_LineClosingHitTest.prototype.onLineSegmentNotHited = function (line, point1, point2) {
            if (line.isClosingToMouse) {
                this.isChanged = true;
            }
            line.isClosingToMouse = false;
        };
        return Selector_LinePoint_LineClosingHitTest;
    }(ManualTracingTool.HitTest_LinePoint_LineDistanceBase));
    ManualTracingTool.Selector_LinePoint_LineClosingHitTest = Selector_LinePoint_LineClosingHitTest;
    var Selector_LinePoint_LineSelect = (function (_super) {
        __extends(Selector_LinePoint_LineSelect, _super);
        function Selector_LinePoint_LineSelect() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editMode = SelectionEditMode.setSelected;
            _this.selectionInfo = new VectorLineSelectionEditingInfo();
            return _this;
        }
        Selector_LinePoint_LineSelect.prototype.beforeHitTest = function () {
            this.selectionInfo.clear();
        };
        Selector_LinePoint_LineSelect.prototype.onLineSegmentHited = function (line, point1, point2) {
            this.selectionInfo.selectLinePoints(line, this.editMode);
            this.exitPointHitTest = true;
        };
        Selector_LinePoint_LineSelect.prototype.afterHitTest = function () {
            this.selectionInfo.releaseEditState();
        };
        return Selector_LinePoint_LineSelect;
    }(ManualTracingTool.HitTest_LinePoint_LineDistanceBase));
    ManualTracingTool.Selector_LinePoint_LineSelect = Selector_LinePoint_LineSelect;
})(ManualTracingTool || (ManualTracingTool = {}));
