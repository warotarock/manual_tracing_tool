﻿import { float } from './conversion'
import { Maths } from './math'

export class Logic_Points {

  // 2 points angle calculation
  static angle(fromPoint: Vec3, ToPoint: Vec3): float {

    const vx = ToPoint[0] - fromPoint[0]
    const vy = ToPoint[1] - fromPoint[1]

    const angle = Math.atan2(vy, vx)

    return angle
  }

  // 3 points angle calculation
  static angleOfCorner(firstPoint: Vec3, centerPoint: Vec3, lastPoint: Vec3): float {

    const ax = lastPoint[0] - centerPoint[0]
    const ay = lastPoint[1] - centerPoint[1]
    const bx = firstPoint[0] - centerPoint[0]
    const by = firstPoint[1] - centerPoint[1]

    const angle = Math.atan2(ax * by - bx * ay, ax * bx + ay * by)

    return angle
  }

  // returns true if angle of 3 points is clocwise
  static isClockwise(firstPoint: Vec3, centerPoint: Vec3, lastPoint: Vec3): boolean {

    const ax = lastPoint[0] - centerPoint[0]
    const ay = lastPoint[1] - centerPoint[1]
    const bx = firstPoint[0] - centerPoint[0]
    const by = firstPoint[1] - centerPoint[1]

    const crossProduct = ax * by - ay * bx

    return (crossProduct > 0)
  }

  // Point to line segment: distance calculation
  static pointToLineSegmentDistanceSQ(point1: Vec3, point2: Vec3, x: float, y: float): float {

    return Maths.pointToLineSegment_Distance(
      x,
      y,
      point1[0],
      point1[1],
      point2[0],
      point2[1])
  }

  static pointToLineSegment_SorroundingDistance(point1: Vec3, point2: Vec3, targetPoint: Vec3): float {

    const distanceSQ = this.pointToLineSegmentDistanceSQ(point1, point2, targetPoint[0], targetPoint[1])

    return Math.sqrt(distanceSQ)
  }

  // Point to line segment: if targetPoint is before point1, return value is < 0.0, if targetPoint is agter point2, retuen value is > 1.0
  static pointToLineSegment_NormalizedPosition(point1: Vec3, point2: Vec3, targetPoint: Vec3): float {

    return Maths.pointToLine_NearestPointNormalizedPosition(
      targetPoint[0],
      targetPoint[1],
      point1[0],
      point1[1],
      point2[0],
      point2[1])
  }

  // Point to endless line: distance calculation
  static pointToLine_Distance(targetPoint: Vec3, point1: Vec3, point2: Vec3): float {

    return Maths.pointToLine_Distance(
      targetPoint[0],
      targetPoint[1],
      point1[0],
      point1[1],
      point2[0],
      point2[1])
  }

  // Point to endless line: nearest location calculation
  static pointToLine_NearestLocation(result: Vec3, linePoint1: Vec3, linePoint2: Vec3, targetPoint: Vec3): boolean {

    return Maths.pointToLine_NearestPoint(
      result,
      targetPoint[0],
      targetPoint[1],
      linePoint1[0],
      linePoint1[1],
      linePoint2[0],
      linePoint2[1]) != null
  }

  static lineToLine_CrossPoint(result: Vec3, L1: Vec3, L2: Vec3, L3: Vec3, L4: Vec3): boolean {

    return Maths.lineToLine_CrossPoint(
      result,
      L1[0],
      L1[1],
      L2[0],
      L2[1],
      L3[0],
      L3[1],
      L4[0],
      L4[1]
    )
  }
}
