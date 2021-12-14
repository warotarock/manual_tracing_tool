import { float, int } from '../logics/conversion'

export class RenderModel {

  vertexBuffer: WebGLBuffer = null
  indexBuffer: WebGLBuffer = null

  vertexData: float[] = null
  indexData: float[] = null
  indexCount = 0
  vertexDataStride = 0
}

export class RenderImage {

  width = 0
  height = 0

  texture: WebGLTexture = null

  imageData: HTMLImageElement = null
}

export class RenderShader {

  gl: WebGLRenderingContext

  floatPrecisionDefinitionCode = ''
  vertexShaderSourceCode = ''
  fragmentShaderSourceCode = ''

  vertexShader: WebGLShader = null
  fragmentShader: WebGLShader = null
  program: WebGLProgram = null

  attribLocationList: int[] = []
  vertexAttribPointerOffset = 0

  uPMatrix: WebGLUniformLocation = null
  uMVMatrix: WebGLUniformLocation = null

  isAvailable(): boolean {

    return (this.gl != null)
  }

  isDisabled(): boolean {

    return (this.gl == null)
  }

  initializeSourceCode(precisionText: string) {

    this.floatPrecisionDefinitionCode = '#ifdef GL_ES\n precision ' + precisionText + ' float;\n #endif\n'

    this.initializeVertexSourceCode()

    this.initializeFragmentSourceCode()
  }

  protected initializeVertexSourceCode() { // @virtual

    // Override method
  }

  protected initializeFragmentSourceCode() { // @virtual

    // Override method
  }

  initializeAttributes() { // @virtual

    this.initializeAttributes_RenderShader()
  }

  initializeAttributes_RenderShader() {

    if (this.isDisabled()) {
      return
    }

    this.uPMatrix = this.getUniformLocation('uPMatrix')
    this.uMVMatrix = this.getUniformLocation('uMVMatrix')
  }

  protected getAttribLocation(name: string): int {

    if (this.isDisabled()) {
      return
    }

    const attribLocation = this.gl.getAttribLocation(this.program, name)
    this.attribLocationList.push(attribLocation)

    return attribLocation
  }

  protected getUniformLocation(name: string): WebGLUniformLocation {

    if (this.isDisabled()) {
      return
    }

    return this.gl.getUniformLocation(this.program, name)
  }

  enableVertexAttributes() {

    if (this.isDisabled()) {
      return
    }

    for (const attribLocation of this.attribLocationList) {

      this.gl.enableVertexAttribArray(attribLocation)
    }
  }

  disableVertexAttributes() {

    if (this.isDisabled()) {
      return
    }

    for (const attribLocation of this.attribLocationList) {

      this.gl.disableVertexAttribArray(attribLocation)
    }
  }

  resetVertexAttribPointerOffset() {

    this.vertexAttribPointerOffset = 0
  }

  vertexAttribPointer(indx: number, size: number, type: number, stride: number) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    if (type == gl.FLOAT || type == gl.INT) {

      gl.vertexAttribPointer(indx, size, type, false, stride, this.vertexAttribPointerOffset)
      this.vertexAttribPointerOffset += 4 * size
    }
  }

  skipVertexAttribPointer(type: number, size: number) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    if (type == gl.FLOAT || type == gl.INT) {

      this.vertexAttribPointerOffset += 4 * size
    }
  }

  setProjectionMatrix(matrix: Mat4) {

    if (this.isDisabled()) {
      return
    }

    this.gl.uniformMatrix4fv(this.uPMatrix, false, matrix)
  }

  setModelViewMatrix(matrix: Mat4) {

    if (this.isDisabled()) {
      return
    }

    this.gl.uniformMatrix4fv(this.uMVMatrix, false, matrix)
  }
}

export enum WebGLRenderBlendType {
  blend = 1,
  add = 2,
  src = 3,
}

export class WebGLRender {

  private gl: WebGLRenderingContext = null
  private floatPrecisionText: string = ''
  private currentShader: RenderShader = null

