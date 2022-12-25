import { float, int } from '../common-logics'

export class CanvasWindow {

  canvas: HTMLCanvasElement = null
  context: CanvasRenderingContext2D = null
  devicePixelRatio: float = 1.0
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

  createCanvas(width?: int, height?: int, willReadFrequently = false) {

    this.attachCanvas(document.createElement('canvas'))

    if (width && height) {

      this.setCanvasSize(width, height)
      this.initializeContext(willReadFrequently)
    }
  }

  attachCanvas(canvas: HTMLCanvasElement) {

    this.canvas = canvas
    this.devicePixelRatio = window.devicePixelRatio
    this.width = canvas.width
    this.height = canvas.height
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

  initializeContext(willReadFrequently = false) {

    this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d', { willReadFrequently: willReadFrequently })
  }

  isInitialized(): boolean {

    return (this.canvas != null && this.context != null)
  }

  isSameMetrics(targetWindow: CanvasWindow): boolean {

    return (
      this.isInitialized() &&
      targetWindow.isInitialized() &&
      targetWindow.width == this.width &&
      targetWindow.height == this.height
    )
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

  getViewScaledLength(length: float) {

    return length / this.viewScale
  }
}

export enum CanvasRenderBlendMode {

  default, alphaOver, add,  sourceAtop, destinationIn
}

export enum CanvasRenderLineCap {

  butt, round, square
}

export class CanvasRender {

  private context: CanvasRenderingContext2D = null
  private canvasWindow: CanvasWindow = null
  private currentTransform = mat4.create()
  private tempMat = mat4.create()
  private lastFontHeight = 0.0
  private strokeDashEmpty: float[] = []

  get transformMatrix(): Mat4 {

    return this.canvasWindow.transformMatrix
  }

  get canvasWidth(): int {

    return this.canvasWindow.width
  }

  get canvasHeight(): int {

    return this.canvasWindow.height
  }

  setContext(canvasWindow: CanvasWindow) {

    this.context = canvasWindow.context
    this.canvasWindow = canvasWindow
    this.lastFontHeight = 0.0

    canvasWindow.updateViewMatrix()

    this.copyTransformFromWindow(canvasWindow)
  }

  getViewScale(): float {

    return this.canvasWindow.viewScale
  }

  getViewScaledSize(size: float): float {

    return size / this.canvasWindow.viewScale
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

    CanvasRender.setTransformMat4(this.context, matrix)
  }

  static setTransformMat4(context: CanvasRenderingContext2D, matrix: Mat4) {

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

  isInViewRectangle(location: Vec3, range: float) {

    const centerX = this.canvasWindow.viewLocation[0]
    const centerY = this.canvasWindow.viewLocation[0]

    const distance = Math.sqrt(Math.pow(location[0] - centerX, 2) + Math.pow(location[1] - centerY, 2))

    const rangeX = Math.max(centerX , this.canvasWidth - centerX)
    const rangeY = Math.max(centerY , this.canvasHeight - centerY)

    const viewRange = Math.sqrt(rangeX * rangeX + rangeY * rangeY) / this.canvasWindow.viewScale

    return ((distance - range) < viewRange)
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

  createRadialGradient(x: float, y: float, radius: float) {

    return this.context.createRadialGradient(x, y, 0, x, y, radius)
  }

  setFillGradiaent(gradient: CanvasGradient) {

    this.context.fillStyle = gradient
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

  clearLineDash() {

    this.context.setLineDash(this.strokeDashEmpty)
  }

  setGlobalAlpha(a: float) {

    this.context.globalAlpha = a
  }

  setBlendMode(blendMode: CanvasRenderBlendMode) {

    switch (blendMode) {

      case CanvasRenderBlendMode.default:
      case CanvasRenderBlendMode.alphaOver:
        this.context.globalCompositeOperation = 'source-over'
        break

      case CanvasRenderBlendMode.sourceAtop:
        this.context.globalCompositeOperation = 'source-atop'
        break

      case CanvasRenderBlendMode.destinationIn:
        this.context.globalCompositeOperation = 'destination-in'
        break

      case CanvasRenderBlendMode.add:
        this.context.globalCompositeOperation = 'lighter'
        break
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

  clear() {

    mat4.copy(this.tempMat, this.canvasWindow.transformMatrix)

    this.context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

    this.context.clearRect(0, 0, this.canvasWindow.width, this.canvasWindow.height)

    this.setTransformFromMatrix(this.tempMat)
  }

  clearRect(left: int, top: int, width: int, height: int) {

    this.context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

    this.context.clearRect(left, top, width, height)

    this.cancelLocalTransform()
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

  putImageData(imageData: ImageData, destX: int, destY: int) {

    this.context.putImageData(imageData, destX, destY)
  }

  setFontSize(height: float) {

    if (height != this.lastFontHeight) {

      this.context.font = `${height.toFixed(0)}px 'MS Gothic', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Osaka-Mono', 'Noto Sans JP', monospace`
    }
  }

  fillText(text: string, x: float, y: float, horizontalCenter = false, verticalCenter = false) {

    this.strokeOrFillText(true, text, x, y, horizontalCenter, verticalCenter)
  }

  strokeText(text: string, x: float, y: float, horizontalCenter = false, verticalCenter = false) {

    this.strokeOrFillText(false, text, x, y, horizontalCenter, verticalCenter)
  }

  private strokeOrFillText(fill: boolean, text: string, x: float, y: float, horizontalCenter = false, verticalCenter = false) {

    if (verticalCenter || horizontalCenter) {

      const metrics = this.context.measureText(text)

      if (horizontalCenter) {

        x -= metrics.width / 2
      }

      if (verticalCenter) {

        y += (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) / 2
      }
    }

    if (fill) {

      this.context.fillText(text, x, y)
    }
    else {

      this.context.lineJoin = 'round';
      this.context.strokeText(text, x, y)
      this.context.lineJoin = 'miter';
    }
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
