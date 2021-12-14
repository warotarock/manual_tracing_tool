import { VectorStrokeGroup, VectorLayer, VectorGeometry, VectorDrawingUnit, VectorStroke, VectorPoint } from '../document_data'
import { Logic_Edit_Line } from '../logics/edit_vector_layer'
import { Posing3DLogic } from '../posing3d/posing3d_logic'
import { Posing3DView } from '../posing3d/posing3d_view'
import { ViewKeyframeLayer } from '../view/view_keyframe'

export class EyesSymmetryLogic {

  private posing3DLogic: Posing3DLogic = null
  private posing3DView: Posing3DView = null

  private locationFront = vec3.create()
  private locationBack = vec3.create()
  private invMatrix = mat4.create()
  private mirrorMatrix = mat4.create()
  private oppositeTransformMatrix = mat4.create()
  private eyeLocation = vec3.create()
  private tempMat4 = mat4.create()
  private tempVec3 = vec3.create()

  link(posing3DLogic: Posing3DLogic, posing3DView: Posing3DView) {

    this.posing3DLogic = posing3DLogic
    this.posing3DView = posing3DView
  }

  updateEyesSymetries(viewKeyframeLayers: ViewKeyframeLayer[]) {

    ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup, vectorLayer: VectorLayer) => {

      // console.debug('group.isUpdated', group.isUpdated)

      if (!group.isUpdated) {
        return
      }

      if (VectorLayer.isVectorLayerWithOwnData(vectorLayer) && vectorLayer.eyesSymmetryEnabled) {

        this.calculateEyesSymmetry(group, vectorLayer)
      }

      group.isUpdated = false
    })
  }

  private calculateEyesSymmetry(group: VectorStrokeGroup, vectorLayer: VectorLayer) {

    const posingData = vectorLayer.posingLayer.posingData

    this.posing3DLogic.getEyeSphereLocation(this.eyeLocation, posingData, vectorLayer.eyesSymmetryInputSide)

    // 反転処理の行列を計算
    mat4.invert(this.invMatrix, posingData.headMatrix)
    mat4.identity(this.mirrorMatrix)
    mat4.scale(this.mirrorMatrix, this.mirrorMatrix, vec3.set(this.tempVec3, -1.0, 1.0 ,1.0))

    mat4.multiply(this.tempMat4, posingData.headMatrix, this.mirrorMatrix)
    mat4.multiply(this.oppositeTransformMatrix, this.tempMat4, this.invMatrix)

    const eyeSize = this.posing3DLogic.getEyeSphereSize()

    // console.debug('calculateEyesSymmetry', eyeSize, this.centimeter(this.eyeLocation))

    vectorLayer.eyesSymmetryGeometry = new VectorGeometry()
    const drawingUnit = new VectorDrawingUnit()
    const strokeGroup = new VectorStrokeGroup()

    for (const stroke of group.lines) {

      const symmetryStroke = new VectorStroke()

      for (const point of stroke.points) {

        const hited = this.posing3DLogic.calculateInputLocation3DWSide(
          this.locationFront,
          this.locationBack,
          point.location,
          this.eyeLocation,
          eyeSize,
          posingData,
          this.posing3DView
        )

        if (hited) {

          vec3.copy(point.location3D, this.locationFront)

          const symmetryPoint = VectorPoint.clone(point)
          vec3.transformMat4(symmetryPoint.location3D, point.location3D, this.oppositeTransformMatrix)

          this.posing3DView.calculate2DLocationFrom3DLocation(symmetryPoint.location, symmetryPoint.location3D, posingData)
          vec3.copy(symmetryPoint.adjustingLocation, symmetryPoint.location)

          symmetryStroke.points.push(symmetryPoint)

          // console.debug(this.centimeter(point.location3D))
        }
      }

      if (symmetryStroke.points.length > 0) {

        Logic_Edit_Line.calculateParameters(symmetryStroke)

        strokeGroup.lines.push(symmetryStroke)
        // console.debug(`symmetryStroke`, symmetryStroke.points.length)
      }
    }

    drawingUnit.groups.push(strokeGroup)
    // console.debug(`strokeGroup`, strokeGroup.lines.length)

    vectorLayer.eyesSymmetryGeometry.units.push(drawingUnit)
    // console.debug(`drawingUnit`, drawingUnit.groups.length)

    // console.debug(`eyesSymmetryGeometry`, vectorLayer.eyesSymmetryGeometry.units.length)
  }
}
