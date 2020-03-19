var ManualTracingTool;
(function (ManualTracingTool) {
    var Logic_GPULine = /** @class */ (function () {
        function Logic_GPULine() {
            // 省略しているアルファベットの意味
            //   F: Forward, B: Backward, L: Left, R: Right, C: Center
            // cur 対象となる点を指定する
            //     1: Fromの点、2: Toの点
            // loc その点の持つ座標値のどれを使用するか指定
            //     1: location
            //     2: edgePointL, 3: controlPointVertexLF, 4: controlPointVertexLB
            //     5: edgePointR, 6: controlPointVertexRF, 7: controlPointVertexRB
            this.solidLinePolygonMap = [
                { cur: 1, loc: 2 }, { cur: 2, loc: 2 }, { cur: 1, loc: 5 },
                { cur: 1, loc: 5 }, { cur: 2, loc: 2 }, { cur: 2, loc: 5 },
            ];
            // lr 左右どちらののポリゴンであるかを指定する
            //    1: 左、2: 右
            this.bezierPolygonMap = [
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
            ];
            this.vec = vec3.create();
            this.scale = vec3.create();
            this.direction = vec3.create();
            this.controlPointVec = vec3.create();
            this.normal = vec3.create();
            this.invMat = mat4.create();
            this.tempMat = mat4.create();
            this.calculateSegmentMat_Direction = vec3.create();
            this.relativeVecA = vec3.create();
            this.relativeVecB = vec3.create();
            this.relativeVecC = vec3.create();
            this.relativeVecD = vec3.create();
            this.relativeEdgePointVecA = vec3.create();
            this.relativeEdgePointVecB = vec3.create();
            this.relativeVecCenterFrom = vec3.create();
            this.relativeVecCenterTo = vec3.create();
            this.relativeVecEdgeFrom = vec3.create();
            this.relativeVecEdgeTo = vec3.create();
            this.minimumSegmentDistance = 0.001;
        }
        Logic_GPULine.prototype.copyGroupPointDataToBuffer = function (group, lineWidthBiasRate, useAdjustingLocation) {
            var vertexBuffer = group.buffer;
            var pointCount = 0;
            vertexBuffer.lines = new List();
            for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                var gpuLine = new ManualTracingTool.GPULine();
                var lastLinePoint = null;
                for (var _b = 0, _c = line.points; _b < _c.length; _b++) {
                    var linePoint = _c[_b];
                    var gpuPoint = void 0;
                    if (lastLinePoint != null
                        && vec3.distance(lastLinePoint.location, linePoint.location) < this.minimumSegmentDistance) {
                        continue;
                    }
                    if (pointCount < vertexBuffer.recyclePoints.length) {
                        // 頂点データを再利用する
                        gpuPoint = vertexBuffer.recyclePoints[pointCount];
                    }
                    else {
                        gpuPoint = new ManualTracingTool.GPULinePoint();
                        vertexBuffer.recyclePoints.push(gpuPoint);
                    }
                    gpuPoint.copyFrom(linePoint, lineWidthBiasRate, useAdjustingLocation);
                    gpuLine.points.push(gpuPoint);
                    pointCount++;
                    lastLinePoint = linePoint;
                }
                if (gpuLine.points.length < 2) {
                    continue;
                }
                vertexBuffer.lines.push(gpuLine);
            }
            vertexBuffer.pointCount = pointCount;
        };
        Logic_GPULine.prototype.allocateBuffer = function (vertexBuffer, vertexCount, vertexUnitSize, gl) {
            var bufferSize = vertexCount * vertexUnitSize;
            if (vertexBuffer.buffer == null) {
                vertexBuffer.buffer = gl.createBuffer();
                vertexBuffer.dataArray = new Float32Array(bufferSize);
            }
            else if (bufferSize > vertexBuffer.bufferSize) {
                vertexBuffer.dataArray = new Float32Array(bufferSize);
            }
            vertexBuffer.bufferSize = bufferSize;
        };
        // 1. エッジの位置の計算
        Logic_GPULine.prototype.calculateLinePointEdges = function (vertexBuffer) {
            var direction = this.direction;
            var normal = this.normal;
            // 点の左右の頂点位置を計算
            for (var _i = 0, _a = vertexBuffer.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                var gpuPoints = line.points;
                for (var index = 0; index < gpuPoints.length; index++) {
                    var gpuPoint = gpuPoints[index];
                    var gpuPointPrev = void 0;
                    var gpuPointNext = void 0;
                    var width = void 0;
                    if (index == 0) {
                        // 最初の点は最初の点から次の点へのベクトルから計算
                        gpuPointPrev = gpuPoints[index];
                        gpuPointNext = gpuPoints[index + 1];
                        width = gpuPointPrev.width;
                    }
                    else if (index == gpuPoints.length - 1) {
                        // 最後の点は前の点から最後の点へのベクトルから計算
                        gpuPointPrev = gpuPoints[index - 1];
                        gpuPointNext = gpuPoints[index];
                        width = gpuPointNext.width;
                        // 最後の点にはフラグを設定
                        gpuPoint.isEndPoint = true;
                    }
                    else {
                        // 中間の点は前の点から次の点へのベクトルから計算
                        gpuPointPrev = gpuPoints[index - 1];
                        gpuPointNext = gpuPoints[index + 1];
                        width = gpuPoint.width;
                    }
                    vec3.subtract(gpuPoint.direction, gpuPointNext.location, gpuPointPrev.location);
                    vec3.normalize(gpuPoint.direction, gpuPoint.direction);
                    vec3.set(normal, gpuPoint.direction[1], -gpuPoint.direction[0], 0.0); // 法線ベクトル
                    vec3.scale(normal, normal, width * 0.5);
                    vec3.subtract(gpuPoint.edgePointL, gpuPoint.location, normal);
                    vec3.add(gpuPoint.edgePointR, gpuPoint.location, normal);
                }
                if (gpuPoints.length >= 2) {
                    {
                        var point = gpuPoints[0];
                        var pointTo = gpuPoints[1];
                        vec3.subtract(direction, pointTo.location, point.location);
                        vec3.scale(direction, direction, 0.33); // いいかげんです
                        vec3.add(point.controlPointCF, point.location, direction);
                        vec3.add(point.controlPointLF, point.edgePointL, direction);
                        vec3.add(point.controlPointRF, point.edgePointR, direction);
                    }
                    {
                        var point = gpuPoints[gpuPoints.length - 1];
                        var pointTo = gpuPoints[gpuPoints.length - 2];
                        vec3.subtract(direction, pointTo.location, point.location);
                        vec3.scale(direction, direction, 0.33); // いいかげんです
                        vec3.add(point.controlPointCB, point.location, direction);
                        vec3.add(point.controlPointLB, point.edgePointL, direction);
                        vec3.add(point.controlPointRB, point.edgePointR, direction);
                    }
                }
            }
        };
        // 2. ベジエ曲線の制御点の位置の計算
        Logic_GPULine.prototype.calculateLinePointBezierLocation = function (vertexBuffer) {
            // 中間の点の制御点の位置を計算
            for (var _i = 0, _a = vertexBuffer.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                var gpuPoints = line.points;
                for (var index = 0; index < gpuPoints.length - 1; index++) {
                    var linePoint = gpuPoints[index];
                    if (index + 1 < gpuPoints.length) {
                        var linePointNext = gpuPoints[index + 1];
                        this.calculateSegmentMat(linePoint.pointMat, linePoint.location, linePointNext.location);
                        mat4.invert(linePoint.invMat, linePoint.pointMat);
                    }
                    if (index - 1 >= 0 && index + 1 < gpuPoints.length) {
                        var linePointPrev = gpuPoints[index - 1];
                        var linePointNext = gpuPoints[index + 1];
                        this.calculateControlPoint(linePoint.controlPointCF, linePoint.controlPointCB, linePoint.direction, linePoint.location, linePointPrev.location, linePointNext.location);
                        this.calculateControlPoint(linePoint.controlPointLF, linePoint.controlPointLB, linePoint.direction, linePoint.edgePointL, linePointPrev.edgePointL, linePointNext.edgePointL);
                        this.calculateControlPoint(linePoint.controlPointRF, linePoint.controlPointRB, linePoint.direction, linePoint.edgePointR, linePointPrev.edgePointR, linePointNext.edgePointR);
                    }
                }
                // 最初の点の制御点の位置を計算
                if (gpuPoints.length > 2) {
                    // １つ次の点の正方向の制御点と対称にする
                    var linePoint = gpuPoints[0];
                    var linePointNext = gpuPoints[1];
                    this.calculateMirroredPoint(linePoint.controlPointCF, null, linePoint.location, linePoint.location, linePoint.width, linePointNext.location, linePointNext.location, linePointNext.controlPointCB, linePoint.pointMat, linePoint.invMat);
                    this.calculateMirroredPoint(linePoint.controlPointLF, linePoint.edgePointL, linePoint.location, linePoint.edgePointL, linePoint.width, linePointNext.location, linePointNext.edgePointL, linePointNext.controlPointLB, linePoint.pointMat, linePoint.invMat);
                    this.calculateMirroredPoint(linePoint.controlPointRF, linePoint.edgePointR, linePoint.location, linePoint.edgePointR, linePoint.width, linePointNext.location, linePointNext.edgePointR, linePointNext.controlPointRB, linePoint.pointMat, linePoint.invMat);
                }
                // 最後の点の制御点の位置を計算
                if (gpuPoints.length > 2) {
                    // １つ前の点の負方向の制御点と対称にする
                    var linePoint = gpuPoints[gpuPoints.length - 1];
                    var linePointNext = gpuPoints[gpuPoints.length - 2];
                    this.calculateMirroredPoint(linePoint.controlPointCB, null, linePoint.location, linePoint.location, linePoint.width, linePointNext.location, linePointNext.location, linePointNext.controlPointCF, linePointNext.pointMat, linePointNext.invMat);
                    this.calculateMirroredPoint(linePoint.controlPointLB, linePoint.edgePointL, linePoint.location, linePoint.edgePointL, linePoint.width, linePointNext.location, linePointNext.edgePointL, linePointNext.controlPointLF, linePointNext.pointMat, linePointNext.invMat);
                    this.calculateMirroredPoint(linePoint.controlPointRB, linePoint.edgePointR, linePoint.location, linePoint.edgePointR, linePoint.width, linePointNext.location, linePointNext.edgePointR, linePointNext.controlPointRF, linePointNext.pointMat, linePointNext.invMat);
                }
            }
        };
        Logic_GPULine.prototype.calculateSegmentMat = function (result, locationFrom, locationTo) {
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
        };
        Logic_GPULine.prototype.calculateControlPoint = function (resultF, resultB, direction, edgePointC, edgePointB, edgePointF) {
            var distanceF = vec3.distance(edgePointF, edgePointC);
            vec3.scale(this.controlPointVec, direction, distanceF * 0.33); // いいかげんです
            vec3.add(resultF, edgePointC, this.controlPointVec);
            var distanceB = vec3.distance(edgePointB, edgePointC);
            vec3.scale(this.controlPointVec, direction, -distanceB * 0.33); // いいかげんです
            vec3.add(resultB, edgePointC, this.controlPointVec);
        };
        Logic_GPULine.prototype.calculateMirroredPoint = function (resultControlPoint, resultEdgePoint, centerPointFrom, edgePointfrom, radiusFrom, centerPointTo, edgePointTo, controlPointTo, pointMat, invMat) {
            if (resultEdgePoint != null) {
                vec3.transformMat4(this.relativeVecCenterTo, centerPointTo, invMat);
                vec3.transformMat4(this.relativeVecCenterFrom, centerPointFrom, invMat);
                vec3.transformMat4(this.relativeVecA, edgePointTo, invMat);
                vec3.subtract(this.relativeVecB, this.relativeVecA, this.relativeVecCenterTo);
                var length_1 = vec3.length(this.relativeVecB);
                if (length_1 > 0) {
                    vec3.scale(this.relativeVecB, this.relativeVecB, radiusFrom / length_1);
                }
                else {
                    vec3.set(this.relativeVecB, 0.0, 0.0, 0.0);
                }
                this.relativeVecB[0] = this.relativeVecB[0] * -1 + this.relativeVecCenterFrom[0];
                this.relativeVecB[1] = this.relativeVecB[1] + this.relativeVecCenterFrom[1];
                this.relativeVecB[2] = 0.0;
                vec3.transformMat4(resultEdgePoint, this.relativeVecB, pointMat);
            }
            if (resultControlPoint != null) {
                vec3.transformMat4(this.relativeVecEdgeTo, edgePointTo, invMat);
                vec3.transformMat4(this.relativeVecEdgeFrom, edgePointfrom, invMat);
                vec3.transformMat4(this.relativeVecA, controlPointTo, invMat);
                this.relativeVecB[0] = (this.relativeVecA[0] - this.relativeVecEdgeTo[0]) * -1 + this.relativeVecEdgeFrom[0];
                this.relativeVecB[1] = (this.relativeVecA[1] - this.relativeVecEdgeTo[1]) + this.relativeVecEdgeFrom[1];
                this.relativeVecB[2] = 0.0;
                vec3.transformMat4(resultControlPoint, this.relativeVecB, pointMat);
            }
        };
        // 3. ベジエ曲線を囲むポリゴンのうち制御点の頂点位置の計算
        Logic_GPULine.prototype.calculateControlPointVertexLocations = function (vertexBuffer) {
            for (var _i = 0, _a = vertexBuffer.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                // 前方向への制御点の位置を計算
                for (var index = 0; index < line.points.length - 1; index++) {
                    var linePoint = line.points[index];
                    var linePointNext = line.points[index + 1];
                    this.calculateControlPointVertexLocation(linePoint.controlPointVertexLF, linePoint.edgePointL, linePoint.controlPointLF, linePointNext.edgePointL, linePointNext.controlPointLB, 1.0);
                    this.calculateControlPointVertexLocation(linePoint.controlPointVertexRF, linePoint.edgePointR, linePoint.controlPointRF, linePointNext.edgePointR, linePointNext.controlPointRB, -1.0);
                }
                // 後方向への制御点の位置を計算
                for (var index = 1; index < line.points.length; index++) {
                    var linePoint = line.points[index];
                    var linePointPrev = line.points[index - 1];
                    this.calculateControlPointVertexLocation(linePoint.controlPointVertexLB, linePoint.edgePointL, linePoint.controlPointLB, linePointPrev.edgePointL, linePointPrev.controlPointLF, -1.0);
                    this.calculateControlPointVertexLocation(linePoint.controlPointVertexRB, linePoint.edgePointR, linePoint.controlPointRB, linePointPrev.edgePointR, linePointPrev.controlPointRF, 1.0);
                }
            }
        };
        Logic_GPULine.prototype.calculateControlPointVertexLocation = function (controlPointVertexLF, edgePointFrom, controlPointFrom, edgePointTo, controlPointTo, flipY) {
            // セグメントの座標系
            this.calculateSegmentMat(this.tempMat, edgePointFrom, edgePointTo);
            mat4.invert(this.invMat, this.tempMat);
            // セグメント座標
            vec3.transformMat4(this.relativeEdgePointVecA, edgePointFrom, this.invMat);
            vec3.transformMat4(this.relativeVecA, controlPointFrom, this.invMat);
            vec3.transformMat4(this.relativeVecB, controlPointTo, this.invMat);
            if (this.relativeVecB[1] * flipY < 0.0) {
                vec3.transformMat4(this.relativeVecB, edgePointTo, this.invMat);
            }
            var tiltX = this.relativeVecB[0] - this.relativeEdgePointVecA[0];
            var tiltY = this.relativeVecB[1] - this.relativeEdgePointVecA[1];
            if (tiltX == 0.0) {
                return;
            }
            var deltaX = this.relativeVecA[0] - this.relativeEdgePointVecA[0];
            var localY = (tiltY / tiltX) * deltaX + this.relativeEdgePointVecA[1];
            if (this.relativeVecA[1] * flipY < localY * flipY) {
                controlPointVertexLF[0] = this.relativeVecA[0];
                controlPointVertexLF[1] = localY;
                controlPointVertexLF[2] = 0.0;
                vec3.transformMat4(controlPointVertexLF, controlPointVertexLF, this.tempMat);
            }
            else {
                vec3.copy(controlPointVertexLF, controlPointFrom);
            }
        };
        Logic_GPULine.prototype.calculateBufferData_PloyLine = function (vertexBuffer) {
            var data = vertexBuffer.dataArray;
            var offset = 0;
            for (var _i = 0, _a = vertexBuffer.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                for (var index = 0; index < line.points.length - 1; index++) {
                    var linePoint = line.points[index];
                    var linePointNext = line.points[index + 1];
                    if (linePoint.isEndPoint) {
                        continue;
                    }
                    for (var _b = 0, _c = this.solidLinePolygonMap; _b < _c.length; _b++) {
                        var map = _c[_b];
                        var point = void 0;
                        if (map.cur == 1) {
                            point = linePoint;
                        }
                        else {
                            point = linePointNext;
                        }
                        var vec = void 0;
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
                    }
                }
            }
            vertexBuffer.usedDataArraySize = offset;
        };
        Logic_GPULine.prototype.calculateBufferData_BezierLine = function (vertexBuffer) {
            var data = vertexBuffer.dataArray;
            var offset = 0;
            for (var _i = 0, _a = vertexBuffer.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                {
                    var linePoint = line.points[0];
                    var linePointNext = line.points[1];
                    offset = this.calculateBufferData_AddBezierCapPoints(data, offset, linePoint, linePointNext, true);
                }
                {
                    var linePoint = line.points[line.points.length - 2];
                    var linePointNext = line.points[line.points.length - 1];
                    offset = this.calculateBufferData_AddBezierCapPoints(data, offset, linePoint, linePointNext, false);
                }
                for (var index = 0; index < line.points.length - 1; index++) {
                    var linePoint = line.points[index];
                    var linePointNext = line.points[index + 1];
                    for (var _b = 0, _c = this.bezierPolygonMap; _b < _c.length; _b++) {
                        var map = _c[_b];
                        var point = void 0;
                        if (map.cur == 1) {
                            point = linePoint;
                        }
                        else {
                            point = linePointNext;
                        }
                        var vec = void 0;
                        if (map.loc == 1) {
                            vec = point.location;
                        }
                        else if (map.loc == 2) {
                            vec = point.edgePointL;
                        }
                        else if (map.loc == 3) {
                            vec = point.controlPointVertexLF;
                        }
                        else if (map.loc == 4) {
                            vec = point.controlPointVertexLB;
                        }
                        else if (map.loc == 5) {
                            vec = point.edgePointR;
                        }
                        else if (map.loc == 6) {
                            vec = point.controlPointVertexRF;
                        }
                        else if (map.loc == 7) {
                            vec = point.controlPointVertexRB;
                        }
                        //let flipY = (map.lr == 1 ? 1.0 : -1.0);
                        offset = this.calculateBufferData_AddBezierPoint(data, offset, vec, linePoint, linePointNext, 1.0, linePoint.width, linePointNext.width);
                    }
                }
            }
            vertexBuffer.usedDataArraySize = offset;
        };
        Logic_GPULine.prototype.calculateBufferData_AddBezierPoint = function (data, offset, vec, linePoint, linePointNext, flipY, widthFrom, widthTo) {
            // 頂点位置
            data[offset++] = vec[0];
            data[offset++] = vec[1];
            // セグメントローカル座標 x, y、セグメントローカル t (0.0 -> 1.0)
            vec3.transformMat4(this.relativeVecA, vec, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1] * flipY;
            var length = vec3.distance(linePoint.location, linePointNext.location);
            data[offset++] = this.relativeVecA[0] / length;
            // 各制御点
            // vec3.transformMat4(this.relativeVecA, linePoint.edgePointL, linePoint.invMat);
            vec3.transformMat4(this.relativeVecA, linePoint.location, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1];
            // vec3.transformMat4(this.relativeVecA, linePoint.controlPointLF, linePoint.invMat);
            vec3.transformMat4(this.relativeVecA, linePoint.controlPointCF, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1];
            // vec3.transformMat4(this.relativeVecA, linePointNext.controlPointLB, linePoint.invMat);
            vec3.transformMat4(this.relativeVecA, linePointNext.controlPointCB, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1];
            // vec3.transformMat4(this.relativeVecA, linePointNext.edgePointL, linePoint.invMat);
            vec3.transformMat4(this.relativeVecA, linePointNext.location, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1];
            vec3.transformMat4(this.relativeVecA, linePoint.edgePointR, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1];
            vec3.transformMat4(this.relativeVecA, linePoint.controlPointRF, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1];
            vec3.transformMat4(this.relativeVecA, linePointNext.controlPointRB, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1];
            vec3.transformMat4(this.relativeVecA, linePointNext.edgePointR, linePoint.invMat);
            data[offset++] = this.relativeVecA[0];
            data[offset++] = this.relativeVecA[1];
            // 幅
            data[offset++] = widthFrom * 0.5;
            data[offset++] = widthTo * 0.5;
            return offset;
        };
        Logic_GPULine.prototype.calculateBufferData_AddBezierCapPoints = function (data, offset, linePoint, linePointNext, isTopCap) {
            var capPoint = (isTopCap ? linePoint : linePointNext);
            var direction = (isTopCap ? 1.0 : -1.0);
            var capTopRelativeX = -(capPoint.edgePointL[1] - capPoint.location[1]) * direction;
            var capTopRelativeY = (capPoint.edgePointL[0] - capPoint.location[0]) * direction;
            var leftTopX = capPoint.edgePointL[0] + capTopRelativeX;
            var leftTopY = capPoint.edgePointL[1] + capTopRelativeY;
            var rightTopX = capPoint.edgePointR[0] + capTopRelativeX;
            var rightTopY = capPoint.edgePointR[1] + capTopRelativeY;
            var width = (isTopCap ? linePoint.width : linePointNext.width);
            ;
            // 1
            vec3.set(this.vec, leftTopX, leftTopY, 0.0);
            offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width);
            vec3.set(this.vec, capPoint.edgePointL[0], capPoint.edgePointL[1], 0.0);
            offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width);
            vec3.set(this.vec, capPoint.edgePointR[0], capPoint.edgePointR[1], 0.0);
            offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width);
            // 2
            vec3.set(this.vec, capPoint.edgePointR[0], capPoint.edgePointR[1], 0.0);
            offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width);
            vec3.set(this.vec, rightTopX, rightTopY, 0.0);
            offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width);
            vec3.set(this.vec, leftTopX, leftTopY, 0.0);
            offset = this.calculateBufferData_AddBezierPoint(data, offset, this.vec, linePoint, linePointNext, 1.0, width, width);
            return offset;
        };
        Logic_GPULine.prototype.bufferData = function (vertexBuffer, gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer.dataArray, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            vertexBuffer.isStored = true;
        };
        return Logic_GPULine;
    }());
    ManualTracingTool.Logic_GPULine = Logic_GPULine;
})(ManualTracingTool || (ManualTracingTool = {}));
