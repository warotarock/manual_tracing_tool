import { float } from './conversion'
import { Maths } from './math'

export class ColorLogic {

    private static floatToHex2String(v: float) {

        return (('00' + v.toString(16)).substr(-2))
    }

    static rgbToHex2String(color: Vec4) {

        return `${this.floatToHex2String(Math.floor(color[0] * 255.0))}${this.floatToHex2String(Math.floor(color[1] * 255.0))}${this.floatToHex2String(Math.floor(color[2] * 255.0))}`
    }

    static rgbaToRgbaString(color: Vec4) {

      return `${(color[0] * 255.0).toFixed(0)},${(color[1] * 255.0).toFixed(0)},${(color[2] * 255.0).toFixed(0)},${color[3].toFixed(3)}`
    }

    static hex2StringToRGB(result: Vec4, colorString: string): Vec4 {

        result[0] = parseInt(colorString.substring(1, 3), 16) / 255.0
        result[1] = parseInt(colorString.substring(3, 5), 16) / 255.0
        result[2] = parseInt(colorString.substring(5, 7), 16) / 255.0

        return result
    }

    private static hsvToRGB_Element(h: float, s: float, v: float, baseElement: float): float {

        return ((Maths.clamp(Math.abs(Maths.fract(h + baseElement / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v
    }

    static hsvToRGB(out: Vec4, h: float, s: float, v: float) {

        out[0] = this.hsvToRGB_Element(h, s, v, 0.0)
        out[1] = this.hsvToRGB_Element(h, s, v, 2.0)
        out[2] = this.hsvToRGB_Element(h, s, v, 1.0)
    }

    static hsvToRGBv(out: Vec4, hsv: Vec4) {

      this.hsvToRGB(out, hsv[0], hsv[1], hsv[2])
    }

    private static rgbToHSV_bgKwz = vec4.create()
    private static rgbToHSV_gbKxy = vec4.create()
    private static rgbToHSV_p = vec4.create()
    private static rgbToHSV_Pxywr = vec4.create()
    private static rgbToHSV_rPyzx = vec4.create()
    private static rgbToHSV_q = vec4.create()

    static rgbToHSV(result: Vec4, r: float, g: float, b: float) {

        const Kx = 0.0
        const Ky = -1.0 / 3.0
        const Kz = 2.0 / 3.0
        const Kw = -1.0

        vec4.set(this.rgbToHSV_bgKwz, b, g, Kw, Kz)
        vec4.set(this.rgbToHSV_gbKxy, g, b, Kx, Ky)
        vec4.lerp(this.rgbToHSV_p, this.rgbToHSV_bgKwz, this.rgbToHSV_gbKxy, Maths.step(b, g))

        const px = this.rgbToHSV_p[0]
        const py = this.rgbToHSV_p[1]
        const pz = this.rgbToHSV_p[2]
        const pw = this.rgbToHSV_p[3]

        vec4.set(this.rgbToHSV_Pxywr, px, py, pw, r)
        vec4.set(this.rgbToHSV_rPyzx, r, py, pz, px)
        vec4.lerp(this.rgbToHSV_q, this.rgbToHSV_Pxywr, this.rgbToHSV_rPyzx, Maths.step(px, r))

        const qx = this.rgbToHSV_q[0]
        const qy = this.rgbToHSV_q[1]
        const qz = this.rgbToHSV_q[2]
        const qw = this.rgbToHSV_q[3]

        const d = qx - Math.min(qw, qy)

        const e = 1.0e-10

        result[0] = Math.abs(qz + (qw - qy) / (6.0 * d + e))
        result[1] = d / (qx + e)
        result[2] = qx
    }

    static rgbToHSVv(out: Vec4, rgb: Vec4) {

      this.rgbToHSV(out, rgb[0], rgb[1], rgb[2])
    }
}
