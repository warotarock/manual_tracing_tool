var ManualTracingTool;
(function (ManualTracingTool) {
    let SelectionEditMode;
    (function (SelectionEditMode) {
        SelectionEditMode[SelectionEditMode["setSelected"] = 1] = "setSelected";
        SelectionEditMode[SelectionEditMode["setUnselected"] = 2] = "setUnselected";
        SelectionEditMode[SelectionEditMode["toggle"] = 3] = "toggle";
    })(SelectionEditMode = ManualTracingTool.SelectionEditMode || (ManualTracingTool.SelectionEditMode = {}));
    class GroupSelectionInfo {
        constructor() {
            this.group = null;
        }
    }
    ManualTracingTool.GroupSelectionInfo = GroupSelectionInfo;
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
            this.selectedGroups = null;
            this.selectedLines = null;
            this.selectedPoints = null;
            this.clear();
        }
        clear() {
            this.selectedGroups = new List();
            this.selectedLines = new List();
            this.selectedPoints = new List();
        }
        isGroupDone(group) {
            return (group.modifyFlag != ManualTracingTool.VectorGroupModifyFlagID.none);
        }
        isLineDone(line) {
            return (line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.none);
        }
        isPointDone(point) {
            return (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.none);
        }
        selectPoint(line, point, editMode) {
            if (this.isPointDone(point)) {
                return;
            }
            if (editMode == SelectionEditMode.setSelected
                || editMode == SelectionEditMode.toggle) {
                if (!point.isSelected) {
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
                if (point.isSelected) {
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
            if (this.isLineDone(line)) {
                return;
            }
            let selInfo = new LineSelectionInfo();
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
        }
        selectLinePointsForLines(editMode) {
            for (let selLineInfo of this.selectedLines) {
                for (let point of selLineInfo.line.points) {
                    this.selectPoint(selLineInfo.line, point, editMode);
                }
            }
        }
        editGroup(group) {
            if (this.isGroupDone(group)) {
                return;
            }
            let selInfo = new GroupSelectionInfo();
            selInfo.group = group;
            this.selectedGroups.push(selInfo);
            group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.edit;
        }
        editLine(line) {
            if (this.isLineDone(line)) {
                return;
            }
            let selInfo = new LineSelectionInfo();
            selInfo.line = line;
            this.selectedLines.push(selInfo);
            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.edit;
        }
        editPoint(point) {
            if (this.isPointDone(point)) {
                return;
            }
            let selInfo = new PointSelectionInfo();
            selInfo.point = point;
            this.selectedPoints.push(selInfo);
            point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.edit;
        }
        deletePoint(point) {
            if (this.isPointDone(point)) {
                return;
            }
            let selInfo = new PointSelectionInfo();
            selInfo.point = point;
            this.selectedPoints.push(selInfo);
            point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
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
            for (let selGroup of this.selectedGroups) {
                selGroup.group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            }
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
            this.resetModifyStates();
        }
        resetModifyStates() {
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
        onLineSegmentHited(group, line, point1, point2, location, minDistanceSQ, distanceSQ) {
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
        onLineSegmentHited(group, line, point1, point2, location, minDistanceSQ, distanceSQ) {
            this.selectionInfo.selectPoint(line, point1, this.editMode);
            this.selectionInfo.selectPoint(line, point2, this.editMode);
        }
        afterHitTest() {
            this.selectionInfo.updateLineSelectionState();
            this.selectionInfo.resetModifyStates();
        }
        resetModifyStates() {
            this.selectionInfo.resetModifyStates();
        }
    }
    ManualTracingTool.Selector_LineSegment_BrushSelect = Selector_LineSegment_BrushSelect;
})(ManualTracingTool || (ManualTracingTool = {}));
