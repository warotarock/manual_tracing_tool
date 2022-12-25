import { float, int } from "../common-logics"
import { VectorPoint, VectorStrokeGroup } from "../document-data"
import { WebGLRender } from "../render"

export class GPULinePoint {

  location: Vec3 = vec3.fromValues(0.0, 0.0, 0.0)
  width = 1.0
  alpha = 1.0
  isEndPoint = false

  direction = vec3.fromValues(0.0, 0.0, 0.0)
  controlPointCF = vec3.fromValues(0.0, 0.0, 0.0) // 正方向への制御点の位置
  controlPointCB = vec3.fromValues(0.0, 0.0, 0.0) // 逆方向への制御点の位置

  edgePointL = vec3.fromValues(0.0, 0.0, 0.0)     // 点の左側の頂点の位置
  controlPointLF = vec3.fromValues(0.0, 0.0, 0.0) // 左側の頂点から正方向への制御点の位置
  controlPointLB = vec3.fromValues(0.0, 0.0, 0.0) // 左側の頂点から負方向への制御点の位置

  edgePointR = vec3.fromValues(0.0, 0.0, 0.0)     // 点の右側の頂点の位置
  controlPointRF = vec3.fromValues(0.0, 0.0, 0.0) // 右側の頂点から正方向への制御点の位置
  controlPointRB = vec3.fromValues(0.0, 0.0, 0.0) // 右側の頂点から負方向への制御点の位置

  controlPointVertexLF = vec3.fromValues(0.0, 0.0, 0.0) // 曲線を囲むように配置したポリゴンの頂点座標
  controlPointVertexLB = vec3.fromValues(0.0, 0.0, 0.0)
  controlPointVertexRF = vec3.fromValues(0.0, 0.0, 0.0)
  controlPointVertexRB = vec3.fromValues(0.0, 0.0, 0.0)

  pointMat = mat4.create()
  invMat = mat4.create()

  copyFrom(linePoint: VectorPoint, lineWidthBiasRate: float, useAdjustingLocation: boolean) {

    if (useAdjustingLocation) {

      this.location[0] = linePoint.adjustingLocation[0]
      this.location[1] = linePoint.adjustingLocation[1]
      this.width = linePoint.adjustingLineWidth * lineWidthBiasRate
      this.alpha = 1.0
    }
    else {

      this.location[0] = linePoint.location[0]
      this.location[1] = linePoint.location[1]
      this.width = linePoint.lineWidth * lineWidthBiasRate
      this.alpha = 1.0
    }

    this.isEndPoint = false
  }
}

export class GPULine {

  points: GPULinePoint[] = []
}

export class GPUVertexBuffer {

  pointCount = 0
  recyclePoints: GPULinePoint[] = []

  lines: GPULine[] = []

  dataArray: Float32Array = null
  usedDataArraySize = 0

  bufferSize = 0
  buffer: WebGLBuffer = null
  isStored = false
}

export class Logic_GPULine {

  // 省略しているアルファベットの意味
  //   F: Forward, B: Backward, L: Left, R: Right, C: Center

  // cur 対象となる点を指定する
  //     1: Fromの点、2: Toの点
  // loc その点の持つ座標値のどれを使用するか指定
  //     1: location
  //     2: edgePointL, 3: controlPointVertexLF, 4: controlPointVertexLB
  //     5: edgePointR, 6: controlPointVertexRF, 7: controlPointVertexRB
  solidLinePolygonMap = [
    { cur: 1, loc: 2 }, { cur: 2, loc: 2 }, { cur: 1, loc: 5 },
    { cur: 1, loc: 5 }, { cur: 2, loc: 2 }, { cur: 2, loc: 5 },
  ]

