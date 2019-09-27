// written by @warotarock

declare module glMatrix {

    // number[] - Float32Array compatible array type
    type Array = Float32Array | number[];

}

type Vec2 = glMatrix.Array;

type Vec3 = glMatrix.Array;

type Vec4 = glMatrix.Array;

type Quat4 = glMatrix.Array;

type Mat2 = glMatrix.Array;

type Mat2d = glMatrix.Array;

type Mat3 = glMatrix.Array;

type Mat4 = glMatrix.Array;

declare module vec2 {
    export function add(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function create(): Vec2;
    export function clone(a: Vec2): Vec2;
    export function fromValues(x: number, y: number): Vec2;
    export function copy(out: Vec2, a: Vec2): Vec2;
    export function set(out: Vec2, x: number, y: number): Vec2;
    export function sub(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function subtract(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function mul(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function multiply(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function div(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function divide(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function min(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function max(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function scale(out: Vec2, a: Vec2, b: number): Vec2;
    export function dist(a: Vec2, b: Vec2): number;
    export function distance(a: Vec2, b: Vec2): number;
    export function sqrDist(a: Vec2, b: Vec2): number;
    export function squaredDistance(a: Vec2, b: Vec2): number;
    export function len(a: Vec2): number;
    export function length(a: Vec2): number;
    export function sqrLen(a: Vec2): number;
    export function squaredLength(a: Vec2): number;
    export function negate(out: Vec2, a: Vec2): Vec2;
    export function normalize(out: Vec2, a: Vec2): Vec2;
    export function dot(a: Vec2, b: Vec2): number;
    export function cross(out: Vec2, a: Vec2, b: Vec2): Vec2;
    export function lerp(out: Vec2, a: Vec2, b: Vec2, t: number): Vec2;
    export function transformMat2(out: Vec2, a: Vec2, m: Mat2): Vec2;
    export function transformMat2d(out: Vec2, a: Vec2, m: Mat2d): Vec2;
    export function str(a: Vec2): string;
}

declare module vec3 {
    export function add(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function create(): Vec3;
    export function clone(a: Vec3): Vec3;
    export function fromValues(x: number, y: number, z: number): Vec3;
    export function copy(out: Vec3, a: Vec3): Vec3;
    export function set(out: Vec3, x: number, y: number, z: number): Vec3;
    export function sub(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function subtract(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function mul(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function multiply(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function div(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function divide(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function min(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function max(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function scale(out: Vec3, a: Vec3, b: number): Vec3;
    export function dist(a: Vec3, b: Vec3): number;
    export function distance(a: Vec3, b: Vec3): number;
    export function sqrDist(a: Vec3, b: Vec3): number;
    export function squaredDistance(a: Vec3, b: Vec3): number;
    export function len(a: Vec3): number;
    export function length(a: Vec3): number;
    export function sqrLen(a: Vec3): number;
    export function squaredLength(a: Vec3): number;
    export function negate(out: Vec3, a: Vec3): Vec3;
    export function normalize(out: Vec3, a: Vec3): Vec3;
    export function dot(a: Vec3, b: Vec3): number;
    export function cross(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function lerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3;
    export function transformMat4(out: Vec3, a: Vec3, m: Mat4): Vec3;
    export function transformQuat(out: Vec3, a: Vec3, q: Vec4): Vec3;
    export function str(a: Vec3): string;
}

declare module vec4 {
    export function add(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function create(): Vec4;
    export function clone(a: Vec4): Vec4;
    export function fromValues(x: number, y: number, z: number, w: number): Vec4;
    export function copy(out: Vec4, a: Vec4): Vec4;
    export function set(out: Vec4, x: number, y: number, z: number, w: number): Vec4;
    export function sub(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function subtract(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function mul(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function multiply(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function div(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function divide(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function min(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function max(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function scale(out: Vec4, a: Vec4, b: number): Vec4;
    export function dist(a: Vec4, b: Vec4): number;
    export function distance(a: Vec4, b: Vec4): number;
    export function sqrDist(a: Vec4, b: Vec4): number;
    export function squaredDistance(a: Vec4, b: Vec4): number;
    export function len(a: Vec4): number;
    export function length(a: Vec4): number;
    export function sqrLen(a: Vec4): number;
    export function squaredLength(a: Vec4): number;
    export function negate(out: Vec4, a: Vec4): Vec4;
    export function normalize(out: Vec4, a: Vec4): Vec4;
    export function dot(a: Vec4, b: Vec4): number;
    export function cross(out: Vec4, a: Vec4, b: Vec4): Vec4;
    export function lerp(out: Vec4, a: Vec4, b: Vec4, t: number): Vec4;
    export function transformMat4(out: Vec4, a: Vec4, m: Mat4): Vec4;
    export function transformQuat(out: Vec4, a: Vec4, q: Vec4): Vec4;
    export function str(a: Vec4): string;
}

declare module quat {
    export function create(): Quat4;
    export function clone(a: Quat4): Quat4;
    export function fromValues(x: number, y: number, z: number, w: number): Quat4;
    export function copy(out: Quat4, a: Quat4): Quat4;
    export function set(out: Quat4, x: number, y: number, z: number, w: number): Quat4;
    export function identity(out: Quat4): Quat4;
    export function setAxisAngle(out: Quat4, axis: Vec3, rad: number): Quat4;
    export function add(out: Quat4, a: Quat4, b: Quat4): Quat4;
    export function mul(out: Quat4, a: Quat4, b: Quat4): Quat4;
    export function multiply(out: Quat4, a: Quat4, b: Quat4): Quat4;
    export function scale(out: Quat4, a: Quat4, b: number): Quat4;
    export function rotateX(out: Quat4, a: Quat4, rad: number): Quat4;
    export function rotateY(out: Quat4, a: Quat4, rad: number): Quat4;
    export function rotateZ(out: Quat4, a: Quat4, rad: number): Quat4;
    export function calculateW(out: Quat4, a: Quat4): Quat4;
    export function dot(a: Quat4, b: Quat4): number;
    export function lerp(out: Quat4, a: Quat4, b: Quat4, t: number): Quat4;
    export function slerp(out: Quat4, a: Quat4, b: Quat4, t: number): Quat4;
    export function invert(out: Quat4, a: Quat4): Quat4;
    export function conjugate(out: Quat4, a: Quat4): Quat4;
    export function len(a: Quat4): number;
    export function length(a: Quat4): number;
    export function sqrLen(a: Quat4): number;
    export function squaredLength(a: Quat4): number;
    export function normalize(out: Quat4, a: Quat4): Quat4;
    export function str(a: Quat4): string;
}

declare module mat2 {
    export function create(): Mat2;
    export function clone(a: Mat2): Mat2;
    export function copy(out: Mat2, a: Mat2): Mat2;
    export function identity(out: Mat2): Mat2;
    export function transpose(out: Mat2, a: Mat2): Mat2;
    export function invert(out: Mat2, a: Mat2): Mat2;
    export function adjoint(out: Mat2, a: Mat2): Mat2;
    export function determinant(a: Mat2): number;
    export function mul(out: Mat2, a: Mat2, b: Mat2): Mat2;
    export function multiply(out: Mat2, a: Mat2, b: Mat2): Mat2;
    export function rotate(out: Mat2, a: Mat2, rad: number): Mat2;
    export function scale(out: Mat2, a: Mat2, v: Vec2): Mat2;
    export function str(a: Mat2): string;
}

declare module mat2d {
    export function create(): Mat2d;
    export function clone(a: Mat2d): Mat2d;
    export function copy(out: Mat2d, a: Mat2d): Mat2d;
    export function identity(out: Mat2d): Mat2d;
    export function invert(out: Mat2d, a: Mat2d): Mat2d;
    export function determinant(a: Mat2d): number;
    export function mul(out: Mat2d, a: Mat2d, b: Mat2d): Mat2d;
    export function multiply(out: Mat2d, a: Mat2d, b: Mat2d): Mat2d;
    export function rotate(out: Mat2d, a: Mat2d, rad: number): Mat2d;
    export function scale(out: Mat2d, a: Mat2d, v: Vec2): Mat2d;
    export function translate(out: Mat2d, a: Mat2d, v: Vec2): Mat2d;
    export function str(a: Mat2d): string;
}

declare module mat3 {
    export function create(): Mat3;
    export function clone(a: Mat3): Mat3;
    export function copy(out: Mat3, a: Mat3): Mat3;
    export function identity(out: Mat3): Mat3;
    export function transpose(out: Mat3, a: Mat3): Mat3;
    export function invert(out: Mat3, a: Mat3): Mat3;
    export function adjoint(out: Mat3, a: Mat3): Mat3;
    export function determinant(a: Mat3): number;
    export function mul(out: Mat3, a: Mat3, b: Mat3): Mat3;
    export function multiply(out: Mat3, a: Mat3, b: Mat3): Mat3;
    export function str(a: Mat3): string;
}

declare module mat4 {
    export function create(): Mat4;
    export function clone(a: Mat4): Mat4;
    export function copy(out: Mat4, a: Mat4): Mat4;
    export function identity(out: Mat4): Mat4;
    export function transpose(out: Mat4, a: Mat4): Mat4;
    export function invert(out: Mat4, a: Mat4): Mat4;
    export function adjoint(out: Mat4, a: Mat4): Mat4;
    export function determinant(a: Mat4): number;
    export function mul(out: Mat4, a: Mat4, b: Mat4): Mat4;
    export function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4;
    export function str(a: Mat4): string;
    export function translate(out: Mat4, a: Mat4, v: Vec3): Mat4;
    export function scale(out: Mat4, a: Mat4, v: Vec3): Mat4;
    export function rotate(out: Mat4, a: Mat4, rad: number, axis: Vec3): Mat4;
    export function rotateX(out: Mat4, a: Mat4, rad: number): Mat4;
    export function rotateY(out: Mat4, a: Mat4, rad: number): Mat4;
    export function rotateZ(out: Mat4, a: Mat4, rad: number): Mat4;
    export function fromRotationTranslation(out: Mat4, q: Vec4, v: Vec3): Mat4;
    export function frustum(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
    export function perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4;
    export function ortho(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
    export function lookAt(out: Mat4, eye: Vec3, center: Vec3, up: Vec3): Mat4;
    export function fromQuat(out: Mat4, quat: Quat4): Mat4;
}
