var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var HitTest_VectorLayer_Base = /** @class */ (function () {
        function HitTest_VectorLayer_Base() {
            this.existsPointHitTest = false;
        }
        HitTest_VectorLayer_Base.prototype.beforeHitTest = function () {
        };
        HitTest_VectorLayer_Base.prototype.afterHitTest = function () {
        };
        HitTest_VectorLayer_Base.prototype.beforeHitTestToLayer = function (geometry) {
        };
        HitTest_VectorLayer_Base.prototype.afterHitTestToLayer = function (geometry) {
        };
        HitTest_VectorLayer_Base.prototype.beforeHitTestToGroup = function (geometry, group) {
        };
        HitTest_VectorLayer_Base.prototype.afterHitTestToGroup = function (geometry, group) {
        };
        HitTest_VectorLayer_Base.prototype.beforeHitTestToLine = function (group, line) {
        };
        HitTest_VectorLayer_Base.prototype.afterHitTestToLine = function (group, line) {
        };
        HitTest_VectorLayer_Base.prototype.onPointHited = function (group, line, point) {
        };
        HitTest_VectorLayer_Base.prototype.onLineSegmentHited = function (line, point1, point2, location, minDistance, distanceSQ) {
        };
        HitTest_VectorLayer_Base.prototype.onLineSegmentNotHited = function (line, point1, point2) {
        };
        return HitTest_VectorLayer_Base;
    }());
    ManualTracingTool.HitTest_VectorLayer_Base = HitTest_VectorLayer_Base;
    var HitTest_LinePointBase = /** @class */ (function (_super) {
        __extends(HitTest_LinePointBase, _super);
        function HitTest_LinePointBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HitTest_LinePointBase.prototype.processLayer = function (geometry, location, minDistance) {
            this.hitTest(geometry, location, minDistance * minDistance);
        };
        HitTest_LinePointBase.prototype.startProcess = function () {
            this.existsPointHitTest = false;
            this.beforeHitTest();
        };
        HitTest_LinePointBase.prototype.endProcess = function () {
            this.afterHitTest();
        };
        HitTest_LinePointBase.prototype.hitTest = function (geometry, location, minDistance) {
            this.beforeHitTestToLayer(geometry);
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                this.beforeHitTestToGroup(geometry, group);
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    this.beforeHitTestToLine(group, line);
                    if (this.hitTest_LineRectangle(line, location, minDistance)) {
                        this.processHitTestToLine(group, line, location, minDistance);
                    }
                    this.afterHitTestToLine(group, line);
                }
                this.afterHitTestToGroup(geometry, group);
            }
            this.afterHitTestToLayer(geometry);
        };
        HitTest_LinePointBase.prototype.hitTest_LineRectangle = function (line, location, minDistance) {
            return HitTest_Line.hitTestLocationToLineByRectangle(location, line, minDistance);
        };
        HitTest_LinePointBase.prototype.processHitTestToLine = function (group, line, location, minDistance) {
        };
        return HitTest_LinePointBase;
    }(HitTest_VectorLayer_Base));
    ManualTracingTool.HitTest_LinePointBase = HitTest_LinePointBase;
    var HitTest_LinePoint_PointToPointByDistance = /** @class */ (function (_super) {
        __extends(HitTest_LinePoint_PointToPointByDistance, _super);
        function HitTest_LinePoint_PointToPointByDistance() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HitTest_LinePoint_PointToPointByDistance.prototype.processHitTestToLine = function (group, line, location, minDistance) {
            this.existsPointHitTest = false;
            for (var i = 0; i < line.points.length; i++) {
                var point = line.points[i];
                var distance2d = Math.pow(location[0] - point.location[0], 2) + Math.pow(location[1] - point.location[1], 2);
                if (distance2d < minDistance) {
                    this.onPointHited(group, line, point);
                }
                if (this.existsPointHitTest) {
                    break;
                }
            }
        };
        return HitTest_LinePoint_PointToPointByDistance;
    }(HitTest_LinePointBase));
    ManualTracingTool.HitTest_LinePoint_PointToPointByDistance = HitTest_LinePoint_PointToPointByDistance;
    var HitTest_Line_PointToLineByDistance = /** @class */ (function (_super) {
        __extends(HitTest_Line_PointToLineByDistance, _super);
        function HitTest_Line_PointToLineByDistance() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HitTest_Line_PointToLineByDistance.prototype.processHitTestToLine = function (group, line, location, minDistance) {
            this.existsPointHitTest = false;
            for (var i = 0; i + 1 < line.points.length; i++) {
                var point1 = line.points[i];
                var point2 = line.points[i + 1];
                var distanceSQ = ManualTracingTool.Logic_Points.pointToLineSegmentDistanceSQ(point1.location, point2.location, location[0], location[1]);
                if (distanceSQ < minDistance) {
                    this.onLineSegmentHited(line, point1, point2, location, Math.sqrt(minDistance), distanceSQ);
                }
                else {
                    this.onLineSegmentNotHited(line, point1, point2);
                }
                if (this.existsPointHitTest) {
                    break;
                }
            }
        };
        return HitTest_Line_PointToLineByDistance;
    }(HitTest_LinePointBase));
    ManualTracingTool.HitTest_Line_PointToLineByDistance = HitTest_Line_PointToLineByDistance;
    var HitTest_Line_PointToLineByDistanceSingle = /** @class */ (function (_super) {
        __extends(HitTest_Line_PointToLineByDistanceSingle, _super);
        function HitTest_Line_PointToLineByDistanceSingle() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.hitedLine = null;
            return _this;
        }
        HitTest_Line_PointToLineByDistanceSingle.prototype.beforeHitTest = function () {
            this.hitedLine = null;
        };
        HitTest_Line_PointToLineByDistanceSingle.prototype.onLineSegmentHited = function (line, point1, point2, location, minDistance, distanceSQ) {
            this.hitedLine = line;
            this.existsPointHitTest = true;
        };
        return HitTest_Line_PointToLineByDistanceSingle;
    }(HitTest_Line_PointToLineByDistance));
    ManualTracingTool.HitTest_Line_PointToLineByDistanceSingle = HitTest_Line_PointToLineByDistanceSingle;
    var HitTest_Line_IsCloseToMouse = /** @class */ (function (_super) {
        __extends(HitTest_Line_IsCloseToMouse, _super);
        function HitTest_Line_IsCloseToMouse() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.isChanged = false;
            return _this;
        }
        HitTest_Line_IsCloseToMouse.prototype.beforeHitTest = function () {
            this.isChanged = false;
        };
        HitTest_Line_IsCloseToMouse.prototype.onLineSegmentHited = function (line, point1, point2, location, minDistance, distanceSQ) {
            if (!line.isCloseToMouse) {
                this.isChanged = true;
            }
            line.isCloseToMouse = true;
            this.existsPointHitTest = true;
        };
        HitTest_Line_IsCloseToMouse.prototype.onLineSegmentNotHited = function (line, point1, point2) {
            if (line.isCloseToMouse) {
                this.isChanged = true;
            }
            line.isCloseToMouse = false;
        };
        return HitTest_Line_IsCloseToMouse;
    }(HitTest_Line_PointToLineByDistance));
    ManualTracingTool.HitTest_Line_IsCloseToMouse = HitTest_Line_IsCloseToMouse;
    var HitTest_Line = /** @class */ (function () {
        function HitTest_Line() {
        }
        HitTest_Line.getNearestSegmentIndex = function (targetLine, location) {
            var minDistance = HitTest_Line.MaxDistance;
            var nearestSegmentIndex = HitTest_Line.InvalidIndex;
            for (var i = 0; i < targetLine.points.length - 1; i++) {
                var editPoint1 = targetLine.points[i];
                var editPoint2 = targetLine.points[i + 1];
                var distance = ManualTracingTool.Logic_Points.pointToLineSegment_SorroundingDistance(editPoint1.location, editPoint2.location, location);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestSegmentIndex = i;
                }
            }
            return nearestSegmentIndex;
        };
        HitTest_Line.hitTestLocationToLineByRectangle = function (location, line, minDistance) {
            return (location[0] >= line.left - minDistance
                && location[0] <= line.right + minDistance
                && location[1] >= line.top - minDistance
                && location[1] <= line.bottom + minDistance);
        };
        HitTest_Line.hitTestLineToLineByRectangle = function (line1, line2) {
            var centerX1 = (line1.left + line1.right) / 2.0;
            var centerY1 = (line1.top + line1.bottom) / 2.0;
            var centerX2 = (line2.left + line2.right) / 2.0;
            var centerY2 = (line2.top + line2.bottom) / 2.0;
            var widthHalf = (line1.right - line1.left) / 2.0 + (line2.right - line2.left) / 2.0;
            var heightHalf = (line1.bottom - line1.top) / 2.0 + (line2.bottom - line2.top) / 2.0;
            return (centerX2 >= centerX1 - widthHalf
                && centerX2 <= centerX1 + widthHalf
                && centerY2 >= centerY1 - heightHalf
                && centerY2 <= centerY1 + heightHalf);
        };
        HitTest_Line.MaxDistance = 999999.0;
        HitTest_Line.InvalidDistance = -1.0;
        HitTest_Line.InvalidIndex = -1;
        return HitTest_Line;
    }());
    ManualTracingTool.HitTest_Line = HitTest_Line;
})(ManualTracingTool || (ManualTracingTool = {}));
