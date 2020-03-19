var ManualTracingTool;
(function (ManualTracingTool) {
    var Logic_Edit_Points_RectangleArea = /** @class */ (function () {
        function Logic_Edit_Points_RectangleArea() {
            this.top = 0.0;
            this.right = 0.0;
            this.bottom = 0.0;
            this.left = 0.0;
        }
        Logic_Edit_Points_RectangleArea.prototype.getWidth = function () {
            return Math.abs(this.right - this.left);
        };
        Logic_Edit_Points_RectangleArea.prototype.getHeight = function () {
            return Math.abs(this.bottom - this.top);
        };
        Logic_Edit_Points_RectangleArea.prototype.getHorizontalPositionInRate = function (x) {
            var width = this.getWidth();
            if (width == 0.0) {
                return 0.0;
            }
            return (x - this.left) / width;
        };
        Logic_Edit_Points_RectangleArea.prototype.getVerticalPositionInRate = function (y) {
            var height = this.getHeight();
            if (height == 0.0) {
                return 0.0;
            }
            return (y - this.top) / height;
        };
        return Logic_Edit_Points_RectangleArea;
    }());
    ManualTracingTool.Logic_Edit_Points_RectangleArea = Logic_Edit_Points_RectangleArea;
    var Logic_Edit_Points = /** @class */ (function () {
        function Logic_Edit_Points() {
        }
        Logic_Edit_Points.setMinMaxToRectangleArea = function (result) {
            result.left = 999999.0;
            result.top = 999999.0;
            result.right = -999999.0;
            result.bottom = -999999.0;
        };
        Logic_Edit_Points.existsRectangleArea = function (rectangle) {
            return (rectangle.left != 999999.0
                && rectangle.top != 999999.0
                && rectangle.right != -999999.0
                && rectangle.bottom != -999999.0);
        };
        Logic_Edit_Points.clalculateSamplingDivisionCount = function (totalLength, resamplingUnitLength) {
            var divisionCount = Math.floor(totalLength / resamplingUnitLength);
            if ((divisionCount % 2) == 0) {
                divisionCount = divisionCount + 1;
            }
            return divisionCount;
        };
        Logic_Edit_Points.calculateSurroundingRectangle = function (result, minMaxRectangle, points, selectedOnly) {
            var left = minMaxRectangle.left;
            var top = minMaxRectangle.top;
            var right = minMaxRectangle.right;
            var bottom = minMaxRectangle.bottom;
            for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
                var point = points_1[_i];
                if (selectedOnly
                    && !point.isSelected) {
                    continue;
                }
                left = Math.min(point.location[0], left);
                top = Math.min(point.location[1], top);
                right = Math.max(point.location[0], right);
                bottom = Math.max(point.location[1], bottom);
            }
            result.left = left;
            result.top = top;
            result.right = right;
            result.bottom = bottom;
        };
        Logic_Edit_Points.calculatePointTotalLength = function (points, startLength) {
            if (points.length == 0) {
                return;
            }
            points[0].totalLength = startLength;
            var totalLength = startLength;
            for (var i = 1; i < points.length; i++) {
                var point1 = points[i];
                var point2 = points[i - 1];
                totalLength += vec3.distance(point1.location, point2.location);
                point1.totalLength = totalLength;
            }
        };
        Logic_Edit_Points.calculatePointCurvature = function (points) {
            if (points.length <= 2) {
                return;
            }
            points[0].totalLength = 0;
            points[points.length - 1].totalLength = 0;
            for (var i = 1; i + 1 < points.length; i++) {
                var point1 = points[i - 1];
                var point2 = points[i];
                var point3 = points[i + 1];
                var angle = ManualTracingTool.Logic_Points.angle(point1.location, point2.location, point3.location);
                point2.curvature = Math.PI - angle;
                if (point2.curvature >= Math.PI) {
                    point2.curvature = Math.PI * 2 - point2.curvature;
                }
            }
        };
        Logic_Edit_Points.calculateSegmentTotalLength = function (points, startIndex, endIndex) {
            var totalLength = 0.0;
            for (var i = startIndex; i <= endIndex - 1; i++) {
                var point1 = points[i];
                var point2 = points[i + 1];
                totalLength += vec3.distance(point1.location, point2.location);
            }
            return totalLength;
        };
        Logic_Edit_Points.resamplePoints = function (result, points, startIndex, endIndex, samplingUnitLength) {
            var sampledLocationVec = Logic_Edit_Line.sampledLocation;
            var totalLength = Logic_Edit_Points.calculateSegmentTotalLength(points, startIndex, endIndex);
            var firstPoint = points[startIndex];
            var lastPoint = points[endIndex];
            var currentIndex = startIndex;
            var currentPosition = 0.0;
            var endPosition = totalLength;
            var maxSampleCount = 1 + Math.ceil(totalLength / samplingUnitLength);
            var nextStepLength = samplingUnitLength;
            // for first point
            {
                var sampledPoint = new ManualTracingTool.LinePoint();
                vec3.copy(sampledPoint.location, firstPoint.location);
                vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location);
                sampledPoint.lineWidth = firstPoint.lineWidth;
                sampledPoint.adjustingLineWidth = sampledPoint.lineWidth;
                result.push(sampledPoint);
            }
            // for inside points
            var sampledCount = 1;
            var currentPointPosition = 0.0;
            while (currentPosition < endPosition) {
                var currentPoint = points[currentIndex];
                var nextPoint = points[currentIndex + 1];
                var segmentLength = vec3.distance(nextPoint.location, currentPoint.location);
                if (segmentLength < samplingUnitLength / 10.0) {
                    currentIndex++;
                    currentPointPosition += segmentLength;
                    if (currentIndex == endIndex) {
                        break;
                    }
                }
                var nextPointPosition = currentPointPosition + segmentLength;
                if (currentPosition + nextStepLength >= endPosition - samplingUnitLength / 2.0) {
                    break;
                }
                else if (currentPosition + nextStepLength <= nextPointPosition) {
                    var localPosition = (currentPosition + nextStepLength) - currentPointPosition;
                    var positionRate = localPosition / segmentLength;
                    vec3.lerp(sampledLocationVec, currentPoint.location, nextPoint.location, positionRate);
                    var sampledPoint = new ManualTracingTool.LinePoint();
                    vec3.copy(sampledPoint.location, sampledLocationVec);
                    vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location);
                    sampledPoint.lineWidth = ManualTracingTool.Maths.lerp(positionRate, currentPoint.lineWidth, nextPoint.lineWidth);
                    sampledPoint.adjustingLineWidth = sampledPoint.lineWidth;
                    result.push(sampledPoint);
                    currentPosition = currentPosition + nextStepLength;
                    nextStepLength = samplingUnitLength;
                    sampledCount++;
                    if (sampledCount >= maxSampleCount) {
                        break;
                    }
                }
                else {
                    nextStepLength = (currentPosition + nextStepLength) - nextPointPosition;
                    currentPosition = nextPointPosition;
                    currentIndex++;
                    currentPointPosition += segmentLength;
                    if (currentIndex == endIndex) {
                        break;
                    }
                }
            }
            // for last point
            {
                var sampledPoint = new ManualTracingTool.LinePoint();
                vec3.copy(sampledPoint.location, lastPoint.location);
                vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location);
                sampledPoint.lineWidth = lastPoint.lineWidth;
                sampledPoint.adjustingLineWidth = sampledPoint.lineWidth;
                result.push(sampledPoint);
            }
            return result;
        };
        return Logic_Edit_Points;
    }());
    ManualTracingTool.Logic_Edit_Points = Logic_Edit_Points;
    var Logic_Edit_Line = /** @class */ (function () {
        function Logic_Edit_Line() {
        }
        Logic_Edit_Line.calculateParameters = function (line) {
            // Calculate rectangle area and selection
            var left = 999999.0;
            var top = 999999.0;
            var right = -999999.0;
            var bottom = -999999.0;
            var isSelected = false;
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                left = Math.min(point.location[0], left);
                top = Math.min(point.location[1], top);
                right = Math.max(point.location[0], right);
                bottom = Math.max(point.location[1], bottom);
                if (point.isSelected) {
                    isSelected = true;
                }
            }
            line.left = left;
            line.top = top;
            line.right = right;
            line.bottom = bottom;
            line.range = Math.sqrt(Math.pow((right - left) * 0.5, 2) + Math.pow((bottom - top) * 0.5, 2));
            line.isSelected = isSelected;
            // Calculate point positon in length
            if (line.points.length > 0) {
                Logic_Edit_Points.calculatePointTotalLength(line.points, 0.0);
                line.totalLength = line.points[line.points.length - 1].totalLength;
            }
            else {
                line.totalLength = 0.0;
            }
            // Calculate curvature
            Logic_Edit_Points.calculatePointCurvature(line.points);
        };
        Logic_Edit_Line.calculateParametersV = function (lines) {
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                Logic_Edit_Line.calculateParameters(line);
            }
        };
        Logic_Edit_Line.smooth = function (line) {
            Logic_Edit_Line.smoothPoints(line.points);
            Logic_Edit_Line.applyAdjustments(line);
            Logic_Edit_Line.calculateParameters(line);
        };
        Logic_Edit_Line.smoothPoints = function (linePoints) {
            // Smoothing
            for (var i = 0; i < linePoints.length; i++) {
                var point = linePoints[i];
                vec3.copy(point.adjustingLocation, point.location);
                vec3.copy(point.tempLocation, point.location);
                point.adjustingLineWidth = point.lineWidth;
            }
            var iteration = 2;
            for (var count = 0; count < iteration; count++) {
                for (var i = 0; i + 2 < linePoints.length; i++) {
                    var point1 = linePoints[i];
                    var point2 = linePoints[i + 1];
                    var point3 = linePoints[i + 2];
                    Logic_Edit_Line.calcBezier2d(point2.adjustingLocation, point1.tempLocation, point2.tempLocation, point3.tempLocation, 0.5);
                    point2.adjustingLineWidth = (point1.adjustingLineWidth + point3.adjustingLineWidth) / 2;
                }
                for (var i = 0; i + 2 < linePoints.length; i++) {
                    var point2 = linePoints[i + 1];
                    vec3.copy(point2.tempLocation, point2.adjustingLocation);
                }
            }
        };
        Logic_Edit_Line.calcBezier2d = function (result, p0, p1, p2, t) {
            var px = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
            var py = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
            vec3.set(result, px, py, 0.0);
        };
        Logic_Edit_Line.applyAdjustments = function (line) {
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                vec3.copy(point.location, point.adjustingLocation);
                point.lineWidth = point.adjustingLineWidth;
            }
        };
        Logic_Edit_Line.resetModifyStates = function (lines) {
            for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
                var line = lines_2[_i];
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            }
        };
        Logic_Edit_Line.createResampledLine = function (baseLine, samplingDivisionCount) {
            var result = new ManualTracingTool.VectorLine();
            var startIndex = 0;
            var endIndex = baseLine.points.length - 1;
            var samplingUnitLength = baseLine.totalLength / samplingDivisionCount;
            Logic_Edit_Points.resamplePoints(result.points, baseLine.points, startIndex, endIndex, samplingUnitLength);
            Logic_Edit_Line.calculateParameters(result);
            return result;
        };
        Logic_Edit_Line.sampledLocation = vec3.fromValues(0.0, 0.0, 0.0);
        return Logic_Edit_Line;
    }());
    ManualTracingTool.Logic_Edit_Line = Logic_Edit_Line;
    var Logic_Edit_VectorLayer = /** @class */ (function () {
        function Logic_Edit_VectorLayer() {
        }
        Logic_Edit_VectorLayer.clearGeometryModifyFlags = function (geometry) {
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                this.clearGroupModifyFlags(group);
            }
        };
        Logic_Edit_VectorLayer.clearGroupModifyFlags = function (group) {
            group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                this.clearLineModifyFlags(line);
            }
        };
        Logic_Edit_VectorLayer.clearPointModifyFlags = function (points) {
            for (var _i = 0, points_2 = points; _i < points_2.length; _i++) {
                var point = points_2[_i];
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
            }
        };
        Logic_Edit_VectorLayer.clearLineModifyFlags = function (line) {
            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            Logic_Edit_VectorLayer.clearPointModifyFlags(line.points);
        };
        Logic_Edit_VectorLayer.fillGeometryDeleteFlags = function (geometry, forceDelete) {
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                this.fillGroupDeleteFlags(group, forceDelete);
            }
        };
        Logic_Edit_VectorLayer.fillGroupDeleteFlags = function (group, forceDelete) {
            if (forceDelete) {
                group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.delete;
            }
            var setDelete = false;
            if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.delete) {
                setDelete = true;
            }
            for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                this.fillLineDeleteFlags(line, setDelete);
            }
        };
        Logic_Edit_VectorLayer.fillLineDeleteFlags = function (line, forceDelete) {
            if (forceDelete) {
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.delete;
            }
            var setDelete = false;
            if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.delete) {
                setDelete = true;
            }
            if (setDelete) {
                for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                    var point = _a[_i];
                    point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
                }
            }
        };
        return Logic_Edit_VectorLayer;
    }());
    ManualTracingTool.Logic_Edit_VectorLayer = Logic_Edit_VectorLayer;
})(ManualTracingTool || (ManualTracingTool = {}));