import { float } from './conversion'
import { LinePointModifyFlagID, VectorGroupModifyFlagID, VectorLineModifyFlagID, VectorPoint,
  VectorStroke, VectorStrokeGroup } from '../document_data'
import { HitTest_LinePoint_PointToPointByDistance, HitTest_Line_PointToLineByDistance,
  IHitTest_VectorLayerLinePoint } from './hittest'

export enum SelectionEditMode {

    setSelected = 1,
    setUnselected = 2,
    toggle = 3,
}

export class GroupSelectionInfo {

    group: VectorStrokeGroup = null
}

export class LineSelectionInfo {

    line: VectorStroke = null
    selectStateAfter = false
    selectStateBefore = false
}

export class PointSelectionInfo {

    point: VectorPoint = null
    selectStateAfter = false
    selectStateBefore = false
}

export class VectorLayerEditorSelectionInfo {

    selectedGroups: GroupSelectionInfo[] = null
    selectedLines: LineSelectionInfo[] = null
    selectedPoints: PointSelectionInfo[] = null

    constructor() {

        this.clear()
    }

    clear() {

        this.selectedGroups = []
        this.selectedLines = []
        this.selectedPoints = []
    }

    isGroupDone(group: VectorStrokeGroup) {

        return (group.modifyFlag != VectorGroupModifyFlagID.none)
    }

    isLineDone(line: VectorStroke) {

        return (line.modifyFlag != VectorLineModifyFlagID.none)
    }

    isPointDone(point: VectorPoint) {

        return (point.modifyFlag != LinePointModifyFlagID.none)
    }

    selectPoint(line: VectorStroke, point: VectorPoint, editMode: SelectionEditMode) {

        if (this.isPointDone(point)) {
            return
        }

        if (editMode == SelectionEditMode.setSelected
            || editMode == SelectionEditMode.toggle) {

            if (!point.isSelected) {

                const selPoint = new PointSelectionInfo()
                selPoint.point = point
                selPoint.selectStateAfter = true
                selPoint.selectStateBefore = point.isSelected

                this.selectedPoints.push(selPoint)

                point.isSelected = selPoint.selectStateAfter
                point.modifyFlag = LinePointModifyFlagID.unselectedToSelected

                this.selectLine(line, editMode)
            }
        }

        if (editMode == SelectionEditMode.setUnselected
            || editMode == SelectionEditMode.toggle) {

            if (point.isSelected) {

                const selPoint = new PointSelectionInfo()
                selPoint.point = point
                selPoint.selectStateAfter = false
                selPoint.selectStateBefore = point.isSelected

                this.selectedPoints.push(selPoint)

                point.isSelected = selPoint.selectStateAfter
                point.modifyFlag = LinePointModifyFlagID.selectedToUnselected

                this.selectLine(line, editMode)
            }
        }
    }

    selectLinePoints(line: VectorStroke, editMode: SelectionEditMode) {

        for (const point of line.points) {

            this.selectPoint(line, point, editMode)
        }
    }

    selectLine(line: VectorStroke, editMode: SelectionEditMode) {

        if (this.isLineDone(line)) {
            return
        }

        const selInfo = new LineSelectionInfo()
        selInfo.line = line
        selInfo.selectStateBefore = line.isSelected

        if (editMode == SelectionEditMode.setSelected) {

            selInfo.selectStateAfter = true
            line.isSelected = true
            line.modifyFlag = VectorLineModifyFlagID.unselectedToSelected
        }
        else if (editMode == SelectionEditMode.setUnselected) {

            selInfo.selectStateAfter = false
            line.modifyFlag = VectorLineModifyFlagID.selectedToUnselected
        }
        else if (editMode == SelectionEditMode.toggle) {

            if (line.isSelected) {

                selInfo.selectStateAfter = false
                line.modifyFlag = VectorLineModifyFlagID.selectedToUnselected
            }
            else {

                selInfo.selectStateAfter = true
                line.isSelected = true
                line.modifyFlag = VectorLineModifyFlagID.unselectedToSelected
            }
        }

        this.selectedLines.push(selInfo)
    }

    selectLinePointsForLines(editMode: SelectionEditMode) {

        for (const selLineInfo of this.selectedLines) {

            for (const point of selLineInfo.line.points) {

                this.selectPoint(selLineInfo.line, point, editMode)
            }
        }
    }

