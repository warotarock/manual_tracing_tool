import { CommandBase } from '../command'
import { SubToolContext } from '../context'
import { PostUpdateSituationTypeID } from '../deffered-process'
import { VectorLayer, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document-data'
import { VectorStrokeLogic } from '../document-logic'
import { OperationUnitID } from '../tool'
import { ViewKeyframeLayer } from '../view'
import { Tool_Transform_Lattice, TransformType } from './transform-lattice'

class EditPoint {

  targetPoint: VectorPoint = null

  relativeLocation = vec3.fromValues(0.0, 0.0, 0.0)
  newLocation = vec3.fromValues(0.0, 0.0, 0.0)
  oldLocation = vec3.fromValues(0.0, 0.0, 0.0)
}

interface TargetStroke {

  stroke: VectorStroke
  layer: VectorLayer
}

interface TargetGroup {

  group: VectorStrokeGroup
  layer: VectorLayer
}

export class Tool_Transform_Lattice_StrokePoint extends Tool_Transform_Lattice {

  lerpLocation1 = vec3.create()
  lerpLocation2 = vec3.create()
  lerpLocation3 = vec3.create()

  viewKeyframeLayers: ViewKeyframeLayer[] = null
  targetGroups: TargetGroup[] = null
  targetStrokes: TargetStroke[] = null
  editPoints: EditPoint[] = null

  protected clearEditData() { // @override

    this.targetGroups = null
    this.targetStrokes = null
    this.editPoints = null
  }

  protected checkTarget(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerEditbaleLayer()
    )
  }

  protected prepareLatticePoints(ctx: SubToolContext): boolean { // @override

    this.bound_contentArea.setMinimumValue()
    this.inner_contentArea.setMinimumValue()

    const parStroke = (ctx.operationUnitID == OperationUnitID.stroke)

    this.viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    ViewKeyframeLayer.forEachStrokeGroup(this.viewKeyframeLayers, (group, layer) => {

      for (const stroke of group.lines) {

        if (parStroke) {

          if (stroke.isSelected) {

            this.bound_contentArea.expandByRectangle(stroke.runtime.area)
            this.inner_contentArea.expandByRectangle(stroke.runtime.innerArea)
          }
        }
        else {

          for (const point of stroke.points) {

            if (!point.isSelected) {
              continue
            }

            VectorStrokeLogic.expandAreasForPoint(
              this.bound_contentArea,
              this.inner_contentArea,
              point,
              layer.lineWidthBiasRate
            )
          }
        }
      }
    })

    this.setLatticePointsByRectangle(this.bound_contentArea, this.inner_contentArea)

    return this.existsLatticeRectangleArea()
  }

  protected prepareEditData(ctx: SubToolContext) { // @override

    const targetGroups: TargetGroup[] = []
    const targetStrokes: TargetStroke[] = []
    const editPoints: EditPoint[] = []

    const parSteoke = (ctx.operationUnitID == OperationUnitID.stroke)

    ViewKeyframeLayer.forEachStrokeGroup(this.viewKeyframeLayers, (group, layer) => {

      let existsInGroup = false

      for (const stroke of group.lines) {

        let existsInLine = false

        for (const point of stroke.points) {

          if (!(point.isSelected || (parSteoke && stroke.isSelected))) {
            continue
          }

          const editPoint = new EditPoint()
          editPoint.targetPoint = point

          vec3.copy(editPoint.oldLocation, point.location)
          vec3.copy(editPoint.newLocation, point.location)

          const xPosition = this.inner_contentArea.getHorizontalPositionRate(point.location[0])
          const yPosition = this.inner_contentArea.getVerticalPositionRate(point.location[1])
          vec3.set(editPoint.relativeLocation, xPosition, yPosition, 0.0)

          editPoints.push(editPoint)

          existsInLine = true
        }

        if (existsInLine) {

          targetStrokes.push({ stroke: stroke, layer: layer })

          existsInGroup = true
        }
      }

      if (existsInGroup) {

        targetGroups.push({ group, layer })
      }
    })

    this.targetGroups = targetGroups
    this.targetStrokes = targetStrokes
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
    command.targetStrokes = this.targetStrokes

    for (const targetGroup of this.targetGroups) {

      command.defferedProcess.addGroup(targetGroup.layer, targetGroup.group, PostUpdateSituationTypeID.changesObjectShapes)
    }

    ctx.commandHistory.executeCommand(command, ctx)

    this.editPoints = null
  }
}

export class Command_TransformLattice_LinePoint extends CommandBase {

  targetStrokes: TargetStroke[] = null
  editPoints: EditPoint[] = null

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

    if (this.targetStrokes == null) {
      throw new Error('ERROR 1003:Command_TransformLattice: line is null!')
    }

    if (this.editPoints.length == 0) {
      throw new Error('ERROR 1004:Command_TransformLattice: no target point!')
    }
  }

  private updateRelatedObjects() {

    for (const targetStroke of this.targetStrokes) {

      VectorStrokeLogic.calculateParameters(targetStroke.stroke, targetStroke.layer.lineWidthBiasRate)
    }
  }
}

export class Tool_Transform_Lattice_GrabMove extends Tool_Transform_Lattice_StrokePoint {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.grabMove, ctx)
  }
}

export class Tool_Transform_Lattice_Rotate extends Tool_Transform_Lattice_StrokePoint {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.rotate, ctx)
  }
}

export class Tool_Transform_Lattice_Scale extends Tool_Transform_Lattice_StrokePoint {

  protected selectTransformCalculator(ctx: SubToolContext) { // @override

    this.setLatticeAffineTransform(TransformType.scale, ctx)
  }
}
