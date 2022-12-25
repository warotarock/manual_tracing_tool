import { RectangleArea } from '../common-logics'
import {
  VectorLayer, VectorLayerGeometry, VectorLayerGeometryTypeID, VectorPoint,
  VectorStroke, VectorStrokeDrawingUnit, VectorStrokeGroup
} from '../document-data'
import { Posing3DLogic, Posing3DView } from '../posing3d'
import { VectorStrokeLogic } from './vector-stroke'

export class EyesSymmetryLogic {

  private static locationFront = vec3.create()
  private static locationBack = vec3.create()
  private static invMatrix = mat4.create()
  private static mirrorMatrix = mat4.create()
  private static oppositeTransformMatrix = mat4.create()
  private static eyeLocation = vec3.create()
  private static tempMat4 = mat4.create()
  private static tempVec3 = vec3.create()

  static updateEyesSymetries(vectorLayer: VectorLayer, geometry: VectorLayerGeometry, posing3DLogic: Posing3DLogic, posing3DView: Posing3DView) {

    if (!(VectorLayer.isVectorLayerWithOwnData(vectorLayer) && vectorLayer.eyesSymmetryEnabled)) {
        return
    }

    let existsUpdate = false
    VectorLayerGeometry.forEachGroup(geometry, (group) => {

      if (group.runtime.needsLazyUpdate) {
        existsUpdate = true
      }
    })

    if (!existsUpdate) {
      return
    }

    const posingData = vectorLayer.runtime.posingLayer.posingData

    posing3DView.caluculateCameraMatrix(posingData)

    posing3DLogic.getEyeSphereLocation(this.eyeLocation, posingData, vectorLayer.eyesSymmetryInputSide)

    // 反転処理の行列を計算
    mat4.invert(this.invMatrix, posingData.headMatrix)
    mat4.identity(this.mirrorMatrix)
    mat4.scale(this.mirrorMatrix, this.mirrorMatrix, vec3.set(this.tempVec3, -1.0, 1.0 ,1.0))

    mat4.multiply(this.tempMat4, posingData.headMatrix, this.mirrorMatrix)
    mat4.multiply(this.oppositeTransformMatrix, this.tempMat4, this.invMatrix)

    const eyeSize = posing3DLogic.getEyeSphereSize()

    // console.debug('calculateEyesSymmetry', eyeSize, this.centimeter(this.eyeLocation))

    vectorLayer.runtime.eyesSymmetryGeometry = new VectorLayerGeometry(VectorLayerGeometryTypeID.strokes)
    const drawingUnit = new VectorStrokeDrawingUnit()
    const strokeGroup = new VectorStrokeGroup()

    VectorLayerGeometry.forEachGroup(geometry, (group) => {

      // console.debug('group.isUpdated', group.isUpdated)

      if (!group.runtime.needsLazyUpdate) {
        return
      }

      group.runtime.needsLazyUpdate = false

      for (const stroke of group.lines) {

        const symmetryStroke = new VectorStroke()

        for (const point of stroke.points) {

          const hited = posing3DLogic.calculateInputLocation3DForDoubleSide(
            this.locationFront,
            this.locationBack,
            point.location,
            this.eyeLocation,
            eyeSize,
            posingData,
            posing3DView
          )

          if (hited) {

            vec3.copy(point.location3D, this.locationFront)

            const symmetryPoint = VectorPoint.clone(point)
            vec3.transformMat4(symmetryPoint.location3D, point.location3D, this.oppositeTransformMatrix)

            posing3DView.calculate2DLocationFrom3DLocation(symmetryPoint.location, symmetryPoint.location3D, posingData)
            vec3.copy(symmetryPoint.adjustingLocation, symmetryPoint.location)

            symmetryStroke.points.push(symmetryPoint)
          }
        }

        if (symmetryStroke.points.length > 0) {

          VectorStrokeLogic.calculateParameters(symmetryStroke, vectorLayer.lineWidthBiasRate)

          strokeGroup.lines.push(symmetryStroke)
        }
      }
    })

    drawingUnit.groups.push(strokeGroup)

    vectorLayer.runtime.eyesSymmetryGeometry.units.push(drawingUnit)

    const surroundingArea = RectangleArea.createMinumumValueRectangle()
    for (const unite of vectorLayer.runtime.eyesSymmetryGeometry.units) {

      for (const group of unite.groups) {

        VectorStrokeLogic.calculateSurroundingArea(group.runtime.area, group.lines)

        surroundingArea.expandByRectangle(group.runtime.area)
      }
    }
    surroundingArea.calculateParams()
    surroundingArea.copyTo(vectorLayer.runtime.eyesSymmetryGeometry.runtime.area)
  }
}
