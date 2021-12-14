import { float, int } from '../logics/conversion'

export class CanvasWindow {

  canvas: HTMLCanvasElement = null
  context: CanvasRenderingContext2D = null

  width: float = 0.0
  height: float = 0.0

  viewLocation = vec3.fromValues(0.0, 0.0, 0.0)
  centerLocationRate = vec3.fromValues(0.0, 0.0, 0.0)
  viewScale = 1.0
  viewRotation = 0.0

  mirrorX = false
  mirrorY = false

  maxViewScale = 50.0
  minViewScale = 0.01

  transformMatrix = mat4.create()

  private tempVec3 = vec3.create()
  private tmpMatrix = mat4.create()

  createCanvas() {

    this.canvas = document.createElement('canvas')
  }

  releaseCanvas(): HTMLCanvasElement {

    const canvas = this.canvas

    this.canvas = null

    return canvas
  }

  setCanvasSize(width: int, height: int) {

    this.canvas.width = width
    this.canvas.height = height

    this.width = width
    this.height = height
  }

  initializeContext() {

    this.context = this.canvas.getContext('2d')
  }

  copyTransformTo(targetWindow: CanvasWindow) {

    vec3.copy(targetWindow.viewLocation, this.viewLocation)
    vec3.copy(targetWindow.centerLocationRate, this.centerLocationRate)
    targetWindow.viewScale = this.viewScale
    targetWindow.viewRotation = this.viewRotation
    targetWindow.mirrorX = this.mirrorX
    targetWindow.mirrorY = this.mirrorY
    mat4.copy(targetWindow.transformMatrix, this.transformMatrix)
  }

  addViewScale(addScale: float) {

    this.viewScale *= addScale

    this.fixViewScale()
  }

  fixViewRotation() {

    if (this.viewRotation >= 360.0) {

      this.viewRotation -= 360.0
    }

    if (this.viewRotation <= 0.0) {

      this.viewRotation += 360.0
    }
  }

  fixViewScale() {

    if (this.viewScale >= this.maxViewScale) {

      this.viewScale = this.maxViewScale
    }

    if (this.viewScale <= this.minViewScale) {

      this.viewScale = this.minViewScale
    }
  }

  updateViewMatrix() {

    this.caluclateViewMatrix(this.transformMatrix)
  }

  caluclateViewMatrix(result: Mat4) {

    mat4.identity(result)

    mat4.translate(result, result, vec3.set(this.tempVec3, this.width * this.centerLocationRate[0], this.height * this.centerLocationRate[0], 0.0))

    mat4.scale(result, result, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0))

    if (this.mirrorX) {
      mat4.scale(result, result, vec3.set(this.tempVec3, -1.0, 1.0, 1.0))
    }

    if (this.mirrorY) {
      mat4.scale(result, result, vec3.set(this.tempVec3, 1.0, -1.0, 1.0))
    }

    mat4.rotateZ(result, result, this.viewRotation * Math.PI / 180.0)

    mat4.translate(result, result, vec3.set(this.tempVec3, -this.viewLocation[0], -this.viewLocation[1], 0.0))
  }

  caluclateGLViewMatrix(result: Mat4) {

    const viewScale = this.viewScale
    const aspect = this.height / this.width

    const real2DViewHalfWidth = this.width / 2 / viewScale
    const real2DViewHalfHeight = this.height / 2 / viewScale

    const viewOffsetX = -(this.viewLocation[0]) / real2DViewHalfWidth // Normalize to fit to ortho matrix range (0.0-1.0)
    const viewOffsetY = (this.viewLocation[1]) / real2DViewHalfHeight

    mat4.identity(this.tmpMatrix)

    mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, aspect, 1.0, 1.0))

    if (this.mirrorX) {

      mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, -1.0, 1.0, 1.0))
    }

    if (this.mirrorY) {

      mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, 1.0, -1.0, 1.0))
    }

    mat4.rotateZ(this.tmpMatrix, this.tmpMatrix, -this.viewRotation * Math.PI / 180.0)

    mat4.translate(result, this.tmpMatrix, vec3.set(this.tempVec3, viewOffsetX / aspect, viewOffsetY, 0.0))
  }

  calculateViewUnitMatrix(result: Mat4) {

    mat4.identity(result)
    mat4.scale(result, result, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0))
    mat4.rotateZ(result, result, this.viewRotation * Math.PI / 180.0)
  }
}

export enum CanvasRenderBlendMode {

  default, alphaOver, add, color, luminosity
}

export enum CanvasRenderLineCap {

  butt, round, square
}

export class CanvasRender {

