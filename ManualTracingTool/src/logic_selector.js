var ManualTracingTool;
(function (ManualTracingTool) {
    let SelectionEditMode;
    (function (SelectionEditMode) {
        SelectionEditMode[SelectionEditMode["setSelected"] = 1] = "setSelected";
        SelectionEditMode[SelectionEditMode["setUnselected"] = 2] = "setUnselected";
        SelectionEditMode[SelectionEditMode["toggle"] = 3] = "toggle";
    })(SelectionEditMode = ManualTracingTool.SelectionEditMode || (ManualTracingTool.SelectionEditMode = {}));
    class LineSelectionInfo {
        constructor() {
            this.line = null;
            this.selectStateAfter = false;
            this.selectStateBefore = false;
        }
    }
    ManualTracingTool.LineSelectionInfo = LineSelectionInfo;
    class PointSelectionInfo {
        constructor() {
            this.point = null;
            this.selectStateAfter = false;
            this.selectStateBefore = false;
        }
    }
    ManualTracingTool.PointSelectionInfo = PointSelectionInfo;
    class VectorLayerEditorSelectionInfo {
        constructor() {
            this.selectedLines = null;
            this.selectedPoints = null;
            this.clear();
        }
        clear() {
            this.selectedLines = new List();
            this.selectedPoints = new List();
        }
        selectPoint(line, point, editMode) {
            if (editMode == SelectionEditMode.setSelected
                || editMode == SelectionEditMode.toggle) {
                if (!point.isSelected && point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                    let selPoint = new PointSelectionInfo();
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
                if (point.isSelected && point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                    let selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = false;
                    selPoint.selectStateBefore = point.isSelected;
                    this.selectedPoints.push(selPoint);
                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.selectedToUnselected;
                    this.selectLine(line, editMode);
                }
            }
        }
        selectLinePoints(line, editMode) {
            for (let point of line.points) {
                this.selectPoint(line, point, editMode);
            }
        }
        selectLine(line, editMode) {
            if (line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.none) {
                return;
            }
            let selLine = new LineSelectionInfo();
            selLine.line = line;
            selLine.selectStateBefore = line.isSelected;
            if (editMode == SelectionEditMode.setSelected) {
                selLine.selectStateAfter = true;
                line.isSelected = true;
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.unselectedToSelected;
            }
            else if (editMode == SelectionEditMode.setUnselected) {
                selLine.selectStateAfter = false;
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.selectedToUnselected;
            }
            else if (editMode == SelectionEditMode.toggle) {
                if (line.isSelected) {
                    selLine.selectStateAfter = false;
                    line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.selectedToUnselected;
                }
                else {
                    selLine.selectStateAfter = true;
                    line.isSelected = true;
                    line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.unselectedToSelected;
                }
            }
            this.selectedLines.push(selLine);
        }
        selectLinePointsForLines(editMode) {
            for (let selLineInfo of this.selectedLines) {
                for (let point of selLineInfo.line.points) {
                    this.selectPoint(selLineInfo.line, point, editMode);
                }
            }
        }
        editPoint(point) {
            if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                let selPoint = new PointSelectionInfo();
                selPoint.point = point;
                this.selectedPoints.push(selPoint);
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.edit;
            }
        }
        deletePoint(point) {
            if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                let selPoint = new PointSelectionInfo();
                selPoint.point = point;
                this.selectedPoints.push(selPoint);
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
            }
        }
        updateLineSelectionState() {
            for (let selLineInfo of this.selectedLines) {
                let existsSelectedPoint = false;
                for (let point of selLineInfo.line.points) {
                    if (point.isSelected) {
                        existsSelectedPoint = true;
                        break;
                    }
                }
                selLineInfo.selectStateAfter = existsSelectedPoint;
                selLineInfo.line.isSelected = existsSelectedPoint;
            }
        }
        resetModifyStates() {
            for (let selPoint of this.selectedPoints) {
                selPoint.point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
            }
            for (let selLine of this.selectedLines) {
                selLine.line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            }
        }
    }
    ManualTracingTool.VectorLayerEditorSelectionInfo = VectorLayerEditorSelectionInfo;
    class Selector_LinePoint_BrushSelect extends ManualTracingTool.HitTest_LinePoint_PointToPointByDistance {
        constructor() {
            super(...arguments);
            this.editMode = SelectionEditMode.setSelected; // @override
            this.selectionInfo = new VectorLayerEditorSelectionInfo(); // @override
        }
        beforeHitTest() {
            this.selectionInfo.clear();
        }
        onPointHited(group, line, point) {
            this.selectionInfo.selectPoint(line, point, this.editMode);
        }
        afterHitTest() {
            this.selectionInfo.updateLineSelectionState();
            this.selectionInfo.resetModifyStates();
        }
    }
    ManualTracingTool.Selector_LinePoint_BrushSelect = Selector_LinePoint_BrushSelect;
    class Selector_Line_BrushSelect extends ManualTracingTool.HitTest_Line_PointToLineByDistance {
        constructor() {
            super(...arguments);
            this.editMode = SelectionEditMode.setSelected; // @override
            this.selectionInfo = new VectorLayerEditorSelectionInfo(); // @override
        }
        beforeHitTest() {
            this.selectionInfo.clear();
        }
        onLineSegmentHited(line, point1, point2, location, minDistanceSQ, distanceSQ) {
            this.selectionInfo.selectLine(line, this.editMode);
            this.existsPointHitTest = true;
        }
        afterHitTest() {
            this.selectionInfo.selectLinePointsForLines(this.editMode);
            this.selectionInfo.updateLineSelectionState();
            this.selectionInfo.resetModifyStates();
        }
    }
    ManualTracingTool.Selector_Line_BrushSelect = Selector_Line_BrushSelect;
    class Selector_LineSegment_BrushSelect extends ManualTracingTool.HitTest_Line_PointToLineByDistance {
        constructor() {
            super(...arguments);
            this.editMode = SelectionEditMode.setSelected; // @override
            this.selectionInfo = new VectorLayerEditorSelectionInfo(); // @override
        }
        beforeHitTest() {
            this.selectionInfo.clear();
        }
        onLineSegmentHited(line, point1, point2, location, minDistanceSQ, distanceSQ) {
            this.selectionInfo.selectPoint(line, point1, this.editMode);
            this.selectionInfo.selectPoint(line, point2, this.editMode);
        }
        afterHitTest() {
            this.selectionInfo.updateLineSelectionState();
            this.selectionInfo.resetModifyStates();
        }
    }
    ManualTracingTool.Selector_LineSegment_BrushSelect = Selector_LineSegment_BrushSelect;
})(ManualTracingTool || (ManualTracingTool = {}));
