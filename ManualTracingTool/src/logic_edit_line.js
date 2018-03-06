var ManualTracingTool;
(function (ManualTracingTool) {
    var Logic_VectorLayer = /** @class */ (function () {
        function Logic_VectorLayer() {
        }
        Logic_VectorLayer.clearLayerModifyFlags = function (layer) {
            for (var _i = 0, _a = layer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                this.clearGroupModifyFlags(group);
            }
        };
        Logic_VectorLayer.clearGroupModifyFlags = function (group) {
            group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                var line = _a[_i];
                this.clearLineModifyFlags(line);
            }
        };
        Logic_VectorLayer.clearLineModifyFlags = function (line) {
            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
            }
        };
        Logic_VectorLayer.fillLayerDeleteFlags = function (layer, forceDelete) {
            for (var _i = 0, _a = layer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                this.fillGroupDeleteFlags(group, forceDelete);
            }
        };
        Logic_VectorLayer.fillGroupDeleteFlags = function (group, forceDelete) {
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
        Logic_VectorLayer.fillLineDeleteFlags = function (line, forceDelete) {
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
        return Logic_VectorLayer;
    }());
    ManualTracingTool.Logic_VectorLayer = Logic_VectorLayer;
    var Logic_Edit_Line = /** @class */ (function () {
        function Logic_Edit_Line() {
        }
        Logic_Edit_Line.calcParameters = function (line) {
            // Calculate rectangle area
            var minX = 999999.0;
            var minY = 999999.0;
            var maxX = -999999.0;
            var maxY = -999999.0;
            for (var i = 0; i < line.points.length; i++) {
                var point1 = line.points[i];
                minX = Math.min(point1.location[0], minX);
                minY = Math.min(point1.location[1], minY);
                maxX = Math.max(point1.location[0], maxX);
                maxY = Math.max(point1.location[1], maxY);
            }
            line.minX = minX;
            line.minY = minY;
            line.maxX = maxX;
            line.maxY = maxY;
            // Calculate point positon in length
            var totalLength = 0.0;
            for (var i = 1; i < line.points.length; i++) {
                var point1 = line.points[i];
                var point2 = line.points[i - 1];
                totalLength += vec3.distance(point1.location, point2.location);
                point1.totalLength = totalLength;
            }
            line.totalLength = totalLength;
            // Calculate curvature
            for (var i = 1; i + 1 < line.points.length; i++) {
                var point1 = line.points[i - 1];
                var point2 = line.points[i];
                var point3 = line.points[i + 1];
                var angle = ManualTracingTool.Logic_Points.angle(point1.location, point2.location, point3.location);
                point2.curvature = Math.PI - angle;
                if (point2.curvature >= Math.PI) {
                    point2.curvature = Math.PI * 2 - point2.curvature;
                }
            }
        };
        Logic_Edit_Line.smooth = function (line) {
            // Smoothing
            for (var i = 0; i < line.points.length; i++) {
                var point = line.points[i];
                vec3.copy(point.adjustedLocation, point.location);
                vec3.copy(point.tempLocation, point.location);
            }
            var iteration = 2;
            for (var count = 0; count < iteration; count++) {
                for (var i = 0; i + 2 < line.points.length; i++) {
                    var point1 = line.points[i];
                    var point2 = line.points[i + 1];
                    var point3 = line.points[i + 2];
                    Logic_Edit_Line.calcBezier2d(point2.adjustedLocation, point1.tempLocation, point2.tempLocation, point3.tempLocation, 0.5);
                }
                for (var i = 0; i + 2 < line.points.length; i++) {
                    var point2 = line.points[i + 1];
                    vec3.copy(point2.tempLocation, point2.adjustedLocation);
                }
            }
            Logic_Edit_Line.applyAdjustments(line);
            Logic_Edit_Line.calcParameters(line);
        };
        Logic_Edit_Line.calcBezier2d = function (result, p0, p1, p2, t) {
            var px = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
            var py = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
            vec3.set(result, px, py, 0.0);
        };
        Logic_Edit_Line.gaussian = function (x, eRange) {
            var d = eRange * eRange;
            var timeScale = 0.5;
            var r = 1 + 2 * x;
            return Math.exp(-timeScale * r * r / d);
        };
        Logic_Edit_Line.applyAdjustments = function (line) {
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                vec3.copy(point.location, point.adjustedLocation);
            }
        };
        return Logic_Edit_Line;
    }());
    ManualTracingTool.Logic_Edit_Line = Logic_Edit_Line;
})(ManualTracingTool || (ManualTracingTool = {}));
