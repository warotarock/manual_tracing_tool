
namespace ManualTracingTool {

    export class Logic_Edit_Line {

        static calcParameters(line: VectorLine) {

            // Calculate rectangle area
            let minX = 999999.0;
            let minY = 999999.0;

            let maxX = -999999.0;
            let maxY = -999999.0;

            for (let i = 0; i < line.points.length; i++) {

                let point1 = line.points[i];

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
            let totalLength = 0.0;
            for (let i = 1; i < line.points.length; i++) {

                let point1 = line.points[i];
                let point2 = line.points[i - 1];

                totalLength += vec3.distance(point1.location, point2.location);

                point1.totalLength = totalLength;
            }

            line.totalLength = totalLength;

            // Calculate curvature
            for (let i = 1; i + 1 < line.points.length; i++) {

                let point1 = line.points[i - 1];
                let point2 = line.points[i];
                let point3 = line.points[i + 1];

                let angle = Logic_Points.angle(point1.location, point2.location, point3.location);

                point2.curvature = Math.PI - angle;
                if (point2.curvature >= Math.PI) {

                    point2.curvature = Math.PI * 2 - point2.curvature;
                }
            }
        }

        static smooth(line: VectorLine) {

            // Smoothing
            for (let i = 0; i < line.points.length; i++) {
                let point = line.points[i];

                vec3.copy(point.adjustedLocation, point.location);
                vec3.copy(point.tempLocation, point.location);
            }

            let iteration = 2;
            for (let count = 0; count < iteration; count++) {

                for (let i = 0; i + 2 < line.points.length; i++) {

                    let point1 = line.points[i];
                    let point2 = line.points[i + 1];
                    let point3 = line.points[i + 2];

                    Logic_Edit_Line.calcBezier2d(
                        point2.adjustedLocation
                        , point1.tempLocation
                        , point2.tempLocation
                        , point3.tempLocation
                        , 0.5
                    );
                }

                for (let i = 0; i + 2 < line.points.length; i++) {

                    let point2 = line.points[i + 1];

                    vec3.copy(point2.tempLocation, point2.adjustedLocation);
                }
            }

            Logic_Edit_Line.applyAdjustments(line);

            Logic_Edit_Line.calcParameters(line)
        }

        private static calcBezier2d(result: Vec3, p0: Vec3, p1: Vec3, p2: Vec3, t: float) {

            let px = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
            let py = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];

            vec3.set(result, px, py, 0.0);
        }

        private static gaussian(x: float, eRange: float): float {

            let d = eRange * eRange;
            let timeScale = 0.5;
            let r = 1 + 2 * x;

            return Math.exp(-timeScale * r * r / d);
        }

        static applyAdjustments(line: VectorLine) {

            for (let point of line.points) {

                vec3.copy(point.location, point.adjustedLocation)
            }
        }
    }
}