  private context: CanvasRenderingContext2D = null
  private currentTransform = mat4.create()
  private tempMat = mat4.create()
  private viewWidth = 1.0
  private viewHeight = 1.0
  private viewScale = 1.0

  private viewCenterX = 0.0
  private viewCenterY = 0.0
  private viewRange = 1.0

  private lastFontHeight = 0.0

  setContext(canvasWindow: CanvasWindow) {

    this.context = canvasWindow.context
    this.viewWidth = canvasWindow.width
    this.viewHeight = canvasWindow.height
    this.viewScale = canvasWindow.viewScale

    this.viewCenterX = canvasWindow.viewLocation[0]
    this.viewCenterY = canvasWindow.viewLocation[1]
    this.viewRange = Math.sqrt(Math.pow(this.viewWidth * 0.5, 2) + Math.pow(this.viewHeight * 0.5, 2)) / this.viewScale

    this.lastFontHeight = 0.0

    canvasWindow.updateViewMatrix()

    this.copyTransformFromWindow(canvasWindow)
  }

  getViewScale(): float {

    return this.viewScale
  }

  resetTransform() {

    mat4.identity(this.tempMat)

    this.setTransformFromMatrix(this.tempMat)
  }

  copyTransformFromWindow(canvasWindow: CanvasWindow) {

    mat4.copy(this.currentTransform, canvasWindow.transformMatrix)

    this.setTransformFromMatrix(canvasWindow.transformMatrix)
  }

  setTransformFromMatrix(matrix: Mat4) {

    CanvasRender.setTransformToContext(this.context, matrix)
  }

  static setTransformToContext(context: CanvasRenderingContext2D, matrix: Mat4) {

    context.setTransform(
      matrix[0], matrix[1],
      matrix[4], matrix[5],
      matrix[12], matrix[13]
    )
  }

  setLocalTransform(matrix: Mat4) {

    mat4.multiply(this.tempMat, this.currentTransform, matrix)

    this.setTransformFromMatrix(this.tempMat)
  }

  cancelLocalTransform() {

    this.setTransformFromMatrix(this.currentTransform)
  }

  isInViewRectangle(left: float, top: float, right: float, bottom: float, range: float) {

    const centerX = (right + left) * 0.5
    const centerY = (bottom + top) * 0.5

    const distance = Math.sqrt(Math.pow(centerX - this.viewCenterX, 2) + Math.pow(centerY - this.viewCenterY, 2))

    return ((distance - range) < this.viewRange)
  }

  setCompositeOperation(operationText: 'source-over' | 'source-atop') {

    this.context.globalCompositeOperation = operationText
  }

  private getColorStyleText(r: float, g: float, b: float, a: float) {

    return 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')'
  }

  private getColorStyleTextV(color: Vec4) {

    return this.getColorStyleText(color[0], color[1], color[2], color[3])
  }

  setFillColor(r: float, g: float, b: float, a: float) {

    this.context.fillStyle = this.getColorStyleText(r, g, b, a)
  }

  setFillColorV(color: Vec4) {

    this.setFillColor(color[0], color[1], color[2], color[3])
  }

  setFillLinearGradient(x0: float, y0: float, x1: float, y1: float, color1: Vec4, color2: Vec4) {

    const grad = this.context.createLinearGradient(x0, y0, x1, y1)
    grad.addColorStop(0.0, this.getColorStyleTextV(color1))
    grad.addColorStop(1.0, this.getColorStyleTextV(color2))
    this.context.fillStyle = grad
  }

  setFillRadialGradient(x: float, y: float, r1: float, r2: float, color1: Vec4, color2: Vec4) {

    const grad = this.context.createRadialGradient(x, y, r1, x, y, r2)
    grad.addColorStop(0.0, this.getColorStyleTextV(color1))
    grad.addColorStop(1.0, this.getColorStyleTextV(color2))
    this.context.fillStyle = grad
  }

  setStrokeWidth(width: float) {

    this.context.lineWidth = width
  }

  setStrokeColor(r: float, g: float, b: float, a: float) {

    this.context.strokeStyle = this.getColorStyleText(r, g, b, a)
  }

  setStrokeColorV(color: Vec4) {

    this.setStrokeColor(color[0], color[1], color[2], color[3])
  }

  setLineDash(segments: float[]) {

    this.context.setLineDash(segments)
  }

  setGlobalAlpha(a: float) {

    this.context.globalAlpha = a
  }

