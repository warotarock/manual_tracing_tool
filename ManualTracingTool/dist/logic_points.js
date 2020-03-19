var ManualTracingTool;
(function (ManualTracingTool) {
    var Logic_Points = /** @class */ (function () {
        function Logic_Points() {
        }
        // 3 points angle calculation
        Logic_Points.angle = function (firstPoint, centerPoint, lastPoint) {
            var v0_x = lastPoint[0] - centerPoint[0];
            var v0_y = lastPoint[1] - centerPoint[1];
            var v1_x = firstPoint[0] - centerPoint[0];
            var v1_y = firstPoint[1] - centerPoint[1];
            var angle = Math.atan2(v0_x * v1_y - v1_x * v0_y, v0_x * v1_x + v0_y * v1_y);
            return angle;
        };
        // Point to line segment: distance calculation
        Logic_Points.pointToLineSegmentDistanceSQ = function (point1, point2, x, y) {
            return ManualTracingTool.Maths.pointToLineSegment_Distance(x, y, point1[0], point1[1], point2[0], point2[1]);
        };
        Logic_Points.pointToLineSegment_SorroundingDistance = function (point1, point2, targetPoint) {
            var distanceSQ = this.pointToLineSegmentDistanceSQ(point1, point2, targetPoint[0], targetPoint[1]);
            return Math.sqrt(distanceSQ);
        };
        // Point to line segment: if targetPoint is before point1, return value is < 0.0, if targetPoint is agter point2, retuen value is > 1.0
        Logic_Points.pointToLineSegment_NormalizedPosition = function (point1, point2, targetPoint) {
            return ManualTracingTool.Maths.pointToLine_NearestPointNormalizedPosition(targetPoint[0], targetPoint[1], point1[0], point1[1], point2[0], point2[1]);
        };
        // Point to endless line: distance calculation
        Logic_Points.pointToLine_Distance = function (targetPoint, point1, point2) {
            return ManualTracingTool.Maths.pointToLine_Distance(targetPoint[0], targetPoint[1], point1[0], point1[1], point2[0], point2[1]);
        };
        // Point to endless line: nearest location calculation
        Logic_Points.pointToLine_NearestLocation = function (result, linePoint1, linePoint2, targetPoint) {
            return ManualTracingTool.Maths.pointToLine_NearestPoint(result, targetPoint[0], targetPoint[1], linePoint1[0], linePoint1[1], linePoint2[0], linePoint2[1]) != null;
        };
        return Logic_Points;
    }());
    ManualTracingTool.Logic_Points = Logic_Points;
})(ManualTracingTool || (ManualTracingTool = {}));