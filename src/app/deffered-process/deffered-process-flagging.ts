import { SubToolContext } from "../context"
import { AutoFillLayer, Layer, VectorLayer, VectorLayerGeometry, VectorStrokeGroup } from "../document-data"

export enum PostUpdateSituationTypeID {

  changesKeepingObjectShapes,
  changesObjectShapes,
  addObjects,
  deleteObjects,
}

export class DefferedProcessFlagging {

  postUpdate_geometrys: VectorLayerGeometry[] = []
  postUpdate_strokeGroups: VectorStrokeGroup[] = []
  postUpdate_layers: Layer[] = []

  lazyUpdate_strokeGroups: VectorStrokeGroup[] = []
  lazyUpdate_layers: Layer[] = []

  addGeometryForDeletingEmpties(target_geometry: VectorLayerGeometry) {

    this.postUpdate_geometrys.push(target_geometry)
  }

  addGroup(target_layer: Layer, target_strokeGroup: VectorStrokeGroup, postUpdateStrategyType: PostUpdateSituationTypeID) {

    if (postUpdateStrategyType != PostUpdateSituationTypeID.changesKeepingObjectShapes) {

      this.postUpdate_strokeGroups.push(target_strokeGroup)
    }

    this.lazyUpdate_strokeGroups.push(target_strokeGroup)

    this.addLayer(target_layer)
  }

  addLayer(target_layer: Layer) {

    // 登録済みの場合スキップ
    if (this.lazyUpdate_layers.find(ly => ly == target_layer)) {
      return
    }

    this.lazyUpdate_layers.push(target_layer)

    // 同階層の影響を受けるレイヤーを追加
    if (VectorLayer.isVectorStrokeLayer(target_layer)) {

      for (const child of target_layer.runtime.parentLayer.childLayers) {

        if (VectorLayer.isPointBrushFillLayer(child)) {

          this.postUpdate_layers.push(child)
        }
        else if (AutoFillLayer.isAutoFillLayer(child)) {

          this.lazyUpdate_layers.push(child)
        }
      }
    }
  }

  setFlags(ctx: SubToolContext) {

    if (this.postUpdate_geometrys.length > 0) {

      for (const geometry of this.postUpdate_geometrys) {

        VectorLayerGeometry.setPostUpdateNeeded(geometry)
      }

      ctx.main.setPostUpdateNeeded()
    }

    if (this.postUpdate_layers.length > 0) {

      for (const layer of this.postUpdate_layers) {

        Layer.setPostUpdateNeeded(layer)

        ctx.main.setRedrawDrawPathForLayer(layer)
      }

      ctx.main.setPostUpdateNeeded()
    }

    if (this.postUpdate_strokeGroups.length > 0) {

      for (const group of this.postUpdate_strokeGroups) {

        VectorStrokeGroup.setPostUpdateNeeded(group)
      }

      ctx.main.setPostUpdateNeeded()
    }

    if (this.lazyUpdate_strokeGroups.length > 0) {

      for (const group of this.lazyUpdate_strokeGroups) {

        VectorStrokeGroup.setLazyUpdateNeeded(group)
      }

      ctx.main.setLazyUpdateNeeded()
    }

    if (this.lazyUpdate_layers.length > 0) {

      for (const layer of this.lazyUpdate_layers) {

        Layer.setLazyUpdateNeeded(layer)

        ctx.main.setRedrawDrawPathForLayer(layer)
      }

      ctx.main.setLazyUpdateNeeded()
    }
  }
}