  // lr 左右どちらののポリゴンであるかを指定する
  //    1: 左、2: 右
  bezierPolygonMap = [
    //{ lr: 1, cur: 1, loc: 3 }, { lr: 1, cur: 2, loc: 2 }, { lr: 1, cur: 2, loc: 5 },

    //{ lr: 1, cur: 1, loc: 1 }, { lr: 1, cur: 2, loc: 2 }, { lr: 1, cur: 2, loc: 5 },
    //{ lr: 1, cur: 2, loc: 5 }, { lr: 1, cur: 1, loc: 5 }, { lr: 1, cur: 1, loc: 1 },

    // 左側
    { lr: 1, cur: 1, loc: 1 }, { lr: 1, cur: 1, loc: 2 }, { lr: 1, cur: 1, loc: 3 },
    { lr: 1, cur: 1, loc: 3 }, { lr: 1, cur: 2, loc: 4 }, { lr: 1, cur: 1, loc: 1 },
    { lr: 1, cur: 1, loc: 1 }, { lr: 1, cur: 2, loc: 4 }, { lr: 1, cur: 2, loc: 1 },
    { lr: 1, cur: 2, loc: 1 }, { lr: 1, cur: 2, loc: 4 }, { lr: 1, cur: 2, loc: 2 },
    // 右側
    { lr: 2, cur: 1, loc: 5 }, { lr: 2, cur: 1, loc: 1 }, { lr: 2, cur: 1, loc: 6 },
    { lr: 2, cur: 1, loc: 6 }, { lr: 2, cur: 1, loc: 1 }, { lr: 2, cur: 2, loc: 7 },
    { lr: 2, cur: 2, loc: 7 }, { lr: 2, cur: 1, loc: 1 }, { lr: 2, cur: 2, loc: 1 },
    { lr: 2, cur: 2, loc: 1 }, { lr: 2, cur: 2, loc: 5 }, { lr: 2, cur: 2, loc: 7 },
  ]

  vec = vec3.create()
  scale = vec3.create()
  direction = vec3.create()
  controlPointVec = vec3.create()
  normal = vec3.create()
  invMat = mat4.create()
  tempMat = mat4.create()
  calculateSegmentMat_Direction = vec3.create()

  relativeVecA = vec3.create()
  relativeVecB = vec3.create()
  relativeVecC = vec3.create()
  relativeVecD = vec3.create()
  relativeEdgePointVecA = vec3.create()
  relativeEdgePointVecB = vec3.create()
  relativeVecCenterFrom = vec3.create()
  relativeVecCenterTo = vec3.create()
  relativeVecEdgeFrom = vec3.create()
  relativeVecEdgeTo = vec3.create()

  minimumSegmentDistance = 0.001

  copyGroupPointDataToBuffer(group: VectorStrokeGroup, lineWidthBiasRate: float, useAdjustingLocation: boolean) {

    const vertexBuffer = group.runtime.buffer

    let pointCount = 0

    vertexBuffer.lines = []

    for (const line of group.lines) {

      const gpuLine = new GPULine()

      let lastLinePoint: VectorPoint = null

      for (const linePoint of line.points) {

        let gpuPoint: GPULinePoint

        if (lastLinePoint != null
          && vec3.distance(lastLinePoint.location, linePoint.location) < this.minimumSegmentDistance) {
          continue
        }

        if (pointCount < vertexBuffer.recyclePoints.length) {

          // 頂点データを再利用する
          gpuPoint = vertexBuffer.recyclePoints[pointCount]
        }
        else {

          gpuPoint = new GPULinePoint()
          vertexBuffer.recyclePoints.push(gpuPoint)
        }

        gpuPoint.copyFrom(linePoint, lineWidthBiasRate, useAdjustingLocation)

        gpuLine.points.push(gpuPoint)

        pointCount++

        lastLinePoint = linePoint
      }

      if (gpuLine.points.length < 2) {
        continue
      }

      vertexBuffer.lines.push(gpuLine)
    }

    vertexBuffer.pointCount = pointCount
  }

  allocateBuffer(vertexBuffer: GPUVertexBuffer, vertexCount: int, vertexUnitSize: int, render: WebGLRender) {

    const bufferSize = vertexCount * vertexUnitSize

    if (vertexBuffer.buffer == null) {

      vertexBuffer.buffer = render.createBuffer()
      vertexBuffer.dataArray = new Float32Array(bufferSize)
    }
    else if (bufferSize > vertexBuffer.bufferSize) {

      vertexBuffer.dataArray = new Float32Array(bufferSize)
    }

    vertexBuffer.bufferSize = bufferSize
  }

