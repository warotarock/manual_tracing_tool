import { AutoFillLayer, DocumentData, Layer, PointBrushFillLayer, VectorLayer } from '../document-data'
import { FillAreaTypeID, FillDrawable, FillDrawableLayer } from '../document-data/fill-drawable'
import { DrawLineTypeID, StrokeDrawable, StrokeDrawableLayer } from '../document-data/stroke-drawable'
import { CanvasRenderBlendMode } from '../render'
import { ViewKeyframe, ViewKeyframeLayer } from '../view'
import { DrawPathContext, DrawPathOperationTypeID } from './draw-path'
import { DrawPathStep } from './draw-path-step'

enum TempVirtualLayerTypeID {

  none = 0,
  normal,
  virtualGroup,
}

class TempVirtualLayer {

  constructor(public readonly type: TempVirtualLayerTypeID, public readonly layer: Layer) {

    if (!layer) {
      throw new Error('ERROR0000:virtual layer can not take layer value of null')
    }
  }

  children: TempVirtualLayer[] = []
}

export class DrawPathCollectingLogic {

  collectDrawPaths(drawPathContext: DrawPathContext, documentData: DocumentData, currentViewKeyframe: ViewKeyframe, ouputDebugText = false) {

    const drawPathSteps: DrawPathStep[] = []

    // Insert a step for begin
    {
      const vLayer = new TempVirtualLayer(TempVirtualLayerTypeID.normal, documentData.rootLayer)
      drawPathSteps.push(
        this.createDrawPathStep(vLayer, DrawPathOperationTypeID.startDrawPaths, false, '')
      )
    }

    // Collect virtual-grouped layer info
    const vLayers: TempVirtualLayer[] = []
    this.collectVirtualLayerRecursive(vLayers, documentData.rootLayer.childLayers)

    // Collect steps recursive
    this.collectDrawPathsRecursive(drawPathSteps, vLayers, drawPathContext.isFullRendering(), drawPathContext.isOnionSkin())

    // Insert a step for end
    {
      const vLayer = new TempVirtualLayer(TempVirtualLayerTypeID.normal, documentData.rootLayer)
      drawPathSteps.push(
        this.createDrawPathStep(vLayer, DrawPathOperationTypeID.finishDrawPaths, false, '')
      )
    }

    // Attach layers to paths
    this.updateViewKeyframeReferences(drawPathSteps, currentViewKeyframe.layers)

    drawPathContext.documentData = documentData
    drawPathContext.steps = drawPathSteps
    drawPathContext.isNonActiveLayerBufferDrawingDone = false

    // Collect active part from selection state
    this.updateActiveDrawPathIndex(drawPathContext)

    // Debug output
    if (ouputDebugText) {
      console.debug(`DrawPath collectDrawPaths`)
      let stepIndex = 0
      for (const step of drawPathContext.steps) {
        console.debug(` ${stepIndex}: ${step._debugText} ${(step.layer && step.layer.name) ? '[' + step.layer.name + ']' : ''} ${CanvasRenderBlendMode[step.compositeOperation]}${step._debugText2}`)
        stepIndex++
      }
    }
  }

  private collectVirtualLayerRecursive(result: TempVirtualLayer[], layers: Layer[]) {

    for (let i = 0; i < layers.length; i++) {

      const layer = layers[i]

      const vLayer = new TempVirtualLayer(TempVirtualLayerTypeID.normal, layer)

      this.collectVirtualLayerRecursive(vLayer.children, layer.childLayers)

      if (layer.isMaskedByBelowLayer) {

        // Creates vitual group, inserts the layer and following layers into the group

        const group_virtualLayer = new TempVirtualLayer(TempVirtualLayerTypeID.virtualGroup, layer)

        // the layer
        group_virtualLayer.children.push(vLayer)

        // following layers
        let nextIndex = i + 1
        while (nextIndex < layers.length) {

          const nextLayer = layers[nextIndex]

          const next_vLayer = new TempVirtualLayer(TempVirtualLayerTypeID.normal, nextLayer)

          this.collectVirtualLayerRecursive(next_vLayer.children, nextLayer.childLayers)

          group_virtualLayer.children.push(next_vLayer)

          if (nextLayer.isMaskedByBelowLayer) {

            nextIndex++
          }
          else {

            i = nextIndex

            break
          }
        }

        result.push(group_virtualLayer)
      }
      else {

        result.push(vLayer)
      }
    }
  }