  isAvailable(): boolean {

    return (this.gl != null)
  }

  isDisabled(): boolean {

    return (this.gl == null)
  }

  initializeWebGL(canvas: HTMLCanvasElement, antialias: boolean): boolean {

    try {

      const option = { preserveDrawingBuffer: true, antialias: antialias }

      const gl = <WebGLRenderingContext>(
        canvas.getContext('webgl', option)
        || canvas.getContext('experimental-webgl', option)
      )

      if (gl != null) {

        this.attach(gl)
      }
      else {

        throw new Error('ERROR-0701:Faild to initialize WebGL.')
      }
    }
    catch (e) {

      return true
    }

    return false
  }

  attach(gl: WebGLRenderingContext) {

    this.gl = gl

    const format = this.gl.getShaderPrecisionFormat(this.gl.FRAGMENT_SHADER, this.gl.HIGH_FLOAT)
    this.floatPrecisionText = format.precision != 0 ? 'highp' : 'mediump'

    this.resetBasicParameters()
  }

  initializeModelBuffer(model: RenderModel, vertexData: float[], indexData: int[], vertexDataStride: int) {

    if (this.isDisabled()) {
      return
    }

    model.vertexBuffer = this.createVertexBuffer(vertexData, this.gl)
    model.indexBuffer = this.createIndexBuffer(indexData, this.gl)

    model.vertexData = vertexData
    model.indexData = indexData
    model.indexCount = indexData.length
    model.vertexDataStride = vertexDataStride
  }

  createBuffer(): WebGLBuffer {

    if (this.isDisabled()) {
      return
    }

    return this.gl.createBuffer()
  }

  deleteBuffer(buffer: WebGLBuffer) {

    if (this.isDisabled()) {
      return
    }

    this.gl.deleteBuffer(buffer)
  }

  bufferDataOnce(buffer: WebGLBuffer, dataArray: Float32Array) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  private createVertexBuffer(data: float[], gl: WebGLRenderingContext): WebGLBuffer {

    const glBuffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    return glBuffer
  }

  private createIndexBuffer(data: int[], gl: WebGLRenderingContext): WebGLBuffer {

    const glBuffer = gl.createBuffer()

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    return glBuffer
  }

  releaseModelBuffer(model: RenderModel) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    if (model.vertexBuffer != null) {

      this.gl.bindBuffer(gl.ARRAY_BUFFER, null)

      gl.deleteBuffer(model.vertexBuffer)

      model.vertexBuffer = null
    }

