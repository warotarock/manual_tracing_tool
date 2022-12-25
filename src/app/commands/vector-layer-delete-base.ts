import { CommandBase } from "../command"
import { int } from "../common-logics"
import { SubToolContext } from "../context"
import { Layer, VectorPointModifyFlagID, VectorLayer, VectorLayerGeometry, VectorStrokeModifyFlagID, VectorPoint, VectorStroke, VectorStrokeDrawingUnit,
  VectorStrokeDrawingUnitModifyFlagID, VectorStrokeGroup, VectorStrokeGroupModifyFlagID
} from "../document-data"
import { VectorStrokeLogic } from "../document-logic"
import { ViewKeyframeLayer } from "../view"

class EditGeometry {

  geometry: VectorLayerGeometry = null
  oldUnits: VectorStrokeDrawingUnit[] = null
  newUnits: VectorStrokeDrawingUnit[] = null
  deleteUnits: VectorStrokeDrawingUnit[] = null
}

class EditDrawingUnit {

  drawingUnit: VectorStrokeDrawingUnit = null
  oldGroups: VectorStrokeGroup[] = null
  newGroups: VectorStrokeGroup[] = null
  deleteGroups: VectorStrokeGroup[] = null
}

class EditGroup {

  group: VectorStrokeGroup = null
  oldStrokes: VectorStroke[] = null
  newStrokes: VectorStroke[] = null
  deleteStrokes: VectorStroke[] = null
}

class EditStroke {

  stroke: VectorStroke = null
  old_points: VectorPoint[] = null
  new_points: VectorPoint[] = null
  delete_points: VectorPoint[] = null
}

class VectorLayerDeleteEditDataSet {

  target_layers: Layer[] = []
  editGeometrys: EditGeometry[] = []
  editDrawingUnits: EditDrawingUnit[] = []
  editGroups: EditGroup[] = []
  editStrokes: EditStroke[] = []

  existsChanges(): boolean {

    return (this.editGeometrys.length > 0
      || this.editDrawingUnits.length > 0
      || this.editGroups.length > 0
      || this.editStrokes.length > 0
      )
  }
}

export class Command_VectorLayer_Delete_Base extends CommandBase {

  editDataSet: VectorLayerDeleteEditDataSet | null = null

  prepare(ctx: SubToolContext): boolean {

    const editDataSet = new VectorLayerDeleteEditDataSet()

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    this.setFlags(viewKeyframeLayers)

    ViewKeyframeLayer.forEachVectorGeometry(viewKeyframeLayers, (geometry, layer) => {

      this.processVectorGeometry(geometry, layer, editDataSet)
    })

    this.editDataSet = editDataSet

    return this.editDataSet.existsChanges()
  }

  prepareForGeometry(geometry: VectorLayerGeometry, layer: Layer): boolean {

    const editDataSet = new VectorLayerDeleteEditDataSet()

    this.processVectorGeometry(geometry, layer, editDataSet)

    this.editDataSet = editDataSet

    return this.editDataSet.existsChanges()
  }

  protected setFlags(viewKeyframeLayers: ViewKeyframeLayer[]) { // @virtual

    ViewKeyframeLayer.forEachVectorGeometry(viewKeyframeLayers, (geometry) => {

      this.setFlagsForGeometry(geometry)
    })
  }

  protected setFlagsForGeometry(geometry: VectorLayerGeometry) { // @virtual
  }

  protected processVectorGeometry(geometry: VectorLayerGeometry, layer: Layer, editDataSet: VectorLayerDeleteEditDataSet): int {

    let deleteUnitCount = this.processDrawingUnits(geometry.units, editDataSet)

    if (deleteUnitCount > 0) {

      const editGeometry = new EditGeometry()
      editGeometry.geometry = geometry
      editGeometry.oldUnits = geometry.units
      editGeometry.newUnits = geometry.units.filter(unit => unit.modifyFlag == VectorStrokeDrawingUnitModifyFlagID.none)
      editGeometry.deleteUnits = geometry.units.filter(unit => unit.modifyFlag == VectorStrokeDrawingUnitModifyFlagID.delete)
      editDataSet.editGeometrys.push(editGeometry)
    }

    for (const unit of geometry.units) {
      unit.modifyFlag = VectorStrokeDrawingUnitModifyFlagID.none
    }

    if (editDataSet.existsChanges()) {

      editDataSet.target_layers.push(layer)
    }

    return deleteUnitCount
  }

  protected processDrawingUnits(units: VectorStrokeDrawingUnit[], editDataSet: VectorLayerDeleteEditDataSet): int {

    let deleteUnitCount = 0

    for (const unit of units) {

      let deletedGroupCount = this.processStrokeGroups(unit.groups, editDataSet)

      if (unit.modifyFlag == VectorStrokeDrawingUnitModifyFlagID.delete
        || unit.groups.length - deletedGroupCount == 0) {

        unit.modifyFlag = VectorStrokeDrawingUnitModifyFlagID.delete
        deleteUnitCount++
      }

      if (deletedGroupCount > 0) {

        const editDrawingUnit = new EditDrawingUnit()
        editDrawingUnit.drawingUnit = unit
        editDrawingUnit.oldGroups = unit.groups
        editDrawingUnit.newGroups = unit.groups.filter(group => group.runtime.modifyFlag == VectorStrokeGroupModifyFlagID.none)
        editDrawingUnit.deleteGroups = unit.groups.filter(group => group.runtime.modifyFlag == VectorStrokeGroupModifyFlagID.delete)
        editDataSet.editDrawingUnits.push(editDrawingUnit)
      }

      for (const group of unit.groups) {
        group.runtime.modifyFlag = VectorStrokeGroupModifyFlagID.none
      }
    }

    return deleteUnitCount
  }

