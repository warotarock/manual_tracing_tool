
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

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint, x: float, y: float, minDistance: float, distanceSQ: float) { // @virtual

        }

        protected onLineSegmentNotHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @virtual

        }
    }

    export interface IHitTest_VectorLayerLinePoint {

        startProcess();
        processLayer(geometry: VectorLayerGeometry, x: float, y: float, minDistance: float);
        endProcess();
    }

    export class HitTest_LinePointBase extends HitTest_VectorLayer_Base implements IHitTest_VectorLayerLinePoint {

        processLayer(geometry: VectorLayerGeometry, x: float, y: float, minDistance: float) {

            this.hitTest(geometry, x, y, minDistance * minDistance);
        }

        startProcess() {

            this.existsPointHitTest = false;

            this.beforeHitTest();
        }

        endProcess() {

            this.afterHitTest();
        }

        protected hitTest(geometry: VectorLayerGeometry, x: float, y: float, minDistance: float) {

            this.beforeHitTestToLayer(geometry);

            for (let group of geometry.groups) {

                this.beforeHitTestToGroup(geometry, group);

                for (let line of group.lines) {

                    this.beforeHitTestToLine(group, line);

                    if (this.hitTest_LineRectangle(line, x, y, minDistance)) {

                        this.processHitTestToLine(group, line, x, y, minDistance);
                    }

                    this.afterHitTestToLine(group, line);
                }

                this.afterHitTestToGroup(geometry, group);
            }

            this.afterHitTestToLayer(geometry);
        }

        protected hitTest_LineRectangle(line: VectorLine, x: float, y: float, minDistance: float): boolean {

            return (x >= line.left - minDistance
                && x <= line.right + minDistance
                && y >= line.top - minDistance
                && y <= line.bottom + minDistance);
        }

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, x: float, y: float, minDistance: float) { // @virtual

        }
    }

    export class HitTest_LinePoint_PointToPointByDistance extends HitTest_LinePointBase {

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, x: float, y: float, minDistance: float) { // @override

            this.existsPointHitTest = false;

            for (let i = 0; i < line.points.length; i++) {

                let point = line.points[i];

                let distance2d = Math.pow(x - point.location[0], 2) + Math.pow(y - point.location[1], 2);

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

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, x: float, y: float, minDistance: float) { // @override

            this.existsPointHitTest = false;

            for (let i = 0; i + 1 < line.points.length; i++) {

                let point1 = line.points[i];
                let point2 = line.points[i + 1];

                let distanceSQ = Logic_Points.pointToLineSegmentDistanceSQ(
                    point1.location,
                    point2.location,
                    x, y
                );

                if (distanceSQ < minDistance) {

                    this.onLineSegmentHited(line, point1, point2, x, y, Math.sqrt(minDistance), distanceSQ);
                }
                else {

                    this.onLineSegmentNotHited(line, point1, point2);
                }

                if (this.existsPointHitTest) {
                    break;
                }
            }
        }
    }

    export class HitTest_Line_PointToLineByDistanceSingle extends HitTest_Line_PointToLineByDistance {

        hitedLine: VectorLine = null;

        protected beforeHitTest() { // @override

            this.hitedLine = null;
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint, x: float, y: float, minDistance: float, distanceSQ: float) { // @override

            this.hitedLine = line;

            this.existsPointHitTest = true;
        }
    }

    export class HitTest_Line_IsCloseToMouse extends HitTest_Line_PointToLineByDistance {

        isChanged = false;

        protected beforeHitTest() { // @override

            this.isChanged = false;
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint, x: float, y: float, minDistance: float, distanceSQ: float) { // @override

            if (!line.isCloseToMouse) {

                this.isChanged = true;
            }

            line.isCloseToMouse = true;

            this.existsPointHitTest = true;
        }

        protected onLineSegmentNotHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            if (line.isCloseToMouse) {

                this.isChanged = true;
            }

            line.isCloseToMouse = false;
        }
    }
}
