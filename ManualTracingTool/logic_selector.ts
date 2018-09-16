
namespace ManualTracingTool {

    export enum SelectionEditMode {

        setSelected = 1,
        setUnselected = 2,
        toggle = 3,
    }

    export class LineSelectionInfo {

        line: VectorLine = null;
        selectStateAfter = false;
        selectStateBefore = false;
    }

    export class PointSelectionInfo {

        point: LinePoint = null;
        selectStateAfter = false;
        selectStateBefore = false;
    }

    export class VectorLayerEditorSelectionInfo {

        selectedLines: List<LineSelectionInfo> = null;
        selectedPoints: List<PointSelectionInfo> = null;

        constructor() {

            this.clear();
        }

        clear() {

            this.selectedLines = new List<LineSelectionInfo>();
            this.selectedPoints = new List<PointSelectionInfo>();
        }

        selectPoint(line: VectorLine, point: LinePoint, editMode: SelectionEditMode) {

            if (editMode == SelectionEditMode.setSelected
                || editMode == SelectionEditMode.toggle) {

                if (!point.isSelected && point.modifyFlag == LinePointModifyFlagID.none) {

                    let selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = true;
                    selPoint.selectStateBefore = point.isSelected;

                    this.selectedPoints.push(selPoint);

                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = LinePointModifyFlagID.unselectedToSelected;

                    this.selectLine(line, editMode);
                }
            }

            if (editMode == SelectionEditMode.setUnselected
                || editMode == SelectionEditMode.toggle) {

                if (point.isSelected && point.modifyFlag == LinePointModifyFlagID.none) {

                    let selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = false;
                    selPoint.selectStateBefore = point.isSelected;

                    this.selectedPoints.push(selPoint);

                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = LinePointModifyFlagID.selectedToUnselected;

                    this.selectLine(line, editMode);
                }
            }
        }

        selectLinePoints(line: VectorLine, editMode: SelectionEditMode) {

            for (let point of line.points) {

                this.selectPoint(line, point, editMode);
            }
        }

        selectLine(line: VectorLine, editMode: SelectionEditMode) {

            if (line.modifyFlag != VectorLineModifyFlagID.none) {

                return;
            }

            let selLine = new LineSelectionInfo();
            selLine.line = line;
            selLine.selectStateBefore = line.isSelected;

            if (editMode == SelectionEditMode.setSelected) {

                selLine.selectStateAfter = true;
                line.isSelected = true;
                line.modifyFlag = VectorLineModifyFlagID.unselectedToSelected;
            }
            else if (editMode == SelectionEditMode.setUnselected) {

                selLine.selectStateAfter = false;
                line.modifyFlag = VectorLineModifyFlagID.selectedToUnselected;
            }
            else if (editMode == SelectionEditMode.toggle) {

                if (line.isSelected) {

                    selLine.selectStateAfter = false;
                    line.modifyFlag = VectorLineModifyFlagID.selectedToUnselected;
                }
                else {

                    selLine.selectStateAfter = true;
                    line.isSelected = true;
                    line.modifyFlag = VectorLineModifyFlagID.unselectedToSelected;
                }
            }

            this.selectedLines.push(selLine);
        }

        selectLinePointsForLines(editMode: SelectionEditMode) {

            for (let selLineInfo of this.selectedLines) {

                for (let point of selLineInfo.line.points) {

                    this.selectPoint(selLineInfo.line, point, editMode);
                }
            }
        }

        editPoint(point: LinePoint) {

            if (point.modifyFlag == LinePointModifyFlagID.none) {

                let selPoint = new PointSelectionInfo();
                selPoint.point = point;
                this.selectedPoints.push(selPoint);

                point.modifyFlag = LinePointModifyFlagID.edit;
            }
        }

        deletePoint(point: LinePoint) {

            if (point.modifyFlag == LinePointModifyFlagID.none) {

                let selPoint = new PointSelectionInfo();
                selPoint.point = point;
                this.selectedPoints.push(selPoint);

                point.modifyFlag = LinePointModifyFlagID.delete;
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

        resetModifyStatus() {

            for (let selPoint of this.selectedPoints) {

                selPoint.point.modifyFlag = LinePointModifyFlagID.none;
            }

            for (let selLine of this.selectedLines) {

                selLine.line.modifyFlag = VectorLineModifyFlagID.none;
            }
        }
    }

    export interface ISelector_BrushSelect extends IHitTest_VectorLayerLinePoint {

        editMode: SelectionEditMode;
        selectionInfo: VectorLayerEditorSelectionInfo;
    }

    export class Selector_LinePoint_BrushSelect extends HitTest_LinePoint_PointToPointByDistance implements ISelector_BrushSelect {

        editMode = SelectionEditMode.setSelected; // @override

        selectionInfo = new VectorLayerEditorSelectionInfo(); // @override

        protected beforeHitTest() { // @override

            this.selectionInfo.clear();
        }

        protected onPointHited(group: VectorGroup, line: VectorLine, point: LinePoint) { // @override

            this.selectionInfo.selectPoint(line, point, this.editMode);
        }

        protected afterHitTest() { // @override

            this.selectionInfo.updateLineSelectionState();

            this.selectionInfo.resetModifyStatus();
        }
    }

    export class Selector_Line_BrushSelect extends HitTest_Line_PointToLineByDistance implements ISelector_BrushSelect {

        editMode = SelectionEditMode.setSelected; // @override

        selectionInfo = new VectorLayerEditorSelectionInfo(); // @override

        protected beforeHitTest() { // @override

            this.selectionInfo.clear();
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            this.selectionInfo.selectLine(line, this.editMode);

            this.exitPointHitTest = true;
        }

        protected afterHitTest() { // @override

            this.selectionInfo.selectLinePointsForLines(this.editMode);

            this.selectionInfo.updateLineSelectionState();

            this.selectionInfo.resetModifyStatus();
        }
    }

    export class Selector_LineSegment_BrushSelect extends HitTest_Line_PointToLineByDistance implements ISelector_BrushSelect {

        editMode = SelectionEditMode.setSelected; // @override

        selectionInfo = new VectorLayerEditorSelectionInfo(); // @override

        protected beforeHitTest() { // @override

            this.selectionInfo.clear();
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            this.selectionInfo.selectPoint(line, point1, this.editMode);
            this.selectionInfo.selectPoint(line, point2, this.editMode);
        }

        protected afterHitTest() { // @override

            this.selectionInfo.updateLineSelectionState();

            this.selectionInfo.resetModifyStatus();
        }
    }
}
