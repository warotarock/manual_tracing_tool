import { Platform } from "../../platform"
import { CommandBase } from "../command"
import { Lists } from "../common-logics"
import { SubToolContext } from "../context"
import { PostUpdateSituationTypeID } from "../deffered-process"
import {
  Layer, VectorLayer, VectorLayerGeometry, VectorPoint, VectorStroke, VectorStrokeDrawingUnit,
  VectorStrokeGroup,
  VectorStrokeGroup_RuntimeProperty,
  VectorStroke_RuntimeProperty
} from "../document-data"
import { VectorStrokeLogic } from "../document-logic"

class Command_EditGeometry_ClipbardData {

  static data_version = 'MTT_CLPBD_V001'
  data_version = Command_EditGeometry_ClipbardData.data_version
  copy_layers: Command_EditGeometry_CopyLayer[] = []
}

class Command_EditGeometry_CopyLayer {

  name = ''
  drawingUnits: VectorStrokeDrawingUnit[] = []
}

export class Command_CopyGeometry extends CommandBase {

  copy_layers: Command_EditGeometry_CopyLayer[] = null

  isAvailable(_ctx: SubToolContext): boolean {

    return (this.copy_layers != null)
  }

  prepareEditData(ctx: SubToolContext): boolean {

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    const copy_layers: Command_EditGeometry_CopyLayer[] = []

    for (const viewKeyframeLayer of viewKeyframeLayers) {

      if (!VectorLayer.isVectorLayer(viewKeyframeLayer.layer)) {
        continue
      }

      const copy_units: VectorStrokeDrawingUnit[] = []

      for (const unit of viewKeyframeLayer.vectorLayerKeyframe.geometry.units) {

        const copy_groups: VectorStrokeGroup[] = []

        for (const group of unit.groups) {

          const copy_strokes: VectorStroke[] = []

          for (const stroke of group.lines) {

            if (!stroke.isSelected) {
              continue
            }

            const copy_stroke = new VectorStroke()

            for (const point of stroke.points) {

              if (!point.isSelected) {
                continue
              }

              copy_stroke.points.push(VectorPoint.clone(point))
            }

            if (copy_stroke.points.length > 0) {

              copy_strokes.push(copy_stroke)
            }
          }

          if (copy_strokes.length > 0) {

            const new_group = new VectorStrokeGroup()
            new_group.lines = copy_strokes

            copy_groups.push(new_group)
          }
        }

        if (copy_groups.length > 0) {

          const new_unit = new VectorStrokeDrawingUnit()
          new_unit.groups = copy_groups

          copy_units.push(new_unit)
        }
      }

      if (copy_units.length > 0) {

        const copy_layer = new Command_EditGeometry_CopyLayer()
        copy_layer.name = viewKeyframeLayer.layer.name
        copy_layer.drawingUnits = copy_units

        copy_layers.push(copy_layer)
      }
    }

    if (copy_layers.length > 0) {

      this.copy_layers = copy_layers
      return true
    }
    else {

      return false
    }
  }

  execute(_ctx: SubToolContext) { // @override

    const clipboardData = new Command_EditGeometry_ClipbardData()
    clipboardData.copy_layers = this.copy_layers

    Platform.clipboard.writeText(JSON.stringify(clipboardData))
      .then()
  }
}

class Command_EditGeometry_EditLayer {

  targeLayer: Layer = null

  targetGeometry: VectorLayerGeometry = null
  oldUnits: VectorStrokeDrawingUnit[] = null
  newUnits: VectorStrokeDrawingUnit[] = []

  targetGroup: VectorStrokeGroup = null
  oldStrokes: VectorStroke[] = null
  newStrokes: VectorStroke[] = []
}

export class Command_PasteGeometry extends CommandBase {

  editLayers: Command_EditGeometry_EditLayer[] | null = null
  select_strokes: VectorStroke[] = []

  isAvailable(_ctx: SubToolContext): boolean {

    return (this.editLayers != null)
  }

