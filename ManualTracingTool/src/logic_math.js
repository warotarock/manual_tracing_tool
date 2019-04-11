var ManualTracingTool;
(function (ManualTracingTool) {
    var Maths = /** @class */ (function () {
        function Maths() {
        }
        Maths.clamp = function (x, a, b) {
            return (x < a ? a : (x > b ? b : x));
        };
        Maths.lerp = function (x, a, b) {
            return a + x * (b - a);
        };
        Maths.fract = function (x) {
            return x - Math.floor(x);
        };
        Maths.step = function (edge, x) {
            return x < edge ? 0.0 : 1.0;
        };
        Maths.smoothstep = function (edge0, edge1, x) {
            var t = Maths.clamp((x - edge0) / (edge1 - edge0), 0, 1);
            return t * t * (3 - 2 * t);
        };
        // xが0.0～1.0の間でだいたい0.0～1.0の値をとるシグモイド関数（やんわりと何かを変化させる用途）
        Maths.sigmoid10 = function (x) {
            var a = 1.0 / (1.0 + Math.exp(-20 * (x - 0.5)));
            return a;
        };
        // シグモイド関数の0.5以降の部分
        Maths.sigmoid10half = function (x) {
            return (Maths.sigmoid10(0.5 + x * 0.5) - 0.5) * 2.0;
        };
        Maths.pointToLineSegment_Distance = function (x0, y0, x1, y1, x2, y2) {
            // from: https://qiita.com/yellow_73/items/bcd4e150e7caa0210ee6
            var a = x2 - x1;
            var b = y2 - y1;
            var a2 = a * a;
            var b2 = b * b;
            var r2 = a2 + b2;
            if (r2 < 0.000001) {
                return (x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1);
            }
            var tt = -(a * (x1 - x0) + b * (y1 - y0));
            if (tt < 0) {
                return (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
            }
            if (tt > r2) {
                return (x2 - x0) * (x2 - x0) + (y2 - y0) * (y2 - y0);
            }
            var f1 = a * (y1 - y0) - b * (x1 - x0);
            return (f1 * f1) / r2;
        };
        Maths.pointToLine_Distance = function (P_x, P_y, A_x, A_y, B_x, B_y) {
            // from: http://www.sousakuba.com/Programming/gs_dot_line_distance.html
            var AB_x = B_x - A_x;
            var AB_y = B_y - A_y;
            var AP_x = P_x - A_x;
            var AP_y = P_y - A_y;
            //ベクトルAB、APの外積の絶対値が平行四辺形Dの面積になる
            var D = Math.abs(AB_x * AP_y - AB_y * AP_x);
            var L = Math.sqrt((B_x - A_x) * (B_x - A_x) + (B_y - A_y) * (B_y - A_y)); //AB間の距離
            var H = D / L;
            return H;
        };
        Maths.pointToLine_NearestPointNormalizedPosition = function (P_x, P_y, A_x, A_y, B_x, B_y) {
            // from: http://www.sousakuba.com/Programming/gs_near_pos_on_line.html
            var AB_x = B_x - A_x;
            var AB_y = B_y - A_y;
            var AP_x = P_x - A_x;
            var AP_y = P_y - A_y;
            //ABの単位ベクトルを計算
            var len = Math.sqrt(AB_x * AB_x + AB_y * AB_y);
            if (len <= 0.0) {
                return null;
            }
            var nAB_x = AB_x / len;
            var nAB_y = AB_y / len;
            //Aから線上最近点までの距離（ABベクトルの後ろにあるときはマイナス値）
            var dist_AX = (nAB_x * AP_x + nAB_y * AP_y);
            return dist_AX / len;
        };
        Maths.pointToLine_NearestPoint = function (result, P_x, P_y, A_x, A_y, B_x, B_y) {
            // from: http://www.sousakuba.com/Programming/gs_near_pos_on_line.html
            var AB_x = B_x - A_x;
            var AB_y = B_y - A_y;
            var AP_x = P_x - A_x;
            var AP_y = P_y - A_y;
            //ABの単位ベクトルを計算
            var len = Math.sqrt(AB_x * AB_x + AB_y * AB_y);
            if (len <= 0.0) {
                return null;
            }
            var nAB_x = AB_x / len;
            var nAB_y = AB_y / len;
            //Aから線上最近点までの距離（ABベクトルの後ろにあるときはマイナス値）
            var dist_AX = (nAB_x * AP_x + nAB_y * AP_y);
            //線上最近点
            result[0] = A_x + (nAB_x * dist_AX);
            result[1] = A_y + (nAB_y * dist_AX);
            return result;
        };
        Maths.getTranslationMat4 = function (result, matrix) {
            result[0] = matrix[12];
            result[1] = matrix[13];
            result[2] = matrix[14];
        };
        Maths.mat4SetVectors = function (result, vecX, vecY, vecZ) {
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
        };
        Maths.mat4SegmentMat = function (result, resultNormalVec, locationFrom, locationTo) {
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
        };
        Maths.hsvToRGB_Element = function (h, s, v, baseElement) {
            return ((Maths.clamp(Math.abs(Maths.fract(h + baseElement / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
        };
        Maths.hsvToRGB = function (out, h, s, v) {
            out[0] = Maths.hsvToRGB_Element(h, s, v, 0.0);
            out[1] = Maths.hsvToRGB_Element(h, s, v, 2.0);
            out[2] = Maths.hsvToRGB_Element(h, s, v, 1.0);
        };
        Maths.rgbToHSV = function (result, r, g, b) {
            // vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            var Kx = 0.0;
            var Ky = -1.0 / 3.0;
            var Kz = 2.0 / 3.0;
            var Kw = -1.0;
            // vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4.set(this.rgbToHSV_bgKwz, b, g, Kw, Kz);
            vec4.set(this.rgbToHSV_gbKxy, g, b, Kx, Ky);
            vec4.lerp(this.rgbToHSV_p, this.rgbToHSV_bgKwz, this.rgbToHSV_gbKxy, this.step(b, g));
            var px = this.rgbToHSV_p[0];
            var py = this.rgbToHSV_p[1];
            var pz = this.rgbToHSV_p[2];
            var pw = this.rgbToHSV_p[3];
            // vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
            vec4.set(this.rgbToHSV_Pxywr, px, py, pw, r);
            vec4.set(this.rgbToHSV_rPyzx, r, py, pz, px);
            vec4.lerp(this.rgbToHSV_q, this.rgbToHSV_Pxywr, this.rgbToHSV_rPyzx, this.step(px, r));
            var qx = this.rgbToHSV_q[0];
            var qy = this.rgbToHSV_q[1];
            var qz = this.rgbToHSV_q[2];
            var qw = this.rgbToHSV_q[3];
            // float d = q.x - min(q.w, q.y);
            var d = qx - Math.min(qw, qy);
            // float e = 1.0e-10;
            var e = 1.0e-10;
            // return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            result[0] = Math.abs(qz + (qw - qy) / (6.0 * d + e));
            result[1] = d / (qx + e);
            result[2] = qx;
        };
        Maths.rgbToHSV_K = vec4.fromValues(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        Maths.rgbToHSV_Kxy = vec4.create();
        Maths.rgbToHSV_bgKwz = vec4.create();
        Maths.rgbToHSV_gbKxy = vec4.create();
        Maths.rgbToHSV_p = vec4.create();
        Maths.rgbToHSV_Pxywr = vec4.create();
        Maths.rgbToHSV_rPyzx = vec4.create();
        Maths.rgbToHSV_q = vec4.create();
        return Maths;
    }());
    ManualTracingTool.Maths = Maths;
})(ManualTracingTool || (ManualTracingTool = {}));
