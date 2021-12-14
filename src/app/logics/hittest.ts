import { float, int } from './conversion'
import { VectorGeometry, VectorPoint, VectorStroke, VectorStrokeGroup } from '../document_data'
import { Logic_Points } from './points'
import { Logic_Stroke } from './stroke'

export class HitTest_VectorLayer_Base {

  existsPointHitTest = false

  protected beforeHitTest() { // @virtual

  }

  protected afterHitTest() { // @virtual

  }

  protected beforeHitTestToLayer(_geometry: VectorGeometry) { // @virtual

  }

  protected afterHitTestToLayer(_geometry: VectorGeometry) { // @virtual

  }

  protected beforeHitTestToGroup(_geometry: VectorGeometry, _group: VectorStrokeGroup) { // @virtual

  }

  protected afterHitTestToGroup(_geometry: VectorGeometry, _group: VectorStrokeGroup) { // @virtual

  }

  protected beforeHitTestToLine(_group: VectorStrokeGroup, _line: VectorStroke) { // @virtual

  }

  protected afterHitTestToLine(_group: VectorStrokeGroup, _line: VectorStroke) { // @virtual

  }

  protected onPointHited(_group: VectorStrokeGroup, _line: VectorStroke, _point: VectorPoint) { // @virtual

  }

  protected onLineSegmentHited(_group: VectorStrokeGroup, _line: VectorStroke, _point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @virtual

  }

  protected onLineSegmentNotHited(_line: VectorStroke, _point1: VectorPoint, _point2: VectorPoint) { // @virtual

  }

  protected onLineHited(_line: VectorStroke) { // @virtual

  }

  protected onLineNotHited(_line: VectorStroke) { // @virtual

  }
}

export interface IHitTest_VectorLayerLinePoint {

  startProcess()
  processGeometry(geometry: VectorGeometry, location: Vec3, minDistance: float)
  endProcess()
}

export class HitTest_LinePointBase extends HitTest_VectorLayer_Base implements IHitTest_VectorLayerLinePoint {

  processGeometry(geometry: VectorGeometry, location: Vec3, minDistance: float) {

    this.hitTest(geometry, location, minDistance)
  }

  startProcess() {

    this.existsPointHitTest = false

    this.beforeHitTest()
  }

  endProcess() {

    this.afterHitTest()
  }

  protected hitTest(geometry: VectorGeometry, location: Vec3, minDistance: float) {

    this.beforeHitTestToLayer(geometry)

    const minDistanceSQ = Math.pow(minDistance, 2)

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        this.beforeHitTestToGroup(geometry, group)

        for (const line of group.lines) {

          this.beforeHitTestToLine(group, line)

          let lineHited = false

          if (this.hitTest_LineRectangle(line, location, minDistance)) {

            lineHited = this.processHitTestToLine(group, line, location, minDistanceSQ)
          }

          if (lineHited) {

            this.onLineHited(line)
          }
          else {

            this.onLineNotHited(line)
          }

          this.afterHitTestToLine(group, line)
        }

        this.afterHitTestToGroup(geometry, group)
      }
    }

    this.afterHitTestToLayer(geometry)
  }

  protected hitTest_LineRectangle(line: VectorStroke, location: Vec3, minDistance: float): boolean {

    return Logic_Stroke.hitTestLocationToStrokeByRectangle(location, line, minDistance)
  }

  protected processHitTestToLine(_group: VectorStrokeGroup, _line: VectorStroke, _location: Vec3, _minDistance: float): boolean { // @virtual

    return false
  }
}

export class HitTest_LinePoint_PointToPointByDistance extends HitTest_LinePointBase {

  protected processHitTestToLine(group: VectorStrokeGroup, line: VectorStroke, location: Vec3, minDistance: float): boolean { // @override

    this.existsPointHitTest = false

    for (let i = 0; i < line.points.length; i++) {

      const point = line.points[i]

      const distance2d = Math.pow(location[0] - point.location[0], 2) + Math.pow(location[1] - point.location[1], 2)

      if (distance2d < minDistance) {

        this.onPointHited(group, line, point)
      }

      if (this.existsPointHitTest) {
        break
      }
    }

    return this.existsPointHitTest
  }
}

export class HitTest_Line_PointToLineByDistance extends HitTest_LinePointBase {

  protected processHitTestToLine(group: VectorStrokeGroup, line: VectorStroke, location: Vec3, minDistanceSQ: float): boolean { // @override

    this.existsPointHitTest = false

    let lineHited = false

    for (let i = 0; i + 1 < line.points.length; i++) {

      const point1 = line.points[i]
      const point2 = line.points[i + 1]

      const distanceSQ = Logic_Points.pointToLineSegmentDistanceSQ(
        point1.location,
        point2.location,
        location[0], location[1]
      )

      if (distanceSQ < minDistanceSQ) {

        this.onLineSegmentHited(group, line, point1, point2, location, minDistanceSQ, distanceSQ)
        lineHited = true
      }
      else {

        this.onLineSegmentNotHited(line, point1, point2)
      }

      if (this.existsPointHitTest) {
        break
      }
    }

    return lineHited
  }
}

export class HitTest_Line_PointToLineByDistanceSingle extends HitTest_Line_PointToLineByDistance {

  hitedLine: VectorStroke = null
  hitedGroup: VectorStrokeGroup = null

  protected beforeHitTest() { // @override

    this.hitedLine = null
    this.hitedGroup = null
  }

  protected onLineSegmentHited(group: VectorStrokeGroup, line: VectorStroke, _point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @override

    this.hitedLine = line
    this.hitedGroup = group

    this.existsPointHitTest = true
  }
}

export class HitTest_Line_PointToLineByDistanceNearest extends HitTest_Line_PointToLineByDistance {

  minDistanceSQ: float = -1
  hitedLine: VectorStroke = null
  hitedGroup: VectorStrokeGroup = null

  protected beforeHitTest() { // @override

    this.minDistanceSQ = -1
    this.hitedLine = null
    this.hitedGroup = null
  }

  protected onLineSegmentHited(group: VectorStrokeGroup, line: VectorStroke, _point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, distanceSQ: float) { // @override

    if (this.minDistanceSQ == -1 || distanceSQ < this.minDistanceSQ) {

      this.minDistanceSQ = distanceSQ
      this.hitedLine = line
      this.hitedGroup = group
    }
  }
}

export class HitTest_Line_IsCloseToMouse extends HitTest_Line_PointToLineByDistance {

  isChanged = false

  protected beforeHitTest() { // @override

    this.isChanged = false
  }

  protected onLineSegmentHited(_group: VectorStrokeGroup, _line: VectorStroke, _point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @override

    // to stop hit test early
    this.existsPointHitTest = true
  }

  protected onLineHited(line: VectorStroke) { // @override

    if (!line.isCloseToMouse) {

      this.isChanged = true
    }

    line.isCloseToMouse = true
  }

  protected onLineNotHited(line: VectorStroke) { // @override

    if (line.isCloseToMouse) {

      this.isChanged = true
    }

    line.isCloseToMouse = false
  }
}
