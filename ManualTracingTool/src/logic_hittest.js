var ManualTracingTool;
(function (ManualTracingTool) {
    class HitTest_VectorLayer_Base {
        constructor() {
            this.existsPointHitTest = false;
        }
        beforeHitTest() {
        }
        afterHitTest() {
        }
        beforeHitTestToLayer(geometry) {
        }
        afterHitTestToLayer(geometry) {
        }
        beforeHitTestToGroup(geometry, group) {
        }
        afterHitTestToGroup(geometry, group) {
        }
        beforeHitTestToLine(group, line) {
        }
        afterHitTestToLine(group, line) {
        }
        onPointHited(group, line, point) {
        }
        onLineSegmentHited(group, line, point1, point2, location, minDistanceSQ, distanceSQ) {
        }
        onLineSegmentNotHited(line, point1, point2) {
        }
        onLineHited(line) {
        }
        onLineNotHited(line) {
        }
    }
    ManualTracingTool.HitTest_VectorLayer_Base = HitTest_VectorLayer_Base;
    class HitTest_LinePointBase extends HitTest_VectorLayer_Base {
        processLayer(geometry, location, minDistance) {
            this.hitTest(geometry, location, minDistance * minDistance);
        }
        startProcess() {
            this.existsPointHitTest = false;
            this.beforeHitTest();
        }
        endProcess() {
            this.afterHitTest();
        }
        hitTest(geometry, location, minDistanceSQ) {
            this.beforeHitTestToLayer(geometry);
            let minDistance = Math.sqrt(minDistanceSQ);
            for (let group of geometry.groups) {
                this.beforeHitTestToGroup(geometry, group);
                for (let line of group.lines) {
                    this.beforeHitTestToLine(group, line);
                    let lineHited = false;
                    if (this.hitTest_LineRectangle(line, location, minDistance)) {
                        lineHited = this.processHitTestToLine(group, line, location, minDistanceSQ);
                    }
                    if (lineHited) {
                        this.onLineHited(line);
                    }
                    else {
                        this.onLineNotHited(line);
                    }
                    this.afterHitTestToLine(group, line);
                }
                this.afterHitTestToGroup(geometry, group);
            }
            this.afterHitTestToLayer(geometry);
        }
        hitTest_LineRectangle(line, location, minDistance) {
            return HitTest_Line.hitTestLocationToLineByRectangle(location, line, minDistance);
        }
        processHitTestToLine(group, line, location, minDistance) {
            return false;
        }
    }
    ManualTracingTool.HitTest_LinePointBase = HitTest_LinePointBase;
    class HitTest_LinePoint_PointToPointByDistance extends HitTest_LinePointBase {
        processHitTestToLine(group, line, location, minDistance) {
            this.existsPointHitTest = false;
            for (let i = 0; i < line.points.length; i++) {
                let point = line.points[i];
                let distance2d = Math.pow(location[0] - point.location[0], 2) + Math.pow(location[1] - point.location[1], 2);
                if (distance2d < minDistance) {
                    this.onPointHited(group, line, point);
                }
                if (this.existsPointHitTest) {
                    break;
                }
            }
            return this.existsPointHitTest;
        }
    }
    ManualTracingTool.HitTest_LinePoint_PointToPointByDistance = HitTest_LinePoint_PointToPointByDistance;
    class HitTest_Line_PointToLineByDistance extends HitTest_LinePointBase {
        processHitTestToLine(group, line, location, minDistanceSQ) {
            this.existsPointHitTest = false;
            let lineHited = false;
            for (let i = 0; i + 1 < line.points.length; i++) {
                let point1 = line.points[i];
                let point2 = line.points[i + 1];
                let distanceSQ = ManualTracingTool.Logic_Points.pointToLineSegmentDistanceSQ(point1.location, point2.location, location[0], location[1]);
                if (distanceSQ < minDistanceSQ) {
                    this.onLineSegmentHited(group, line, point1, point2, location, minDistanceSQ, distanceSQ);
                    lineHited = true;
                }
                else {
                    this.onLineSegmentNotHited(line, point1, point2);
                }
                if (this.existsPointHitTest) {
                    break;
                }
            }
            return lineHited;
        }
    }
    ManualTracingTool.HitTest_Line_PointToLineByDistance = HitTest_Line_PointToLineByDistance;
    class HitTest_Line_PointToLineByDistanceSingle extends HitTest_Line_PointToLineByDistance {
        constructor() {
            super(...arguments);
            this.hitedLine = null;
        }
        beforeHitTest() {
            this.hitedLine = null;
        }
        onLineSegmentHited(group, line, point1, point2, location, minDistanceSQ, distanceSQ) {
            this.hitedLine = line;
            this.existsPointHitTest = true;
        }
    }
    ManualTracingTool.HitTest_Line_PointToLineByDistanceSingle = HitTest_Line_PointToLineByDistanceSingle;
    class HitTest_Line_IsCloseToMouse extends HitTest_Line_PointToLineByDistance {
        constructor() {
            super(...arguments);
            this.isChanged = false;
        }
        beforeHitTest() {
            this.isChanged = false;
        }
        onLineSegmentHited(group, line, point1, point2, location, minDistanceSQ, distanceSQ) {
            // to stop hit test early
            this.existsPointHitTest = true;
        }
        onLineHited(line) {
            if (!line.isCloseToMouse) {
                this.isChanged = true;
            }
            line.isCloseToMouse = true;
        }
        onLineNotHited(line) {
            if (line.isCloseToMouse) {
                this.isChanged = true;
            }
            line.isCloseToMouse = false;
        }
    }
    ManualTracingTool.HitTest_Line_IsCloseToMouse = HitTest_Line_IsCloseToMouse;
    class HitTest_Line {
        static getNearestSegmentIndex(targetLine, location) {
            let minDistance = HitTest_Line.MaxDistance;
            let nearestSegmentIndex = HitTest_Line.InvalidIndex;
            for (let i = 0; i < targetLine.points.length - 1; i++) {
                let editPoint1 = targetLine.points[i];
                let editPoint2 = targetLine.points[i + 1];
                let distance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(editPoint1.location, editPoint2.location, location);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestSegmentIndex = i;
                }
            }
            return nearestSegmentIndex;
        }
        static hitTestLocationToLineByRectangle(location, line, minDistance) {
            return (location[0] >= line.left - minDistance
                && location[0] <= line.right + minDistance
                && location[1] >= line.top - minDistance
                && location[1] <= line.bottom + minDistance);
        }
        static hitTestLineToLineByRectangle(line1, line2) {
            let centerX1 = (line1.left + line1.right) / 2.0;
            let centerY1 = (line1.top + line1.bottom) / 2.0;
            let centerX2 = (line2.left + line2.right) / 2.0;
            let centerY2 = (line2.top + line2.bottom) / 2.0;
            let widthHalf = (line1.right - line1.left) / 2.0 + (line2.right - line2.left) / 2.0;
            let heightHalf = (line1.bottom - line1.top) / 2.0 + (line2.bottom - line2.top) / 2.0;
            return (centerX2 >= centerX1 - widthHalf
                && centerX2 <= centerX1 + widthHalf
                && centerY2 >= centerY1 - heightHalf
                && centerY2 <= centerY1 + heightHalf);
        }
    }
    HitTest_Line.MaxDistance = 999999.0;
    HitTest_Line.InvalidDistance = -1.0;
    HitTest_Line.InvalidIndex = -1;
    ManualTracingTool.HitTest_Line = HitTest_Line;
})(ManualTracingTool || (ManualTracingTool = {}));
