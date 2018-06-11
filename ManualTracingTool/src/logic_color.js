var ManualTracingTool;
(function (ManualTracingTool) {
    var ColorLogic = /** @class */ (function () {
        function ColorLogic() {
        }
        ColorLogic.floatToHex2String = function (v) {
            return (('00' + v.toString(16)).substr(-2));
        };
        ColorLogic.rgbToHex2String = function (color) {
            return (ColorLogic.floatToHex2String(Math.floor(color[0] * 255.0))
                + ColorLogic.floatToHex2String(Math.floor(color[1] * 255.0))
                + ColorLogic.floatToHex2String(Math.floor(color[2] * 255.0)));
        };
        ColorLogic.hex2StringToRGB = function (result, colorString) {
            result[0] = parseInt(colorString.substring(1, 3), 16) / 255.0;
            result[1] = parseInt(colorString.substring(3, 5), 16) / 255.0;
            result[2] = parseInt(colorString.substring(5, 7), 16) / 255.0;
            return result;
        };
        ColorLogic.rgbToHSV = function (result, rgb) {
            // from: https://lab.syncer.jp/Web/JavaScript/Snippet/66/
            var r = rgb[0];
            var g = rgb[1];
            var b = rgb[2];
            var max = Math.max(r, g, b);
            var min = Math.min(r, g, b);
            var diff = max - min;
            var h = 0.0;
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
            var s = (max == 0.0) ? 0.0 : (diff / max);
            var v = max;
            result[0] = h;
            result[1] = s;
            result[2] = v;
            result[3] = rgb[3];
        };
        ColorLogic.hsvToRGB = function (result, hsv) {
            // from: https://lab.syncer.jp/Web/JavaScript/Snippet/67/
            var h = hsv[0] / 60.0;
            var s = hsv[1];
            var v = hsv[2];
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
        };
        return ColorLogic;
    }());
    ManualTracingTool.ColorLogic = ColorLogic;
})(ManualTracingTool || (ManualTracingTool = {}));