  async prepareEditData(ctx: SubToolContext): Promise<boolean> {

    if (!VectorLayer.isVectorLayerWithOwnData(ctx.currentLayer)) {
      return false
    }

    const clipboardData = await this.getClipboardData()

    if (!clipboardData.isAvailable) {
      return false
    }

    const viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    const editLayers: Command_EditGeometry_EditLayer[] = []
    const new_groups: VectorStrokeGroup[] = []
    const new_strokes: VectorStroke[] = []

    for (const copy_layer of clipboardData.copy_layers) {

      let target_viewKeyframeLayer = viewKeyframeLayers
        .find(viewKeyframeLayer => viewKeyframeLayer.layer.isSelected && viewKeyframeLayer.layer.name == copy_layer.name)

      if (!target_viewKeyframeLayer) {
        target_viewKeyframeLayer = viewKeyframeLayers.find(viewKeyframeLayer => viewKeyframeLayer.layer.isSelected)
      }

      const isAvailableToPaste = (target_viewKeyframeLayer && VectorLayer.isVectorLayerWithOwnData(target_viewKeyframeLayer.layer))
      if (!isAvailableToPaste) {
        continue
      }

      let editLayer = editLayers
        .find(editLayer => editLayer.targeLayer == target_viewKeyframeLayer.layer)

      let isNewEditLayer = false

      if (!editLayer) {

        editLayer = new Command_EditGeometry_EditLayer()
        editLayer.targeLayer = target_viewKeyframeLayer.layer
        isNewEditLayer = true
      }

      if (VectorLayer.isSurroundingFillLayer(target_viewKeyframeLayer.layer)) {

        if (isNewEditLayer) {

          editLayer.targetGeometry = target_viewKeyframeLayer.vectorLayerKeyframe.geometry
          editLayer.oldUnits = editLayer.targetGeometry.units
          Lists.addRange(editLayer.newUnits, editLayer.oldUnits)
        }

        Lists.addRange(editLayer.newUnits, copy_layer.drawingUnits)

        for (const unit of copy_layer.drawingUnits) {

          for (const group of unit.groups) {

            this.defferedProcess.addGroup(target_viewKeyframeLayer.layer, group, PostUpdateSituationTypeID.addObjects)

            this.calculateStrokeParameters(group.lines, target_viewKeyframeLayer.layer)

            new_groups.push(group)
            Lists.addRange(new_strokes, group.lines)
          }
        }
      }
      else {

        if (isNewEditLayer) {

          editLayer.targetGroup = target_viewKeyframeLayer.vectorLayerKeyframe.geometry.units[0].groups[0]
          editLayer.oldStrokes = editLayer.targetGroup.lines
          Lists.addRange(editLayer.newStrokes, editLayer.oldStrokes)
        }

        for (const unit of copy_layer.drawingUnits) {

          for (const group of unit.groups) {

            this.calculateStrokeParameters(group.lines, target_viewKeyframeLayer.layer)

            Lists.addRange(editLayer.newStrokes, group.lines)

            new_groups.push(group)
            Lists.addRange(new_strokes, group.lines)
          }
        }

        this.defferedProcess.addGroup(target_viewKeyframeLayer.layer, editLayer.targetGroup, PostUpdateSituationTypeID.addObjects)
      }

      editLayers.push(editLayer)

      this.defferedProcess.addLayer(target_viewKeyframeLayer.layer)
    }

    // TODO: コピーしたオブジェクトのメソッドが消えてしまうため取り急ぎ再生成することにしたが、後できちんとする
    for (const group of new_groups) {

      group.runtime = new VectorStrokeGroup_RuntimeProperty()
    }

    if (editLayers.length > 0) {

      this.editLayers = editLayers
      this.select_strokes = new_strokes
      return true
    }
    else {

      return false
    }
  }

  private calculateStrokeParameters(strokes: VectorStroke[], layer: Layer) {

    const vectorLayer = <VectorLayer>layer

    for (const stroke of strokes) {

      stroke.runtime = new VectorStroke_RuntimeProperty()
      VectorStrokeLogic.calculateParameters(stroke, vectorLayer.lineWidthBiasRate)
    }
  }

  async getClipboardData(): Promise<{ isAvailable: boolean, copy_layers: Command_EditGeometry_CopyLayer[] }> {

    const availableFormats = await Platform.clipboard.availableFormats()

    if (availableFormats.length == 0 && availableFormats[0] != 'text/plains') {
      return { isAvailable: false, copy_layers: null }
    }

    let copy_layers: Command_EditGeometry_CopyLayer[]

    try {

      const text = await Platform.clipboard.readText()

      const clipboardData: Command_EditGeometry_ClipbardData = JSON.parse(text)

      const isAvailableData = (
        clipboardData
        && clipboardData.data_version === Command_EditGeometry_ClipbardData.data_version
        && Array.isArray(clipboardData.copy_layers)
      )

      if (!isAvailableData) {
        return { isAvailable: false, copy_layers: null }
      }

      copy_layers = clipboardData.copy_layers
    }
    catch (e) {

      return { isAvailable: false, copy_layers: null }
    }

    return { isAvailable: true, copy_layers: copy_layers }
  }

  execute(ctx: SubToolContext) { // @override

    this.redo(ctx)
  }

  undo(_ctx: SubToolContext) { // @override

    for (const editLayer of this.editLayers) {

      if (editLayer.targetGeometry) {
        editLayer.targetGeometry.units = editLayer.oldUnits
      }

      if (editLayer.targetGroup) {
        editLayer.targetGroup.lines = editLayer.oldStrokes
      }
    }
  }

  redo(_ctx: SubToolContext) { // @override

    for (const editLayer of this.editLayers) {

      if (editLayer.targetGeometry) {
        editLayer.targetGeometry.units = editLayer.newUnits
      }

      if (editLayer.targetGroup) {
        editLayer.targetGroup.lines = editLayer.newStrokes
      }

      for (const stroke of this.select_strokes) {

        stroke.isSelected = true

        for (const point of stroke.points) {

          point.isSelected = true
        }
      }
    }
  }
}
