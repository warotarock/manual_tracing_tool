import { Layer, VectorKeyframe, VectorLayer, VectorLayerReferenceLayer, VectorStrokeGroup } from '../document_data'
import { SubToolContext } from '../context/subtool_context'

export class CommandBase {

  isContinued = false

  execute(_ctx: SubToolContext) { // @virtual

  }

  undo(_ctx: SubToolContext) { // @virtual

  }

  redo(_ctx: SubToolContext) { // @virtual

  }

  // バッファなど追加の更新の対象

  targetGroups: VectorStrokeGroup[] = null

  useGroup(group: VectorStrokeGroup) {

    if (!this.targetGroups) {

      this.useGroups()
    }

    this.targetGroups.push(group)
  }

  useGroups(targetGroups?: VectorStrokeGroup[]) {

    if (targetGroups) {

      this.targetGroups = targetGroups
    }
    else {

      this.targetGroups = []
    }
  }

  // 参照の更新

  private replacedReferenceInfos: ReplacedReferenceInfo[] = []

  protected replaceReference<T extends Layer>(target: T, propertyKeyName: keyof(T), oldReference: ReferenceTarget, newReference: ReferenceTarget) {

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

  protected replaceReferenceRecursive(layer: Layer, oldReference: ReferenceTarget, newReference: ReferenceTarget) {

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer

      this.replaceReference(vectorLayer, 'posingLayer', oldReference, newReference)
      this.replaceReference(vectorLayer, 'keyframes', oldReference, newReference)
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      const vRefLayer = <VectorLayerReferenceLayer>layer

      this.replaceReference(vRefLayer, 'referenceLayer', oldReference, newReference)
      this.replaceReference(vRefLayer, 'keyframes', oldReference, newReference)
    }

    for (const child of layer.childLayers) {

      this.replaceReferenceRecursive(child, oldReference, newReference)
    }
  }

  protected existsReplacedReference(): boolean {

    return (this.replacedReferenceInfos.length > 0)
  }

  protected undoReplacedReferences() {

    for (const unlinkedLayerInfo of this.replacedReferenceInfos) {

      unlinkedLayerInfo.target[unlinkedLayerInfo.propertyName] = unlinkedLayerInfo.oldReference
    }
  }

  protected redoReplacedReferences() {

    for (const unlinkedLayerInfo of this.replacedReferenceInfos) {

      unlinkedLayerInfo.target[unlinkedLayerInfo.propertyName] = unlinkedLayerInfo.newReference
    }
  }
}

type ReferenceTarget = Layer | VectorKeyframe[]

interface ReplacedReferenceInfo {

  propertyName: string
  target: Layer
  oldReference: ReferenceTarget
  newReference: ReferenceTarget
}