  // 1. エッジの位置の計算
  calculateLinePointEdges(vertexBuffer: GPUVertexBuffer) {

    const direction = this.direction
    const normal = this.normal

    // 点の左右の頂点位置を計算
    for (const line of vertexBuffer.lines) {

      const gpuPoints = line.points

      for (let index = 0; index < gpuPoints.length; index++) {

        const gpuPoint = gpuPoints[index]

        let gpuPointPrev: GPULinePoint
        let gpuPointNext: GPULinePoint
        let width: float

        if (index == 0) {

          // 最初の点は最初の点から次の点へのベクトルから計算
          gpuPointPrev = gpuPoints[index]
          gpuPointNext = gpuPoints[index + 1]
          width = gpuPointPrev.width
        }
        else if (index == gpuPoints.length - 1) {

          // 最後の点は前の点から最後の点へのベクトルから計算
          gpuPointPrev = gpuPoints[index - 1]
          gpuPointNext = gpuPoints[index]
          width = gpuPointNext.width

          // 最後の点にはフラグを設定
          gpuPoint.isEndPoint = true
        }
        else {

          // 中間の点は前の点から次の点へのベクトルから計算
          gpuPointPrev = gpuPoints[index - 1]
          gpuPointNext = gpuPoints[index + 1]
          width = gpuPoint.width
        }

        vec3.subtract(gpuPoint.direction, gpuPointNext.location, gpuPointPrev.location)
        vec3.normalize(gpuPoint.direction, gpuPoint.direction)

        vec3.set(normal, gpuPoint.direction[1], -gpuPoint.direction[0], 0.0) // 法線ベクトル
        vec3.scale(normal, normal, width * 0.5)

        vec3.subtract(gpuPoint.edgePointL, gpuPoint.location, normal)
        vec3.add(gpuPoint.edgePointR, gpuPoint.location, normal)
      }

      if (gpuPoints.length >= 2) {

        {
          const point = gpuPoints[0]
          const pointTo = gpuPoints[1]

          vec3.subtract(direction, pointTo.location, point.location)
          vec3.scale(direction, direction, 0.33)

          vec3.add(point.controlPointCF, point.location, direction)
          vec3.add(point.controlPointLF, point.edgePointL, direction)
          vec3.add(point.controlPointRF, point.edgePointR, direction)
        }

        {
          const point = gpuPoints[gpuPoints.length - 1]
          const pointTo = gpuPoints[gpuPoints.length - 2]

          vec3.subtract(direction, pointTo.location, point.location)
          vec3.scale(direction, direction, 0.33)

          vec3.add(point.controlPointCB, point.location, direction)
          vec3.add(point.controlPointLB, point.edgePointL, direction)
          vec3.add(point.controlPointRB, point.edgePointR, direction)
        }
      }
    }
  }

