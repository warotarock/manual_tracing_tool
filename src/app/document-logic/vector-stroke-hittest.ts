import { float, int, Logic_Points, Maths } from '../common-logics'
import { VectorPoint, VectorStroke } from '../document-data'

export class StrokeSearchResult {

  distance: float = 0.0
  compareDistance: float = 0.0
  nearestSegmentIndex: int = 0
  nearestSegmentPoint: VectorPoint = null
  isCrossing = false
  crossingLocation = vec3.fromValues(0.0, 0.0, 0.0)

  clear() {

    this.distance = VectorStrokeHitTestLogic.MaxDistance
    this.compareDistance = VectorStrokeHitTestLogic.MaxDistance
    this.nearestSegmentIndex = VectorStrokeHitTestLogic.InvalidIndex
    this.nearestSegmentPoint = null
    this.isCrossing = false
    vec3.set(this.crossingLocation, 0.0, 0.0, 0.0)
  }
}

export class VectorStrokeHitTestLogic {

  static MaxDistance = 999999.0
  static InvalidDistance = -1.0
  static InvalidIndex = -1
  private static tempCrossingLocation = vec3.create()

  static getNearestSegmentIndex(stroke: VectorStroke, location: Vec3): int {

    let minDistance = VectorStrokeHitTestLogic.MaxDistance
    let nearestSegmentIndex = VectorStrokeHitTestLogic.InvalidIndex

    for (let i = 0; i < stroke.points.length - 1; i++) {

      const target_FromPoint = stroke.points[i]
      const target_ToPoint = stroke.points[i + 1]

      const distance = Logic_Points.pointToLineSegment_SorroundingDistance(
        target_FromPoint.location,
        target_ToPoint.location,
        location
      )

      if (distance < minDistance) {

        minDistance = distance
        nearestSegmentIndex = i
      }
    }

    return nearestSegmentIndex
  }

  static searchSegmentToSegmentNearestIndex(result: StrokeSearchResult, segmentFrom: Vec3, segmentTo: Vec3, stroke: VectorStroke) {

    result.clear()

    for (let i = 0; i <= stroke.points.length - 2; i++) {

      const target_FromPoint = stroke.points[i]
      const target_ToPoint = stroke.points[i + 1]

      const isCrossing = Logic_Points.lineSegmentToLineSegment_CrossPoint(
        result.crossingLocation,
        segmentFrom,
        segmentTo,
        target_FromPoint.location,
        target_ToPoint.location
      )

      if (isCrossing) {

        result.distance = 0.0
        result.nearestSegmentIndex = i
        result.nearestSegmentPoint = null
        result.isCrossing = true
        break
      }

      const isHead = (i == 0)
      const isTail = (i == stroke.points.length - 2)

      if (!isHead && !isTail) {
        continue
      }

      const compareDistance = vec3.distance(segmentFrom, target_FromPoint.location) + vec3.distance(segmentTo, target_FromPoint.location)

      if (compareDistance >= result.compareDistance) {
        continue
      }

      let distance = VectorStrokeHitTestLogic.MaxDistance

      if (isHead) {

        const point_Distance = Logic_Points.pointToLineSegment_SorroundingDistance(
          segmentFrom,
          segmentTo,
          target_FromPoint.location
        )

        if (point_Distance < distance) {

          distance = point_Distance
          result.nearestSegmentPoint = target_FromPoint
        }
      }

      if (isTail) {

        const point_Distance = Logic_Points.pointToLineSegment_SorroundingDistance(
          segmentFrom,
          segmentTo,
          target_ToPoint.location
        )

        if (point_Distance < distance) {

          distance = point_Distance
          result.nearestSegmentPoint = target_ToPoint
        }
      }

      result.distance = distance
      result.compareDistance = compareDistance
      result.nearestSegmentIndex = i
    }
  }

  static hitTestLocationToStrokeByRectangle(location: Vec3, stroke: VectorStroke, minDistance: float): boolean {

    return stroke.runtime.area.hittestLocationWithRadius(location, minDistance)
  }

  static hitTestLineSegmentToStrokeByRectangle(segmentFrom: Vec3, segmentTo: Vec3, stroke: VectorStroke, minDistance: float): boolean {

    const surroundLeft = stroke.runtime.area.left - minDistance
    const surroundTop = stroke.runtime.area.top - minDistance
    const surroundRight = stroke.runtime.area.right + minDistance
    const surroundBottom = stroke.runtime.area.bottom + minDistance

    if (VectorStrokeHitTestLogic.hitTestLocationToStrokeByRectangle(segmentFrom, stroke, minDistance)) {
      return true
    }

    if (VectorStrokeHitTestLogic.hitTestLocationToStrokeByRectangle(segmentTo, stroke, minDistance)) {
      return true
    }

    if (Maths.lineToLine_CrossPoint(
      this.tempCrossingLocation,
      segmentFrom[0],
      segmentFrom[1],
      segmentTo[0],
      segmentTo[1],
      surroundLeft,
      surroundTop,
      surroundRight,
      surroundTop
    )) {
      return true
    }

    if (Maths.lineToLine_CrossPoint(
      this.tempCrossingLocation,
      segmentFrom[0],
      segmentFrom[1],
      segmentTo[0],
      segmentTo[1],
      surroundRight,
      surroundTop,
      surroundRight,
      surroundBottom
    )) {
      return true
    }

    if (Maths.lineToLine_CrossPoint(
      this.tempCrossingLocation,
      segmentFrom[0],
      segmentFrom[1],
      segmentTo[0],
      segmentTo[1],
      surroundRight,
      surroundBottom,
      surroundLeft,
      surroundBottom
    )) {
      return true
    }

    if (Maths.lineToLine_CrossPoint(
      this.tempCrossingLocation,
      segmentFrom[0],
      segmentFrom[1],
      segmentTo[0],
      segmentTo[1],
      surroundLeft,
      surroundBottom,
      surroundLeft,
      surroundTop
    )) {
      return true
    }

    return false
  }

  static hitTestStrokeToStrokeByRectangle(stroke1: VectorStroke, stroke2: VectorStroke, minDistance: float): boolean {

    const centerX1 = stroke1.runtime.area.getMedianHrizontalPosition()
    const centerY1 = stroke1.runtime.area.getMedianVerticalPosition()

    const centerX2 = stroke2.runtime.area.getMedianHrizontalPosition()
    const centerY2 = stroke2.runtime.area.getMedianVerticalPosition()

    const widthHalf = (stroke1.runtime.area.getWidth() + stroke2.runtime.area.getWidth()) / 2.0 + minDistance
    const heightHalf = (stroke1.runtime.area.getHeight() + stroke2.runtime.area.getHeight()) / 2.0 + minDistance

    return (
      centerX2 >= centerX1 - widthHalf
      && centerX2 <= centerX1 + widthHalf
      && centerY2 >= centerY1 - heightHalf
      && centerY2 <= centerY1 + heightHalf
    )
  }
}
