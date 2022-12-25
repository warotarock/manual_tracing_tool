import {
  FillAreaTypeID, Layer, LayerTypeID, VectorLayerGeometryTypeID, VectorLayer, VectorStroke,
  VectorStrokeGroup,
  AutoFillLayer,
  VectorStrokeGroup_RuntimeProperty
} from '../document-data'

export class DocumentMigration_v00_01_03 {

  private static currentVersionString = '0.1.3'
  private static nextVersionString = '0.1.4'

  static matches(versionString: string): boolean {

    return (versionString == this.currentVersionString)
  }

  static migrateVectorLayer(layer: Layer): string {

    // 仮対応。グループに持たせていたタイプをジオメトリに移動

    const vectorLayer = <VectorLayer>layer

    for (const keyframe of vectorLayer.keyframes) {

      if (layer.type == LayerTypeID.vectorLayer) {

        keyframe.geometry.type = VectorLayerGeometryTypeID.strokes
      }
      else if (layer.type == LayerTypeID.surroundingFillLayer || layer.type == LayerTypeID.autoFillLayer){

        keyframe.geometry.type = VectorLayerGeometryTypeID.surroundingFill
      }
      else if (layer.type == LayerTypeID.pointBrushFillLayer){

        keyframe.geometry.type = VectorLayerGeometryTypeID.pointBrushFill
      }

      for (const unit of keyframe.geometry.units) {

        for (const group of unit.groups) {

          if ('type' in group) {

            delete group['type']
          }
        }
      }
    }

    return this.nextVersionString
  }

  static migrateAutoFillLayer(layer: Layer): string {

    const autoFillLayer = <AutoFillLayer>layer

    for (const keyframe of autoFillLayer.keyframes) {

      keyframe.geometry.type = VectorLayerGeometryTypeID.surroundingFill

      for (const unit of keyframe.geometry.units) {

        for (const group of unit.groups) {

          if ('type' in group) {

            delete group['type']
          }
        }
      }
    }

    return this.nextVersionString
  }
}
