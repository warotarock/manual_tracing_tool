import {
  FillAreaTypeID, Layer, LayerTypeID, VectorLayer, VectorStroke,
  VectorStrokeGroup
} from '../document-data'

export class DocumentMigration_v00_01_02 {

  private static currentVersionString = '0.1.2'
  private static nextVersionString = '0.1.3'

  static matches(versionString: string): boolean {

    return (versionString == this.currentVersionString)
  }

  static pass(): string {

    return this.nextVersionString
  }

  static migrateVectorLayer(layer: Layer): string {

    // 塗りをしているレイヤーを囲み塗りレイヤーに変換する

    const vectorLayer = <VectorLayer>layer

    if (vectorLayer.fillAreaType == FillAreaTypeID.none) {

      for (const keyframe of vectorLayer.keyframes) {

        for (const unit of keyframe.geometry.units) {

          for (const group of unit.groups) {

            group['type'] = 2 // VectorStrokeGroupTypeID.surroundingFill
          }
        }
      }

      return this.nextVersionString
    }

    vectorLayer.type = LayerTypeID.surroundingFillLayer

    for (const keyframe of vectorLayer.keyframes) {

      for (const unit of keyframe.geometry.units) {

        const parted_stroke_groups: VectorStroke[][] = []

        for (const group of unit.groups) {

          let continued_strokes: VectorStroke[] = []

          for (const stroke of group.lines) {

            continued_strokes.push(stroke)

            if (!stroke['continuousFill'] && continued_strokes.length > 0) {

              parted_stroke_groups.push(continued_strokes)
              continued_strokes = []
            }
          }

          if (continued_strokes.length > 0) {
            parted_stroke_groups.push(continued_strokes)
          }
        }

        const new_groupes: VectorStrokeGroup[] = []

        for (const strokes of parted_stroke_groups) {

          const new_group = new VectorStrokeGroup()
          new_group.lines = strokes

          for (const stroke of strokes) {

            if (stroke['continuousFill'] != undefined) {

              delete stroke['continuousFill']
            }
          }

          new_groupes.push(new_group)
        }

        unit.groups = new_groupes
      }
    }

    return this.nextVersionString
  }
}