  protected processStrokeGroups(groups: VectorStrokeGroup[], editDataSet: VectorLayerDeleteEditDataSet): int {

    let deleteGroupCount = 0

    for (const group of groups) {

      const deletedStrokeCount = this.processStrokes(group.lines, editDataSet)

      if (group.runtime.modifyFlag == VectorStrokeGroupModifyFlagID.delete
        || group.lines.length - deletedStrokeCount == 0) {

        group.runtime.modifyFlag = VectorStrokeGroupModifyFlagID.delete
        deleteGroupCount++
      }

      if (deletedStrokeCount > 0) {

        const editGroup = new EditGroup()
        editGroup.group = group
        editGroup.oldStrokes = group.lines
        editGroup.newStrokes = group.lines.filter(stroke => stroke.runtime.modifyFlag == VectorStrokeModifyFlagID.none)
        editGroup.deleteStrokes = group.lines.filter(stroke => stroke.runtime.modifyFlag == VectorStrokeModifyFlagID.delete)
        editDataSet.editGroups.push(editGroup)
      }

      for (const stroke of group.lines) {
        stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.none
      }
    }

    return deleteGroupCount
  }

  protected processStrokes(strokes: VectorStroke[], editDataSet: VectorLayerDeleteEditDataSet): int {

    let deleteStrokeCount = 0

    for (const stroke of strokes) {

      const deletePointCount = this.processPoints(stroke.points)

      if (stroke.runtime.modifyFlag == VectorStrokeModifyFlagID.delete
        || (stroke.points.length - deletePointCount == 0)
        || VectorStrokeLogic.isEmptyStroke(stroke)) {

        stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.delete
        deleteStrokeCount++
      }

      if (deletePointCount > 0) {

        const editStroke = new EditStroke()
        editStroke.stroke = stroke
        editStroke.old_points = stroke.points
        editStroke.new_points = stroke.points.filter(point => point.modifyFlag == VectorPointModifyFlagID.none)
        editStroke.delete_points = stroke.points.filter(point => point.modifyFlag == VectorPointModifyFlagID.delete)
        editDataSet.editStrokes.push(editStroke)
      }

      for (const point of stroke.points) {
        point.modifyFlag = VectorPointModifyFlagID.none
      }
    }

    return deleteStrokeCount
  }

  protected processPoints(points: VectorPoint[]): int {

    let deletePointCount = 0

    for (const point of points) {

      if (point.modifyFlag == VectorPointModifyFlagID.delete) {

        deletePointCount++
      }
    }

    return deletePointCount
  }

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(ctx: SubToolContext) { // @override

    for (const editGeometry of this.editDataSet.editGeometrys) {

      editGeometry.geometry.units = editGeometry.oldUnits

      for (const unit of editGeometry.deleteUnits) {
        unit.modifyFlag = VectorStrokeDrawingUnitModifyFlagID.none
      }
    }

    for (const editDrawingUnit of this.editDataSet.editDrawingUnits) {

      editDrawingUnit.drawingUnit.groups = editDrawingUnit.oldGroups

      for (const group of editDrawingUnit.deleteGroups) {
        group.runtime.modifyFlag = VectorStrokeGroupModifyFlagID.none
      }
    }

    for (const editGroup of this.editDataSet.editGroups) {

      editGroup.group.lines = editGroup.oldStrokes

      for (const stroke of editGroup.deleteStrokes) {
        stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.none
      }
    }

    for (const editStroke of this.editDataSet.editStrokes) {

      editStroke.stroke.points= editStroke.old_points

      for (const point of editStroke.delete_points) {
        point.modifyFlag = VectorPointModifyFlagID.none
      }
    }
  }

  redo(ctx: SubToolContext) { // @override

    for (const editGeometry of this.editDataSet.editGeometrys) {

      editGeometry.geometry.units = editGeometry.newUnits

      for (const unit of editGeometry.deleteUnits) {
        unit.modifyFlag = VectorStrokeDrawingUnitModifyFlagID.delete
      }
    }

    for (const editDrawingUnit of this.editDataSet.editDrawingUnits) {

      editDrawingUnit.drawingUnit.groups = editDrawingUnit.newGroups

      for (const group of editDrawingUnit.deleteGroups) {
        group.runtime.modifyFlag = VectorStrokeGroupModifyFlagID.delete
      }
    }

    for (const editGroup of this.editDataSet.editGroups) {

      editGroup.group.lines = editGroup.newStrokes

      for (const stroke of editGroup.deleteStrokes) {
        stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.delete
      }
    }

    for (const editStroke of this.editDataSet.editStrokes) {

      editStroke.stroke.points= editStroke.new_points

      for (const point of editStroke.delete_points) {
        point.modifyFlag = VectorPointModifyFlagID.delete
      }
    }

    for (const layer of this.editDataSet.target_layers) {

      if (VectorLayer.isPointBrushFillLayer(layer)) {

        ctx.main.setRedrawDrawPathForLayer(layer)
      }
    }
  }
}
