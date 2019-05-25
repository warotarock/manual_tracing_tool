
namespace ManualTracingTool {

    export class HitTest_VectorLayer_Base {

        existsPointHitTest = false;

        protected beforeHitTest() { // @virtual

        }

        protected afterHitTest() { // @virtual

        }

        protected beforeHitTestToLayer(geometry: VectorLayerGeometry) { // @virtual

        }

        protected afterHitTestToLayer(geometry: VectorLayerGeometry) { // @virtual

        }

        protected beforeHitTestToGroup(geometry: VectorLayerGeometry, group: VectorGroup) { // @virtual

        }

        protected afterHitTestToGroup(geometry: VectorLayerGeometry, group: VectorGroup) { // @virtual

        }

        protected beforeHitTestToLine(group: VectorGroup, line: VectorLine) { // @virtual

        }

        protected afterHitTestToLine(group: VectorGroup, line: VectorLine) { // @virtual

        }

        protected onPointHited(group: VectorGroup, line: VectorLine, point: LinePoint) { // @virtual

        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint, location: Vec3, minDistance: float, distanceSQ: float) { // @virtual

        }

        protected onLineSegmentNotHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @virtual

        }

        protected onLineHited(line: VectorLine) { // @virtual

        }

        protected onLineNotHited(line: VectorLine) { // @virtual

        }
    }

    export interface IHitTest_VectorLayerLinePoint {

        startProcess();
        processLayer(geometry: VectorLayerGeometry, location: Vec3, minDistance: float);
        endProcess();
    }

    export class HitTest_LinePointBase extends HitTest_VectorLayer_Base implements IHitTest_VectorLayerLinePoint {

        processLayer(geometry: VectorLayerGeometry, location: Vec3, minDistance: float) {

            this.hitTest(geometry, location, minDistance * minDistance);
        }

        startProcess() {

            this.existsPointHitTest = false;

            this.beforeHitTest();
        }

        endProcess() {

            this.afterHitTest();
        }

        protected hitTest(geometry: VectorLayerGeometry, location: Vec3, minDistance: float) {

            this.beforeHitTestToLayer(geometry);

            for (let group of geometry.groups) {

                this.beforeHitTestToGroup(geometry, group);

                for (let line of group.lines) {

                    this.beforeHitTestToLine(group, line);

                    if (this.hitTest_LineRectangle(line, location, minDistance)) {

                        this.processHitTestToLine(group, line, location, minDistance);
                    }

                    this.afterHitTestToLine(group, line);
                }

                this.afterHitTestToGroup(geometry, group);
            }

            this.afterHitTestToLayer(geometry);
        }

        protected hitTest_LineRectangle(line: VectorLine, location: Vec3, minDistance: float): boolean {

            return HitTest_Line.hitTestLocationToLineByRectangle(location, line, minDistance);
        }

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, location: Vec3, minDistance: float) { // @virtual

        }
    }

    export class HitTest_LinePoint_PointToPointByDistance extends HitTest_LinePointBase {

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, location: Vec3, minDistance: float) { // @override

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
        }
    }

    export class HitTest_Line_PointToLineByDistance extends HitTest_LinePointBase {

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, location: Vec3, minDistance: float) { // @override

            this.existsPointHitTest = false;

            let lineHited = false;

            for (let i = 0; i + 1 < line.points.length; i++) {

                let point1 = line.points[i];
                let point2 = line.points[i + 1];

                let distanceSQ = Logic_Points.pointToLineSegmentDistanceSQ(
                    point1.location,
                    point2.location,
                    location[0], location[1]
                );

                if (distanceSQ < minDistance) {

                    this.onLineSegmentHited(line, point1, point2, location, Math.sqrt(minDistance), distanceSQ);
                    lineHited = true;
                }
                else {

                    this.onLineSegmentNotHited(line, point1, point2);
                }

                if (this.existsPointHitTest) {
                    break;
                }
            }

            if (lineHited) {

                this.onLineHited(line);
            }
            else {

                this.onLineNotHited(line);
            }
        }
    }

    export class HitTest_Line_PointToLineByDistanceSingle extends HitTest_Line_PointToLineByDistance {

        hitedLine: VectorLine = null;

        protected beforeHitTest() { // @override

            this.hitedLine = null;
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint, location: Vec3, minDistance: float, distanceSQ: float) { // @override

            this.hitedLine = line;

            this.existsPointHitTest = true;
        }
    }

    export class HitTest_Line_IsCloseToMouse extends HitTest_Line_PointToLineByDistance {

        isChanged = false;

        protected beforeHitTest() { // @override

            this.isChanged = false;
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint, location: Vec3, minDistance: float, distanceSQ: float) { // @override

            // to stop hit test early
            this.existsPointHitTest = true;
        }

        protected onLineHited(line: VectorLine) { // @override

            if (!line.isCloseToMouse) {

                this.isChanged = true;
            }

            line.isCloseToMouse = true;
        }

        protected onLineNotHited(line: VectorLine) { // @override

            if (line.isCloseToMouse) {

                this.isChanged = true;
            }

            line.isCloseToMouse = false;
        }
    }

    export class HitTest_Line {

        public static MaxDistance = 999999.0;
        public static InvalidDistance = -1.0;
        public static InvalidIndex = -1;

        public static getNearestSegmentIndex(targetLine: VectorLine, location: Vec3): int {

            let minDistance = HitTest_Line.MaxDistance;
            let nearestSegmentIndex = HitTest_Line.InvalidIndex;

            for (let i = 0; i < targetLine.points.length - 1; i++) {

                let editPoint1 = targetLine.points[i];
                let editPoint2 = targetLine.points[i + 1];

                let distance = Logic_Points.pointToLineSegment_SorroundingDistance(
                    editPoint1.location,
                    editPoint2.location,
                    location
                );

                if (distance < minDistance) {

                    minDistance = distance;
                    nearestSegmentIndex = i;
                }
            }

            return nearestSegmentIndex;
        }

        public static hitTestLocationToLineByRectangle(location: Vec3, line: VectorLine, minDistance: float): boolean {

            return (location[0] >= line.left - minDistance
                && location[0] <= line.right + minDistance
                && location[1] >= line.top - minDistance
                && location[1] <= line.bottom + minDistance);
        }

        public static hitTestLineToLineByRectangle(line1: VectorLine, line2: VectorLine): boolean {

            let centerX1 = (line1.left + line1.right) / 2.0;
            let centerY1 = (line1.top + line1.bottom) / 2.0;

            let centerX2 = (line2.left + line2.right) / 2.0;
            let centerY2 = (line2.top + line2.bottom) / 2.0;

            let widthHalf = (line1.right - line1.left) / 2.0 + (line2.right - line2.left) / 2.0;
            let heightHalf = (line1.bottom - line1.top) / 2.0 + (line2.bottom - line2.top) / 2.0;

            return (centerX2 >= centerX1 - widthHalf
                && centerX2 <= centerX1 + widthHalf
                && centerY2 >= centerY1 - heightHalf
                && centerY2 <= centerY1 + heightHalf
            );
        }
    }
}