  // 2. ベジエ曲線の制御点の位置の計算
  calculateLinePointBezierLocation(vertexBuffer: GPUVertexBuffer) {

    // 中間の点の制御点の位置を計算
    for (const line of vertexBuffer.lines) {

      const gpuPoints = line.points

      for (let index = 0; index < gpuPoints.length - 1; index++) {

        const linePoint = gpuPoints[index]

        if (index + 1 < gpuPoints.length) {

          const linePointNext = gpuPoints[index + 1]

          this.calculateSegmentMat(linePoint.pointMat, linePoint.location, linePointNext.location)
          mat4.invert(linePoint.invMat, linePoint.pointMat)
        }

        if (index - 1 >= 0 && index + 1 < gpuPoints.length) {

          const linePointPrev = gpuPoints[index - 1]
          const linePointNext = gpuPoints[index + 1]

          this.calculateControlPoint(
            linePoint.controlPointCF,
            linePoint.controlPointCB,
            linePoint.direction,
            linePoint.location,
            linePointPrev.location,
            linePointNext.location
          )

          this.calculateControlPoint(
            linePoint.controlPointLF,
            linePoint.controlPointLB,
            linePoint.direction,
            linePoint.edgePointL,
            linePointPrev.edgePointL,
            linePointNext.edgePointL
          )

          this.calculateControlPoint(
            linePoint.controlPointRF,
            linePoint.controlPointRB,
            linePoint.direction,
            linePoint.edgePointR,
            linePointPrev.edgePointR,
            linePointNext.edgePointR
          )
        }
      }

      // 最初の点の制御点の位置を計算
      if (gpuPoints.length > 2) {

        // １つ次の点の正方向の制御点と対称にする
        const linePoint = gpuPoints[0]
        const linePointNext = gpuPoints[1]

        this.calculateMirroredPoint(
          linePoint.controlPointCF,
          null,
          linePoint.location,
          linePoint.location,
          linePoint.width,
          linePointNext.location,
          linePointNext.location,
          linePointNext.controlPointCB,
          linePoint.pointMat,
          linePoint.invMat
        )

        this.calculateMirroredPoint(
          linePoint.controlPointLF,
          linePoint.edgePointL,
          linePoint.location,
          linePoint.edgePointL,
          linePoint.width,
          linePointNext.location,
          linePointNext.edgePointL,
          linePointNext.controlPointLB,
          linePoint.pointMat,
          linePoint.invMat
        )

        this.calculateMirroredPoint(
          linePoint.controlPointRF,
          linePoint.edgePointR,
          linePoint.location,
          linePoint.edgePointR,
          linePoint.width,
          linePointNext.location,
          linePointNext.edgePointR,
          linePointNext.controlPointRB,
          linePoint.pointMat,
          linePoint.invMat
        )
      }

      // 最後の点の制御点の位置を計算
      if (gpuPoints.length > 2) {

        // １つ前の点の負方向の制御点と対称にする
        const linePoint = gpuPoints[gpuPoints.length - 1]
        const linePointNext = gpuPoints[gpuPoints.length - 2]

        this.calculateMirroredPoint(
          linePoint.controlPointCB,
          null,
          linePoint.location,
          linePoint.location,
          linePoint.width,
          linePointNext.location,
          linePointNext.location,
          linePointNext.controlPointCF,
          linePointNext.pointMat,
          linePointNext.invMat
        )

        this.calculateMirroredPoint(
          linePoint.controlPointLB,
          linePoint.edgePointL,
          linePoint.location,
          linePoint.edgePointL,
          linePoint.width,
          linePointNext.location,
          linePointNext.edgePointL,
          linePointNext.controlPointLF,
          linePointNext.pointMat,
          linePointNext.invMat
        )

        this.calculateMirroredPoint(
          linePoint.controlPointRB,
          linePoint.edgePointR,
          linePoint.location,
          linePoint.edgePointR,
          linePoint.width,
          linePointNext.location,
          linePointNext.edgePointR,
          linePointNext.controlPointRF,
          linePointNext.pointMat,
          linePointNext.invMat
        )
      }
    }
  }

  calculateSegmentMat(result: Mat4, locationFrom: Vec3, locationTo: Vec3) {

    vec3.subtract(this.calculateSegmentMat_Direction, locationTo, locationFrom)
    vec3.normalize(this.calculateSegmentMat_Direction, this.calculateSegmentMat_Direction)
    mat4.identity(result)
    result[0] = this.calculateSegmentMat_Direction[0]
    result[1] = this.calculateSegmentMat_Direction[1]
    result[4] = -this.calculateSegmentMat_Direction[1]
    result[5] = this.calculateSegmentMat_Direction[0]
    result[10] = 1.0
    result[12] = locationFrom[0]
    result[13] = locationFrom[1]
  }

  calculateControlPoint(resultF: Vec3, resultB: Vec3, direction: Vec3, edgePointC: Vec3, edgePointB: Vec3, edgePointF: Vec3) {

    const distanceF = vec3.distance(edgePointF, edgePointC)
    vec3.scale(this.controlPointVec, direction, distanceF * 0.33)
    vec3.add(resultF, edgePointC, this.controlPointVec)

    const distanceB = vec3.distance(edgePointB, edgePointC)
    vec3.scale(this.controlPointVec, direction, -distanceB * 0.33)
    vec3.add(resultB, edgePointC, this.controlPointVec)
  }

