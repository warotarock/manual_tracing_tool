import { VectorStroke } from '../document_data'
import { float, int } from './conversion'
import { Logic_Points } from './points'

export class Logic_Stroke {

  public static MaxDistance = 999999.0
  public static InvalidDistance = -1.0
  public static InvalidIndex = -1

  public static getNearestSegmentIndex(stroke: VectorStroke, location: Vec3): int {

    let minDistance = Logic_Stroke.MaxDistance
    let nearestSegmentIndex = Logic_Stroke.InvalidIndex

    for (let i = 0; i < stroke.points.length - 1; i++) {

      const editPoint1 = stroke.points[i]
      const editPoint2 = stroke.points[i + 1]

      const distance = Logic_Points.pointToLineSegment_SorroundingDistance(
        editPoint1.location,
        editPoint2.location,
        location
      )

      if (distance < minDistance) {

        minDistance = distance
        nearestSegmentIndex = i
      }
    }

    return nearestSegmentIndex
  }

  public static hitTestLocationToStrokeByRectangle(location: Vec3, stroke: VectorStroke, minDistance: float): boolean {

    return (
      location[0] >= stroke.left - minDistance
      && location[0] <= stroke.right + minDistance
      && location[1] >= stroke.top - minDistance
      && location[1] <= stroke.bottom + minDistance
    )
  }

  public static hitTestStrokeToStrokeByRectangle(stroke1: VectorStroke, stroke2: VectorStroke, minDistance: float): boolean {

    const centerX1 = (stroke1.left + stroke1.right) / 2.0
    const centerY1 = (stroke1.top + stroke1.bottom) / 2.0

    const centerX2 = (stroke2.left + stroke2.right) / 2.0
    const centerY2 = (stroke2.top + stroke2.bottom) / 2.0

    const widthHalf = (stroke1.right - stroke1.left) / 2.0 + (stroke2.right - stroke2.left) / 2.0 + minDistance
    const heightHalf = (stroke1.bottom - stroke1.top) / 2.0 + (stroke2.bottom - stroke2.top) / 2.0 + minDistance

    return (
      centerX2 >= centerX1 - widthHalf
      && centerX2 <= centerX1 + widthHalf
      && centerY2 >= centerY1 - heightHalf
      && centerY2 <= centerY1 + heightHalf
    )
  }
}
