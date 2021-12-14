import { AutoFillLayer, DocumentData, DrawLineTypeID, FillAreaTypeID, FillDrawable, GroupLayer, Layer, VectorLayer } from '../document_data'
import { ViewKeyframe, ViewKeyframeLayer } from '../view/view_keyframe'
import { DrawPathContext, DrawPathStep, DrawPathOperationTypeID, TempVirtualLayer, TempVirtualLayerTypeID
} from './draw_path'

export class DrawPathCollectingLogic {

  collectDrawPaths(drawPathContext: DrawPathContext, documentData: DocumentData, currentViewKeyframe: ViewKeyframe) {

    const drawPathSteps: DrawPathStep[] = []

    // Insert a step for begin
    {
      const drawPathStep = new DrawPathStep()
      drawPathStep.layer = documentData.rootLayer
      drawPathStep.setType(DrawPathOperationTypeID.beginDrawing)
      drawPathSteps.push(drawPathStep)
    }

    // Collect virtual-grouped layer info
    const vLayers: TempVirtualLayer[] = []
    this.collectDrawPaths_CollectVirtualLayerRecursive(vLayers, documentData.rootLayer.childLayers)

    // Collect steps recursive
    this.collectDrawPasths_CollectPathRecursive(drawPathSteps, vLayers)

    // Insert a step for end
    {
      const drawPathStep = new DrawPathStep()
      drawPathStep.layer = documentData.rootLayer
      drawPathStep.setType(DrawPathOperationTypeID.endDrawing)
      drawPathSteps.push(drawPathStep)
    }

    // Attach layers to paths
    if (currentViewKeyframe != null) {

      this.collectDrawPasths_CollectViewKeyframe(drawPathSteps, currentViewKeyframe.layers)
    }

    drawPathContext.documentData = documentData
    drawPathContext.steps = drawPathSteps

    // Collecct selected part
    this.collectDrawPasths_CollectSelectionInfo(drawPathContext)

    // Debug output
    {
      console.debug(`DrawPath collectDrawPaths`)

      let stepIndex = 0

      for (const step of drawPathContext.steps) {

        console.debug(` ${stepIndex}: ${step._debugText} ${(step.layer && step.layer.name) ? step.layer.name : ''}`)

        stepIndex++
      }
    }
  }

  private collectDrawPaths_CollectVirtualLayerRecursive(result: TempVirtualLayer[], layers: Layer[]) {

    for (let i = 0; i < layers.length; i++) {

      const layer = layers[i]

      const vLayer = new TempVirtualLayer()
      vLayer.type = TempVirtualLayerTypeID.normal
      vLayer.layer = layer

      this.collectDrawPaths_CollectVirtualLayerRecursive(vLayer.children, layer.childLayers)

      if (layer.isMaskedByBelowLayer) {

        // Creates vitual group, inserts the layer and following layers into the group

        const virtualGroup_vLayer = new TempVirtualLayer()
        virtualGroup_vLayer.type = TempVirtualLayerTypeID.virtualGroup
        virtualGroup_vLayer.layer = layer

        // the layer
        virtualGroup_vLayer.children.push(vLayer)

        // following layers
        let nextIndex = i + 1
        while (nextIndex < layers.length) {

          const nextLayer = layers[nextIndex]

          const next_vLayer = new TempVirtualLayer()
          next_vLayer.type = TempVirtualLayerTypeID.normal
          next_vLayer.layer = nextLayer

          this.collectDrawPaths_CollectVirtualLayerRecursive(next_vLayer.children, nextLayer.childLayers)

          virtualGroup_vLayer.children.push(next_vLayer)

          if (nextLayer.isMaskedByBelowLayer) {

            nextIndex++
          }
          else {

            i = nextIndex

            break
          }
        }

        result.push(virtualGroup_vLayer)
      }
      else {

        result.push(vLayer)
      }
    }
  }

  private isFillDrawableLayer(layer: Layer) {

    return VectorLayer.isVectorLayer(layer) || AutoFillLayer.isAutoFillLayer(layer)
  }

  private getFillDrawable(layer: Layer) {

    return <FillDrawable><VectorLayer>layer
  }

