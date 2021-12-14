import { CommandBase } from '../command/command'
import { VectorPoint, VectorStroke, VectorStrokeGroup } from '../document_data'
import { OperationUnitID } from '../tool/constants'
import { Logic_Edit_Line, Logic_Edit_Points } from '../logics/edit_vector_layer'
import { SubToolContext } from '../context/subtool_context'
import { ViewKeyframeLayer } from '../view/view_keyframe'
import { Tool_Transform_Lattice, TransformType } from './transform_lattice'

class Tool_Transform_Lattice_EditPoint {

  targetPoint: VectorPoint = null
  targetLine: VectorStroke = null

  relativeLocation = vec3.fromValues(0.0, 0.0, 0.0)
  newLocation = vec3.fromValues(0.0, 0.0, 0.0)
  oldLocation = vec3.fromValues(0.0, 0.0, 0.0)
}

export class Tool_Transform_Lattice_LinePoint extends Tool_Transform_Lattice {

  lerpLocation1 = vec3.create()
  lerpLocation2 = vec3.create()
  lerpLocation3 = vec3.create()

  targetGroups: VectorStrokeGroup[] = null
  targetLines: VectorStroke[] = null
  editPoints: Tool_Transform_Lattice_EditPoint[] = null

  protected clearEditData() { // @override

    this.targetGroups = null
    this.targetLines = null
    this.editPoints = null
  }

  protected checkTarget(ctx: SubToolContext): boolean { // @override

    return (ctx.isCurrentLayerVectorLayer() || ctx.isCurrentLayerGroupLayer())
  }

  protected prepareLatticePoints(ctx: SubToolContext): boolean { // @override

    const rect = this.rectangleArea

    Logic_Edit_Points.setMinMaxToRectangleArea(rect)

    const selectedOnly = true

    const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

    ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

      for (const line of group.lines) {

        Logic_Edit_Points.calculateSurroundingRectangle(rect, rect, line.points, selectedOnly)
      }
    })

    this.setLatticePointsByRectangle(this.rectangleArea)

    return this.existsLatticeRectangleArea()
  }

  protected prepareEditData(ctx: SubToolContext) { // @override

    const targetGroups: VectorStrokeGroup[] = []
    const targetLines: VectorStroke[] = []
    const editPoints: Tool_Transform_Lattice_EditPoint[] = []

    const viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

    ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

      let existsInGroup = false

      for (const line of group.lines) {

        let existsInLine = false

        for (const point of line.points) {

          if ((ctx.operationUnitID != OperationUnitID.line && !point.isSelected)
            || !line.isSelected) {

            continue
          }

          const editPoint = new Tool_Transform_Lattice_EditPoint()
          editPoint.targetPoint = point
          editPoint.targetLine = line

          vec3.copy(editPoint.oldLocation, point.location)
          vec3.copy(editPoint.newLocation, point.location)

          const xPosition = this.rectangleArea.getHorizontalPositionInRate(point.location[0])
          const yPosition = this.rectangleArea.getVerticalPositionInRate(point.location[1])
          vec3.set(editPoint.relativeLocation, xPosition, yPosition, 0.0)

          editPoints.push(editPoint)

          existsInLine = true
        }

        if (existsInLine) {

          targetLines.push(line)

          existsInGroup = true
        }
      }

      if (existsInGroup) {

        targetGroups.push(group)
      }
    })

    this.targetGroups = targetGroups
    this.targetLines = targetLines
    this.editPoints = editPoints
  }

  protected existsEditData(): boolean { // @override

    return (this.editPoints.length > 0)
  }

  cancelModal(ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {

      vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.targetPoint.location)
    }

    this.editPoints = null

    ctx.setRedrawMainWindowEditorWindow()
  }

  protected processTransform(_ctx: SubToolContext) { // @override

    if (this.editPoints == null) {
      return
    }

    const editPoints = this.editPoints

    const latticePoints = this.latticePoints

    //            lerpLocation1
    // (0)-------+-------(1)
    //  |        |        |
    //  |        |        |
    //  |        * result |
    //  |        |        |
    //  |        |        |
    // (3)-------+-------(2)
    //            lerpLocation2

    const latticePointLocationH1A = latticePoints[0].location
    const latticePointLocationH1B = latticePoints[1].location
    const latticePointLocationH2A = latticePoints[3].location
    const latticePointLocationH2B = latticePoints[2].location

    for (const editPoint of editPoints) {

      vec3.lerp(this.lerpLocation1, latticePointLocationH1A, latticePointLocationH1B, editPoint.relativeLocation[0])
      vec3.lerp(this.lerpLocation2, latticePointLocationH2A, latticePointLocationH2B, editPoint.relativeLocation[0])

      vec3.lerp(editPoint.targetPoint.adjustingLocation, this.lerpLocation1, this.lerpLocation2, editPoint.relativeLocation[1])
    }
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    if (this.editPoints.length == 0) {
      return
    }

    for (const editPoint of this.editPoints) {

      vec3.copy(editPoint.newLocation, editPoint.targetPoint.adjustingLocation)
    }

    // Execute the command
    const command = new Command_TransformLattice_LinePoint()
    command.editPoints = this.editPoints
    command.targetLines = this.targetLines
    command.useGroups(this.targetGroups)

    ctx.commandHistory.executeCommand(command, ctx)

    this.editPoints = null
  }
}

export class Command_TransformLattice_LinePoint extends CommandBase {

  targetLines: VectorStroke[] = null
  editPoints: Tool_Transform_Lattice_EditPoint[] = null

  execute(ctx: SubToolContext) { // @override

    this.errorCheck()

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {

      vec3.copy(editPoint.targetPoint.location, editPoint.oldLocation)
      vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.oldLocation)
    }

    this.updateRelatedObjects()
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editPoint of this.editPoints) {

      vec3.copy(editPoint.targetPoint.location, editPoint.newLocation)
      vec3.copy(editPoint.targetPoint.adjustingLocation, editPoint.newLocation)
    }

    this.updateRelatedObjects()
  }

  errorCheck() {

    if (this.targetLines == null) {
      throw new Error('ERROR 1003:Command_TransformLattice: line is null!')
    }

    if (this.editPoints.length == 0) {
      throw new Error('ERROR 1004:Command_TransformLattice: no target point!')
    }
  }

  private updateRelatedObjects() {

    Logic_Edit_Line.calculateParametersV(this.targetLines)
  }
}

export class Tool_Transform_Lattice_GrabMove extends Tool_Transform_Lattice_LinePoint {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.grabMove, ctx)
  }
}

export class Tool_Transform_Lattice_Rotate extends Tool_Transform_Lattice_LinePoint {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.rotate, ctx)
  }
}

export class Tool_Transform_Lattice_Scale extends Tool_Transform_Lattice_LinePoint {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.scale, ctx)
  }
}