  calculateMirroredPoint(resultControlPoint: Vec3, resultEdgePoint: Vec3
    , centerPointFrom: Vec3, edgePointfrom: Vec3, radiusFrom: float
    , centerPointTo: Vec3, edgePointTo: Vec3, controlPointTo: Vec3
    , pointMat: Mat4, invMat: Mat4) {

    if (resultEdgePoint != null) {

      vec3.transformMat4(this.relativeVecCenterTo, centerPointTo, invMat)
      vec3.transformMat4(this.relativeVecCenterFrom, centerPointFrom, invMat)

      vec3.transformMat4(this.relativeVecA, edgePointTo, invMat)

      vec3.subtract(this.relativeVecB, this.relativeVecA, this.relativeVecCenterTo)
      const length = vec3.length(this.relativeVecB)
      if (length > 0) {

        vec3.scale(this.relativeVecB, this.relativeVecB, radiusFrom / length)
      }
      else {

        vec3.set(this.relativeVecB, 0.0, 0.0, 0.0)
      }

      this.relativeVecB[0] = this.relativeVecB[0] * -1 + this.relativeVecCenterFrom[0]
      this.relativeVecB[1] = this.relativeVecB[1] + this.relativeVecCenterFrom[1]
      this.relativeVecB[2] = 0.0
      vec3.transformMat4(resultEdgePoint, this.relativeVecB, pointMat)
    }

    if (resultControlPoint != null) {

      vec3.transformMat4(this.relativeVecEdgeTo, edgePointTo, invMat)
      vec3.transformMat4(this.relativeVecEdgeFrom, edgePointfrom, invMat)

      vec3.transformMat4(this.relativeVecA, controlPointTo, invMat)
      this.relativeVecB[0] = (this.relativeVecA[0] - this.relativeVecEdgeTo[0]) * -1 + this.relativeVecEdgeFrom[0]
      this.relativeVecB[1] = (this.relativeVecA[1] - this.relativeVecEdgeTo[1]) + this.relativeVecEdgeFrom[1]
      this.relativeVecB[2] = 0.0
      vec3.transformMat4(resultControlPoint, this.relativeVecB, pointMat)
    }
  }

  // 3. ベジエ曲線を囲むポリゴンのうち制御点の頂点位置の計算
  calculateControlPointVertexLocations(vertexBuffer: GPUVertexBuffer) {

    for (const line of vertexBuffer.lines) {

      // 前方向への制御点の位置を計算
      for (let index = 0; index < line.points.length - 1; index++) {

        const linePoint = line.points[index]
        const linePointNext = line.points[index + 1]

        this.calculateControlPointVertexLocation(
          linePoint.controlPointVertexLF,
          linePoint.edgePointL,
          linePoint.controlPointLF,
          linePointNext.edgePointL,
          linePointNext.controlPointLB,
          1.0
        )

        this.calculateControlPointVertexLocation(
          linePoint.controlPointVertexRF,
          linePoint.edgePointR,
          linePoint.controlPointRF,
          linePointNext.edgePointR,
          linePointNext.controlPointRB,
          -1.0
        )
      }

      // 後方向への制御点の位置を計算
      for (let index = 1; index < line.points.length; index++) {

        const linePoint = line.points[index]
        const linePointPrev = line.points[index - 1]

        this.calculateControlPointVertexLocation(
          linePoint.controlPointVertexLB,
          linePoint.edgePointL,
          linePoint.controlPointLB,
          linePointPrev.edgePointL,
          linePointPrev.controlPointLF,
          -1.0
        )

        this.calculateControlPointVertexLocation(
          linePoint.controlPointVertexRB,
          linePoint.edgePointR,
          linePoint.controlPointRB,
          linePointPrev.edgePointR,
          linePointPrev.controlPointRF,
          1.0
        )
      }
    }
  }

