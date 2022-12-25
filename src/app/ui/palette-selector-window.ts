import { DocumentContext } from '../context'
import { DocumentData, DrawLineTypeID, FillAreaTypeID } from '../document-data'
import { int, RectangleLayoutArea } from '../common-logics'
import { UI_PaletteSelectorWindowRef } from '../ui-sidebar'

export enum PaletteSelectorWindowButtonID {

  none = 0,
  lineColor = 1,
  fillColor = 2,
  adjustmentMode = 3,
}

export class PaletteSelectorWindow {

  uiRef: UI_PaletteSelectorWindowRef = {}

  // TODO: Ractに移行したので、RectangleLayoutAreaを使用しない実装にする
  commandButtonAreas: RectangleLayoutArea[] = []
  itemAreas: RectangleLayoutArea[] = []
  currentTargetID = PaletteSelectorWindowButtonID.lineColor
  currentPaletteIndex = 0

  setCurrentPaletteIndex(index: int) {

    this.currentPaletteIndex = index
  }

  setCurrentTarget(targetID: PaletteSelectorWindowButtonID) {

    this.currentTargetID = targetID
  }

  getCurrentLayerTargetColorRef(ctx: DocumentContext): Vec4 {

    switch (this.currentTargetID) {

      case PaletteSelectorWindowButtonID.lineColor:
        return ctx.getCurrentLayerLineColor()

      case PaletteSelectorWindowButtonID.fillColor:
        return ctx.getCurrentLayerFillColor()

      case PaletteSelectorWindowButtonID.adjustmentMode:
        return ctx.documentData.paletteColors[this.currentPaletteIndex].color
    }
  }

  updateCurrentLayerColor(newColor: Vec4, keepAlpha: boolean, ctx: DocumentContext): boolean {

    const destColor = this.getCurrentLayerTargetColorRef(ctx)

    if (destColor) {

      destColor[0] = newColor[0]
      destColor[1] = newColor[1]
      destColor[2] = newColor[2]

      if (!keepAlpha) {
        destColor[3] = newColor[3]
      }

      switch (this.currentTargetID) {

      case PaletteSelectorWindowButtonID.lineColor:

        if (ctx.currentStrokeDrawable != null
          && ctx.currentStrokeDrawable.drawLineType == DrawLineTypeID.paletteColor) {

          vec4.copy(ctx.currentStrokeDrawable.layerColor, destColor)
        }
        break

      case PaletteSelectorWindowButtonID.fillColor:

        if (ctx.currentFillDrawable != null
          && ctx.currentFillDrawable.fillAreaType == FillAreaTypeID.paletteColor) {

          vec4.copy(ctx.currentFillDrawable.fillColor, destColor)
        }
        break
      }

      return true
    }
    else {

      return false
    }
  }

  initialize() {

    this.commandButtonAreas = []

    this.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PaletteSelectorWindowButtonID.lineColor))
    this.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PaletteSelectorWindowButtonID.fillColor))
    this.commandButtonAreas.push((new RectangleLayoutArea()).setIndex(PaletteSelectorWindowButtonID.adjustmentMode))

    this.caluculateLayout()
  }

  caluculateLayout() {

    this.itemAreas = []

    for (let paletteColorIndex = 0; paletteColorIndex < DocumentData.maxPaletteColors; paletteColorIndex++) {

      const layoutArea = new RectangleLayoutArea()
      layoutArea.index = paletteColorIndex
      this.itemAreas.push(layoutArea)
    }
  }

  updateCommandButtons() {

    for (const layoutArea of this.commandButtonAreas) {

      const isSelected = (<int>this.currentTargetID == layoutArea.index)

      this.uiRef.setCommandButtonState(layoutArea.index - 1, isSelected)
    }
  }

  updatePaletteItems(ctx: DocumentContext) {

    let currentPaletteColorIndex = -1

    switch (this.currentTargetID) {

      case PaletteSelectorWindowButtonID.lineColor:
        if (ctx.currentStrokeDrawable != null) {
          currentPaletteColorIndex = ctx.currentStrokeDrawable.line_PaletteColorIndex
        }
        break

      case PaletteSelectorWindowButtonID.fillColor:
        if (ctx.currentFillDrawable != null) {
          currentPaletteColorIndex = ctx.currentFillDrawable.fill_PaletteColorIndex
        }
        break

      case PaletteSelectorWindowButtonID.adjustmentMode:
        currentPaletteColorIndex = this.currentPaletteIndex
        break
      }

    for (const layoutArea of this.itemAreas) {

      const paletteColorIndex = layoutArea.index

      if (paletteColorIndex > ctx.documentData.paletteColors.length) {
        break
      }

      const paletteColor = ctx.documentData.paletteColors[paletteColorIndex]

      paletteColor.isSelected = (paletteColorIndex == currentPaletteColorIndex)
    }
  }

  setCurrentTargetForLayer(ctx: DocumentContext) {

    if (ctx.currentFillDrawable != null
      && ctx.currentFillDrawable.fillAreaType != FillAreaTypeID.none) {

        this.currentTargetID = PaletteSelectorWindowButtonID.fillColor
    }
    else if (ctx.currentStrokeDrawable != null
      && ctx.currentStrokeDrawable.drawLineType != DrawLineTypeID.none) {

      this.currentTargetID = PaletteSelectorWindowButtonID.lineColor
    }
  }
}
