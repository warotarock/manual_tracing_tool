
namespace ManualTracingTool {

    export class HitTest_VectorLayer_Base {

        exitPointHitTest = false;

        protected beforeHitTest() { // @virtual

        }

        protected afterHitTest() { // @virtual

        }

        protected beforeHitTestToLayer(layer: VectorLayer) { // @virtual

        }

        protected afterHitTestToLayer(layer: VectorLayer) { // @virtual

        }

        protected beforeHitTestToGroup(layer: VectorLayer, group: VectorGroup) { // @virtual

        }

        protected afterHitTestToGroup(layer: VectorLayer, group: VectorGroup) { // @virtual

        }

        protected beforeHitTestToLine(group: VectorGroup, line: VectorLine) { // @virtual

        }

        protected afterHitTestToLine(group: VectorGroup, line: VectorLine) { // @virtual

        }

        protected onPointHited(line: VectorLine, point: LinePoint) { // @virtual

        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @virtual

        }

        protected onLineSegmentNotHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @virtual

        }
    }

    export interface IHitTest_VectorLayerLinePoint {

        startProcess();
        processLayer(layer: Layer, x: float, y: float, minDistance: float);
        processLayerRecursive(layers: List<Layer>, x: float, y: float, minDistance: float);
        endProcess();
    }

    export class HitTest_LinePointBase extends HitTest_VectorLayer_Base implements IHitTest_VectorLayerLinePoint {

        processLayer(layer: Layer, x: float, y: float, minDistance: float) {

            this.hitTest(layer, x, y, minDistance * minDistance);
        }

        processLayerRecursive(layers: List<Layer>, x: float, y: float, minDistance: float) {

            this.hitTestRecursive(layers, x, y, minDistance * minDistance);
        }

        startProcess() {

            this.exitPointHitTest = false;

            this.beforeHitTest();
        }

        endProcess() {

            this.afterHitTest();
        }

        protected hitTest(layer: Layer, x: float, y: float, minDistance: float) {

            let vectorLayer = <VectorLayer>layer;

            this.beforeHitTestToLayer(vectorLayer);

            for (let group of vectorLayer.groups) {

                this.beforeHitTestToGroup(vectorLayer, group);

                for (let line of group.lines) {

                    this.beforeHitTestToLine(group, line);

                    if (this.hitTest_LineRectangle(line, x, y, minDistance)) {

                        this.processHitTestToLine(group, line, x, y, minDistance);
                    }

                    this.afterHitTestToLine(group, line);
                }

                this.afterHitTestToGroup(vectorLayer, group);
            }

            this.afterHitTestToLayer(vectorLayer);
        }

        protected hitTestRecursive(layers: List<Layer>, x: float, y: float, minDistance: float) {

            for (let layer of layers) {

                if (layer.type == LayerTypeID.vectorLayer) {

                    this.hitTest(layer, x, y, minDistance);
                }

                if (layer.childLayers.length > 0) {

                    this.hitTestRecursive(layer.childLayers, x, y, minDistance);
                }
            }
        }

        protected hitTest_LineRectangle(line: VectorLine, x: float, y: float, minDistance: float): boolean {

            return (x >= line.minX - minDistance
                && x <= line.maxX + minDistance
                && y >= line.minY - minDistance
                && y <= line.maxY + minDistance);
        }

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, x: float, y: float, minDistance: float) { // @virtual

        }
    }

    export class HitTest_LinePoint_PointToPointByDistance extends HitTest_LinePointBase {

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, x: float, y: float, minDistance: float) { // @override

            this.exitPointHitTest = false;

            for (let i = 0; i < line.points.length; i++) {

                let point = line.points[i];

                let distance2d = Math.pow(x - point.adjustedLocation[0], 2) + Math.pow(y - point.adjustedLocation[1], 2);

                if (distance2d < minDistance) {

                    this.onPointHited(line, point);
                }

                if (this.exitPointHitTest) {
                    break;
                }
            }
        }
    }

    export class HitTest_Line_PointToLineByDistance extends HitTest_LinePointBase {

        protected processHitTestToLine(group: VectorGroup, line: VectorLine, x: float, y: float, minDistance: float) { // @override

            this.exitPointHitTest = false;

            for (let i = 0; i + 1 < line.points.length; i++) {

                let point1 = line.points[i];
                let point2 = line.points[i + 1];

                let distance2d = Logic_Points.pointToLineSegmentDistanceSQ(
                    point1.adjustedLocation,
                    point2.adjustedLocation,
                    x, y
                );

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
        }
    }

    export class HitTest_Line_PointToLineByDistanceSingle extends HitTest_Line_PointToLineByDistance {

        hitedLine: VectorLine = null;

        protected beforeHitTest() { // @override

            this.hitedLine = null;
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            this.hitedLine = line;

            this.exitPointHitTest = true;
        }
    }

    export class HitTest_Line_IsCloseToMouse extends HitTest_Line_PointToLineByDistance {

        isChanged = false;

        protected beforeHitTest() { // @override

            this.isChanged = false;
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            if (!line.isCloseToMouse) {

                this.isChanged = true;
            }

            line.isCloseToMouse = true;

            this.exitPointHitTest = true;
        }

        protected onLineSegmentNotHited(line: VectorLine, point1: LinePoint, point2: LinePoint) { // @override

            if (line.isCloseToMouse) {

                this.isChanged = true;
            }

            line.isCloseToMouse = false;
        }
    }
}
