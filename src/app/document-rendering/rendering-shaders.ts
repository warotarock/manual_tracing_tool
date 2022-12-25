import { int } from '../common-logics'
import { RenderShader } from '../render'
import { GPUVertexBuffer, Logic_GPULine } from './gpu-line'

export class GPULineShader extends RenderShader {

  getVertexUnitSize(): int { // @virtual

    return -1
  }

  getVertexCount(_pointCount: int, _lineCount: int): int { // @virtual

    return -1
  }

  setBuffers(_buffer: WebGLBuffer, _color: Vec4) { // @virtual
  }

  calculateBufferData(_buffer: GPUVertexBuffer, _logic_GPULine: Logic_GPULine) { // @virtual

  }

  getDrawArrayTryanglesCount(bufferSize: int): int {

    return bufferSize / this.getVertexUnitSize()
  }
}

export class PolyLineShader extends GPULineShader {

  private uColor: WebGLUniformLocation = null

  private aPosition = -1

  getVertexUnitSize(): int { // @override

    return (
      2 // 頂点の位置 vec2
    )
  }

  getVertexCount(pointCount: int, _lineCount: int): int { // @override

    return (pointCount - 1) * (2 + 2) * 3 // 辺の数 * 左側２ポリゴン＋右側２ポリゴン * 3頂点

  }

  initializeVertexSourceCode() { // @override

    this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

attribute vec2 aPosition;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

void main(void) {

	   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);
}
`
  }

  initializeFragmentSourceCode() { // @override

    this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

uniform vec4 uColor;

void main(void) {

    gl_FragColor = uColor;
}
`
  }

  initializeAttributes() { // @override

    this.initializeAttributes_RenderShader()
    this.initializeAttributes_PolyLineShader()
  }

  initializeAttributes_PolyLineShader() {

    this.uColor = this.getUniformLocation('uColor')
    this.aPosition = this.getAttribLocation('aPosition')
  }

  setBuffers(buffer: WebGLBuffer, color: Vec4) { // @override

    const gl = this.gl

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    this.enableVertexAttributes()
    this.resetVertexAttribPointerOffset()

    gl.uniform4fv(this.uColor, color)

    const vertexDataStride = 4 * this.getVertexUnitSize()

    this.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, vertexDataStride)
  }

  calculateBufferData(buffer: GPUVertexBuffer, logic_GPULine: Logic_GPULine) { // @override

    logic_GPULine.calculateLinePointEdges(buffer)
    logic_GPULine.calculateBufferData_PloyLine(buffer)
  }
}

export class BezierLineShader extends GPULineShader {

  private uColor: WebGLUniformLocation = null

  private aPosition = -1
  private aLocalPosition = -1

  private aLinePoint1 = -1
  private aControlPoint1 = -1
  private aLinePoint2 = -1
  private aControlPoint2 = -1

  private aLinePoint1R = -1
  private aControlPoint1R = -1
  private aLinePoint2R = -1
  private aControlPoint2R = -1

  private aWidth = -1
  // private aAlpha = -1

  getVertexUnitSize(): int { // @override

    return (
      2 // 頂点位置 vec2
      + 3 // ローカル空間座標 vec3 (x, y, t)

      + 2 // 頂点１ vec2
      + 2 // 制御点１ vec2
      + 2 // 制御点２ vec2
      + 2 // 頂点２ vec2

      + 2 // 頂点１R vec2
      + 2 // 制御点１R vec2
      + 2 // 制御点２R vec2
      + 2 // 頂点２R vec2

      + 2 // 太さ vec2 (from, to)
      //+ 2 // 不透明度 vec2 (from, to)
    )
  }

  getVertexCount(pointCount: int, _lineCount: int): int { // @override

    return (pointCount - 1) * (4 + 4) * 3 // 辺の数 * (左側４ポリゴン＋右側４ポリゴン) * 3頂点
  }