  private collectDrawPathsRecursive(result: DrawPathStep[], vLayers: TempVirtualLayer[], isFullRendering: boolean, isOnionSkin: boolean) {

    let isGPUDrawContinuing = false

    for (let i = vLayers.length - 1; i >= 0; i--) {

      const vLayer = vLayers[i]

      // Proccess virtual parent-children
      if (vLayer.children.length > 0) {

        const debugText = (vLayer.type == TempVirtualLayerTypeID.virtualGroup) ? ' virtual' : ''

        // Insert a step to begin buffering for layer composition
        const needsCompositionForSelf = (
          vLayer.layer.isMaskedByBelowLayer
        )

        const needsCompositionForChildren = (
          vLayer.children.findIndex(child =>
            child.type != TempVirtualLayerTypeID.virtualGroup && child.layer.isMaskedByBelowLayer
          ) != -1
        )

        const needsComposition = (needsCompositionForSelf || needsCompositionForChildren) && !isOnionSkin

        if (needsComposition) {

          result.push(
            this.createDrawPathStep(vLayer, DrawPathOperationTypeID.prepareBuffer, isOnionSkin, debugText)
          )
        }

        // Insert steps for children
        this.collectDrawPathsRecursive(result, vLayer.children, isFullRendering, isOnionSkin)

        if (needsComposition) {

          // insert a step to finish buffering
          result.push(
            this.createDrawPathStep(vLayer, DrawPathOperationTypeID.flushBuffer, isOnionSkin, debugText)
          )
        }

        continue
      }

      // Insert a step to draw fill
      const fillDrawable: FillDrawable = this.isFillDrawableLayer(vLayer.layer) ? <FillDrawableLayer>vLayer.layer : null

      if (fillDrawable && fillDrawable.fillAreaType != FillAreaTypeID.none && !isOnionSkin) {

        result.push(
          this.createDrawPathStep(vLayer, DrawPathOperationTypeID.drawBackground, isOnionSkin)
        )
      }

      // Insert steps to draw stroke
      const strokeDrawable: StrokeDrawable = this.isStrokeDrawableLayer(vLayer.layer) ? <StrokeDrawableLayer>vLayer.layer : null

      if (strokeDrawable && strokeDrawable.drawLineType != DrawLineTypeID.none) {

          // Insert a step to clear gl buffer
          if (isFullRendering && !isGPUDrawContinuing) {

            result.push(
              this.createDrawPathStep(vLayer, DrawPathOperationTypeID.prepareRenderingForeground, isOnionSkin)
            )
          }

          // Insert a step to draw
          {
            const drawPathStep = this.createDrawPathStep(vLayer, DrawPathOperationTypeID.drawForeground, isOnionSkin)
            drawPathStep.useCache = this.isLayerUseCache(vLayer.layer)
            result.push(drawPathStep)
          }

          // Insert a step to flush gl buffer if the next layer dont need draw lines
          isGPUDrawContinuing = false
          if (fillDrawable && fillDrawable.fillAreaType == FillAreaTypeID.none && i > 0) {

            const next_layer = vLayers[i - 1].layer

            if (VectorLayer.isVectorLayer(next_layer)) {

              const next_vectorLayer = <VectorLayer>next_layer

              if (next_vectorLayer.drawLineType != DrawLineTypeID.none
                && next_vectorLayer.fillAreaType == FillAreaTypeID.none) {

                isGPUDrawContinuing = true
              }
            }
          }

          if (isFullRendering && !isGPUDrawContinuing) {

            result.push(
              this.createDrawPathStep(vLayer, DrawPathOperationTypeID.flushRenderingForeground, isOnionSkin)
            )
          }
      }

      if (strokeDrawable || fillDrawable) {

        continue
      }
      else {

        // For other type of layer such as image file layer
        if (!isOnionSkin) {

          result.push(
            this.createDrawPathStep(vLayer, DrawPathOperationTypeID.drawForeground, isOnionSkin)
          )
        }
      }
    }
  }