    editGroup(group: VectorStrokeGroup) {

        if (this.isGroupDone(group)) {
            return
        }

        const selInfo = new GroupSelectionInfo()
        selInfo.group = group
        this.selectedGroups.push(selInfo)

        group.modifyFlag = VectorGroupModifyFlagID.edit
    }

    editLine(line: VectorStroke) {

        if (this.isLineDone(line)) {
            return
        }

        const selInfo = new LineSelectionInfo()
        selInfo.line = line
        this.selectedLines.push(selInfo)

        line.modifyFlag = VectorLineModifyFlagID.edit
    }

    editPoint(point: VectorPoint) {

        if (this.isPointDone(point)) {
            return
        }

        const selInfo = new PointSelectionInfo()
        selInfo.point = point
        this.selectedPoints.push(selInfo)

        point.modifyFlag = LinePointModifyFlagID.edit
    }

    deletePoint(point: VectorPoint) {

        if (this.isPointDone(point)) {
            return
        }

        const selInfo = new PointSelectionInfo()
        selInfo.point = point
        this.selectedPoints.push(selInfo)

        point.modifyFlag = LinePointModifyFlagID.delete
    }

    updateLineSelectionState() {

        for (const selLineInfo of this.selectedLines) {

            let existsSelectedPoint = false

            for (const point of selLineInfo.line.points) {

                if (point.isSelected) {
                    existsSelectedPoint = true
                    break
                }
            }

            selLineInfo.selectStateAfter = existsSelectedPoint
            selLineInfo.line.isSelected = existsSelectedPoint
        }
    }

    resetModifyStates() {

        for (const selGroup of this.selectedGroups) {

            selGroup.group.modifyFlag = VectorGroupModifyFlagID.none
        }

        for (const selPoint of this.selectedPoints) {

            selPoint.point.modifyFlag = LinePointModifyFlagID.none
        }

        for (const selLine of this.selectedLines) {

            selLine.line.modifyFlag = VectorLineModifyFlagID.none
        }
    }
}

export interface ISelector_BrushSelect extends IHitTest_VectorLayerLinePoint {

    editMode: SelectionEditMode
    selectionInfo: VectorLayerEditorSelectionInfo
}

export class Selector_LinePoint_BrushSelect extends HitTest_LinePoint_PointToPointByDistance implements ISelector_BrushSelect {

    editMode = SelectionEditMode.setSelected // @override

    selectionInfo = new VectorLayerEditorSelectionInfo() // @override

    protected beforeHitTest() { // @override

        this.selectionInfo.clear()
    }

    protected onPointHited(group: VectorStrokeGroup, line: VectorStroke, point: VectorPoint) { // @override

        this.selectionInfo.selectPoint(line, point, this.editMode)
    }

    protected afterHitTest() { // @override

        this.selectionInfo.updateLineSelectionState()

        this.resetModifyStates()
    }

    resetModifyStates() {

        this.selectionInfo.resetModifyStates()
    }
}

export class Selector_Line_BrushSelect extends HitTest_Line_PointToLineByDistance implements ISelector_BrushSelect {

    editMode = SelectionEditMode.setSelected // @override

    selectionInfo = new VectorLayerEditorSelectionInfo() // @override

    protected beforeHitTest() { // @override

        this.selectionInfo.clear()
    }

    protected onLineSegmentHited(group: VectorStrokeGroup, line: VectorStroke, _point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @override

        this.selectionInfo.selectLine(line, this.editMode)

        this.existsPointHitTest = true
    }

    protected afterHitTest() { // @override

        this.selectionInfo.selectLinePointsForLines(this.editMode)

        this.selectionInfo.updateLineSelectionState()

        this.selectionInfo.resetModifyStates()
    }
}

export class Selector_LineSegment_BrushSelect extends HitTest_Line_PointToLineByDistance implements ISelector_BrushSelect {

    editMode = SelectionEditMode.setSelected // @override

    selectionInfo = new VectorLayerEditorSelectionInfo() // @override

    protected beforeHitTest() { // @override

        this.selectionInfo.clear()
    }

    protected onLineSegmentHited(group: VectorStrokeGroup, line: VectorStroke, point1: VectorPoint, point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @override

        this.selectionInfo.selectPoint(line, point1, this.editMode)
        this.selectionInfo.selectPoint(line, point2, this.editMode)
    }

    protected afterHitTest() { // @override

        this.selectionInfo.updateLineSelectionState()

        this.selectionInfo.resetModifyStates()
    }

    resetModifyStates() {

        this.selectionInfo.resetModifyStates()
    }
}
