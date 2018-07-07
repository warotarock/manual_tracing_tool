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
            this.exitPointHitTest = false;
        }
        HitTest_VectorLayer_Base.prototype.beforeHitTest = function () {
        };
        HitTest_VectorLayer_Base.prototype.afterHitTest = function () {
        };
        HitTest_VectorLayer_Base.prototype.beforeHitTestToLayer = function (layer) {
        };
        HitTest_VectorLayer_Base.prototype.afterHitTestToLayer = function (layer) {
        };
        HitTest_VectorLayer_Base.prototype.beforeHitTestToGroup = function (layer, group) {
        };
        HitTest_VectorLayer_Base.prototype.afterHitTestToGroup = function (layer, group) {
        };
        HitTest_VectorLayer_Base.prototype.beforeHitTestToLine = function (group, line) {
        };
        HitTest_VectorLayer_Base.prototype.afterHitTestToLine = function (group, line) {
        };
        HitTest_VectorLayer_Base.prototype.onPointHited = function (line, point) {
        };
        HitTest_VectorLayer_Base.prototype.onLineSegmentHited = function (line, point1, point2) {
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
        HitTest_LinePointBase.prototype.processLayer = function (layer, x, y, minDistance) {
            this.hitTest(layer, x, y, minDistance * minDistance);
        };
        HitTest_LinePointBase.prototype.processLayerRecursive = function (layers, x, y, minDistance) {
            this.hitTestRecursive(layers, x, y, minDistance * minDistance);
        };
        HitTest_LinePointBase.prototype.startProcess = function () {
            this.exitPointHitTest = false;
            this.beforeHitTest();
        };
        HitTest_LinePointBase.prototype.endProcess = function () {
            this.afterHitTest();
        };
        HitTest_LinePointBase.prototype.hitTest = function (layer, x, y, minDistance) {
            if (layer.type != ManualTracingTool.LayerTypeID.vectorLayer) {
                return;
            }
            var vectorLayer = layer;
            this.beforeHitTestToLayer(vectorLayer);
            for (var _i = 0, _a = vectorLayer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                this.beforeHitTestToGroup(vectorLayer, group);
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    this.beforeHitTestToLine(group, line);
                    if (this.hitTest_LineRectangle(line, x, y, minDistance)) {
                        this.processHitTestToLine(group, line, x, y, minDistance);
                    }
                    this.afterHitTestToLine(group, line);
                }
                this.afterHitTestToGroup(vectorLayer, group);
            }
            this.afterHitTestToLayer(vectorLayer);
        };
        HitTest_LinePointBase.prototype.hitTestRecursive = function (layers, x, y, minDistance) {
            for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
                var layer = layers_1[_i];
                if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                    this.hitTest(layer, x, y, minDistance);
                }
                if (layer.childLayers.length > 0) {
                    this.hitTestRecursive(layer.childLayers, x, y, minDistance);
                }
            }
        };
        HitTest_LinePointBase.prototype.hitTest_LineRectangle = function (line, x, y, minDistance) {
            return (x >= line.left - minDistance
                && x <= line.right + minDistance
                && y >= line.top - minDistance
                && y <= line.bottom + minDistance);
        };
        HitTest_LinePointBase.prototype.processHitTestToLine = function (group, line, x, y, minDistance) {
        };
        return HitTest_LinePointBase;
    }(HitTest_VectorLayer_Base));
    ManualTracingTool.HitTest_LinePointBase = HitTest_LinePointBase;
    var HitTest_LinePoint_PointToPointByDistance = /** @class */ (function (_super) {
        __extends(HitTest_LinePoint_PointToPointByDistance, _super);
        function HitTest_LinePoint_PointToPointByDistance() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HitTest_LinePoint_PointToPointByDistance.prototype.processHitTestToLine = function (group, line, x, y, minDistance) {
            this.exitPointHitTest = false;
            for (var i = 0; i < line.points.length; i++) {
                var point = line.points[i];
                var distance2d = Math.pow(x - point.location[0], 2) + Math.pow(y - point.location[1], 2);
                if (distance2d < minDistance) {
                    this.onPointHited(line, point);
                }
                if (this.exitPointHitTest) {
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
        HitTest_Line_PointToLineByDistance.prototype.processHitTestToLine = function (group, line, x, y, minDistance) {
            this.exitPointHitTest = false;
            for (var i = 0; i + 1 < line.points.length; i++) {
                var point1 = line.points[i];
                var point2 = line.points[i + 1];
                var distance2d = ManualTracingTool.Logic_Points.pointToLineSegmentDistanceSQ(point1.location, point2.location, x, y);
                if (distance2d < minDistance) {
                    this.onLineSegmentHited(line, point1, point2);
                }
                else {
                    this.onLineSegmentNotHited(line, point1, point2);
                }
                if (this.exitPointHitTest) {
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
        HitTest_Line_PointToLineByDistanceSingle.prototype.onLineSegmentHited = function (line, point1, point2) {
            this.hitedLine = line;
            this.exitPointHitTest = true;
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
        HitTest_Line_IsCloseToMouse.prototype.onLineSegmentHited = function (line, point1, point2) {
            if (!line.isCloseToMouse) {
                this.isChanged = true;
            }
            line.isCloseToMouse = true;
            this.exitPointHitTest = true;
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
})(ManualTracingTool || (ManualTracingTool = {}));