  calculateControlPointVertexLocation(controlPointVertexLF: Vec3, edgePointFrom: Vec3, controlPointFrom: Vec3, edgePointTo: Vec3, controlPointTo: Vec3, flipY: float) {

    // セグメントの座標系
    this.calculateSegmentMat(this.tempMat, edgePointFrom, edgePointTo)
    mat4.invert(this.invMat, this.tempMat)

    // セグメント座標
    vec3.transformMat4(this.relativeEdgePointVecA, edgePointFrom, this.invMat)
    vec3.transformMat4(this.relativeVecA, controlPointFrom, this.invMat)

    vec3.transformMat4(this.relativeVecB, controlPointTo, this.invMat)
    if (this.relativeVecB[1] * flipY < 0.0) {
      vec3.transformMat4(this.relativeVecB, edgePointTo, this.invMat)
    }

    const tiltX = this.relativeVecB[0] - this.relativeEdgePointVecA[0]
    const tiltY = this.relativeVecB[1] - this.relativeEdgePointVecA[1]

    if (tiltX == 0.0) {
      return
    }

    const deltaX = this.relativeVecA[0] - this.relativeEdgePointVecA[0]
    const localY = (tiltY / tiltX) * deltaX + this.relativeEdgePointVecA[1]

    if (this.relativeVecA[1] * flipY < localY * flipY) {

      controlPointVertexLF[0] = this.relativeVecA[0]
      controlPointVertexLF[1] = localY
      controlPointVertexLF[2] = 0.0
      vec3.transformMat4(controlPointVertexLF, controlPointVertexLF, this.tempMat)
    }
    else {

      vec3.copy(controlPointVertexLF, controlPointFrom)
    }
  }

  calculateBufferData_PloyLine(vertexBuffer: GPUVertexBuffer) {

    const data = vertexBuffer.dataArray
    let offset = 0

    for (const line of vertexBuffer.lines) {

      for (let index = 0; index < line.points.length - 1; index++) {

        const linePoint = line.points[index]
        const linePointNext = line.points[index + 1]

        if (linePoint.isEndPoint) {
          continue
        }

        for (const map of this.solidLinePolygonMap) {

          let point: GPULinePoint
          if (map.cur == 1) {
            point = linePoint
          }
          else {
            point = linePointNext
          }

          let vec: Vec3
          if (map.loc == 1) {
            vec = point.location
          }
          else if (map.loc == 2) {
            vec = point.edgePointL
          }
          else if (map.loc == 5) {
            vec = point.edgePointR
          }

          data[offset++] = vec[0]
          data[offset++] = vec[1]
        }
      }
    }

    vertexBuffer.usedDataArraySize = offset
  }

  calculateBufferData_BezierLine(vertexBuffer: GPUVertexBuffer) {

    const data = vertexBuffer.dataArray
    let offset = 0

    for (const line of vertexBuffer.lines) {

      {
        const linePoint = line.points[0]
        const linePointNext = line.points[1]

        offset = this.calculateBufferData_AddBezierCapPoints(data, offset, linePoint, linePointNext, true)
      }

      {
        const linePoint = line.points[line.points.length - 2]
        const linePointNext = line.points[line.points.length - 1]

        offset = this.calculateBufferData_AddBezierCapPoints(data, offset, linePoint, linePointNext, false)
      }

      for (let index = 0; index < line.points.length - 1; index++) {

        const linePoint = line.points[index]
        const linePointNext = line.points[index + 1]

        for (const map of this.bezierPolygonMap) {

          let point: GPULinePoint
          if (map.cur == 1) {
            point = linePoint
          }
          else {
            point = linePointNext
          }

          let vec: Vec3
          if (map.loc == 1) {
            vec = point.location
          }
          else if (map.loc == 2) {
            vec = point.edgePointL
          }
          else if (map.loc == 3) {
            vec = point.controlPointVertexLF
          }
          else if (map.loc == 4) {
            vec = point.controlPointVertexLB
          }
          else if (map.loc == 5) {
            vec = point.edgePointR
          }
          else if (map.loc == 6) {
            vec = point.controlPointVertexRF
          }
          else if (map.loc == 7) {
            vec = point.controlPointVertexRB
          }

          //let flipY = (map.lr == 1 ? 1.0 : -1.0)

          offset = this.calculateBufferData_AddBezierPoint(data, offset, vec, linePoint, linePointNext, 1.0
            , linePoint.width, linePointNext.width)
        }
      }
    }

    vertexBuffer.usedDataArraySize = offset
  }

