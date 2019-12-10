var ManualTracingTool;
(function (ManualTracingTool) {
    class ColorLogic {
        static floatToHex2String(v) {
            return (('00' + v.toString(16)).substr(-2));
        }
        static rgbToHex2String(color) {
            return (ColorLogic.floatToHex2String(Math.floor(color[0] * 255.0))
                + ColorLogic.floatToHex2String(Math.floor(color[1] * 255.0))
                + ColorLogic.floatToHex2String(Math.floor(color[2] * 255.0)));
        }
        static hex2StringToRGB(result, colorString) {
            result[0] = parseInt(colorString.substring(1, 3), 16) / 255.0;
            result[1] = parseInt(colorString.substring(3, 5), 16) / 255.0;
            result[2] = parseInt(colorString.substring(5, 7), 16) / 255.0;
            return result;
        }
        static hsvToRGB_Element(h, s, v, baseElement) {
            return ((ManualTracingTool.Maths.clamp(Math.abs(ManualTracingTool.Maths.fract(h + baseElement / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
        }
        static hsvToRGB(out, h, s, v) {
            out[0] = ColorLogic.hsvToRGB_Element(h, s, v, 0.0);
            out[1] = ColorLogic.hsvToRGB_Element(h, s, v, 2.0);
            out[2] = ColorLogic.hsvToRGB_Element(h, s, v, 1.0);
        }
        static hsvToRGBv(out, hsv) {
            ColorLogic.hsvToRGB(out, hsv[0], hsv[1], hsv[2]);
        }
        static rgbToHSV(result, r, g, b) {
            // vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            let Kx = 0.0;
            let Ky = -1.0 / 3.0;
            let Kz = 2.0 / 3.0;
            let Kw = -1.0;
            // vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4.set(this.rgbToHSV_bgKwz, b, g, Kw, Kz);
            vec4.set(this.rgbToHSV_gbKxy, g, b, Kx, Ky);
            vec4.lerp(this.rgbToHSV_p, this.rgbToHSV_bgKwz, this.rgbToHSV_gbKxy, ManualTracingTool.Maths.step(b, g));
            let px = this.rgbToHSV_p[0];
            let py = this.rgbToHSV_p[1];
            let pz = this.rgbToHSV_p[2];
            let pw = this.rgbToHSV_p[3];
            // vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
            vec4.set(this.rgbToHSV_Pxywr, px, py, pw, r);
            vec4.set(this.rgbToHSV_rPyzx, r, py, pz, px);
            vec4.lerp(this.rgbToHSV_q, this.rgbToHSV_Pxywr, this.rgbToHSV_rPyzx, ManualTracingTool.Maths.step(px, r));
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
        static rgbToHSVv(out, rgb) {
            ColorLogic.rgbToHSV(out, rgb[0], rgb[1], rgb[2]);
        }
    }
    //private static rgbToHSV_K = vec4.fromValues(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    //private static rgbToHSV_Kxy = vec4.create();
    ColorLogic.rgbToHSV_bgKwz = vec4.create();
    ColorLogic.rgbToHSV_gbKxy = vec4.create();
    ColorLogic.rgbToHSV_p = vec4.create();
    ColorLogic.rgbToHSV_Pxywr = vec4.create();
    ColorLogic.rgbToHSV_rPyzx = vec4.create();
    ColorLogic.rgbToHSV_q = vec4.create();
    ManualTracingTool.ColorLogic = ColorLogic;
})(ManualTracingTool || (ManualTracingTool = {}));
/*
static rgbToHSV(result: Vec4, rgb: Vec4) {

    // from: https://lab.syncer.jp/Web/JavaScript/Snippet/66/

    let r = rgb[0];
    let g = rgb[1];
    let b = rgb[2];

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let diff = max - min;

    let h = 0.0;

    switch (min) {
        case max:
            h = 0.0;
            break;

        case r:
            h = (60.0 * ((b - g) / diff)) + 180.0;
            break;

        case g:
            h = (60.0 * ((r - b) / diff)) + 300.0;
            break;

        case b:
            h = (60.0 * ((g - r) / diff)) + 60.0;
            break;
    }

    let s = (max == 0.0) ? 0.0 : (diff / max);
    let v = max;

    result[0] = h;
    result[1] = s;
    result[2] = v;
    result[3] = rgb[3];
}

static hsvToRGB(result: Vec4, hsv: Vec4) {

    // from: https://lab.syncer.jp/Web/JavaScript/Snippet/67/

    let h = hsv[0] / 60.0;
    let s = hsv[1];
    let v = hsv[2];

    if (s == 0.0) {

        result[0] = v;
        result[1] = v;
        result[2] = v;
    }

    result[3] = hsv[3];

    var rgb;
    var i = Math.floor(h);
    var f = h - i;
    var v1 = v * (1 - s);
    var v2 = v * (1 - s * f);
    var v3 = v * (1 - s * (1 - f));

    switch (i) {
        case 0:
        case 6:
            result[0] = v;
            result[1] = v3;
            result[2] = v1;
            break;

        case 1:
            result[0] = v2;
            result[1] = v;
            result[2] = v1;
            break;

        case 2:
            result[0] = v1;
            result[1] = v;
            result[2] = v3;
            break;

        case 3:
            result[0] = v1;
            result[1] = v2;
            result[2] = v;
            break;

        case 4:
            result[0] = v3;
            result[1] = v1;
            result[2] = v;
            break;

        case 5:
            result[0] = v;
            result[1] = v1;
            result[2] = v2;
            break;
    }
}
*/ 