  private isStrokeDrawableLayer(layer: Layer): boolean {

    return VectorLayer.isVectorLayer(layer)
  }

  private isFillDrawableLayer(layer: Layer): boolean {

    return VectorLayer.isVectorLayer(layer) || AutoFillLayer.isAutoFillLayer(layer)
  }

  private isLayerUseCache(layer: Layer): boolean {

    return PointBrushFillLayer.isPointBrushFillLayer(layer)
  }


  private createDrawPathStep(vLayer: TempVirtualLayer, operationType: DrawPathOperationTypeID, isOnionSkin: boolean, debugText = ''): DrawPathStep {

    if (!vLayer.layer) {
      throw new Error('ERROR0000:drawPathStep can not take layer value of null')
    }

    const drawPathStep = new DrawPathStep()
    drawPathStep.layer = vLayer.layer
    drawPathStep.operationType = operationType

    if (vLayer.type != TempVirtualLayerTypeID.virtualGroup) {

      drawPathStep.compositeOperation = this.getBlendMode(vLayer.layer, isOnionSkin)
    }

    drawPathStep._debugText = DrawPathOperationTypeID[operationType]
    drawPathStep._debugText2 = debugText

    return drawPathStep
  }

  private getBlendMode(layer: Layer, isOnionSkin: boolean): CanvasRenderBlendMode {

    return ((layer.isMaskedByBelowLayer && !isOnionSkin) ? CanvasRenderBlendMode.sourceAtop : CanvasRenderBlendMode.default)
  }

  private updateViewKeyframeReferences(drawPathSteps: DrawPathStep[], viewKeyframeLayers: ViewKeyframeLayer[]) {

    for (const drawPathStep of drawPathSteps) {

      drawPathStep.viewKeyframeLayer = null

      for (const viewKeyframeLayer of viewKeyframeLayers) {

        if (viewKeyframeLayer.layer == drawPathStep.layer) {

          drawPathStep.viewKeyframeLayer = viewKeyframeLayer
          break
        }
      }
    }
  }

  updateActiveDrawPathIndex(drawPathContext: DrawPathContext) {

    let firstSelectedIndex = -1
    let lastSelectedIndex = -1

    let bufferNestStartIndex = -1
    let bufferNestLevel = 0
    let isSelectedNest = false

    for (let i = 0; i < drawPathContext.steps.length; i++) {

      const drawPathStep = drawPathContext.steps[i]

      if (Layer.isSelected(drawPathStep.layer)) {

        // Detect selected range for level = 0
        if (bufferNestLevel == 0) {

          if (firstSelectedIndex == -1) {

            firstSelectedIndex = i
          }

          lastSelectedIndex = i
        }
        else {

          // Set flag for level > 0
          isSelectedNest = true
        }
      }

      if (drawPathStep.operationType == DrawPathOperationTypeID.prepareBuffer) {

        if (bufferNestLevel == 0) {

          bufferNestStartIndex = i
        }

        bufferNestLevel++
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.flushBuffer) {

        bufferNestLevel--

        // Detect selected range for level > 0
        if (bufferNestLevel == 0) {

          if (isSelectedNest) {

            if (firstSelectedIndex == -1) {

              firstSelectedIndex = bufferNestStartIndex
            }

            lastSelectedIndex = i

            isSelectedNest = false
          }
        }
      }
    }

    drawPathContext.activeDrawPathStartIndex = firstSelectedIndex
    drawPathContext.activeDrawPathEndIndex = lastSelectedIndex

    //console.debug('CollectSelectionInfo', firstSelectedIndex, lastSelectedIndex)
  }
}