  private collectDrawPasths_CollectPathRecursive(result: DrawPathStep[], vLayers: TempVirtualLayer[]) {

    let isGPUDrawContinuing = false

    for (let i = vLayers.length - 1; i >= 0; i--) {

      const vLayer = vLayers[i]
      let done = false

      if (vLayer.type == TempVirtualLayerTypeID.virtualGroup
        || GroupLayer.isGroupLayer(vLayer.layer)) {

        // Insert a step to begin buffering
        {
          const drawPathStep = new DrawPathStep()
          drawPathStep.layer = vLayer.layer
          drawPathStep.setType(DrawPathOperationTypeID.prepareBuffer)
          drawPathStep.compositeOperation = (vLayer.layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over')
          result.push(drawPathStep)
        }

        // Insert steps for group children
        this.collectDrawPasths_CollectPathRecursive(result, vLayer.children)

        // insert a step to finish buffering
        {
          const drawPathStep = new DrawPathStep()
          drawPathStep.layer = vLayer.layer
          drawPathStep.setType(DrawPathOperationTypeID.flushBuffer)
          result.push(drawPathStep)
        }

        done = true
      }

      if (!done && this.isFillDrawableLayer(vLayer.layer)) {

        const drawable = this.getFillDrawable(vLayer.layer)

        // Insert a step to draw fill
        if (drawable.fillAreaType != FillAreaTypeID.none) {

          const drawPathStep = new DrawPathStep()
          drawPathStep.layer = vLayer.layer
          drawPathStep.setType(DrawPathOperationTypeID.drawBackground)
          drawPathStep.compositeOperation = this.collectDrawPasths_getCompositeOperationString(vLayer.layer)
          result.push(drawPathStep)
        }
      }

      if (!done && VectorLayer.isVectorLayer(vLayer.layer)) {

        const vectorLayer = <VectorLayer>vLayer.layer

        // Insert steps to draw line
        if (vectorLayer.drawLineType != DrawLineTypeID.none) {

          // Insert a step to clear gl buffer
          if (!isGPUDrawContinuing) {

            const drawPathStep = new DrawPathStep()
            drawPathStep.layer = vLayer.layer
            drawPathStep.setType(DrawPathOperationTypeID.prepareRendering)
            result.push(drawPathStep)
          }

          // Insert a step to draw
          {
            const drawPathStep = new DrawPathStep()
            drawPathStep.layer = vLayer.layer
            drawPathStep.setType(DrawPathOperationTypeID.drawForeground)
            drawPathStep.compositeOperation = this.collectDrawPasths_getCompositeOperationString(vLayer.layer)
            result.push(drawPathStep)
          }

          // Insert a step to flush gl buffer if the next layer dont need draw lines
          isGPUDrawContinuing = false
          if (vectorLayer.fillAreaType == FillAreaTypeID.none && i > 0) {

            const next_layer = vLayers[i - 1].layer

            if (VectorLayer.isVectorLayer(next_layer)) {

              const next_vectorLayer = <VectorLayer>next_layer

              if (next_vectorLayer.drawLineType != DrawLineTypeID.none
                && next_vectorLayer.fillAreaType == FillAreaTypeID.none) {

                isGPUDrawContinuing = true
              }
            }
          }

          if (!isGPUDrawContinuing) {

            const drawPathStep = new DrawPathStep()
            drawPathStep.layer = vLayer.layer
            drawPathStep.setType(DrawPathOperationTypeID.flushRendering)
            drawPathStep.compositeOperation = this.collectDrawPasths_getCompositeOperationString(vLayer.layer)
            result.push(drawPathStep)
          }
        }

        done = true
      }

      if (!done) {

        const drawPathStep = new DrawPathStep()
        drawPathStep.layer = vLayer.layer
        drawPathStep.setType(DrawPathOperationTypeID.drawForeground)
        result.push(drawPathStep)
      }
    }
  }

  collectDrawPasths_CollectSelectionInfo(drawPathContext: DrawPathContext) {

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

  private collectDrawPasths_CollectViewKeyframe(drawPathSteps: DrawPathStep[], viewKeyframeLayers: ViewKeyframeLayer[]) {

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

  private collectDrawPasths_getCompositeOperationString(layer: Layer) {

    return (layer.isMaskedByBelowLayer ? 'source-atop' : 'source-over')
  }
}
