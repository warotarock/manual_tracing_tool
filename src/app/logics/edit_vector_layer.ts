import { float, int } from './conversion'
import { LinePointModifyFlagID, VectorGeometry, VectorGroupModifyFlagID, VectorLineModifyFlagID,
  VectorPoint, VectorStroke,VectorStrokeGroup } from '../document_data'
import { Maths } from './math'
import { Logic_Points } from './points'

export class Logic_Edit_Points_RectangleArea {

  top = 0.0
  right = 0.0
  bottom = 0.0
  left = 0.0

  getWidth(): float {

    return Math.abs(this.right - this.left)
  }

  getHeight(): float {

    return Math.abs(this.bottom - this.top)
  }

  getHorizontalPositionInRate(x: float) {

    const width = this.getWidth()

    if (width == 0.0) {

      return 0.0
    }

    return (x - this.left) / width
  }

  getVerticalPositionInRate(y: float) {

    const height = this.getHeight()

    if (height == 0.0) {

      return 0.0
    }

    return (y - this.top) / height
  }
}

export class Logic_Edit_Points {

  static setMinMaxToRectangleArea(result: Logic_Edit_Points_RectangleArea) {

    result.left = 999999.0
    result.top = 999999.0

    result.right = -999999.0
    result.bottom = -999999.0
  }

  static existsRectangleArea(rectangle: Logic_Edit_Points_RectangleArea): boolean {

    return (rectangle.left != 999999.0
      && rectangle.top != 999999.0
      && rectangle.right != -999999.0
      && rectangle.bottom != -999999.0)
  }

  static clalculateSamplingDivisionCount(totalLength: float, resamplingUnitLength: float): int {

    let divisionCount = Math.floor(totalLength / resamplingUnitLength)

    if ((divisionCount % 2) == 0) {

      divisionCount = divisionCount + 1
    }

    return divisionCount
  }

  static calculateSurroundingRectangle(result: Logic_Edit_Points_RectangleArea, minMaxRectangle: Logic_Edit_Points_RectangleArea, points: VectorPoint[], selectedOnly: boolean) {

    let left = minMaxRectangle.left
    let top = minMaxRectangle.top

    let right = minMaxRectangle.right
    let bottom = minMaxRectangle.bottom

    for (const point of points) {

      if (selectedOnly
        && !point.isSelected) {

        continue
      }

      left = Math.min(point.location[0], left)
      top = Math.min(point.location[1], top)

      right = Math.max(point.location[0], right)
      bottom = Math.max(point.location[1], bottom)
    }

    result.left = left
    result.top = top

    result.right = right
    result.bottom = bottom
  }

  static calculatePointTotalLength(points: VectorPoint[], startLength: float) {

    if (points.length == 0) {

      return
    }

    points[0].totalLength = startLength

    let totalLength = startLength
    for (let i = 1; i < points.length; i++) {

      const point1 = points[i]
      const point2 = points[i - 1]

      totalLength += vec3.distance(point1.location, point2.location)

      point1.totalLength = totalLength
    }
  }

  static calculatePointCurvature(points: VectorPoint[]) {

    if (points.length <= 2) {

      return
    }

    points[0].totalLength = 0
    points[points.length - 1].totalLength = 0

    for (let i = 1; i + 1 < points.length; i++) {

      const point1 = points[i - 1]
      const point2 = points[i]
      const point3 = points[i + 1]

      const angle = Logic_Points.angleOfCorner(point1.location, point2.location, point3.location)

      point2.curvature = Math.PI - angle
      if (point2.curvature >= Math.PI) {

        point2.curvature = Math.PI * 2 - point2.curvature
      }
    }
  }

  static calculateSegmentTotalLength(points: VectorPoint[], startIndex: int, endIndex: int) {

    let totalLength = 0.0

    for (let i = startIndex; i <= endIndex - 1; i++) {

      const point1 = points[i]
      const point2 = points[i + 1]

      totalLength += vec3.distance(point1.location, point2.location)
    }

    return totalLength
  }

  static resamplePoints(result: VectorPoint[], points: VectorPoint[], startIndex: int, endIndex: int, samplingUnitLength: float): VectorPoint[] {

    const sampledLocationVec = Logic_Edit_Line.sampledLocation

    const totalLength = Logic_Edit_Points.calculateSegmentTotalLength(points, startIndex, endIndex)

    const firstPoint = points[startIndex]
    const lastPoint = points[endIndex]

    let currentIndex = startIndex
    let currentPosition = 0.0
    const endPosition = totalLength

    const maxSampleCount = 1 + Math.ceil(totalLength / samplingUnitLength)

    let nextStepLength = samplingUnitLength

    // for first point
    {
      const sampledPoint = new VectorPoint()
      vec3.copy(sampledPoint.location, firstPoint.location)
      vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location)
      sampledPoint.lineWidth = firstPoint.lineWidth
      sampledPoint.adjustingLineWidth = sampledPoint.lineWidth
      result.push(sampledPoint)
    }

    // for inside points
    let sampledCount = 1

