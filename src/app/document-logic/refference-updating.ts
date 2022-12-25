import { AnimatableLayer, Layer, VectorLayer, VectorLayerKeyframe, VectorLayerReferenceLayer } from '../document-data'
import { EditAnimationFrameLogic } from './edit-animation-frame'

type ReferenceTarget = Layer | VectorLayerKeyframe[]

interface ReplacedReferenceInfo {

  propertyName: string
  target: any
  oldReference: ReferenceTarget
  newReference: ReferenceTarget
}

export class RefferenceUpdating {

  private replacedReferenceInfos: ReplacedReferenceInfo[] = []

  set(layer: Layer, oldReference: ReferenceTarget, newReference: ReferenceTarget) {

    this.replaceReferenceRecursive(layer, oldReference, newReference)
  }

  private replaceReferenceRecursive(layer: Layer, oldReference: ReferenceTarget, newReference: ReferenceTarget) {

    if (EditAnimationFrameLogic.isAnimatableLayer(layer)) {

      const animatableLayer = <AnimatableLayer>layer

      this.replaceProperty(animatableLayer, 'keyframes', oldReference, newReference)
    }

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer

      this.replaceProperty(vectorLayer.runtime, 'posingLayer', oldReference, newReference)
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      const vRefLayer = <VectorLayerReferenceLayer>layer

      this.replaceProperty(vRefLayer.runtime, 'referenceLayer', oldReference, newReference)
      this.replaceProperty(vRefLayer, 'keyframes', oldReference, newReference)
    }

    for (const child of layer.childLayers) {

      this.replaceReferenceRecursive(child, oldReference, newReference)
    }
  }

  private replaceProperty<T extends object>(target: T, propertyKeyName: keyof(T), oldReference: ReferenceTarget, newReference: ReferenceTarget) {

    const propertyName = String(propertyKeyName)

    if ((propertyName in target) && target[propertyName] == oldReference) {

      this.replacedReferenceInfos.push(
        {
          propertyName: propertyName,
          target: target,
          oldReference: target[propertyName],
          newReference: newReference,
        }
      )

      target[propertyName] = newReference
    }
  }

  existsReplacedReference(): boolean {

    return (this.replacedReferenceInfos.length > 0)
  }

  undoReplacedReferences() {

    for (const unlinkedLayerInfo of this.replacedReferenceInfos) {

      unlinkedLayerInfo.target[unlinkedLayerInfo.propertyName] = unlinkedLayerInfo.oldReference
    }
  }

  redoReplacedReferences() {

    for (const unlinkedLayerInfo of this.replacedReferenceInfos) {

      unlinkedLayerInfo.target[unlinkedLayerInfo.propertyName] = unlinkedLayerInfo.newReference
    }
  }
}