  setBlendMode(blendMode: CanvasRenderBlendMode) {

    if (blendMode == CanvasRenderBlendMode.default || blendMode == CanvasRenderBlendMode.alphaOver) {

      this.context.globalCompositeOperation = 'source-over'
    }
    else if (blendMode == CanvasRenderBlendMode.add) {

      this.context.globalCompositeOperation = 'lighter'
    }
    else if (blendMode == CanvasRenderBlendMode.luminosity) {

      this.context.globalCompositeOperation = 'luminosity'
    }
    else if (blendMode == CanvasRenderBlendMode.color) {

      this.context.globalCompositeOperation = 'color'
    }
  }

  setLineCap(lineCap: CanvasRenderLineCap) {

    this.context.lineCap = <CanvasLineCap>(CanvasRenderLineCap[lineCap])
  }

  beginPath() {

    this.context.beginPath()
  }

  closePath() {

    this.context.closePath()
  }

  beginPathPoints(pathPoints: float[][]) {

    this.beginPath()

    this.pathPoints(pathPoints)
  }

  pathPoints(pathPoints: float[][]) {

    this.moveToV(pathPoints[0])
    for (const point of pathPoints) {

      this.lineToV(point)
    }
  }

  strokePath(pathPoints: float[][]) {

    this.beginPathPoints(pathPoints)
    this.stroke()
  }

  fillPath(pathPoints: float[][]) {

    this.beginPathPoints(pathPoints)
    this.fill()
  }

  stroke() {

    this.context.stroke()
  }

  fill() {

    this.context.fill()
  }

  moveTo(x: float, y: float) {

    this.context.moveTo(x, y)
  }

  moveToV(location: Vec3) {

    this.context.moveTo(location[0], location[1])
  }

  lineTo(x: float, y: float) {

    this.context.lineTo(x, y)
  }

  lineToV(location: Vec3) {

    this.context.lineTo(location[0], location[1])
  }

  clearRect(left: int, top: int, width: int, height: int) {

    this.context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

    this.context.clearRect(left, top, width, height)
  }

  strokeRect(left: int, top: int, width: int, height: int) {

    this.context.strokeRect(left, top, width, height)
  }

  fillRect(left: int, top: int, width: int, height: int) {

    this.context.fillRect(left, top, width, height)
  }

  strokeRoundRect(x: float, y: float, width: float, height: float, rounded: float) {

    this.pathRoundRect(x, y, width, height, rounded)

    this.context.stroke()
  }

  fillRoundRect(x: float, y: float, width: float, height: float, rounded: float) {

    this.pathRoundRect(x, y, width, height, rounded)

    this.context.fill()
  }

  pathRoundRect(x: float, y: float, width: float, height: float, rounded: float) {

    const halfRadians = (2 * Math.PI) / 2
    const quarterRadians = (2 * Math.PI) / 4

    this.context.beginPath()

    this.context.arc(rounded + x, rounded + y, rounded, -quarterRadians, halfRadians, true)
    this.context.lineTo(x, y + height - rounded)
    this.context.arc(rounded + x, height - rounded + y, rounded, halfRadians, quarterRadians, true)
    this.context.lineTo(x + width - rounded, y + height)
    this.context.arc(x + width - rounded, y + height - rounded, rounded, quarterRadians, 0, true)
    this.context.lineTo(x + width, y + rounded)
    this.context.arc(x + width - rounded, y + rounded, rounded, 0, -quarterRadians, true)
    this.context.closePath()
  }

  drawLine(x1: float, y1: float, x2: float, y2: float) {

    this.context.beginPath()
    this.context.moveTo(x1, y1)
    this.context.lineTo(x2, y2)
    this.context.stroke()
  }

  circle(x: float, y: float, radius: float) {

    this.context.arc(x, y, radius, 0.0, Math.PI * 2.0)
  }

  drawImage(image: HTMLImageElement | HTMLCanvasElement, srcX: float, srcY: float, srcW: float, srcH: float, dstX: float, detY: float, dstW: float, dstH: float) {

    this.context.drawImage(image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH)
  }

  setFontSize(height: float) {

    if (height != this.lastFontHeight) {

      this.context.font = height.toFixed(0) + `px 'MS Gothic', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Osaka-Mono', 'Noto Sans JP', monospace`
    }
  }

  fillText(text: string, x: float, y: float) {

    this.context.fillText(text, x, y)
  }

  pickColor(outColor: Vec4, x: float, y: float) {

    const imageData = this.context.getImageData(Math.floor(x), Math.floor(y), 1, 1)

    vec4.set(outColor,
      imageData.data[0] / 255.0,
      imageData.data[1] / 255.0,
      imageData.data[2] / 255.0,
      imageData.data[3] / 255.0
    )
  }
}