    if (model.indexBuffer != null) {

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

      gl.deleteBuffer(model.indexBuffer)

      model.indexBuffer = null
    }
  }

  initializeImageTexture(image: RenderImage) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    const glTexture = gl.createTexture()

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.bindTexture(gl.TEXTURE_2D, glTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.imageData)

    //gl.generateMipmap(gl.TEXTURE_2D)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)

    gl.bindTexture(gl.TEXTURE_2D, null)

    image.texture = glTexture
    image.width = image.imageData.width
    image.height = image.imageData.height
  }

  releaseImageTexture(image: RenderImage) {

    if (this.isDisabled()) {
      return
    }

    if (image.texture == null) {
      return
    }

    const gl = this.gl

    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.deleteTexture(image.texture)

    image.texture = null
  }

  setTextureImageFromCanvas(image: RenderImage, canvas: HTMLCanvasElement) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    gl.bindTexture(gl.TEXTURE_2D, image.texture)

    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas)

    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  initializeShader(shader: RenderShader) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    shader.gl = gl

    shader.initializeSourceCode(this.floatPrecisionText)

    const program = gl.createProgram()
    const vertexShader = this.createShader(String(shader.vertexShaderSourceCode), true, gl)
    const fragmentShader = this.createShader(shader.fragmentShaderSourceCode, false, gl)

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {

      shader.program = program
      shader.vertexShader = vertexShader
      shader.fragmentShader = fragmentShader

      shader.initializeAttributes()
    }
    else {

      throw new Error('ERROR-0702:' + gl.getProgramInfoLog(program))
    }
  }

  private createShader(glslSourceCode: string, isVertexShader: boolean, gl: WebGLRenderingContext): WebGLShader {

    let shader: WebGLShader
    if (isVertexShader) {

      shader = gl.createShader(gl.VERTEX_SHADER)
    }
    else {

      shader = gl.createShader(gl.FRAGMENT_SHADER)
    }

    gl.shaderSource(shader, glslSourceCode)

    gl.compileShader(shader)

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

      return shader
    }
    else {

      alert(gl.getShaderInfoLog(shader))
    }
  }

  releaseShader(shader: RenderShader) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    if (shader.program != null) {

      gl.useProgram(null)

      gl.detachShader(shader.program, shader.vertexShader)
      gl.deleteShader(shader.vertexShader)
      shader.vertexShader = null

      gl.detachShader(shader.program, shader.fragmentShader)
      gl.deleteShader(shader.fragmentShader)
      shader.fragmentShader = null

      gl.deleteShader(shader.program)
      shader.program = null
    }
  }

  setShader(shader: RenderShader) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    const lastShader = this.currentShader

    gl.useProgram(shader.program)
    this.currentShader = shader

    if (lastShader != null
      && lastShader.attribLocationList.length != this.currentShader.attribLocationList.length) {

      lastShader.disableVertexAttributes()
    }
  }

  clearColorBufferDepthBuffer(r: float, g: float, b: float, a: float) {

    if (this.isDisabled()) {
      return
    }

    this.gl.clearColor(r, g, b, a)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
  }

  clearDepthBuffer() {

    if (this.isDisabled()) {
      return
    }

    this.gl.clear(this.gl.DEPTH_BUFFER_BIT)
  }

  setTextureFilterNearest() {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  }

  setTextureFilterLinear() {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }

  activeTexture(image: RenderImage) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, image.texture)
  }

  resetBasicParameters() {

    this.setDepthTest(true)
    this.setDepthMask(true)
    this.setCulling(true)
    this.setBlendType(WebGLRenderBlendType.blend)
  }

  setViewport(x: float, y: float, width: float, height: float) {

    if (this.isDisabled()) {
      return
    }

    this.gl.viewport(x, y, width, height)
  }

  setDepthTest(enable: boolean): WebGLRender {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    if (enable) {

      gl.enable(gl.DEPTH_TEST)
    }
    else {

      gl.disable(gl.DEPTH_TEST)
    }

    return this
  }

  setDepthMask(enable: boolean) {

    if (this.isDisabled()) {
      return
    }

    this.gl.depthMask(enable)
  }

  setCulling(enable: boolean) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    if (enable) {

      gl.enable(gl.CULL_FACE)
    }
    else {

      gl.disable(gl.CULL_FACE)
    }
  }

  setCullingBackFace(cullBackFace: boolean): WebGLRender {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    if (cullBackFace) {

      gl.cullFace(gl.BACK)
    }
    else {

      gl.cullFace(gl.FRONT)
    }
  }

  setBlendType(blendType: WebGLRenderBlendType) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    gl.enable(gl.BLEND)

    if (blendType == WebGLRenderBlendType.add) {

      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE)
      gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD)
    }
    else if (blendType == WebGLRenderBlendType.src) {

      gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO)
      gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD)
    }
    else {

      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE)
      gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD)
    }
  }

  drawElements(model: RenderModel) {

    if (this.isDisabled()) {
      return
    }

    this.gl.drawElements(this.gl.TRIANGLES, model.indexCount, this.gl.UNSIGNED_SHORT, 0)
  }

  drawArrayTriangles(tryangleCount: int) {

    if (this.isDisabled()) {
      return
    }

    this.gl.drawArrays(this.gl.TRIANGLES, 0, tryangleCount)
  }
}