  initializeVertexSourceCode() { // @override

    this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

attribute vec2 aPosition;
attribute vec3 aLocalPosition;

attribute vec2 aLinePoint1;
attribute vec2 aControlPoint1;
attribute vec2 aControlPoint2;
attribute vec2 aLinePoint2;

attribute vec2 aLinePoint1R;
attribute vec2 aControlPoint1R;
attribute vec2 aControlPoint2R;
attribute vec2 aLinePoint2R;

attribute vec2 aWidth;
// attribute vec2 aAlpha;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

varying vec3 vLocalPosition;

varying vec2 vLinePoint1;
varying vec2 vControlPoint1;
varying vec2 vControlPoint2;
varying vec2 vLinePoint2;

varying vec2 vLinePoint1R;
varying vec2 vControlPoint1R;
varying vec2 vControlPoint2R;
varying vec2 vLinePoint2R;

varying vec2 vWidth;
// varying vec2 vAlpha;

void main(void) {

    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);

    vLocalPosition = aLocalPosition;

    vLinePoint1 = aLinePoint1;
    vControlPoint1 = aControlPoint1;
    vControlPoint2 = aControlPoint2;
    vLinePoint2 = aLinePoint2;

    vLinePoint1R = aLinePoint1R;
    vControlPoint1R = aControlPoint1R;
    vControlPoint2R = aControlPoint2R;
    vLinePoint2R = aLinePoint2R;

    vWidth = aWidth;
    // vAlpha = aAlpha;
}
`
  }

  initializeFragmentSourceCode() { // @override

    this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

float cubeRoot(float x) {

    float res = pow(abs(x), 1.0 / 3.0);
    return (x >= 0.0) ? res : -res;
}

void solveQuadraticEquation(out vec3 solution, float a, float b, float c) {

    float d;
    float x1;
    float x2;

    if (a == 0.0) {

        solution[0] = -c / b;
        solution[1] = -1.0;
        return;
    }

    d = b * b - 4.0 * a * c;

    if (d > 0.0) {

        if (b < 0.0) {

            x1 = (-b - sqrt(d)) / 2.0 / a;
            x2 = -b / a - x1;
        }
        else {

            x1 = (-b + sqrt(d)) / 2.0 / a;
            x2 = -b / a - x1;
        }

        solution[0] = x1;
        solution[1]= x2;
    }
    else if (d == 0.0) {

        solution[0] = -b / 2.0 / a;
        solution[1] = -1.0;
    }
    else {

        // imaginary root
    }
}

void solveCubicEquation(out vec3 solution, float a, float b, float c, float d) {

    float PI = 3.14159265358979323846264;
    float p;
    float q;
    float t;
    float a3;
    float b3;

    if (a == 0.0) {;
        solveQuadraticEquation(solution, b, c, d);
        return;
    }

    b /= 3.0 * a;
    c /= a;
    d /= a;
    p = b * b - c / 3.0;
    q = (b * (c - 2.0 * b * b) - d) / 2.0;

    a = q * q - p * p * p;

    if (a == 0.0) {

        q = cubeRoot(q);
        solution[0] = 2.0 * q - b;
        solution[1] = -q - b;
        solution[2] = -1.0;
    }
    else if (a > 0.0) {

        float sign = 1.0;
        if (q <= 0.0) { sign = -1.0; }
        a3 = cubeRoot(q + (sign) * sqrt(a));
        b3 = p / a3;
        solution[0] = a3 + b3 - b;
        solution[1] = -1.0;
        solution[2] = -1.0;
    }
    else {

        a = 2.0 * sqrt(p);
        t = acos(q / (p * a / 2.0));
        solution[0] = a * cos(t / 3.0) - b;
        solution[1] = a * cos((t + 2.0 * PI) / 3.0) - b;
        solution[2] = a * cos((t + 4.0 * PI) / 3.0) - b;
    }
}

float calcBezierTimeInSection(float x1, float x2, float x3, float x4, float targetX) {

    vec3 solution = vec3(0.0, 0.0, 0.0);
    float a = x4 - 3.0 * (x3 - x2) - x1;
    float b = 3.0 * (x3 - 2.0 * x2 + x1);
    float c = 3.0 * (x2 - x1);
    float d = x1 - targetX;

    solveCubicEquation(solution, a, b, c, d);

    if (solution[0] >= -0.1 && solution[0] <= 1.0) {

        return solution[0];
    }
    else if (solution[1] >= 0.0 && solution[1] <= 1.0) {

        return solution[1];
    }
    else if (solution[2] >= 0.0 && solution[2] <= 1.0) {

        return solution[2];
    }
    else {

        return -1.0;
    }
}

float calcInterpolationBezier(float x1, float x2, float x3, float x4, float t) {

    return (1.0 - t) * (1.0 - t) * (1.0 - t) * x1 +
        3.0 * (1.0 - t) * (1.0 - t) * t * x2 +
        3.0 * (1.0 - t) * t * t * x3 +
        t * t * t * x4;
}

uniform vec4 uColor;

varying vec3 vLocalPosition;

varying vec2 vLinePoint1;
varying vec2 vControlPoint1;
varying vec2 vControlPoint2;
varying vec2 vLinePoint2;

varying vec2 vLinePoint1R;
varying vec2 vControlPoint1R;
varying vec2 vControlPoint2R;
varying vec2 vLinePoint2R;

varying vec2 vWidth;
// varying vec2 vAlpha;

void main(void) {

    float t1 = calcBezierTimeInSection(
        vLinePoint1.x,
        vControlPoint1.x,
        vControlPoint2.x,
        vLinePoint2.x,
        vLocalPosition.x
    );

    float y1;

    if (t1 >= 0.0) {

        y1 = calcInterpolationBezier(
            vLinePoint1.y,
            vControlPoint1.y,
            vControlPoint2.y,
            vLinePoint2.y,
            t1
        );
    }
    else {

        y1 = vLocalPosition.y + 1.0;
    }

    float t2 = calcBezierTimeInSection(
        vLinePoint1R.x,
        vControlPoint1R.x,
        vControlPoint2R.x,
        vLinePoint2R.x,
        vLocalPosition.x
    );

    float y2;

    if (t2 >= 0.0) {

        y2 = calcInterpolationBezier(
            vLinePoint1R.y,
            vControlPoint1R.y,
            vControlPoint2R.y,
            vLinePoint2R.y,
            t2
        );
    }
    else {

        y2 = vLocalPosition.y - 1.0;
    }

    float col = (vLocalPosition.y <= y1 && vLocalPosition.y >= y2)? 1.0 : 0.0;

    gl_FragColor = vec4(uColor.rgb, col * uColor.a);
//    gl_FragColor = vec4(0.0, 0.0, 0.0, col * mix(vAlpha[0], vAlpha[1], vLocalPosition.z));
//    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);
}
`
  }

  initializeAttributes() { // @override

    this.initializeAttributes_RenderShader()
    this.initializeAttributes_PolyLineShader()
  }

  initializeAttributes_PolyLineShader() {

    this.uColor = this.getUniformLocation('uColor')

    this.aPosition = this.getAttribLocation('aPosition')
    this.aLocalPosition = this.getAttribLocation('aLocalPosition')

    this.aLinePoint1 = this.getAttribLocation('aLinePoint1')
    this.aControlPoint1 = this.getAttribLocation('aControlPoint1')
    this.aControlPoint2 = this.getAttribLocation('aControlPoint2')
    this.aLinePoint2 = this.getAttribLocation('aLinePoint2')

    this.aLinePoint1R = this.getAttribLocation('aLinePoint1R')
    this.aControlPoint1R = this.getAttribLocation('aControlPoint1R')
    this.aControlPoint2R = this.getAttribLocation('aControlPoint2R')
    this.aLinePoint2R = this.getAttribLocation('aLinePoint2R')

    this.aWidth = this.getAttribLocation('aWidth')
    // this.aAlpha = this.getAttribLocation('aAlpha')
  }

  setBuffers(buffer: WebGLBuffer, color: Vec4) { // @override

    const gl = this.gl

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    this.enableVertexAttributes()
    this.resetVertexAttribPointerOffset()

    gl.uniform4fv(this.uColor, color)

    const vertexDataStride = 4 * this.getVertexUnitSize()

    this.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aLocalPosition, 3, gl.FLOAT, vertexDataStride)

    this.vertexAttribPointer(this.aLinePoint1, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aControlPoint1, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aControlPoint2, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aLinePoint2, 2, gl.FLOAT, vertexDataStride)

    this.vertexAttribPointer(this.aLinePoint1R, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aControlPoint1R, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aControlPoint2R, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aLinePoint2R, 2, gl.FLOAT, vertexDataStride)

    this.vertexAttribPointer(this.aWidth, 2, gl.FLOAT, vertexDataStride)
    // this.vertexAttribPointer(this.aAlpha, 2, gl.FLOAT, vertexDataStride)
  }

  calculateBufferData(buffer: GPUVertexBuffer, logic_GPULine: Logic_GPULine) { // @override

    logic_GPULine.calculateLinePointEdges(buffer)
    logic_GPULine.calculateLinePointBezierLocation(buffer)
    logic_GPULine.calculateControlPointVertexLocations(buffer)

    logic_GPULine.calculateBufferData_BezierLine(buffer)
  }
}

