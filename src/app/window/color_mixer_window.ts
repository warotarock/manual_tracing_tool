import { ColorLogic } from '../logics/color'
import { CanvasRender, CanvasRenderBlendMode } from '../render/render2d'
import { UI_ColorMixerWindowRef } from '../ui/color_mixer_window'
import { PointerInputWindow } from '../view/pointer_input'

export class ColorCanvasWindow extends PointerInputWindow {

  isDrawingDone = false
}

export class ColorMixerWindow {

  canvasRender: CanvasRender = null

  uiRef: UI_ColorMixerWindowRef = {}
  colorCanvas = new ColorCanvasWindow()

  private static tempColor4 = vec4.create()
  private static colorW = vec4.fromValues(1.0, 1.0, 1.0, 1.0)

  link(canvasRender: CanvasRender) {

    this.canvasRender = canvasRender
  }

  updateInputControls(color: Vec4) {

    if (color != null) {

      this.uiRef.update(color)
    }
  }

  drawPaletteColorMixer() {

    ColorMixerWindow.drawPaletteColorMixerImage(this.colorCanvas, this.canvasRender)
  }

  static drawPaletteColorMixerImage(colorCanvasWindow: ColorCanvasWindow, canvasRender: CanvasRender) {

    const width = colorCanvasWindow.width
    const height = colorCanvasWindow.height

    if (width == 0 || height == 0) {
      return
    }

    canvasRender.setContext(colorCanvasWindow)
    canvasRender.setBlendMode(CanvasRenderBlendMode.default)
    canvasRender.setFillColorV(this.colorW)
    canvasRender.fillRect(0.0, 0.0, width, height)

    canvasRender.setBlendMode(CanvasRenderBlendMode.default)
    const divisionW = 40.0
    const divisionH = 25.0
    const unitWidth = width / divisionW
    const unitHeight = height / divisionH

    let drawX = 0.0

    for (let x = 0; x <= divisionW; x++) {

      let drawY = 0.0

      for (let y = 1; y <= divisionH; y++) {

        const h = x / divisionW
        let s = 0.0
        let v = 0.0
        const iy = y / divisionH
        if (iy <= 0.5) {
          s = iy * 2.0
          v = 1.0
        }
        else {
          s = 1.0
          v = 1.0 - (iy - 0.5) * 2.0
        }

        ColorLogic.hsvToRGB(this.tempColor4, h, s, v)
        this.tempColor4[3] = 1.0
        canvasRender.setFillColorV(this.tempColor4)
        canvasRender.fillRect(drawX, drawY, unitWidth + 1.0, unitHeight + 1.0)

        drawY += unitHeight
      }

      drawX += unitWidth

      colorCanvasWindow.isDrawingDone = true
    }

    canvasRender.setBlendMode(CanvasRenderBlendMode.default)
  }
}
