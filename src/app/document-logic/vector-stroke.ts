import { VectorStrokeModifyFlagID, VectorPoint, VectorStroke, VectorStrokeConnectionInfo, VectorStrokeGroup } from '../document-data'
import { float, int, RectangleArea } from '../common-logics'
import { VectorPointLogic } from './vector-point'

export class VectorStrokeLogic {

  static expandAreasForPoint(bound_area: RectangleArea, inner_area: RectangleArea, point: VectorPoint, lineWidthBiasRate: float) {

    const pointRadius = VectorPointLogic.getPointRadius(point)

    bound_area.expandByLocation(
      point.location[0] - pointRadius * lineWidthBiasRate,
      point.location[1] - pointRadius * lineWidthBiasRate
    )

    bound_area.expandByLocation(
      point.location[0] + pointRadius * lineWidthBiasRate,
      point.location[1] + pointRadius * lineWidthBiasRate
    )

    inner_area.expandByLocation(
      point.location[0],
      point.location[1]
    )
  }

  static calculateParameters(stroke: VectorStroke, lineWidthBiasRate = 1.0) {

    // Calculate rectangle area and selection
    let isSelected = false

    stroke.runtime.area.setMinimumValue()
    stroke.runtime.innerArea.setMinimumValue()
    for (const point of stroke.points) {

      this.expandAreasForPoint(
        stroke.runtime.area,
        stroke.runtime.innerArea,
        point,
        lineWidthBiasRate
      )

      if (point.isSelected) {

        isSelected = true
      }
    }

    stroke.runtime.area.calculateParams()
    stroke.runtime.innerArea.calculateParams()

    stroke.isSelected = isSelected

    // Calculate point positon in length
    if (stroke.points.length > 0) {

      VectorPointLogic.calculatePointTotalLength(stroke.points, 0.0)

      stroke.runtime.totalLength = stroke.points[stroke.points.length - 1].totalLength
    }
    else {

      stroke.runtime.totalLength = 0.0
    }

    // Calculate curvature
    VectorPointLogic.calculatePointCurvature(stroke.points)
  }

  static calculateSurroundingArea(result: RectangleArea, strokes: VectorStroke[]) {

    result.setMinimumValue()

    for (const stroke of strokes) {

      RectangleArea.calculateSurroundingRectangle(result, result, stroke.runtime.area)
    }

    result.calculateParams()
  }

  static isEmpty(stroke: VectorStroke): boolean {

    return (stroke.points.length == 0)
  }

  static isEmptyStroke(stroke: VectorStroke): boolean {

    return (stroke.points.length < 2 || stroke.runtime.totalLength <= 0.0 || stroke.runtime.innerArea.range == 0.0)
  }

  static clalculateSamplingDivisionCount(totalLength: float, resamplingUnitLength: float): int {

    if (resamplingUnitLength <= 0) {
      throw new Error('ERROR 0000: Can\'t set resampling unit length as zero or minus')
    }

    let divisionCount = Math.floor(totalLength / resamplingUnitLength)

    if ((divisionCount % 2) == 0) {

      divisionCount = divisionCount + 1
    }

    return divisionCount
  }

  static smooth(line: VectorStroke, iterationCount = 1) {

    for (let loopCount = 0; loopCount < iterationCount; loopCount++) {

      VectorStrokeLogic.smoothPoints(line.points)

      VectorStrokeLogic.applyAdjustments(line)
    }

    VectorStrokeLogic.calculateParameters(line)
  }

  static smoothPoints(linePoints: VectorPoint[]) {

    // Smoothing
    for (let i = 0; i < linePoints.length; i++) {
      const point = linePoints[i]

      vec3.copy(point.adjustingLocation, point.location)
      vec3.copy(point.tempLocation, point.location)
      point.adjustingLineWidth = point.lineWidth
    }

    const iteration = 2
    for (let count = 0; count < iteration; count++) {

      for (let i = 0; i + 2 < linePoints.length; i++) {

        const point1 = linePoints[i]
        const point2 = linePoints[i + 1]
        const point3 = linePoints[i + 2]

        VectorStrokeLogic.calcBezier2d(
          point2.adjustingLocation
          , point1.tempLocation
          , point2.tempLocation
          , point3.tempLocation
          , 0.5
        )

        point2.adjustingLineWidth = (point1.adjustingLineWidth + point3.adjustingLineWidth) / 2
      }

      for (let i = 0; i + 2 < linePoints.length; i++) {

        const point2 = linePoints[i + 1]

        vec3.copy(point2.tempLocation, point2.adjustingLocation)
      }
    }
  }

  private static calcBezier2d(result: Vec3, p0: Vec3, p1: Vec3, p2: Vec3, t: float) {

    const px = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
    const py = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]

    vec3.set(result, px, py, 0.0)
  }

  static applyAdjustments(line: VectorStroke) {

    for (const point of line.points) {

      vec3.copy(point.location, point.adjustingLocation)
      point.lineWidth = point.adjustingLineWidth
    }
  }

  static resetModifyStates(lines: VectorStroke[]) {

    for (const line of lines) {

      line.runtime.modifyFlag = VectorStrokeModifyFlagID.none
    }
  }

  static createResampledLine(baseLine: VectorStroke, samplingUnitLength: float): VectorStroke {

    const result = new VectorStroke()

    const startIndex = 0
    const endIndex = baseLine.points.length - 1

    VectorPointLogic.resamplePoints(
      result.points
      , baseLine.points
      , startIndex
      , endIndex
      , samplingUnitLength)

    VectorStrokeLogic.calculateParameters(result)

    return result
  }

  static createConnectionInfos(strokeGroup: VectorStrokeGroup): VectorStrokeConnectionInfo[] {

    const infos: VectorStrokeConnectionInfo[] = []

    for (const [index, stroke] of strokeGroup.lines.entries()) {

      if (index != strokeGroup.lines.length - 1) {

        const info = new VectorStrokeConnectionInfo()
        info.from_Stroke = stroke
        info.to_Stroke = strokeGroup.lines[index + 1]

        infos.push(info)
      }
    }

    return infos
  }
}