export class BezierDistanceLineShader extends GPULineShader {

  private uColor: WebGLUniformLocation = null

  private aPosition = -1
  private aLocalPosition = -1

  private aLinePoint1 = -1
  private aControlPoint1 = -1
  private aLinePoint2 = -1
  private aControlPoint2 = -1

  private aLinePoint1R = -1
  private aControlPoint1R = -1
  private aLinePoint2R = -1
  private aControlPoint2R = -1

  private aWidth = -1
  // private aAlpha = -1

  getVertexUnitSize(): int { // @override

    return (
      2 // 頂点位置 vec2
      + 3 // ローカル空間座標 vec3 (x, y, t)

      + 2 // 頂点１ vec2
      + 2 // 制御点１ vec2
      + 2 // 制御点２ vec2
      + 2 // 頂点２ vec2

      + 2 // 頂点１R vec2
      + 2 // 制御点１R vec2
      + 2 // 制御点２R vec2
      + 2 // 頂点２R vec2

      + 2 // 太さ vec2 (from, to)
      //+ 2 // 不透明度 vec2 (from, to)
    )
  }

  getVertexCount(pointCount: int, lineCount: int): int { // @override

    return (pointCount - 1) * (4 + 4) * 3 + lineCount * (2 + 2) * 3 // 辺の数 * (左側４ポリゴン＋右側４ポリゴン) * 3頂点 + (線端用２ポリゴン＊２)* 3頂点
  }

