import { float, Logic_Points } from '../common-logics'
import { VectorLayer, VectorLayerGeometry, VectorPoint, VectorStroke, VectorStrokeDrawingUnit, VectorStrokeGroup } from '../document-data'
import { VectorStrokeHitTestLogic } from './vector-stroke-hittest'

export interface IHitTest_VectorLayer {

  startProcess()
  processGeometry(layer: VectorLayer, geometry: VectorLayerGeometry, location: Vec3, minDistance: float)
  endProcess()
}

export class HitTest_VectorPointBase implements IHitTest_VectorLayer {

  existsPointHitTest = false
  currentLayer: VectorLayer | null = null
  currentGeometry: VectorLayerGeometry | null = null
  currentDrawingUnit: VectorStrokeDrawingUnit | null = null
  currentStrokeGroup: VectorStrokeGroup | null = null
  currentStroke: VectorStroke | null = null

  startProcess() {

    this.existsPointHitTest = false

    this.beforeHitTest()
  }

  processGeometry(layer: VectorLayer, geometry: VectorLayerGeometry, location: Vec3, minDistance: float) {

    this.hitTest(geometry, location, minDistance, layer)
  }

  endProcess() {

    this.afterHitTest()
  }

  protected hitTest(geometry: VectorLayerGeometry, location: Vec3, minDistance: float, layer: VectorLayer) {

    this.beforeHitTestToLayer(geometry)

    const minDistanceSQ = Math.pow(minDistance, 2)

    this.currentLayer = layer
    this.currentGeometry = geometry

    for (const unit of geometry.units) {

      this.currentDrawingUnit = unit

      for (const group of unit.groups) {

        this.currentStrokeGroup = group

        this.beforeHitTestToGroup()

        for (const stroke of group.lines) {

          this.currentStroke = stroke

          this.beforeHitTestToLine()

          let lineHited = false

          if (this.hitTestStrokeByRectangle(stroke, location, minDistance)) {

            lineHited = this.processHitTestToStroke(location, minDistanceSQ)
          }

          if (lineHited) {

            this.onLineHited()
          }
          else {

            this.onLineNotHited()
          }

          this.afterHitTestToLine()
        }

        this.currentStroke = null

        this.afterHitTestToGroup()
      }

      this.currentStrokeGroup = null
    }

    this.currentDrawingUnit = null

    this.afterHitTestToLayer(geometry)

    this.currentGeometry = null
    this.currentLayer = null
  }

  protected hitTestStrokeByRectangle(line: VectorStroke, location: Vec3, minDistance: float): boolean {

    return VectorStrokeHitTestLogic.hitTestLocationToStrokeByRectangle(location, line, minDistance)
  }

  protected processHitTestToStroke(_location: Vec3, _minDistanceSQ: float): boolean { // @virtual

    return false
  }

  protected beforeHitTest() { // @virtual
  }

  protected afterHitTest() { // @virtual
  }

  protected beforeHitTestToLayer(_geometry: VectorLayerGeometry) { // @virtual
  }

  protected afterHitTestToLayer(_geometry: VectorLayerGeometry) { // @virtual
  }

  protected beforeHitTestToGroup() { // @virtual
  }

  protected afterHitTestToGroup() { // @virtual
  }

  protected beforeHitTestToLine() { // @virtual
  }

  protected afterHitTestToLine() { // @virtual
  }

  protected onPointHited(_point: VectorPoint) { // @virtual
  }

  protected onPointNotHited(_point: VectorPoint) { // @virtual
  }

  protected onLineSegmentHited(_point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @virtual
  }

  protected onLineSegmentNotHited(_point1: VectorPoint, _point2: VectorPoint) { // @virtual
  }

  protected onLineHited() { // @virtual
  }

  protected onLineNotHited() { // @virtual
  }
}

export class HitTest_VectorPoint_PointToPoint extends HitTest_VectorPointBase {

  protected processHitTestToStroke(location: Vec3, minDistanceSQ: float): boolean { // @override

    this.existsPointHitTest = false

    for (const point of this.currentStroke.points) {

      const distance2d = Math.pow(location[0] - point.location[0], 2) + Math.pow(location[1] - point.location[1], 2)

      if (distance2d < minDistanceSQ) {

        this.onPointHited(point)
      }
      else {

        this.onPointNotHited(point)
      }

      if (this.existsPointHitTest) {
        break
      }
    }

    return this.existsPointHitTest
  }
}

export class HitTest_VectorStroke_PointToStroke extends HitTest_VectorPointBase {

  protected processHitTestToStroke(location: Vec3, minDistanceSQ: float): boolean { // @override

    this.existsPointHitTest = false

    let lineHited = false

    for (let i = 0; i + 1 < this.currentStroke.points.length; i++) {

      const point1 = this.currentStroke.points[i]
      const point2 = this.currentStroke.points[i + 1]

      const distanceSQ = Logic_Points.pointToLineSegment_SorroundingDistanceSQ(
        point1.location,
        point2.location,
        location
      )

      if (distanceSQ < minDistanceSQ) {

        this.onLineSegmentHited(point1, point2, location, minDistanceSQ, distanceSQ)
        lineHited = true
      }
      else {

        this.onLineSegmentNotHited(point1, point2)
      }

      if (this.existsPointHitTest) {
        break
      }
    }

    return lineHited
  }
}

export class HitTest_VectorStroke_PointToStroke_Nearest extends HitTest_VectorStroke_PointToStroke {

  minDistanceSQ: float = -1
  hitedGeometry: VectorLayerGeometry = null
  hitedGroup: VectorStrokeGroup = null
  hitedStoke: VectorStroke = null

  protected beforeHitTest() { // @override

    this.minDistanceSQ = -1
    this.hitedGeometry = null
    this.hitedGroup = null
    this.hitedStoke = null
  }

  protected onLineSegmentHited(_point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, distanceSQ: float) { // @override

    if (this.minDistanceSQ == -1 || distanceSQ < this.minDistanceSQ) {

      this.minDistanceSQ = distanceSQ
      this.hitedGeometry = this.currentGeometry
      this.hitedGroup = this.currentStrokeGroup
      this.hitedStoke = this.currentStroke
    }
  }
}

export class HitTest_VectorStroke_IsCloseToMouse extends HitTest_VectorStroke_PointToStroke {

  isChanged = false

  protected beforeHitTest() { // @override

    this.isChanged = false
  }

  protected onLineSegmentHited(_point1: VectorPoint, _point2: VectorPoint, _location: Vec3, _minDistanceSQ: float, _distanceSQ: float) { // @override

    // to stop hit test early
    this.existsPointHitTest = true
  }

  protected onLineHited() { // @override

    if (!this.currentStroke.runtime.isCloseToMouse) {

      this.isChanged = true
    }

    this.currentStroke.runtime.isCloseToMouse = true
  }

  protected onLineNotHited() { // @override

    if (this.currentStroke.runtime.isCloseToMouse) {

      this.isChanged = true
    }

    this.currentStroke.runtime.isCloseToMouse = false
  }
}
