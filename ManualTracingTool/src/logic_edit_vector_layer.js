var ManualTracingTool;
(function (ManualTracingTool) {
    class Logic_Edit_Points_RectangleArea {
        constructor() {
            this.top = 0.0;
            this.right = 0.0;
            this.bottom = 0.0;
            this.left = 0.0;
        }
        getWidth() {
            return Math.abs(this.right - this.left);
        }
        getHeight() {
            return Math.abs(this.bottom - this.top);
        }
        getHorizontalPositionInRate(x) {
            let width = this.getWidth();
            if (width == 0.0) {
                return 0.0;
            }
            return (x - this.left) / width;
        }
        getVerticalPositionInRate(y) {
            let height = this.getHeight();
            if (height == 0.0) {
                return 0.0;
            }
            return (y - this.top) / height;
        }
    }
    ManualTracingTool.Logic_Edit_Points_RectangleArea = Logic_Edit_Points_RectangleArea;
    class Logic_Edit_Points {
        static setMinMaxToRectangleArea(result) {
            result.left = 999999.0;
            result.top = 999999.0;
            result.right = -999999.0;
            result.bottom = -999999.0;
        }
        static existsRectangleArea(rectangle) {
            return (rectangle.left != 999999.0
                && rectangle.top != 999999.0
                && rectangle.right != -999999.0
                && rectangle.bottom != -999999.0);
        }
        static clalculateSamplingDivisionCount(totalLength, resamplingUnitLength) {
            let divisionCount = Math.floor(totalLength / resamplingUnitLength);
            if ((divisionCount % 2) == 0) {
                divisionCount = divisionCount + 1;
            }
            return divisionCount;
        }
        static calculateSurroundingRectangle(result, minMaxRectangle, points, selectedOnly) {
            let left = minMaxRectangle.left;
            let top = minMaxRectangle.top;
            let right = minMaxRectangle.right;
            let bottom = minMaxRectangle.bottom;
            for (let point of points) {
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
        }
        static calculatePointTotalLength(points, startLength) {
            if (points.length == 0) {
                return;
            }
            points[0].totalLength = startLength;
            let totalLength = startLength;
            for (let i = 1; i < points.length; i++) {
                let point1 = points[i];
                let point2 = points[i - 1];
                totalLength += vec3.distance(point1.location, point2.location);
                point1.totalLength = totalLength;
            }
        }
        static calculatePointCurvature(points) {
            if (points.length <= 2) {
                return;
            }
            points[0].totalLength = 0;
            points[points.length - 1].totalLength = 0;
            for (let i = 1; i + 1 < points.length; i++) {
                let point1 = points[i - 1];
                let point2 = points[i];
                let point3 = points[i + 1];
                let angle = ManualTracingTool.Logic_Points.angle(point1.location, point2.location, point3.location);
                point2.curvature = Math.PI - angle;
                if (point2.curvature >= Math.PI) {
                    point2.curvature = Math.PI * 2 - point2.curvature;
                }
            }
        }
        static calculateSegmentTotalLength(points, startIndex, endIndex) {
            let totalLength = 0.0;
            for (let i = startIndex; i <= endIndex - 1; i++) {
                let point1 = points[i];
                let point2 = points[i + 1];
                totalLength += vec3.distance(point1.location, point2.location);
            }
            return totalLength;
        }
        static resamplePoints(result, points, startIndex, endIndex, samplingUnitLength) {
            let sampledLocationVec = Logic_Edit_Line.sampledLocation;
            let totalLength = Logic_Edit_Points.calculateSegmentTotalLength(points, startIndex, endIndex);
            let firstPoint = points[startIndex];
            let lastPoint = points[endIndex];
            let currentIndex = startIndex;
            let currentPosition = 0.0;
            let endPosition = totalLength;
            let maxSampleCount = 1 + Math.ceil(totalLength / samplingUnitLength);
            let nextStepLength = samplingUnitLength;
            // for first point
            {
                let sampledPoint = new ManualTracingTool.LinePoint();
                vec3.copy(sampledPoint.location, firstPoint.location);
                vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location);
                sampledPoint.lineWidth = firstPoint.lineWidth;
                sampledPoint.adjustingLineWidth = sampledPoint.lineWidth;
                result.push(sampledPoint);
            }
            // for inside points
            let sampledCount = 1;
            let currentPointPosition = 0.0;
            while (currentPosition < endPosition) {
                let currentPoint = points[currentIndex];
                let nextPoint = points[currentIndex + 1];
                let segmentLength = vec3.distance(nextPoint.location, currentPoint.location);
                if (segmentLength < samplingUnitLength / 10.0) {
                    currentIndex++;
                    currentPointPosition += segmentLength;
                    if (currentIndex == endIndex) {
                        break;
                    }
                }
                let nextPointPosition = currentPointPosition + segmentLength;
                if (currentPosition + nextStepLength >= endPosition - samplingUnitLength / 2.0) {
                    break;
                }
                else if (currentPosition + nextStepLength <= nextPointPosition) {
                    let localPosition = (currentPosition + nextStepLength) - currentPointPosition;
                    let positionRate = localPosition / segmentLength;
                    vec3.lerp(sampledLocationVec, currentPoint.location, nextPoint.location, positionRate);
                    let sampledPoint = new ManualTracingTool.LinePoint();
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
                let sampledPoint = new ManualTracingTool.LinePoint();
                vec3.copy(sampledPoint.location, lastPoint.location);
                vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location);
                sampledPoint.lineWidth = lastPoint.lineWidth;
                sampledPoint.adjustingLineWidth = sampledPoint.lineWidth;
                result.push(sampledPoint);
            }
            return result;
        }
    }
    ManualTracingTool.Logic_Edit_Points = Logic_Edit_Points;
    class Logic_Edit_Line {
        static calculateParameters(line) {
            // Calculate rectangle area and selection
            let left = 999999.0;
            let top = 999999.0;
            let right = -999999.0;
            let bottom = -999999.0;
            let isSelected = false;
            for (let point of line.points) {
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
        }
        static calculateParametersV(lines) {
            for (let line of lines) {
                Logic_Edit_Line.calculateParameters(line);
            }
        }
        static smooth(line) {
            Logic_Edit_Line.smoothPoints(line.points);
            Logic_Edit_Line.applyAdjustments(line);
            Logic_Edit_Line.calculateParameters(line);
        }
        static smoothPoints(linePoints) {
            // Smoothing
            for (let i = 0; i < linePoints.length; i++) {
                let point = linePoints[i];
                vec3.copy(point.adjustingLocation, point.location);
                vec3.copy(point.tempLocation, point.location);
                point.adjustingLineWidth = point.lineWidth;
            }
            let iteration = 2;
            for (let count = 0; count < iteration; count++) {
                for (let i = 0; i + 2 < linePoints.length; i++) {
                    let point1 = linePoints[i];
                    let point2 = linePoints[i + 1];
                    let point3 = linePoints[i + 2];
                    Logic_Edit_Line.calcBezier2d(point2.adjustingLocation, point1.tempLocation, point2.tempLocation, point3.tempLocation, 0.5);
                    point2.adjustingLineWidth = (point1.adjustingLineWidth + point3.adjustingLineWidth) / 2;
                }
                for (let i = 0; i + 2 < linePoints.length; i++) {
                    let point2 = linePoints[i + 1];
                    vec3.copy(point2.tempLocation, point2.adjustingLocation);
                }
            }
        }
        static calcBezier2d(result, p0, p1, p2, t) {
            let px = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
            let py = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
            vec3.set(result, px, py, 0.0);
        }
        static applyAdjustments(line) {
            for (let point of line.points) {
                vec3.copy(point.location, point.adjustingLocation);
                point.lineWidth = point.adjustingLineWidth;
            }
        }
        static resetModifyStates(lines) {
            for (let line of lines) {
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            }
        }
        static createResampledLine(baseLine, samplingDivisionCount) {
            let result = new ManualTracingTool.VectorLine();
            let startIndex = 0;
            let endIndex = baseLine.points.length - 1;
            let samplingUnitLength = baseLine.totalLength / samplingDivisionCount;
            Logic_Edit_Points.resamplePoints(result.points, baseLine.points, startIndex, endIndex, samplingUnitLength);
            Logic_Edit_Line.calculateParameters(result);
            return result;
        }
    }
    Logic_Edit_Line.sampledLocation = vec3.fromValues(0.0, 0.0, 0.0);
    ManualTracingTool.Logic_Edit_Line = Logic_Edit_Line;
    class Logic_Edit_VectorLayer {
        static clearGeometryModifyFlags(geometry) {
            for (let group of geometry.groups) {
                this.clearGroupModifyFlags(group);
            }
        }
        static clearGroupModifyFlags(group) {
            group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            for (let line of group.lines) {
                this.clearLineModifyFlags(line);
            }
        }
        static clearPointModifyFlags(points) {
            for (let point of points) {
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
            }
        }
        static clearLineModifyFlags(line) {
            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            Logic_Edit_VectorLayer.clearPointModifyFlags(line.points);
        }
        static fillGeometryDeleteFlags(geometry, forceDelete) {
            for (let group of geometry.groups) {
                this.fillGroupDeleteFlags(group, forceDelete);
            }
        }
        static fillGroupDeleteFlags(group, forceDelete) {
            if (forceDelete) {
                group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.delete;
            }
            let setDelete = false;
            if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.delete) {
                setDelete = true;
            }
            for (let line of group.lines) {
                this.fillLineDeleteFlags(line, setDelete);
            }
        }
        static fillLineDeleteFlags(line, forceDelete) {
            if (forceDelete) {
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.delete;
            }
            let setDelete = false;
            if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.delete) {
                setDelete = true;
            }
            if (setDelete) {
                for (let point of line.points) {
                    point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
                }
            }
        }
    }
    ManualTracingTool.Logic_Edit_VectorLayer = Logic_Edit_VectorLayer;
})(ManualTracingTool || (ManualTracingTool = {}));