  initializeVertexSourceCode() { // @override

    this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

attribute vec2 aPosition;
attribute vec3 aLocalPosition;

attribute vec2 aLinePoint1;
attribute vec2 aControlPoint1;
attribute vec2 aControlPoint2;
attribute vec2 aLinePoint2;

attribute vec2 aLinePoint1R;
attribute vec2 aControlPoint1R;
attribute vec2 aControlPoint2R;
attribute vec2 aLinePoint2R;

attribute vec2 aWidth;
// attribute vec2 aAlpha;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

varying vec3 vLocalPosition;

varying vec2 vLinePoint1;
varying vec2 vControlPoint1;
varying vec2 vControlPoint2;
varying vec2 vLinePoint2;

varying vec2 vLinePoint1R;
varying vec2 vControlPoint1R;
varying vec2 vControlPoint2R;
varying vec2 vLinePoint2R;

varying vec2 vWidth;
// varying vec2 vAlpha;

void main(void) {

    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);

    vLocalPosition = aLocalPosition;

    vLinePoint1 = aLinePoint1;
    vControlPoint1 = aControlPoint1;
    vControlPoint2 = aControlPoint2;
    vLinePoint2 = aLinePoint2;

    vLinePoint1R = aLinePoint1R;
    vControlPoint1R = aControlPoint1R;
    vControlPoint2R = aControlPoint2R;
    vLinePoint2R = aLinePoint2R;

    vWidth = aWidth;
    // vAlpha = aAlpha;
}
`
  }

  initializeFragmentSourceCode() { // @override

    this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

// From https://www.shadertoy.com/view/4sXyDr

#define CLAMP

float distanceBezier(vec2 p, vec2 P0, vec2 P1, vec2 P2, vec2 P3, out float t)
{
    // Cubic Bezier curve
    vec2 A = -P0 + 3.0 * P1 - 3.0 * P2 + P3;
    vec2 B = 3.0 * (P0 - 2.0 * P1 + P2);
    vec2 C = 3.0 * (P1 - P0);
    vec2 D = P0;

    float a5 =  6.0 * dot(A, A);
    float a4 = 10.0 * dot(A, B);
    float a3 =  8.0 * dot(A, C)     + 4.0 * dot(B, B);
    float a2 =  6.0 * dot(A, D - p) + 6.0 * dot(B, C);
    float a1 =  4.0 * dot(B, D - p) + 2.0 * dot(C, C);
    float a0 =  2.0 * dot(C, D - p);

    // calculate distances to the control points
    float d0 = length(p - P0);
    float d1 = length(p - P1);
    float d2 = length(p - P2);
    float d3 = length(p - P3);
    float d = min(d0, min(d1, min(d2, d3)));

    // Choose initial value of t
    //float t;
    if (abs(d3 - d) < 1.0e-5) {
        t = 1.0;
    }
    else if (abs(d0 - d) < 1.0e-5) {
        t = 0.0;
    }
    else {
        t = 0.5;
    }

	// iteration
    for (int i = 0; i < 10; i++) {

        float t2 = t*t;
        float t3 = t2*t;
        float t4 = t3*t;
        float t5 = t4*t;

        float f = a5*t5 + a4*t4 + a3*t3 + a2*t2 + a1*t + a0;
        float df = 5.0*a5*t4 + 4.0*a4*t3 + 3.0*a3*t2 + 2.0*a2*t + a1;

        t = t - f/df;
    }

    // clamp to edge of bezier segment
#ifdef CLAMP
    t = clamp(t, 0.0, 1.0);
#endif

    // get the point on the curve
    vec2 P = A*t*t*t + B*t*t + C*t + D;

    // return distance to the point on the curve
    return min(length(p - P), min(d0, d3));
}

uniform vec4 uColor;

varying vec3 vLocalPosition;

varying vec2 vLinePoint1;
varying vec2 vControlPoint1;
varying vec2 vControlPoint2;
varying vec2 vLinePoint2;

varying vec2 vLinePoint1R;
varying vec2 vControlPoint1R;
varying vec2 vControlPoint2R;
varying vec2 vLinePoint2R;

varying vec2 vWidth;
// varying vec2 vAlpha;

void main(void) {

	vec2 p  = vLocalPosition.xy;
  vec2 P0 = vLinePoint1;
  vec2 P1 = vControlPoint1;
  vec2 P2 = vControlPoint2;
  vec2 P3 = vLinePoint2;

  float t;
  float distance = distanceBezier(p, P0, P1, P2, P3, t);
  float width = mix(vWidth.x, vWidth.y, t);

  if (distance > width) {

    // gl_FragColor = vec4(1.0, 0.5, 0.0, 0.1);
  	discard;
  }
	else {

      float col = 1.0 - smoothstep(width - 0.08, width, distance);
      //float col = distance * 0.1;

      //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);
      //gl_FragColor = vec4(vLocalPosition.z, 0.0, 0.0, col);
      //gl_FragColor = vec4(vWidth.y, 0.0, 0.0, col * uColor.a * 0.9 + 0.1);
      gl_FragColor = vec4(uColor.rgb, col * uColor.a * 0.9 + 0.1);
  }
}
`
  }

  initializeAttributes() { // @override

    this.initializeAttributes_RenderShader()
    this.initializeAttributes_PolyLineShader()
  }

  initializeAttributes_PolyLineShader() {

    this.uColor = this.getUniformLocation('uColor')

    this.aPosition = this.getAttribLocation('aPosition')
    this.aLocalPosition = this.getAttribLocation('aLocalPosition')

    this.aLinePoint1 = this.getAttribLocation('aLinePoint1')
    this.aControlPoint1 = this.getAttribLocation('aControlPoint1')
    this.aControlPoint2 = this.getAttribLocation('aControlPoint2')
    this.aLinePoint2 = this.getAttribLocation('aLinePoint2')

    this.aLinePoint1R = this.getAttribLocation('aLinePoint1R')
    this.aControlPoint1R = this.getAttribLocation('aControlPoint1R')
    this.aControlPoint2R = this.getAttribLocation('aControlPoint2R')
    this.aLinePoint2R = this.getAttribLocation('aLinePoint2R')

    this.aWidth = this.getAttribLocation('aWidth')
    // this.aAlpha = this.getAttribLocation('aAlpha')
  }

  setBuffers(buffer: WebGLBuffer, color: Vec4) { // @override

    const gl = this.gl

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    this.enableVertexAttributes()
    this.resetVertexAttribPointerOffset()

    gl.uniform4fv(this.uColor, color)

    const vertexDataStride = 4 * this.getVertexUnitSize()

    this.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aLocalPosition, 3, gl.FLOAT, vertexDataStride)

    this.vertexAttribPointer(this.aLinePoint1, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aControlPoint1, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aControlPoint2, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aLinePoint2, 2, gl.FLOAT, vertexDataStride)

    this.vertexAttribPointer(this.aLinePoint1R, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aControlPoint1R, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aControlPoint2R, 2, gl.FLOAT, vertexDataStride)
    this.vertexAttribPointer(this.aLinePoint2R, 2, gl.FLOAT, vertexDataStride)

    this.vertexAttribPointer(this.aWidth, 2, gl.FLOAT, vertexDataStride)
    // this.vertexAttribPointer(this.aAlpha, 2, gl.FLOAT, vertexDataStride)
  }

  calculateBufferData(buffer: GPUVertexBuffer, logic_GPULine: Logic_GPULine) { // @override

    logic_GPULine.calculateLinePointEdges(buffer)
    logic_GPULine.calculateLinePointBezierLocation(buffer)
    logic_GPULine.calculateControlPointVertexLocations(buffer)

    logic_GPULine.calculateBufferData_BezierLine(buffer)
  }
}
