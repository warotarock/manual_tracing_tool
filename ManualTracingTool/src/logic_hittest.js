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
    var HitTest_LinePoint_LocationalDistanceBase = /** @class */ (function (_super) {
        __extends(HitTest_LinePoint_LocationalDistanceBase, _super);
        function HitTest_LinePoint_LocationalDistanceBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HitTest_LinePoint_LocationalDistanceBase.prototype.processLayer = function (layer, x, y, minDistance) {
            this.startProcess();
            this.hitTest(layer, x, y, minDistance * minDistance);
            this.endProcess();
        };
        HitTest_LinePoint_LocationalDistanceBase.prototype.processLayerRecursive = function (layers, x, y, minDistance) {
            this.startProcess();
            this.hitTestRecursive(layers, x, y, minDistance * minDistance);
            this.endProcess();
        };
        HitTest_LinePoint_LocationalDistanceBase.prototype.startProcess = function () {
            this.exitPointHitTest = false;
            this.beforeHitTest();
        };
        HitTest_LinePoint_LocationalDistanceBase.prototype.endProcess = function () {
            this.afterHitTest();
        };
        HitTest_LinePoint_LocationalDistanceBase.prototype.hitTest = function (layer, x, y, minDistance) {
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
        HitTest_LinePoint_LocationalDistanceBase.prototype.hitTestRecursive = function (layers, x, y, minDistance) {
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
        HitTest_LinePoint_LocationalDistanceBase.prototype.hitTest_LineRectangle = function (line, x, y, minDistance) {
            return (x >= line.minX - minDistance
                && x <= line.maxX + minDistance
                && y >= line.minY - minDistance
                && y <= line.maxY + minDistance);
        };
        HitTest_LinePoint_LocationalDistanceBase.prototype.processHitTestToLine = function (group, line, x, y, minDistance) {
        };
        return HitTest_LinePoint_LocationalDistanceBase;
    }(HitTest_VectorLayer_Base));
    ManualTracingTool.HitTest_LinePoint_LocationalDistanceBase = HitTest_LinePoint_LocationalDistanceBase;
    var HitTest_LinePoint_PointDistanceBase = /** @class */ (function (_super) {
        __extends(HitTest_LinePoint_PointDistanceBase, _super);
        function HitTest_LinePoint_PointDistanceBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HitTest_LinePoint_PointDistanceBase.prototype.processHitTestToLine = function (group, line, x, y, minDistance) {
            this.exitPointHitTest = false;
            for (var i = 0; i < line.points.length; i++) {
                var point = line.points[i];
                var distance2d = Math.pow(x - point.adjustedLocation[0], 2) + Math.pow(y - point.adjustedLocation[1], 2);
                if (distance2d < minDistance) {
                    this.onPointHited(line, point);
                }
                if (this.exitPointHitTest) {
                    break;
                }
            }
        };
        return HitTest_LinePoint_PointDistanceBase;
    }(HitTest_LinePoint_LocationalDistanceBase));
    ManualTracingTool.HitTest_LinePoint_PointDistanceBase = HitTest_LinePoint_PointDistanceBase;
    var HitTest_LinePoint_LineDistanceBase = /** @class */ (function (_super) {
        __extends(HitTest_LinePoint_LineDistanceBase, _super);
        function HitTest_LinePoint_LineDistanceBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HitTest_LinePoint_LineDistanceBase.prototype.processHitTestToLine = function (group, line, x, y, minDistance) {
            this.exitPointHitTest = false;
            for (var i = 0; i + 1 < line.points.length; i++) {
                var point1 = line.points[i];
                var point2 = line.points[i + 1];
                var distance2d = ManualTracingTool.Logic_Points.pointToLineSegmentDistanceSQ(point1.adjustedLocation, point2.adjustedLocation, x, y);
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
        return HitTest_LinePoint_LineDistanceBase;
    }(HitTest_LinePoint_LocationalDistanceBase));
    ManualTracingTool.HitTest_LinePoint_LineDistanceBase = HitTest_LinePoint_LineDistanceBase;
    var HitTest_LinePoint_LineSingleHitTest = /** @class */ (function (_super) {
        __extends(HitTest_LinePoint_LineSingleHitTest, _super);
        function HitTest_LinePoint_LineSingleHitTest() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.hitedLine = null;
            return _this;
        }
        HitTest_LinePoint_LineSingleHitTest.prototype.beforeHitTest = function () {
            this.hitedLine = null;
        };
        HitTest_LinePoint_LineSingleHitTest.prototype.onLineSegmentHited = function (line, point1, point2) {
            this.hitedLine = line;
            this.exitPointHitTest = true;
        };
        return HitTest_LinePoint_LineSingleHitTest;
    }(HitTest_LinePoint_LineDistanceBase));
    ManualTracingTool.HitTest_LinePoint_LineSingleHitTest = HitTest_LinePoint_LineSingleHitTest;
})(ManualTracingTool || (ManualTracingTool = {}));
