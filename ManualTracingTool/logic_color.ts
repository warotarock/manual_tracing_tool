
namespace ManualTracingTool {

    export class ColorLogic {

        private static floatToHex2String(v: float) {

            return (('00' + v.toString(16)).substr(-2));
        }

        static rgbToHex2String(color: Vec4) {

            return (
                ColorLogic.floatToHex2String(Math.floor(color[0] * 255.0))
                + ColorLogic.floatToHex2String(Math.floor(color[1] * 255.0))
                + ColorLogic.floatToHex2String(Math.floor(color[2] * 255.0))
            );
        }


        static hex2StringToRGB(result: Vec4, colorString: string): Vec4 {

            result[0] = parseInt(colorString.substring(1, 3), 16) / 255.0;
            result[1] = parseInt(colorString.substring(3, 5), 16) / 255.0;
            result[2] = parseInt(colorString.substring(5, 7), 16) / 255.0;

            return result;
        }

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

    }
}
