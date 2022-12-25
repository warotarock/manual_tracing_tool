import { VectorPoint } from '../document-data'
import { float, int, Logic_Points, Maths, RectangleArea } from '../common-logics'

export class VectorPointLogic {

  static sampledLocation = vec3.fromValues(0.0, 0.0, 0.0)

  static getLineRadiusFromLineWidth(lineWidth: float) {

    return lineWidth / 2
  }

  static getPointRadius(point: VectorPoint) {

    return VectorPointLogic.getLineRadiusFromLineWidth(point.lineWidth)
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

      point2.curvature = Logic_Points.angleDistanceOfCorner(point1.location, point2.location, point3.location)
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

    if (samplingUnitLength <= 0) {
      throw new Error('ERROR 0000: Can\'t set sampling unit length as zero or minus')
    }

    const sampledLocationVec = this.sampledLocation

    const totalLength = VectorPointLogic.calculateSegmentTotalLength(points, startIndex, endIndex)

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
