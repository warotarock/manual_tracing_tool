import { float } from '../common-logics'
import {
  VectorPointModifyFlagID, VectorLayerGeometryModifyFlagID, VectorStrokeGroupModifyFlagID, VectorLayer, VectorLayerGeometry, VectorStrokeModifyFlagID, VectorPoint,
  VectorStroke, VectorStrokeGroup
} from '../document-data'
import {
  HitTest_VectorPoint_PointToPoint, HitTest_VectorStroke_PointToStroke,
  IHitTest_VectorLayer
} from './vector-layer-hittest'

export class VectorPointSelectionInfo {

  point: VectorPoint = null
  selectStateAfter = false
  selectStateBefore = false
}

export class VectorStrokeSelectionInfo {

  stroke: VectorStroke = null
  selectStateAfter = false
  selectStateBefore = false
}

export class VectorGroupSelectionInfo {

  geometry: VectorLayerGeometry = null
  layer: VectorLayer = null
  group: VectorStrokeGroup = null
}

export class VectorLayerSelectionInfo {

  selectedGroups: VectorGroupSelectionInfo[] = null
  selectedStrokess: VectorStrokeSelectionInfo[] = null
  selectedPoints: VectorPointSelectionInfo[] = null

  constructor() {

    this.clear()
  }

  clear() {

    this.selectedGroups = []
    this.selectedStrokess = []
    this.selectedPoints = []
  }

  isGroupDone(group: VectorStrokeGroup) {

    return (group.runtime.modifyFlag != VectorStrokeGroupModifyFlagID.none)
  }

  isStrokeDone(stroke: VectorStroke) {

    return (stroke.runtime.modifyFlag != VectorStrokeModifyFlagID.none)
  }

  isPointDone(point: VectorPoint) {

    return (point.modifyFlag != VectorPointModifyFlagID.none)
  }

  selectPoint(stroke: VectorStroke, point: VectorPoint, editMode: SelectionEditMode) {

    if (this.isPointDone(point)) {
      return
    }

    if (
      (editMode == SelectionEditMode.setSelected
        || editMode == SelectionEditMode.toggle
      )
      && !point.isSelected
    ) {

      const selPoint = new VectorPointSelectionInfo()
      selPoint.point = point
      selPoint.selectStateAfter = true
      selPoint.selectStateBefore = point.isSelected

      this.selectedPoints.push(selPoint)

      point.isSelected = selPoint.selectStateAfter
      point.modifyFlag = VectorPointModifyFlagID.unselectedToSelected

      this.selectLine(stroke, editMode)
    }
    else if (
      (editMode == SelectionEditMode.setUnselected
        || editMode == SelectionEditMode.toggle
      )
      && point.isSelected
    ){

      const selPoint = new VectorPointSelectionInfo()
      selPoint.point = point
      selPoint.selectStateAfter = false
      selPoint.selectStateBefore = point.isSelected

      this.selectedPoints.push(selPoint)

      point.isSelected = selPoint.selectStateAfter
      point.modifyFlag = VectorPointModifyFlagID.selectedToUnselected

      this.selectLine(stroke, editMode)
    }
  }

  selectLinePoints(stroke: VectorStroke, editMode: SelectionEditMode) {

    for (const point of stroke.points) {

      this.selectPoint(stroke, point, editMode)
    }
  }

  selectLine(stroke: VectorStroke, editMode: SelectionEditMode) {

    if (this.isStrokeDone(stroke)) {
      return
    }

    const selInfo = new VectorStrokeSelectionInfo()
    selInfo.stroke = stroke
    selInfo.selectStateBefore = stroke.isSelected

    if (editMode == SelectionEditMode.setSelected) {

      selInfo.selectStateAfter = true
      stroke.isSelected = true
      stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.unselectedToSelected
    }
    else if (editMode == SelectionEditMode.setUnselected) {

      selInfo.selectStateAfter = false
      stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.selectedToUnselected
    }
    else if (editMode == SelectionEditMode.toggle) {

      if (stroke.isSelected) {

        selInfo.selectStateAfter = false
        stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.selectedToUnselected
      }
      else {

        selInfo.selectStateAfter = true
        stroke.isSelected = true
        stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.unselectedToSelected
      }
    }

    this.selectedStrokess.push(selInfo)
  }

  selectLinePointsForLines(editMode: SelectionEditMode) {

    for (const selLineInfo of this.selectedStrokess) {

      for (const point of selLineInfo.stroke.points) {

        this.selectPoint(selLineInfo.stroke, point, editMode)
      }
    }
  }

  editGroup(group: VectorStrokeGroup, geometry: VectorLayerGeometry, layer: VectorLayer) {

    if (this.isGroupDone(group)) {
      return
    }

    const selInfo = new VectorGroupSelectionInfo()
    selInfo.layer = layer
    selInfo.geometry = geometry
    selInfo.group = group
    this.selectedGroups.push(selInfo)

    geometry.runtime.modifyFlag = VectorLayerGeometryModifyFlagID.edit
    group.runtime.modifyFlag = VectorStrokeGroupModifyFlagID.edit
  }

