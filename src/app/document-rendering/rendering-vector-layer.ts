import { DocumentData, VectorLayer } from '../document-data'
import { CanvasWindow, WebGLRender } from '../render'
import { DrawingVectorLayerLogic } from '../document-drawing/drawing-vector-layer'
import { ViewKeyframeLayer } from '../view'
import { GPULineShader } from './rendering-shaders'
import { Logic_GPULine } from './gpu-line'

export class RenderingVectorLayerLogic {

  private drawGPURender = new WebGLRender()
  private lineShader = new GPULineShader()
  private drawingVectorLayer = new DrawingVectorLayerLogic()
  private logic_GPULine = new Logic_GPULine()

  private strokeColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  private tempMat4 = mat4.create()
  private eyeLocation = vec3.create()
  private lookatLocation = vec3.create()
  private upVector = vec3.create()
  private modelLocation = vec3.create()
  private modelMatrix = mat4.create()
  private viewMatrix = mat4.create()
  private modelViewMatrix = mat4.create()
  private projectionMatrix = mat4.create()

  link(drawGPURender: WebGLRender, lineShader: GPULineShader, drawingVectorLayer: DrawingVectorLayerLogic, logic_GPULine: Logic_GPULine) {

    this.drawGPURender = drawGPURender
    this.lineShader = lineShader
    this.drawingVectorLayer = drawingVectorLayer
    this.logic_GPULine = logic_GPULine
  }

  renderClearBuffer(wnd: CanvasWindow) {

    const render = this.drawGPURender

    render.setViewport(0.0, 0.0, wnd.width, wnd.height)

    render.setDepthTest(true)
    render.setCulling(true)

    render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0)
  }

  renderForeground_VectorLayer(wnd: CanvasWindow, viewKeyFrameLayer: ViewKeyframeLayer, documentData: DocumentData, isEditMode: boolean, useAdjustingLocation: boolean) {

    const render = this.drawGPURender
    const shader = this.lineShader

    const keyframe = viewKeyFrameLayer.vectorLayerKeyframe
    const layer = <VectorLayer>viewKeyFrameLayer.layer

    render.setViewport(0.0, 0.0, wnd.width, wnd.height)

    // Calculate camera matrix
    vec3.set(this.lookatLocation, 0.0, 0.0, 0.0)
    vec3.set(this.upVector, 0.0, 1.0, 0.0)
    vec3.set(this.eyeLocation, 0.0, 0.0, 1.0)

    mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector)

    const aspect = wnd.height / wnd.width
    const orthoWidth = wnd.width / 2 / wnd.viewScale * aspect // TODO: 計算が怪しい（なぜか縦横両方に同じ値を掛けないと合わない）ので後で検討する
    mat4.ortho(this.projectionMatrix, -orthoWidth, orthoWidth, orthoWidth, -orthoWidth, 0.1, 1.0)

    wnd.caluclateGLViewMatrix(this.tempMat4)
    mat4.multiply(this.projectionMatrix, this.tempMat4, this.projectionMatrix)

    render.setDepthTest(false)
    render.setCulling(false)

    render.setShader(shader)

    // Set shader parameters
    vec3.set(this.modelLocation, 0.0, 0.0, 0.0)

    mat4.identity(this.modelMatrix)
    mat4.translate(this.modelMatrix, this.modelMatrix, this.modelLocation)

    mat4.multiply(this.modelViewMatrix, this.viewMatrix, this.modelMatrix)

    shader.setModelViewMatrix(this.modelViewMatrix)
    shader.setProjectionMatrix(this.projectionMatrix)

    this.drawingVectorLayer.getStrokeColor(this.strokeColor, layer, documentData, isEditMode, false)

    for (const unit of keyframe.geometry.units) {

      for (const group of unit.groups) {

        // Calculate line point buffer data

        if (!group.runtime.buffer.isStored) {

          // console.debug(`Calculate line point buffer data`)

          this.logic_GPULine.copyGroupPointDataToBuffer(group, documentData.lineWidthBiasRate, useAdjustingLocation)

          const vertexUnitSize = shader.getVertexUnitSize()
          const vertexCount = shader.getVertexCount(group.runtime.buffer.pointCount, group.runtime.buffer.lines.length) // 本当は辺の数だけでよいので若干無駄は生じるが、計算を簡単にするためこれでよいことにする

          this.logic_GPULine.allocateBuffer(group.runtime.buffer, vertexCount, vertexUnitSize, render)

          shader.calculateBufferData(group.runtime.buffer, this.logic_GPULine)

          if (group.runtime.buffer.usedDataArraySize > 0) {

            this.logic_GPULine.bufferData(group.runtime.buffer, render)
          }
        }

        // Draw lines

        if (group.runtime.buffer.isStored) {

          this.lineShader.setBuffers(group.runtime.buffer.buffer, this.strokeColor)

          const drawCount = this.lineShader.getDrawArrayTryanglesCount(group.runtime.buffer.usedDataArraySize)

          render.drawArrayTriangles(drawCount)
        }
      }
    }
  }
}
