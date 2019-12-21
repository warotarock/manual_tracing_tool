
namespace ManualTracingTool {

    export class Logic_GPULine {

        // cur 対象となる点を指定する
        //     1: Fromの点、2: Toの点
        // loc その点の持つ座標値のどれを使用するか指定
        //     1: location
        //     2: edgePointL, 3: controlPointVertexLF, 4: controlPointVertexLB
        //     5: edgePointR, 6: controlPointVertexRF, 7: controlPointVertexRB
        solidLinePolygonMap = [
            { cur: 1, loc: 2 }, { cur: 2, loc: 2 }, { cur: 1, loc: 5 },
            { cur: 1, loc: 5 }, { cur: 2, loc: 2 }, { cur: 2, loc: 5 },
        ];

        // lr 左右どちらののポリゴンであるかを指定する
        //    1: 左、2: 右
        bezierPolygonMap = [
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
        ];

        scale = vec3.create();
        direction = vec3.create();
        controlPointVec = vec3.create();
        normal = vec3.create();
        invMat = mat4.create();
        tempMat = mat4.create();
        calculateSegmentMat_Direction = vec3.create();

        relativeVecA = vec3.create();
        relativeVecB = vec3.create();
        relativeEdgePointVecA = vec3.create();
        relativeEdgePointVecB = vec3.create();

        copyGroupPointDataToBuffer(group: VectorGroup, lineWidthBiasRate: float, useAdjustingLocation: boolean) {

            let vertexBuffer = group.buffer;

            let pointCount = 0;

            vertexBuffer.lines = new List<GPULine>()

            for (let line of group.lines) {

                let gpuLine = new GPULine();
                vertexBuffer.lines.push(gpuLine);

                for (let linePoint of line.points) {

                    let gpuPoint: GPULinePoint;

                    if (pointCount < vertexBuffer.points.length) {

                        // 頂点データを再利用する
                        gpuPoint = vertexBuffer.points[pointCount];
                    }
                    else {

                        gpuPoint = new GPULinePoint();
                        vertexBuffer.points.push(gpuPoint);
                    }

                    gpuPoint.copyFrom(linePoint, lineWidthBiasRate, useAdjustingLocation);

                    gpuLine.points.push(gpuPoint);

                    pointCount++;
                }
            }

            vertexBuffer.pointCount = pointCount;
        }

        allocateBuffer(vertexBuffer: GPUVertexBuffer, vertexCount: int, vertexUnitSize: int, gl: WebGLRenderingContext) {

            let bufferSize = vertexCount * vertexUnitSize;

            if (vertexBuffer.buffer == null) {

                vertexBuffer.buffer = gl.createBuffer();
                vertexBuffer.dataArray = new Float32Array(bufferSize);
            }
            else if (bufferSize > vertexBuffer.bufferSize) {

                vertexBuffer.dataArray = new Float32Array(bufferSize);
            }

            vertexBuffer.bufferSize = bufferSize;
        }

        calculateLinePointEdges(vertexBuffer: GPUVertexBuffer) {

            let direction = this.direction;
            let normal = this.normal;

            // 点の左右の頂点位置を計算
            for (let line of vertexBuffer.lines) {

                let gpuPoints = line.points;

                for (let index = 0; index < gpuPoints.length; index++) {

                    let gpuPoint = gpuPoints[index];

                    let gpuPointPrev: GPULinePoint;
                    let gpuPointNext: GPULinePoint;

                    if (index == 0) {

                        // 最初の点は最初の点から次の点へのベクトルから計算
                        gpuPointPrev = gpuPoints[index];
                        gpuPointNext = gpuPoints[index + 1];
                    }
                    else if (index == gpuPoints.length - 1) {

                        // 最後の点は前の点から最後の点へのベクトルから計算
                        gpuPointPrev = gpuPoints[index - 1];
                        gpuPointNext = gpuPoints[index];

                        // 最後の点にはフラグを設定
                        gpuPoint.isEndPoint = true;
                    }
                    else {

                        // 中間の点は前の点から次の点へのベクトルから計算
                        gpuPointPrev = gpuPoints[index - 1];
                        gpuPointNext = gpuPoints[index + 1];
                    }

                    vec3.subtract(gpuPoint.direction, gpuPointNext.location, gpuPointPrev.location);
                    vec3.normalize(direction, gpuPoint.direction);

                    vec3.set(normal, direction[1], -direction[0], 0.0); // 90度回転したベクトル
                    vec3.scale(normal, normal, gpuPoint.width * 0.5);

                    vec3.subtract(gpuPoint.edgePointL, gpuPoint.location, normal);
                    vec3.add(gpuPoint.edgePointR, gpuPoint.location, normal);
                }
            }
        }