  editStroke(stroke: VectorStroke) {

    if (this.isStrokeDone(stroke)) {
      return
    }

    const selInfo = new VectorStrokeSelectionInfo()
    selInfo.stroke = stroke
    this.selectedStrokess.push(selInfo)

    stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.edit
  }

  editPoint(point: VectorPoint) {

    if (this.isPointDone(point)) {
      return
    }

    const selInfo = new VectorPointSelectionInfo()
    selInfo.point = point
    this.selectedPoints.push(selInfo)

    point.modifyFlag = VectorPointModifyFlagID.edit
  }

  deletePoint(point: VectorPoint) {

    if (this.isPointDone(point)) {
      return
    }

    const selInfo = new VectorPointSelectionInfo()
    selInfo.point = point
    this.selectedPoints.push(selInfo)

    point.modifyFlag = VectorPointModifyFlagID.delete
  }

  updateLineSelectionState() {

    for (const selLineInfo of this.selectedStrokess) {

      let existsSelectedPoint = false

      for (const point of selLineInfo.stroke.points) {

        if (point.isSelected) {
          existsSelectedPoint = true
          break
        }
      }

      selLineInfo.selectStateAfter = existsSelectedPoint
      selLineInfo.stroke.isSelected = existsSelectedPoint
    }
  }

  resetModifyStates() {

    for (const selGroup of this.selectedGroups) {

      if (selGroup.geometry.runtime.modifyFlag != VectorLayerGeometryModifyFlagID.delete) {

        selGroup.geometry.runtime.modifyFlag = VectorLayerGeometryModifyFlagID.none
      }

      if (selGroup.group.runtime.modifyFlag != VectorStrokeGroupModifyFlagID.delete) {

        selGroup.group.runtime.modifyFlag = VectorStrokeGroupModifyFlagID.none
      }
    }

    for (const selLine of this.selectedStrokess) {

      if (selLine.stroke.runtime.modifyFlag != VectorStrokeModifyFlagID.delete) {

        selLine.stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.none
      }
    }

    for (const selPoint of this.selectedPoints) {

      if (selPoint.point.modifyFlag != VectorPointModifyFlagID.delete) {

        selPoint.point.modifyFlag = VectorPointModifyFlagID.none
      }
    }
  }

  existsSelected() {

    return (
      this.selectedGroups.length > 0
      || this.selectedStrokess.length > 0
      || this.selectedPoints.length > 0
    )
  }
}

export enum SelectionEditMode {

  none = 0,
  setSelected = 1,
  setUnselected = 2,
  toggle = 3
}

export interface ISelector_VectorLayer extends IHitTest_VectorLayer {

  editMode: SelectionEditMode
  selectionInfo: VectorLayerSelectionInfo
}

export class Selector_VectorPoint_BrushSelect extends HitTest_VectorPoint_PointToPoint implements ISelector_VectorLayer {

  editMode = SelectionEditMode.none // @implements ISelector_VectorLayer
  selectionInfo = new VectorLayerSelectionInfo() // @implements ISelector_VectorLayer

  protected beforeHitTest() { // @override

    this.selectionInfo.clear()
  }

  protected onPointHited(point: VectorPoint) { // @override

    this.selectionInfo.selectPoint(this.currentStroke, point, this.editMode)
  }

  protected afterHitTest() { // @override

    this.selectionInfo.updateLineSelectionState()

    this.resetModifyStates()
  }

  resetModifyStates() {

    this.selectionInfo.resetModifyStates()
  }
}

export class Selector_VectorStroke_BrushSelect extends HitTest_VectorStroke_PointToStroke implements ISelector_VectorLayer {

  editMode = SelectionEditMode.none // @implements ISelector_VectorLayer
  selectionInfo = new VectorLayerSelectionInfo() // @implements ISelector_VectorLayer

  protected beforeHitTest() { // @override

    this.selectionInfo.clear()
  }

  protected onLineSegmentHited(_point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @override

    this.selectionInfo.selectLine(this.currentStroke, this.editMode)

    this.existsPointHitTest = true
  }

  protected afterHitTest() { // @override

    this.selectionInfo.selectLinePointsForLines(this.editMode)

    this.selectionInfo.updateLineSelectionState()

    this.selectionInfo.resetModifyStates()
  }
}

export class Selector_StrokeSegment_BrushSelect extends HitTest_VectorStroke_PointToStroke implements ISelector_VectorLayer {

  editMode = SelectionEditMode.none // @implements ISelector_VectorLayer
  selectionInfo = new VectorLayerSelectionInfo() // @implements ISelector_VectorLayer

  protected beforeHitTest() { // @override

    this.selectionInfo.clear()
  }

  protected onLineSegmentHited(point1: VectorPoint, point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @override

    this.selectionInfo.selectPoint(this.currentStroke, point1, this.editMode)
    this.selectionInfo.selectPoint(this.currentStroke, point2, this.editMode)
  }

  protected afterHitTest() { // @override

    this.selectionInfo.updateLineSelectionState()

    this.selectionInfo.resetModifyStates()
  }

  resetModifyStates() {

    this.selectionInfo.resetModifyStates()
  }
}
