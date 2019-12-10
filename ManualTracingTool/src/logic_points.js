var ManualTracingTool;
(function (ManualTracingTool) {
    class Logic_Points {
        // 3 points angle calculation
        static angle(firstPoint, centerPoint, lastPoint) {
            let v0_x = lastPoint[0] - centerPoint[0];
            let v0_y = lastPoint[1] - centerPoint[1];
            let v1_x = firstPoint[0] - centerPoint[0];
            let v1_y = firstPoint[1] - centerPoint[1];
            let angle = Math.atan2(v0_x * v1_y - v1_x * v0_y, v0_x * v1_x + v0_y * v1_y);
            return angle;
        }
        // Point to line segment: distance calculation
        static pointToLineSegmentDistanceSQ(point1, point2, x, y) {
            return ManualTracingTool.Maths.pointToLineSegment_Distance(x, y, point1[0], point1[1], point2[0], point2[1]);
        }
        static pointToLineSegment_SorroundingDistance(point1, point2, targetPoint) {
            let distanceSQ = this.pointToLineSegmentDistanceSQ(point1, point2, targetPoint[0], targetPoint[1]);
            return Math.sqrt(distanceSQ);
        }
        // Point to line segment: if targetPoint is before point1, return value is < 0.0, if targetPoint is agter point2, retuen value is > 1.0
        static pointToLineSegment_NormalizedPosition(point1, point2, targetPoint) {
            return ManualTracingTool.Maths.pointToLine_NearestPointNormalizedPosition(targetPoint[0], targetPoint[1], point1[0], point1[1], point2[0], point2[1]);
        }
        // Point to endless line: distance calculation
        static pointToLine_Distance(targetPoint, point1, point2) {
            return ManualTracingTool.Maths.pointToLine_Distance(targetPoint[0], targetPoint[1], point1[0], point1[1], point2[0], point2[1]);
        }
        // Point to endless line: nearest location calculation
        static pointToLine_NearestLocation(result, linePoint1, linePoint2, targetPoint) {
            return ManualTracingTool.Maths.pointToLine_NearestPoint(result, targetPoint[0], targetPoint[1], linePoint1[0], linePoint1[1], linePoint2[0], linePoint2[1]) != null;
        }
    }
    ManualTracingTool.Logic_Points = Logic_Points;
})(ManualTracingTool || (ManualTracingTool = {}));