        calculateLinePointBezierLocation(vertexBuffer: GPUVertexBuffer) {

            // 中間の点の制御点の位置を計算
            for (let line of vertexBuffer.lines) {

                let gpuPoints = line.points;

                for (let index = 0; index < gpuPoints.length - 1; index++) {

                    let linePoint = gpuPoints[index];

                    if (index < gpuPoints.length - 1) {

                        let linePointNext = gpuPoints[index + 1];

                        this.calculateSegmentMat(linePoint.pointMat, linePoint.location, linePointNext.location);
                        mat4.invert(linePoint.invMat, linePoint.pointMat);
                    }

                    if (index > 0 && index < gpuPoints.length - 1) {

                        let linePointPrev = gpuPoints[index - 1];
                        let linePointNext = gpuPoints[index + 1];

                        this.calculateControlPoint(
                            linePoint.controlPointCF,
                            linePoint.controlPointCB,
                            linePoint.direction,
                            linePoint.location,
                            linePointPrev.location,
                            linePointNext.location
                        );

                        this.calculateControlPoint(
                            linePoint.controlPointLF,
                            linePoint.controlPointLB,
                            linePoint.direction,
                            linePoint.edgePointL,
                            linePointPrev.edgePointL,
                            linePointNext.edgePointL
                        );

                        this.calculateControlPoint(
                            linePoint.controlPointRF,
                            linePoint.controlPointRB,
                            linePoint.direction,
                            linePoint.edgePointR,
                            linePointPrev.edgePointR,
                            linePointNext.edgePointR
                        );
                    }
                }

                // 最初の点の制御点の位置を計算
                {
                    let linePoint = gpuPoints[0];
                    let linePointNext = gpuPoints[1];

                    this.calculateMirroredControlPoint(
                        linePoint.controlPointCF,
                        linePointNext.controlPointCB,
                        linePointNext.location,
                        linePoint.location,
                        linePoint.pointMat,
                        linePoint.invMat
                    );

                    this.calculateSegmentMat(this.tempMat, linePoint.edgePointL, linePointNext.edgePointL);
                    mat4.invert(this.invMat, this.tempMat);

                    this.calculateMirroredControlPoint(
                        linePoint.controlPointLF,
                        linePointNext.controlPointLB,
                        linePointNext.edgePointL,
                        linePoint.edgePointL,
                        this.tempMat,
                        this.invMat
                    );

                    this.calculateSegmentMat(this.tempMat, linePoint.edgePointR, linePointNext.edgePointR);
                    mat4.invert(this.invMat, this.tempMat);

                    this.calculateMirroredControlPoint(
                        linePoint.controlPointRF,
                        linePointNext.controlPointRB,
                        linePointNext.edgePointR,
                        linePoint.edgePointR,
                        this.tempMat,
                        this.invMat
                    );
                }

                // 最後の点の制御点の位置を計算
                {
                    let linePoint = gpuPoints[gpuPoints.length - 1];
                    let linePointNext = gpuPoints[gpuPoints.length - 2];

                    this.calculateSegmentMat(linePoint.pointMat, linePoint.location, linePointNext.location);
                    mat4.invert(linePoint.invMat, linePoint.pointMat);

                    this.calculateMirroredControlPoint(
                        linePoint.controlPointCB,
                        linePointNext.controlPointCF,
                        linePointNext.location,
                        linePoint.location,
                        linePoint.pointMat,
                        linePoint.invMat
                    );

                    this.calculateSegmentMat(this.tempMat, linePoint.edgePointL, linePointNext.edgePointL);
                    mat4.invert(this.invMat, this.tempMat);

                    this.calculateMirroredControlPoint(
                        linePoint.controlPointLB,
                        linePointNext.controlPointLF,
                        linePointNext.edgePointL,
                        linePoint.edgePointL,
                        this.tempMat,
                        this.invMat
                    );

                    this.calculateSegmentMat(this.tempMat, linePoint.edgePointR, linePointNext.edgePointR);
                    mat4.invert(this.invMat, this.tempMat);

                    this.calculateMirroredControlPoint(
                        linePoint.controlPointRB,
                        linePointNext.controlPointRF,
                        linePointNext.edgePointR,
                        linePoint.edgePointR,
                        this.tempMat,
                        this.invMat
                    );
                }
            }
        }

