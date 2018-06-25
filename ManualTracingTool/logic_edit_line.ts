
namespace ManualTracingTool {

    export class Logic_VectorLayer {

        static clearLayerModifyFlags(layer: VectorLayer) {

            for (let group of layer.groups) {

                this.clearGroupModifyFlags(group);
            }
        }

        static clearGroupModifyFlags(group: VectorGroup) {

            group.modifyFlag = VectorGroupModifyFlagID.none;
            group.linePointModifyFlag = VectorGroupModifyFlagID.none;

            for (let line of group.lines) {

                this.clearLineModifyFlags(line);
            }
        }

        static clearLineModifyFlags(line: VectorLine) {

            line.modifyFlag = VectorLineModifyFlagID.none;

            for (let point of line.points) {

                point.modifyFlag = LinePointModifyFlagID.none;
            }
        }

        static fillLayerDeleteFlags(layer: VectorLayer, forceDelete: boolean) {

            for (let group of layer.groups) {

                this.fillGroupDeleteFlags(group, forceDelete);
            }
        }

        static fillGroupDeleteFlags(group: VectorGroup, forceDelete: boolean) {

            if (forceDelete) {

                group.modifyFlag = VectorGroupModifyFlagID.delete;
            }

            let setDelete = false;
            if (group.modifyFlag == VectorGroupModifyFlagID.delete) {
                setDelete = true;
            }

            for (let line of group.lines) {

                this.fillLineDeleteFlags(line, setDelete);
            }
        }

        static fillLineDeleteFlags(line: VectorLine, forceDelete: boolean) {

            if (forceDelete) {

                line.modifyFlag = VectorLineModifyFlagID.delete;
            }

            let setDelete = false;
            if (line.modifyFlag == VectorLineModifyFlagID.delete) {
                setDelete = true;
            }

            if (setDelete) {

                for (let point of line.points) {

                    point.modifyFlag = LinePointModifyFlagID.delete;
                }
            }
        }
    }

    export class Logic_Edit_Points_RectangleArea {

        top = 0.0;
        right = 0.0;
        bottom = 0.0;
        left = 0.0;

        getWidth(): float {

            return Math.abs(this.right - this.left);
        }

        getHeight(): float {

            return Math.abs(this.bottom - this.top);
        }

        getHorizontalPositionInRate(x: float) {

            let width = this.getWidth();

            if (width == 0.0) {

                return 0.0;
            }

            return (x - this.left) / width;
        }

        getVerticalPositionInRate(y: float) {

            let height = this.getHeight();

            if (height == 0.0) {

                return 0.0;
            }

            return (y - this.top) / height;
        }
    }

    export class Logic_Edit_Points {

        static setMinMaxToRectangleArea(result: Logic_Edit_Points_RectangleArea) {

            result.left = 999999.0;
            result.top = 999999.0;

            result.right = -999999.0;
            result.bottom = -999999.0;
        }

        static existsRectangleArea(rectangle: Logic_Edit_Points_RectangleArea): boolean {

            return (rectangle.left != 999999.0
                && rectangle.top != 999999.0
                && rectangle.right != -999999.0
                && rectangle.bottom != -999999.0);
        }

        static clalculateSamplingDivisionCount(totalLength: float, resamplingUnitLength: float): int {

            let divisionCount = Math.floor(totalLength / resamplingUnitLength);

            if ((divisionCount % 2) == 0) {

                divisionCount = divisionCount + 1;
            }

            return divisionCount;
        }

        static calculateSurroundingRectangle(result: Logic_Edit_Points_RectangleArea, minMaxRectangle: Logic_Edit_Points_RectangleArea, points: List<LinePoint>, selectedOnly: boolean) {

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

        static calculateSegmentTotalLength(points: List<LinePoint>, startIndex: int, endIndex: int) {

            let totalLength = 0.0;

            for (let i = startIndex; i <= endIndex - 1; i++) {

                let point1 = points[i];
                let point2 = points[i + 1];

                totalLength += vec3.distance(point1.location, point2.location);
            }

            return totalLength;
        }

        static resamplePoints(result: List<LinePoint>, points: List<LinePoint>, startIndex: int, endIndex: int, samplingUnitLength: float): List<LinePoint> {

            let sampledLocationVec = Logic_Edit_Line.sampledLocation;

            let totalLength = Logic_Edit_Points.calculateSegmentTotalLength(points, startIndex, endIndex);

            let firstPoint = points[startIndex];
            let lastPoint = points[endIndex];

            let currentIndex = startIndex;
            let currentPosition = firstPoint.totalLength;
            let endPosition = firstPoint.totalLength + totalLength;

            let maxSampleCount = 1 + Math.ceil(totalLength / samplingUnitLength);

            let nextStepLength = samplingUnitLength;

            // for first point
            {
                let sampledPoint = new LinePoint();
                vec3.copy(sampledPoint.location, firstPoint.location);
                vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location);
                sampledPoint.lineWidth = firstPoint.lineWidth;
                sampledPoint.adjustingLineWidth = sampledPoint.lineWidth;
                result.push(sampledPoint);
            }

            // for internal points
            let sampledCount = 1;

            while (currentPosition < endPosition) {

                let currentPoint = points[currentIndex];
                let nextPoint = points[currentIndex + 1];
                let segmentLength = nextPoint.totalLength - currentPoint.totalLength;

                if (segmentLength == 0.0) {

                    currentIndex++;
                    if (currentIndex == endIndex) {
                        break;
                    }
                }

                if (currentPosition + nextStepLength <= nextPoint.totalLength) {

                    let localPosition = (currentPosition + nextStepLength) - currentPoint.totalLength;
                    let positionRate = localPosition / segmentLength;

                    vec3.lerp(sampledLocationVec, currentPoint.location, nextPoint.location, positionRate);

                    let sampledPoint = new LinePoint();
                    vec3.copy(sampledPoint.location, sampledLocationVec);
                    vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location);

                    sampledPoint.lineWidth = Maths.lerp(positionRate, currentPoint.lineWidth, nextPoint.lineWidth);
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

                    nextStepLength = (currentPosition + nextStepLength) - nextPoint.totalLength;
                    currentPosition = nextPoint.totalLength;
                    currentIndex++;

                    if (currentIndex == endIndex) {
                        break;
                    }
                }
            }

