
namespace ManualTracingTool {

    export class Maths {

        static clamp(x: float, a: float, b: float): float {

            return (x < a ? a : (x > b ? b : x));
        }

        static lerp(x: float, a: float, b: float): float {

            return a + x * (b - a);
        }

        static fract(x: float): float {

            return x - Math.floor(x);
        }

        static step(edge: float, x: float): float {

            return x < edge ? 0.0 : 1.0;
        }

        static smoothstep(edge0: float, edge1: float, x: float): float {

            let t = Maths.clamp((x - edge0) / (edge1 - edge0), 0, 1);

            return t * t * (3 - 2 * t);
        }

        static pointToLineSegment_Distance(x0: float, y0: float, x1: float, y1: float, x2: float, y2: float): float {

            // from: https://qiita.com/yellow_73/items/bcd4e150e7caa0210ee6

            var a = x2 - x1;
            var b = y2 - y1;
            var a2 = a * a;
            var b2 = b * b;
            var r2 = a2 + b2;
            var tt = -(a * (x1 - x0) + b * (y1 - y0));

            if (tt < 0) {
                return (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
            }
            if (tt > r2) {
                return (x2 - x0) * (x2 - x0) + (y2 - y0) * (y2 - y0);

            }
            var f1 = a * (y1 - y0) - b * (x1 - x0);

            return (f1 * f1) / r2;
        }

        static pointToLine_Distance(P_x: float, P_y: float, A_x: float, A_y: float, B_x: float, B_y: float): float {

            // from: http://www.sousakuba.com/Programming/gs_dot_line_distance.html

            let AB_x = B_x - A_x;
            let AB_y = B_y - A_y;
            let AP_x = P_x - A_x;
            let AP_y = P_y - A_y;

            //ベクトルAB、APの外積の絶対値が平行四辺形Dの面積になる
            let D = Math.abs(AB_x * AP_y - AB_y * AP_x);

            let L = Math.sqrt((B_x - A_x) * (B_x - A_x) + (B_y - A_y) * (B_y - A_y));	//AB間の距離

            let H = D / L;

            return H;
        }

        static pointToLine_NearestPointNormalizedPosition(P_x: float, P_y: float, A_x: float, A_y: float, B_x: float, B_y: float): float {

            // from: http://www.sousakuba.com/Programming/gs_near_pos_on_line.html

            let AB_x = B_x - A_x;
            let AB_y = B_y - A_y;
            let AP_x = P_x - A_x;
            let AP_y = P_y - A_y;

            //ABの単位ベクトルを計算
            let len = Math.sqrt(AB_x * AB_x + AB_y * AB_y);
            if (len <= 0.0) {
                return null;
            }
            let nAB_x = AB_x / len;
            let nAB_y = AB_y / len;

            //Aから線上最近点までの距離（ABベクトルの後ろにあるときはマイナス値）
            let dist_AX = (nAB_x * AP_x + nAB_y * AP_y);

            return dist_AX / len;
        }

        static pointToLine_NearestPoint(result: Vec3, P_x: float, P_y: float, A_x: float, A_y: float, B_x: float, B_y: float): Vec3 {

            // from: http://www.sousakuba.com/Programming/gs_near_pos_on_line.html

            let AB_x = B_x - A_x;
            let AB_y = B_y - A_y;
            let AP_x = P_x - A_x;
            let AP_y = P_y - A_y;

            //ABの単位ベクトルを計算
            let len = Math.sqrt(AB_x * AB_x + AB_y * AB_y);
            if (len <= 0.0) {
                return null;
            }
            let nAB_x = AB_x / len;
            let nAB_y = AB_y / len;

            //Aから線上最近点までの距離（ABベクトルの後ろにあるときはマイナス値）
            let dist_AX = (nAB_x * AP_x + nAB_y * AP_y);

            //線上最近点
            result[0] = A_x + (nAB_x * dist_AX);
            result[1] = A_y + (nAB_y * dist_AX);

            return result;
        }

        static getTranslationMat4(result: Vec3, matrix: Mat4) {

            result[0] = matrix[12];
            result[1] = matrix[13];
            result[2] = matrix[14];
        }

        static mat4SetVectors(result: Mat4, vecX: Vec3, vecY: Vec3, vecZ: Vec3) {

            result[0] = vecX[0];
            result[1] = vecX[1];
            result[2] = vecX[2];
            result[3] = 0.0;

            result[4] = vecY[0];
            result[5] = vecY[1];
            result[6] = vecY[2];
            result[7] = 0.0;

            result[8] = vecZ[0];
            result[9] = vecZ[1];
            result[10] = vecZ[2];
            result[11] = 0.0;
        }

        static mat4SegmentMat(result: Mat4, resultNormalVec: Vec4, locationFrom: Vec3, locationTo: Vec3) {

            vec3.subtract(resultNormalVec, locationTo, locationFrom);
            vec3.normalize(resultNormalVec, resultNormalVec);

            result[0] = resultNormalVec[0];
            result[1] = resultNormalVec[1];
            result[2] = 0.0;
            result[3] = 0.0;

            result[4] = -resultNormalVec[1];
            result[5] = resultNormalVec[0];
            result[6] = 0.0;
            result[7] = 0.0;

            result[8] = 0.0;
            result[9] = 0.0;
            result[10] = 1.0;
            result[11] = 1.0;

            result[12] = locationFrom[0];
            result[13] = locationFrom[1];
            result[14] = 0.0;
            result[15] = 1.0;
        }

        private static hsvToRGB_Element(h: float, s: float, v: float, baseElement: float): float {

            return ((Maths.clamp(Math.abs(Maths.fract(h + baseElement / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
        }

        static hsvToRGB(out: Vec4, h: float, s: float, v: float) {

            out[0] = Maths.hsvToRGB_Element(h, s, v, 0.0);
            out[1] = Maths.hsvToRGB_Element(h, s, v, 2.0);
            out[2] = Maths.hsvToRGB_Element(h, s, v, 1.0);
        }

        private static rgbToHSV_K = vec4.fromValues(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        private static rgbToHSV_Kxy = vec4.create();
        private static rgbToHSV_bgKwz = vec4.create();
        private static rgbToHSV_gbKxy = vec4.create();
        private static rgbToHSV_p = vec4.create();
        private static rgbToHSV_Pxywr = vec4.create();
        private static rgbToHSV_rPyzx = vec4.create();
        private static rgbToHSV_q = vec4.create();

        static rgbToHSV(result: Vec4, r: float, g: float, b: float) {

            // vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            let Kx = 0.0;
            let Ky = -1.0 / 3.0;
            let Kz = 2.0 / 3.0;
            let Kw = -1.0;

            // vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4.set(this.rgbToHSV_bgKwz, b, g, Kw, Kz);
            vec4.set(this.rgbToHSV_gbKxy, g, b, Kx, Ky);
            vec4.lerp(this.rgbToHSV_p, this.rgbToHSV_bgKwz, this.rgbToHSV_gbKxy, this.step(b, g));

            let px = this.rgbToHSV_p[0];
            let py = this.rgbToHSV_p[1];
            let pz = this.rgbToHSV_p[2];
            let pw = this.rgbToHSV_p[3];

            // vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
            vec4.set(this.rgbToHSV_Pxywr, px, py, pw, r);
            vec4.set(this.rgbToHSV_rPyzx, r, py, pz, px);
            vec4.lerp(this.rgbToHSV_q, this.rgbToHSV_Pxywr, this.rgbToHSV_rPyzx, this.step(px, r));

            let qx = this.rgbToHSV_q[0];
            let qy = this.rgbToHSV_q[1];
            let qz = this.rgbToHSV_q[2];
            let qw = this.rgbToHSV_q[3];

            // float d = q.x - min(q.w, q.y);
            let d = qx - Math.min(qw, qy);

            // float e = 1.0e-10;
            let e = 1.0e-10;

            // return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            result[0] = Math.abs(qz + (qw - qy) / (6.0 * d + e));
            result[1] = d / (qx + e);
            result[2] = qx;
        }
    }
}