        calculateSegmentMat(result: Mat4, locationFrom: Vec3, locationTo: Vec3) {

            vec3.subtract(this.calculateSegmentMat_Direction, locationTo, locationFrom);
            vec3.normalize(this.calculateSegmentMat_Direction, this.calculateSegmentMat_Direction);
            mat4.identity(result);
            result[0] = this.calculateSegmentMat_Direction[0];
            result[1] = this.calculateSegmentMat_Direction[1];
            result[4] = -this.calculateSegmentMat_Direction[1];
            result[5] = this.calculateSegmentMat_Direction[0];
            result[10] = 1.0;
            result[12] = locationFrom[0];
            result[13] = locationFrom[1];
        }

        calculateControlPoint(resultF: Vec3, resultB: Vec3, direction: Vec3, edgePointC: Vec3, edgePointB: Vec3, edgePointF: Vec3) {

            let distanceB = vec3.distance(edgePointB, edgePointC);
            let distanceF = vec3.distance(edgePointF, edgePointC);
            let distanceBF = distanceB + distanceF;

            vec3.scale(this.controlPointVec, direction, (distanceF / distanceBF) * 0.33); // いいかげんです
            vec3.add(resultF, edgePointC, this.controlPointVec);

            vec3.scale(this.controlPointVec, direction, -(distanceB / distanceBF) * 0.33); // いいかげんです
            vec3.add(resultB, edgePointC, this.controlPointVec);
        }

        calculateMirroredControlPoint(resultF: Vec3, controlPointTo: Vec3, edgePointTo: Vec3, edgePointFrom: Vec3, pointMat: Mat4, invMat: Mat4) {

            vec3.subtract(this.relativeVecA, controlPointTo, edgePointTo);
            vec3.add(this.relativeVecA, this.relativeVecA, edgePointFrom);

            vec3.transformMat4(this.relativeVecB, this.relativeVecA, invMat);

            this.relativeVecB[0] *= -1;

            vec3.transformMat4(resultF, this.relativeVecB, pointMat);
        }