    let currentPointPosition = 0.0
    while (currentPosition < endPosition) {

      const currentPoint = points[currentIndex]
      const nextPoint = points[currentIndex + 1]
      const segmentLength = vec3.distance(nextPoint.location, currentPoint.location)

      if (segmentLength < samplingUnitLength / 10.0) {

        currentIndex++
        currentPointPosition += segmentLength

        if (currentIndex == endIndex) {
          break
        }
      }

      const nextPointPosition = currentPointPosition + segmentLength

      if (currentPosition + nextStepLength >= endPosition - samplingUnitLength / 2.0) {
        break
      }
      else if (currentPosition + nextStepLength <= nextPointPosition) {

        const localPosition = (currentPosition + nextStepLength) - currentPointPosition
        const positionRate = localPosition / segmentLength

        vec3.lerp(sampledLocationVec, currentPoint.location, nextPoint.location, positionRate)

        const sampledPoint = new VectorPoint()
        vec3.copy(sampledPoint.location, sampledLocationVec)
        vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location)

        sampledPoint.lineWidth = Maths.lerp(positionRate, currentPoint.lineWidth, nextPoint.lineWidth)
        sampledPoint.adjustingLineWidth = sampledPoint.lineWidth

        result.push(sampledPoint)

        currentPosition = currentPosition + nextStepLength
        nextStepLength = samplingUnitLength

        sampledCount++
        if (sampledCount >= maxSampleCount) {

          break
        }
      }
      else {

        nextStepLength = (currentPosition + nextStepLength) - nextPointPosition
        currentPosition = nextPointPosition

        currentIndex++
        currentPointPosition += segmentLength

        if (currentIndex == endIndex) {
          break
        }
      }
    }

    // for last point
    {
      const sampledPoint = new VectorPoint()
      vec3.copy(sampledPoint.location, lastPoint.location)
      vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location)
      sampledPoint.lineWidth = lastPoint.lineWidth
      sampledPoint.adjustingLineWidth = sampledPoint.lineWidth
      result.push(sampledPoint)
    }

    return result
  }
}

export class Logic_Edit_Line {

  static sampledLocation = vec3.fromValues(0.0, 0.0, 0.0)

  static calculateParameters(line: VectorStroke) {

    // Calculate rectangle area and selection
    let left = 999999.0
    let top = 999999.0

    let right = -999999.0
    let bottom = -999999.0

    let isSelected = false

    for (const point of line.points) {

      left = Math.min(point.location[0], left)
      top = Math.min(point.location[1], top)

      right = Math.max(point.location[0], right)
      bottom = Math.max(point.location[1], bottom)

      if (point.isSelected) {

        isSelected = true
      }
    }

    line.left = left
    line.top = top
    line.right = right
    line.bottom = bottom
    line.range = Math.sqrt(Math.pow((right - left) * 0.5, 2) + Math.pow((bottom - top) * 0.5, 2))

    line.isSelected = isSelected

    // Calculate point positon in length
    if (line.points.length > 0) {

      Logic_Edit_Points.calculatePointTotalLength(line.points, 0.0)

      line.totalLength = line.points[line.points.length - 1].totalLength
    }
    else {

      line.totalLength = 0.0
    }

    // Calculate curvature
    Logic_Edit_Points.calculatePointCurvature(line.points)
  }

  static calculateParametersV(lines: VectorStroke[]) {

    for (const line of lines) {

      Logic_Edit_Line.calculateParameters(line)
    }
  }

  static smooth(line: VectorStroke) {

    Logic_Edit_Line.smoothPoints(line.points)

    Logic_Edit_Line.applyAdjustments(line)

    Logic_Edit_Line.calculateParameters(line)
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

        Logic_Edit_Line.calcBezier2d(
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

      line.modifyFlag = VectorLineModifyFlagID.none
    }
  }

  static createResampledLine(baseLine: VectorStroke, samplingDivisionCount: int): VectorStroke {

    const result = new VectorStroke()

    const startIndex = 0
    const endIndex = baseLine.points.length - 1
    const samplingUnitLength = baseLine.totalLength / samplingDivisionCount

    Logic_Edit_Points.resamplePoints(
      result.points
      , baseLine.points
      , startIndex
      , endIndex
      , samplingUnitLength)

    Logic_Edit_Line.calculateParameters(result)

    return result
  }
}

export class Logic_Edit_VectorLayer {

  static clearGeometryModifyFlags(geometry: VectorGeometry) {

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        this.clearGroupModifyFlags(group)
      }
    }
  }

  static clearGroupModifyFlags(group: VectorStrokeGroup) {

    group.modifyFlag = VectorGroupModifyFlagID.none
    group.linePointModifyFlag = VectorGroupModifyFlagID.none

    for (const line of group.lines) {

      this.clearLineModifyFlags(line)
    }
  }

  static clearPointModifyFlags(points: VectorPoint[]) {

    for (const point of points) {

      point.modifyFlag = LinePointModifyFlagID.none
    }
  }

  static clearLineModifyFlags(line: VectorStroke) {

    line.modifyFlag = VectorLineModifyFlagID.none

    Logic_Edit_VectorLayer.clearPointModifyFlags(line.points)
  }

  static fillGeometryDeleteFlags(geometry: VectorGeometry, forceDelete: boolean) {

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        this.fillGroupDeleteFlags(group, forceDelete)
      }
    }
  }

  static fillGroupDeleteFlags(group: VectorStrokeGroup, forceDelete: boolean) {

    if (forceDelete) {

      group.modifyFlag = VectorGroupModifyFlagID.delete
    }

    let setDelete = false
    if (group.modifyFlag == VectorGroupModifyFlagID.delete) {
      setDelete = true
    }

    for (const line of group.lines) {

      this.fillLineDeleteFlags(line, setDelete)
    }
  }

  static fillLineDeleteFlags(line: VectorStroke, forceDelete: boolean) {

    if (forceDelete) {

      line.modifyFlag = VectorLineModifyFlagID.delete
    }

    let setDelete = false
    if (line.modifyFlag == VectorLineModifyFlagID.delete) {
      setDelete = true
    }

    if (setDelete) {

      for (const point of line.points) {

        point.modifyFlag = LinePointModifyFlagID.delete
      }
    }
  }
}
