import { CommandBase } from "../command"
import { Lists } from "../common-logics"
import { SubToolContext } from "../context"
import { PostUpdateSituationTypeID } from "../deffered-process"
import { VectorLayer, VectorLayerGeometry, VectorStrokeModifyFlagID, VectorStroke, VectorStrokeDrawingUnit, VectorStrokeGroup } from "../document-data"
import { VectorStrokeLogic } from "../document-logic"

export class Command_AddStroke extends CommandBase {

  layer: VectorLayer = null
  geometry: VectorLayerGeometry = null
  drawingUnit: VectorStrokeDrawingUnit = null
  group: VectorStrokeGroup = null
  stroke: VectorStroke = null
  addToTop = false

  add_strokeGroup: VectorStrokeGroup | null = null
  add_drawingUnit: VectorStrokeDrawingUnit | null = null

  setTarget(layer: VectorLayer, geometry: VectorLayerGeometry, drawingUnit: VectorStrokeDrawingUnit | null, group: VectorStrokeGroup, stroke: VectorStroke) {

    this.layer = layer
    this.geometry = geometry
    this.drawingUnit = drawingUnit
    this.group = group
    this.stroke = stroke
  }

  execute(ctx: SubToolContext) { // @override

    VectorStrokeLogic.calculateParameters(this.stroke, this.layer.lineWidthBiasRate)

    if (this.group == null) {

      if (this.drawingUnit == null) {

        this.add_drawingUnit = new VectorStrokeDrawingUnit()
        this.drawingUnit = this.add_drawingUnit
      }

      this.add_strokeGroup = new VectorStrokeGroup()
      this.group = this.add_strokeGroup
    }

    this.defferedProcess.addGroup(this.layer, this.group, PostUpdateSituationTypeID.changesObjectShapes)

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    if (this.add_drawingUnit != null) {

      this.geometry.units.pop()
    }

    if (this.add_strokeGroup != null) {

      this.drawingUnit.groups.pop()
    }

    if (this.addToTop) {

      Lists.removeAt(this.group.lines, 0)
    }
    else {

      this.group.lines.pop()
    }

    this.stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.delete
  }

  redo(_ctx: SubToolContext) { // @override

    if (this.add_drawingUnit != null) {

      this.geometry.units.push(this.add_drawingUnit)
    }

    if (this.add_strokeGroup != null) {

      this.drawingUnit.groups.push(this.add_strokeGroup)
    }

    if (this.addToTop) {

      Lists.insertAt(this.group.lines, 0, this.stroke)
    }
    else {

      this.group.lines.push(this.stroke)
    }

    this.stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.none
  }
}