        calculateControlPointVertexLocations(linePoints: List<GPULinePoint>) {

            for (let index = 0; index < linePoints.length - 1; index++) {

                let linePoint = linePoints[index];
                let linePointNext = linePoints[index + 1];

                this.calculateControlPointVertexLocation(
                    linePoint.controlPointVertexLF,
                    linePoint.edgePointL,
                    linePoint.controlPointLF,
                    linePointNext.edgePointL,
                    linePointNext.controlPointLB,
                    1.0
                );

                this.calculateControlPointVertexLocation(
                    linePoint.controlPointVertexRF,
                    linePoint.edgePointR,
                    linePoint.controlPointRF,
                    linePointNext.edgePointR,
                    linePointNext.controlPointRB,
                    -1.0
                );
            }

            for (let index = 1; index < linePoints.length; index++) {

                let linePoint = linePoints[index];
                let linePointPrev = linePoints[index - 1];

                this.calculateControlPointVertexLocation(
                    linePoint.controlPointVertexLB,
                    linePoint.edgePointL,
                    linePoint.controlPointLB,
                    linePointPrev.edgePointL,
                    linePointPrev.controlPointLF,
                    -1.0
                );

                this.calculateControlPointVertexLocation(
                    linePoint.controlPointVertexRB,
                    linePoint.edgePointR,
                    linePoint.controlPointRB,
                    linePointPrev.edgePointR,
                    linePointPrev.controlPointRF,
                    1.0
                );
            }
        }

        calculateControlPointVertexLocation(controlPointVertexLF: Vec3, edgePointFrom: Vec3, controlPointFrom: Vec3, edgePointTo: Vec3, controlPointTo: Vec3, flipY: float) {

            this.calculateSegmentMat(this.tempMat, edgePointFrom, edgePointTo);
            mat4.invert(this.invMat, this.tempMat);

            vec3.transformMat4(this.relativeEdgePointVecA, edgePointFrom, this.invMat);
            vec3.transformMat4(this.relativeVecA, controlPointFrom, this.invMat);

            vec3.transformMat4(this.relativeVecB, controlPointTo, this.invMat);
            if (this.relativeVecB[1] * flipY < 0.0) {
                vec3.transformMat4(this.relativeVecB, edgePointTo, this.invMat);
            }

            let tiltX = this.relativeVecB[0] - this.relativeEdgePointVecA[0];
            let tiltY = this.relativeVecB[1] - this.relativeEdgePointVecA[1];

            if (tiltX == 0.0) {
                return;
            }

            let deltaX = this.relativeVecA[0] - this.relativeEdgePointVecA[0];
            let localY = (tiltY / tiltX) * deltaX + this.relativeEdgePointVecA[1];

            if (this.relativeVecA[1] * flipY < localY * flipY) {

                controlPointVertexLF[0] = this.relativeVecA[0];
                controlPointVertexLF[1] = localY;
                controlPointVertexLF[2] = 0.0;
                vec3.transformMat4(controlPointVertexLF, controlPointVertexLF, this.tempMat);
            }
            else {

                vec3.copy(controlPointVertexLF, controlPointFrom);
            }
        }

        calculateBufferData_PloyLine(vertexBuffer: GPUVertexBuffer, lineColor: Vec4) {

            let data = vertexBuffer.dataArray;

            let offset = 0;

            for (let line of vertexBuffer.lines) {

                for (let index = 0; index < line.points.length - 1; index++) {

                    let linePoint = line.points[index];
                    let linePointNext = line.points[index + 1];

                    for (let map of this.solidLinePolygonMap) {

                        let point: GPULinePoint;
                        if (map.cur == 1) {
                            point = linePoint;
                        }
                        else {
                            point = linePointNext;
                        }

                        let vec: Vec3;
                        if (map.loc == 1) {
                            vec = point.location;
                        }
                        else if (map.loc == 2) {
                            vec = point.edgePointL;
                        }
                        else if (map.loc == 5) {
                            vec = point.edgePointR;
                        }

                        data[offset++] = vec[0];
                        data[offset++] = vec[1];
                        data[offset++] = lineColor[0];
                        data[offset++] = lineColor[1];
                        data[offset++] = lineColor[2];
                        data[offset++] = lineColor[3];
                    }
                }
            }

            vertexBuffer.usedDataArraySize = offset;
        }

        bufferData(vertexBuffer: GPUVertexBuffer, gl: WebGLRenderingContext) {

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer.dataArray, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            vertexBuffer.isStored = true;
        }
    }
}