            // for last point
            {
                let sampledPoint = new LinePoint();
                vec3.copy(sampledPoint.location, lastPoint.location);
                vec3.copy(sampledPoint.adjustingLocation, sampledPoint.location);
                sampledPoint.lineWidth = lastPoint.lineWidth;
                sampledPoint.adjustingLineWidth = sampledPoint.lineWidth;
                result.push(sampledPoint);
            }

            return result;
        }
    }

    export class Logic_Edit_Line {

        static sampledLocation = vec3.fromValues(0.0, 0.0, 0.0);

        static calculateParameters(line: VectorLine) {

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

            line.isSelected = isSelected;

            // Calculate point positon in length
            let totalLength = 0.0;
            for (let i = 1; i < line.points.length; i++) {

                let point1 = line.points[i];
                let point2 = line.points[i - 1];

                totalLength += vec3.distance(point1.location, point2.location);

                point1.totalLength = totalLength;
            }

            line.totalLength = totalLength;

            // Calculate curvature
            for (let i = 1; i + 1 < line.points.length; i++) {

                let point1 = line.points[i - 1];
                let point2 = line.points[i];
                let point3 = line.points[i + 1];

                let angle = Logic_Points.angle(point1.location, point2.location, point3.location);

                point2.curvature = Math.PI - angle;
                if (point2.curvature >= Math.PI) {

                    point2.curvature = Math.PI * 2 - point2.curvature;
                }
            }
        }

        static calculateParametersV(lines: List<VectorLine>) {

            for (let line of lines) {

                Logic_Edit_Line.calculateParameters(line);
            }
        }

        static smooth(line: VectorLine) {

            // Smoothing
            for (let i = 0; i < line.points.length; i++) {
                let point = line.points[i];

                vec3.copy(point.adjustingLocation, point.location);
                vec3.copy(point.tempLocation, point.location);
            }

            let iteration = 2;
            for (let count = 0; count < iteration; count++) {

                for (let i = 0; i + 2 < line.points.length; i++) {

                    let point1 = line.points[i];
                    let point2 = line.points[i + 1];
                    let point3 = line.points[i + 2];

                    Logic_Edit_Line.calcBezier2d(
                        point2.adjustingLocation
                        , point1.tempLocation
                        , point2.tempLocation
                        , point3.tempLocation
                        , 0.5
                    );

                    point2.adjustingLineWidth = (point1.adjustingLineWidth + point3.adjustingLineWidth) / 2;
                }

                for (let i = 0; i + 2 < line.points.length; i++) {

                    let point2 = line.points[i + 1];

                    vec3.copy(point2.tempLocation, point2.adjustingLocation);

                    point2.lineWidth = point2.adjustingLineWidth;
                }
            }

            Logic_Edit_Line.applyAdjustments(line);

            Logic_Edit_Line.calculateParameters(line)
        }

        private static calcBezier2d(result: Vec3, p0: Vec3, p1: Vec3, p2: Vec3, t: float) {

            let px = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
            let py = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];

            vec3.set(result, px, py, 0.0);
        }

        private static gaussian(x: float, eRange: float): float {

            let d = eRange * eRange;
            let timeScale = 0.5;
            let r = 1 + 2 * x;

            return Math.exp(-timeScale * r * r / d);
        }

        static applyAdjustments(line: VectorLine) {

            for (let point of line.points) {

                vec3.copy(point.location, point.adjustingLocation)
            }
        }

        static createResampledLine(baseLine: VectorLine, samplingDivisionCount: int): VectorLine {

            let result = new VectorLine();

            let startIndex = 0;
            let endIndex = baseLine.points.length - 1;
            let samplingUnitLength = baseLine.totalLength / samplingDivisionCount;

            Logic_Edit_Points.resamplePoints(
                result.points
                , baseLine.points
                , startIndex
                , endIndex
                , samplingUnitLength);

            Logic_Edit_Line.calculateParameters(result);

            return result;
        }

        static resetModifyStatus(lines: List<VectorLine>) {

            for (let line of lines) {

                line.modifyFlag = VectorLineModifyFlagID.none;
            }
        }
    }
}
