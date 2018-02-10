
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

    export class VectorLineSelectionEditingInfo {

        selectedLines: List<LineSelectionInfo> = null;
        selectedPoints: List<PointSelectionInfo> = null;

        clear() {

            this.selectedLines = new List<LineSelectionInfo>();
            this.selectedPoints = new List<PointSelectionInfo>();
        }

        selectPoint(line: VectorLine, point: LinePoint, editMode: SelectionEditMode) {

            if (editMode == SelectionEditMode.setSelected
                || editMode == SelectionEditMode.toggle) {

                if (!point.isSelected && point.modifyFlag == ModifyFlagID.none) {

                    let selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = true;
                    selPoint.selectStateBefore = point.isSelected;

                    this.selectedPoints.push(selPoint);

                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = ModifyFlagID.unselectedToSelected;

                    if (line.modifyFlag == ModifyFlagID.none) {

                        let selLine = new LineSelectionInfo();
                        selLine.line = line;
                        selLine.selectStateAfter = true;
                        selLine.selectStateBefore = line.isSelected;

                        line.isSelected = selLine.selectStateAfter;
                        line.modifyFlag = ModifyFlagID.unselectedToSelected;

                        this.selectedLines.push(selLine);
                    }
                }
            }

            if (editMode == SelectionEditMode.setUnselected
                || editMode == SelectionEditMode.toggle) {

                if (point.isSelected && point.modifyFlag == ModifyFlagID.none) {

                    let selPoint = new PointSelectionInfo();
                    selPoint.point = point;
                    selPoint.selectStateAfter = false;
                    selPoint.selectStateBefore = point.isSelected;

                    this.selectedPoints.push(selPoint);

                    point.isSelected = selPoint.selectStateAfter;
                    point.modifyFlag = ModifyFlagID.selectedToUnselected;

                    if (line.modifyFlag == ModifyFlagID.none) {

                        let selLine = new LineSelectionInfo();
                        selLine.line = line;
                        selLine.selectStateBefore = line.isSelected;

                        line.modifyFlag = ModifyFlagID.selectedToUnselected;

                        this.selectedLines.push(selLine);
                    }
                }

            }
        }

        selectLinePoints(line: VectorLine, editMode: SelectionEditMode) {

            for (let point of line.points) {

                this.selectPoint(line, point, editMode);
            }
        }

        releaseEditState() {

            for (let selPoint of this.selectedPoints) {

                selPoint.point.modifyFlag = ModifyFlagID.none;
            }

            for (let selLine of this.selectedLines) {

                selLine.line.modifyFlag = ModifyFlagID.none;
            }
        }
    }

    export class Selector_LinePoint_BrushSelect extends HitTest_LinePoint_PointDistanceBase {

        editMode = SelectionEditMode.setSelected;

        selectionInfo = new VectorLineSelectionEditingInfo();

        protected beforeHitTest() { // @override

            this.selectionInfo.clear();
        }

        protected onPointHited(line: VectorLine, point: LinePoint) { // @override

            this.selectionInfo.selectPoint(line, point, this.editMode);
        }

        protected afterHitTest() { // @override

            for (let selLine of this.selectionInfo.selectedLines) {

                let existsSelectedPoint = false;

                for (let point of selLine.line.points) {

                    if (point.isSelected) {
                        existsSelectedPoint = true;
                        break;
                    }
                }

                selLine.selectStateAfter = existsSelectedPoint;
                selLine.line.isSelected = existsSelectedPoint;
            }

            this.selectionInfo.releaseEditState();
        }
    }

    export class Selector_LinePoint_LineClosingHitTest extends HitTest_LinePoint_LineDistanceBase {

        isChanged = false;

        protected beforeHitTest() { // @override

            this.isChanged = false;
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            if (!line.isClosingToMouse) {

                this.isChanged = true;
            }

            line.isClosingToMouse = true;

            this.exitPointHitTest = true;
        }

        protected onLineSegmentNotHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            if (line.isClosingToMouse) {

                this.isChanged = true;
            }

            line.isClosingToMouse = false;
        }
    }

    export class Selector_LinePoint_LineSelect extends HitTest_LinePoint_LineDistanceBase {

        editMode = SelectionEditMode.setSelected;

        protected selectionInfo = new VectorLineSelectionEditingInfo();

        protected beforeHitTest() { // @override

            this.selectionInfo.clear();
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            this.selectionInfo.selectLinePoints(line, this.editMode);

            this.exitPointHitTest = true;
        }

        protected afterHitTest() { // @override

            this.selectionInfo.releaseEditState();
        }
    }
}