  calculateBufferData_AddBezierPoint(data: Float32Array, offset: int, vec: Vec3
    , linePoint: GPULinePoint, linePointNext: GPULinePoint, flipY: float
    , widthFrom: float, widthTo: float): int {

    // 頂点位置
    data[offset++] = vec[0]
    data[offset++] = vec[1]

    // セグメントローカル座標 x, y、セグメントローカル t (0.0 -> 1.0)
    vec3.transformMat4(this.relativeVecA, vec, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1] * flipY

    const length = vec3.distance(linePoint.location, linePointNext.location)
    data[offset++] = this.relativeVecA[0] / length

    // 各制御点
    // vec3.transformMat4(this.relativeVecA, linePoint.edgePointL, linePoint.invMat)
    vec3.transformMat4(this.relativeVecA, linePoint.location, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1]

    // vec3.transformMat4(this.relativeVecA, linePoint.controlPointLF, linePoint.invMat)
    vec3.transformMat4(this.relativeVecA, linePoint.controlPointCF, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1]

    // vec3.transformMat4(this.relativeVecA, linePointNext.controlPointLB, linePoint.invMat)
    vec3.transformMat4(this.relativeVecA, linePointNext.controlPointCB, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1]

    // vec3.transformMat4(this.relativeVecA, linePointNext.edgePointL, linePoint.invMat)
    vec3.transformMat4(this.relativeVecA, linePointNext.location, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1]

    vec3.transformMat4(this.relativeVecA, linePoint.edgePointR, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1]

    vec3.transformMat4(this.relativeVecA, linePoint.controlPointRF, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1]

    vec3.transformMat4(this.relativeVecA, linePointNext.controlPointRB, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1]

    vec3.transformMat4(this.relativeVecA, linePointNext.edgePointR, linePoint.invMat)
    data[offset++] = this.relativeVecA[0]
    data[offset++] = this.relativeVecA[1]

    // 幅
    data[offset++] = widthFrom * 0.5
    data[offset++] = widthTo * 0.5

    return offset
  }

  calculateBufferData_AddBezierCapPoints(data: Float32Array, offset: int, linePoint: GPULinePoint, linePointNext: GPULinePoint, isTopCap: boolean): int {

    const capPoint = (isTopCap ? linePoint : linePointNext)
    const direction = (isTopCap ? 1.0 : -1.0)
    const capTopRelativeX = -(capPoint.edgePointL[1] - capPoint.location[1]) * direction
    const capTopRelativeY = (capPoint.edgePointL[0] - capPoint.location[0]) * direction

    const leftTopX = capPoint.edgePointL[0] + capTopRelativeX
    const leftTopY = capPoint.edgePointL[1] + capTopRelativeY
    const rightTopX = capPoint.edgePointR[0] + capTopRelativeX
    const rightTopY = capPoint.edgePointR[1] + capTopRelativeY

    const width = (isTopCap ? linePoint.width : linePointNext.width)

    // 1
    vec3.set(this.vec, leftTopX, leftTopY, 0.0)
    offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width)

    vec3.set(this.vec, capPoint.edgePointL[0], capPoint.edgePointL[1], 0.0)
    offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width)

    vec3.set(this.vec, capPoint.edgePointR[0], capPoint.edgePointR[1], 0.0)
    offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width)

    // 2
    vec3.set(this.vec, capPoint.edgePointR[0], capPoint.edgePointR[1], 0.0)
    offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width)

    vec3.set(this.vec, rightTopX, rightTopY, 0.0)
    offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width)

    vec3.set(this.vec, leftTopX, leftTopY, 0.0)
    offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width)

    return offset
  }

  bufferData(vertexBuffer: GPUVertexBuffer, render: WebGLRender) {

    render.bufferDataOnce(vertexBuffer.buffer, vertexBuffer.dataArray)

    vertexBuffer.isStored = true
  }
}
