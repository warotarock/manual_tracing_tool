import * as React from 'react'
import { DocumentContext } from '../context'
import { VectorPoint, VectorStroke } from '../document-data'
import { ToolDrawingStyle } from '../document-drawing'
import { VectorStrokeLogic } from '../document-logic'
import { DOMResizingLogic } from '../dom'
import { Lists, Logic_Points } from '../common-logics'
import { CanvasRender, CanvasWindow } from '../render'
import { BrushParameterID, PointerParameterID, PointerTypeID } from '../tool'
import { RibbonUIControlID } from '../ui'
import { UI_ColorSlider, UI_Icon_MaterialIcon } from '../ui-common-controls'
import { PopoverRef, UI_PopoverContainerRef, UI_PopoverContent } from './popover-container'

export class UI_BrushPropertyBoxRef extends PopoverRef {

  docContext: DocumentContext | null = null
  updateBox(){}
  resize(){} // for the case when the box is invisible due to current main tool was not drawing-tab at the system startup
  updatePopover(){}

  showPopover(parentNode: HTMLElement){}
  numberInput_Changed(id: RibbonUIControlID, value: number){}
}

interface BrushPreset {

  index: number
  baseWidth: number
  minWidth: number
}

interface BrushPresetGroup {

  index: number
  presets: BrushPreset[]
}

export interface UI_BrushPropertyBoxParam {

  uiRef: UI_BrushPropertyBoxRef
}

export interface UI_BrushPropertyBoxPopoverParam {

  uiRef: UI_BrushPropertyBoxRef
}

export function UI_BrushPropertyBox({ uiRef }: UI_BrushPropertyBoxParam) {

  const popoverAnchor_Ref = React.useRef<HTMLDivElement>(null)

  const [pointerParams, set_pointerParams] = React.useState({
    isUsingPointerParameter: false,
    isUsingBrushParameter: false,
    pointerType: PointerTypeID.brush,
    pointerBaseSize: 0.0,
    brushBaseSize: 0.0,
    brushMinSize: 1.0,
    baseColor: vec4.fromValues(0.0, 0.0, 0.0, 1.0),
  })

  React.useEffect(() => {

    uiRef.resize = () => {

      // if (thumbnailResize_Ref.current) {
      //   // thumbnailResize_Ref.current()
      // }
    }

    uiRef.updateBox = () => {

      if (uiRef.docContext.currentPointerParameter != null) {

        set_pointerParams(getPointerParameters(uiRef.docContext))
      }
    }

    return function cleanup() {

      uiRef.updateBox = null
    }
  }, [])

  function box_Clicked() {

    uiRef.showPopover(popoverAnchor_Ref.current)
  }

  return (
    <div className='brush-property-box'
      ref={popoverAnchor_Ref}
    >
      <div className='brush-property-box-inner-container'
        onPointerDown={box_Clicked}
      >
        <BrushThumbnailBox
          pointerType={pointerParams.pointerType}
          drawLineBaseWidth={pointerParams.isUsingBrushParameter ? pointerParams.brushBaseSize: pointerParams.pointerBaseSize}
          drawLineMinWidth={pointerParams.isUsingBrushParameter ? pointerParams.brushMinSize : 1.0}
          baseColor={pointerParams.baseColor}
          drawStyle={uiRef.docContext.drawStyle}
        />
        <div className='expand'>
          <UI_Icon_MaterialIcon iconName='expandmore' />
        </div>
      </div>
    </div>
  )
}

export function UI_BrushPropertyBoxPopover({ uiRef }: UI_BrushPropertyBoxPopoverParam) {

  const previewCanvas_Ref = React.useRef<HTMLCanvasElement>(null)

  const [isPopoverShown, set_isPopoverShown] = React.useState(false)
  const [isCanvasShown, set_isCanvasShown] = React.useState(false)

  const [brushParams, set_brushParams] = React.useState({
    isUsingPointerParameter: false,
    isUsingBrushParameter: false,
    pointerType: PointerTypeID.brush,
    pointerBaseSize: 0.0,
    brushBaseSize: 0.0,
    brushMinSize: 1.0,
    baseColor: vec4.fromValues(0.0, 0.0, 0.0, 1.0),
  })

  const brushPresetGroups = React.useMemo<BrushPresetGroup[]>(() => {

    const groups = [
      {
        index: 0,
        presets: [
          { index: 0, baseWidth: 1.0, minWidth: 1.0},
          { index: 0, baseWidth: 2.0, minWidth: 1.0},
          { index: 0, baseWidth: 3.0, minWidth: 1.0},
          { index: 0, baseWidth: 4.0, minWidth: 1.0},
          { index: 0, baseWidth: 5.0, minWidth: 1.0},
        ]
      },
      {
        index: 0,
        presets: [
          { index: 0, baseWidth: 1.0, minWidth: 0.5},
          { index: 0, baseWidth: 2.0, minWidth: 0.5},
          { index: 0, baseWidth: 3.0, minWidth: 0.5},
          { index: 0, baseWidth: 4.0, minWidth: 0.5},
          { index: 0, baseWidth: 5.0, minWidth: 0.5},
        ]
      },
      {
        index: 0,
        presets: [
          { index: 0, baseWidth: 1.0, minWidth: 0.2},
          { index: 0, baseWidth: 2.0, minWidth: 0.2},
          { index: 0, baseWidth: 3.0, minWidth: 0.2},
          { index: 0, baseWidth: 4.0, minWidth: 0.2},
          { index: 0, baseWidth: 5.0, minWidth: 0.2},
        ]
      },
      {
        index: 0,
        presets: [
          { index: 0, baseWidth: 7.5, minWidth: 1.0},
          { index: 0, baseWidth: 10.0, minWidth: 1.0},
          { index: 0, baseWidth: 20.0, minWidth: 1.0},
          { index: 0, baseWidth: 30.0, minWidth: 1.0},
          { index: 0, baseWidth: 40.0, minWidth: 1.0},
          { index: 0, baseWidth: 50.0, minWidth: 1.0},
          { index: 0, baseWidth: 7.5, minWidth: 0.5},
          { index: 0, baseWidth: 10.0, minWidth: 0.5},
          { index: 0, baseWidth: 20.0, minWidth: 0.5},
          { index: 0, baseWidth: 30.0, minWidth: 0.5},
          { index: 0, baseWidth: 40.0, minWidth: 0.5},
          { index: 0, baseWidth: 50.0, minWidth: 0.5},
          { index: 0, baseWidth: 7.5, minWidth: 0.2},
          { index: 0, baseWidth: 10.0, minWidth: 0.2},
          { index: 0, baseWidth: 20.0, minWidth: 0.2},
          { index: 0, baseWidth: 30.0, minWidth: 0.2},
          { index: 0, baseWidth: 40.0, minWidth: 0.2},
          { index: 0, baseWidth: 50.0, minWidth: 0.2},
        ]
      },
      {
        index: 0,
        presets: [
          { index: 0, baseWidth: 60.0, minWidth: 0.5},
          { index: 0, baseWidth: 70.0, minWidth: 0.5},
          { index: 0, baseWidth: 80.0, minWidth: 0.5},
          { index: 0, baseWidth: 90.0, minWidth: 0.5},
          { index: 0, baseWidth: 100.0, minWidth: 0.5},
        ]
      }
    ]

    initializePresets(groups)

    return groups
  }, [])

  const the = React.useMemo(() => ({
    canvasRender: new CanvasRender(),
    domResizing: new DOMResizingLogic(),
    previewCanvasWindow: new CanvasWindow(),
    buttonCanvasWindow: new CanvasWindow(),
    popoverContentRef: new UI_PopoverContainerRef(),
    location: vec3.create(),
    localLocation: vec3.create(),
    direction: vec3.create(),
    capMatrix: mat4.create(),
    blackColor: vec4.fromValues(0.0, 0.0, 0.0, 1.0),
  }), [])

  React.useEffect(() => {

    uiRef.updatePopover = () => {

      if (uiRef.docContext.currentPointerParameter != null) {

        set_brushParams(getPointerParameters(uiRef.docContext))
      }
    }

    uiRef.showPopover = (parentNode) => {

      if (uiRef.docContext.currentPointerParameter != null) {

        set_brushParams(getPointerParameters(uiRef.docContext))
      }

      the.popoverContentRef.show(uiRef, parentNode)

      set_isPopoverShown(true)

      setTimeout(() => {

        set_isCanvasShown(true)

      }, 200);
    }

    return function cleanup() {

      uiRef.showPopover = null
    }
  }, [])

  React.useEffect(() => {

    if (isCanvasShown) {

      the.previewCanvasWindow.attachCanvas(previewCanvas_Ref.current)
      the.domResizing.resizeCanvasToParent(the.previewCanvasWindow, false)
      the.previewCanvasWindow.initializeContext()
    }

  }, [isCanvasShown])

  React.useEffect(() => {

    if (isCanvasShown) {

      drawPreview();
    }

  }, [isCanvasShown, brushParams])

  function initializePresets(presetGroups: BrushPresetGroup[]) {

    let groupIndex = 1
    for (const group of presetGroups) {

      group.index = groupIndex
      groupIndex++

      let presetIndex = 1
      for (const preset of group.presets) {

        preset.index = presetIndex
        presetIndex++
      }
    }
  }

  function drawPreview() {

    drawBrushPreview(
      the.previewCanvasWindow,
      brushParams.pointerType,
      brushParams.isUsingBrushParameter ? brushParams.brushBaseSize: brushParams.pointerBaseSize,
      brushParams.isUsingBrushParameter ? brushParams.brushMinSize : 1.0,
      brushParams.pointerBaseSize,
      uiRef.docContext.currentPaintParameter.baseColor,
      uiRef.docContext.drawStyle,
      the.canvasRender,
      the
    )
  }

  function popover_Exit() {

    the.popoverContentRef.close(uiRef)
  }

  function pointerBaseSize_sliderChanged(value: number) {

    uiRef.numberInput_Changed(RibbonUIControlID.pointerBaseSize, value)
  }

  function brushBaseSize_sliderChanged(value: number) {

    uiRef.numberInput_Changed(RibbonUIControlID.brushBaseSize, value)
  }

  function brushMinSize_sliderChanged(value: number) {

    uiRef.numberInput_Changed(RibbonUIControlID.brushMinSize, value)
  }

  function preset_Clicked(preset: BrushPreset) {

    if (brushParams.isUsingBrushParameter) {

      uiRef.numberInput_Changed(RibbonUIControlID.brushBaseSize, preset.baseWidth)
      uiRef.numberInput_Changed(RibbonUIControlID.brushMinSize, preset.minWidth)
    }
    else {

      uiRef.numberInput_Changed(RibbonUIControlID.pointerBaseSize, preset.baseWidth)
    }
  }

  return (
    <UI_PopoverContent
      uiRef={the.popoverContentRef}
      fullHeight={true}
      offset={{ x: 0, y: -3 }}
      onDissmiss={popover_Exit}
      onEscape={popover_Exit}
    >
      <div className='brush-property-popover-locator'>
        <div className='brush-property-popover'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='preview-canvas-frame'>
            <div className='preview-canvas-size-calculator'>
              <canvas className='preview-canvas alpha-checker-background' ref={previewCanvas_Ref} />
            </div>
          </div>
          <div className={`param-slider-container${!brushParams.isUsingBrushParameter ? ' hidden' : ''}`}>
            <div className='label'><div className='label-text'>基本幅</div></div>
            <UI_ColorSlider
              min={0.0} max={100.0} step={0.05} trackColor={'#222'} showText={true}
              value={brushParams.brushBaseSize}
              onChange={brushBaseSize_sliderChanged}
            ></UI_ColorSlider>
          </div>
          <div className={`param-slider-container${!brushParams.isUsingBrushParameter ? ' hidden' : ''}`}>
            <div className='label'><div className='label-text'>最小幅</div></div>
            <UI_ColorSlider
              min={0.0} max={1.0} step={0.01} trackColor={'#666'} showText={true}
              value={brushParams.brushMinSize}
              onChange={brushMinSize_sliderChanged}
            ></UI_ColorSlider>
          </div>
          <div className={`param-slider-container${!brushParams.isUsingPointerParameter ? ' hidden' : ''}`}>
            <div className='label'><div className='label-text'>範囲</div></div>
            <UI_ColorSlider
              min={0.0} max={50.0} step={0.05} trackColor={'#f88'} showText={true}
              value={brushParams.pointerBaseSize}
              onChange={pointerBaseSize_sliderChanged}
            ></UI_ColorSlider>
          </div>
          {
            isPopoverShown &&
              <div className='brush-presets-container'>
                {
                  brushPresetGroups.map(group =>
                    <div className='brush-preset-group-container' key={group.index}>
                      {
                        group.presets.map(preset =>
                          <div className='brush-preset-frame' key={preset.index}>
                            <BrushThumbnailBox
                              pointerType={PointerTypeID.brush}
                              drawLineBaseWidth={preset.baseWidth}
                              drawLineMinWidth={preset.minWidth}
                              baseColor={the.blackColor}
                              preset={preset}
                              drawStyle={uiRef.docContext.drawStyle}
                              onPresetClicked={preset_Clicked}
                            />
                          </div>
                        )
                      }
                    </div>
                  )
                }
              </div>
          }
        </div>
      </div>
    </UI_PopoverContent>
  )
}

interface BrushThumbnailBoxParam {

  pointerType: PointerTypeID
  drawLineBaseWidth: number
  drawLineMinWidth: number
  drawStyle: ToolDrawingStyle
  preset?: BrushPreset
  baseColor?: Vec4
  onPresetClicked?: (preset: BrushPreset) => void
}

function BrushThumbnailBox({ pointerType, drawLineBaseWidth, drawLineMinWidth, drawStyle, baseColor, preset, onPresetClicked }: BrushThumbnailBoxParam) {

  const canvas_Ref = React.useRef<HTMLCanvasElement>(null)

  const the = React.useMemo(() => ({
    canvasRender: new CanvasRender(),
    domResizing: new DOMResizingLogic(),
    canvasWindow: new CanvasWindow(),
  }), [])

  React.useEffect(() => {

    resizeCanvas()

  }, [])

  React.useEffect(() => {

    drawThumbnail()

  }, [pointerType, drawLineBaseWidth, drawLineMinWidth, baseColor[0], baseColor[1], baseColor[2], baseColor[3]])

  function resizeCanvas() {

    the.canvasWindow.attachCanvas(canvas_Ref.current)
    the.domResizing.resizeCanvasToBoundingClientRect(the.canvasWindow, false)
    the.canvasWindow.initializeContext()
  }

  function drawThumbnail() {

    if (the.canvasWindow.isInitialized()) {

      drawBrushThumbnail(
        the.canvasWindow,
        pointerType,
        drawLineBaseWidth,
        drawLineMinWidth,
        baseColor ?? vec4.fromValues(0.0, 0.0, 0.0, 1.0),
        drawStyle,
        the.canvasRender
      );
    }
  }

  function thumbnailClicked() {

    if (onPresetClicked && preset) {

      onPresetClicked(preset)
    }
  }

  return (
    <div className='brush-thumbnail-frame'
      onPointerDown={thumbnailClicked}
    >
      <canvas className='brush-thumbnail-canvas' ref={canvas_Ref} />
      <div className='brush-size-text-frame back'>
        <div className='brush-size-text'>{drawLineBaseWidth.toFixed(2)}</div>
      </div>
      <div className='brush-size-text-frame front'>
        <div className='brush-size-text'>{drawLineBaseWidth.toFixed(2)}</div>
      </div>
    </div>
  )
}

function getPointerParameters(docContext: DocumentContext) {

  return {
    isUsingPointerParameter: docContext.currentPointerParameter.parameterID != PointerParameterID.none ? true : false,
    isUsingBrushParameter: docContext.currentBrushParameter.parameterID != BrushParameterID.none ? true : false,
    pointerType: docContext.currentSubToolParameter?.pointerType ?? PointerTypeID.none,
    pointerBaseSize: docContext.currentPointerParameter?.baseSize ?? 0.0,
    brushBaseSize: docContext.currentBrushParameter?.baseSize ?? 0.0,
    brushMinSize: docContext.currentBrushParameter?.minSize ?? 0.0,
    baseColor: docContext.currentPaintParameter?.baseColor ?? vec4.fromValues(0.0, 0.0, 0.0, 1.0),
  }
}

function drawBrushThumbnail(
  canvasWindow: CanvasWindow,
  pointerType: PointerTypeID,
  drawLineBaseWidth: number,
  drawLineMinWidth: number,
  baseColor: Vec4,
  drawStyle: ToolDrawingStyle,
  canvasRender: CanvasRender
) {

  const scaleSettings = [
    { minRadius: 0.0, maxRadius: 5.0, scale: 0.4 },
    { minRadius: 5.0, maxRadius: 50.0, scale: 0.8 },
    { minRadius: 50.0, maxRadius: 100.0, scale: 1.0 },
  ]

  let scaleSetting = scaleSettings[0]
  for (const setting of scaleSettings) {

    if (drawLineBaseWidth > setting.minRadius) {

      scaleSetting = setting
    }
  }

  const maxBrushVisualPadding = 0.1
  const maxBrushVisualWidth = canvasWindow.width * (0.5 - maxBrushVisualPadding)
  const maxBrushWidthScale = maxBrushVisualWidth / scaleSetting.maxRadius

  let maxRadius = drawLineBaseWidth * maxBrushWidthScale * scaleSetting.scale

  const minRadius = maxRadius * drawLineMinWidth
  const centerX = canvasWindow.width / 2
  const centerY = canvasWindow.height / 2

  canvasRender.setContext(canvasWindow)
  canvasRender.clear()

  switch (pointerType) {

    case PointerTypeID.brush:
    case PointerTypeID.brushWithCircularRange:
      if (minRadius != maxRadius) {
        canvasRender.setFillColor(0.7, 0.7, 0.7, 1.0)
        canvasRender.beginPath()
        canvasRender.circle(centerX, centerY, maxRadius)
        canvasRender.fill()
      }

      canvasRender.setFillColor(1.0, 1.0, 1.0, 1.0)
      canvasRender.beginPath()
      canvasRender.circle(centerX, centerY, minRadius)
      canvasRender.fill()

      canvasRender.setFillColorV(baseColor)
      canvasRender.beginPath()
      canvasRender.circle(centerX, centerY, minRadius)
      canvasRender.fill()
      break

    case PointerTypeID.circularRange:
      canvasRender.setStrokeColorV(drawStyle.mouseCursorCircleColor)
      canvasRender.beginPath()
      canvasRender.circle(centerX, centerY, maxRadius)
      canvasRender.stroke()
      break
  }
}

function drawBrushPreview(
  canvasWindow: CanvasWindow,
  pointerType: PointerTypeID,
  drawLineBaseWidth: number,
  drawLineMinWidth: number,
  pointerBaseSize: number,
  baseColor: Vec4,
  drawStyle: ToolDrawingStyle,
  canvasRender: CanvasRender,
  temp: {
    location: Vec3,
    localLocation: Vec3,
    direction: Vec3,
    capMatrix: Mat4
  }
) {

  const scaleSettings = [
    { minRadius: 0.0, maxRadius: 5.0, scale: 1.0 },
    { minRadius: 5.0, maxRadius: 50.0, scale: 1.0 },
    { minRadius: 50.0, maxRadius: 100.0, scale: 0.5 },
  ]

  let scaleSetting = scaleSettings[0]
  for (const setting of scaleSettings) {

    if (drawLineBaseWidth > setting.minRadius) {

      scaleSetting = setting
    }
  }

  const radiusVisualScale = 1.0
  const maxRadius = drawLineBaseWidth * radiusVisualScale * scaleSetting.scale
  const minRadius = maxRadius * drawLineMinWidth
  const target = canvasWindow

  const previewPadding = 30.0
  const previewWidth = target.width - previewPadding * 2
  const previewXResolution = 20
  const previewCapUnitAngle = 0.2

  // creating stroke core position
  const corePositionStroke = new VectorStroke()

  for (let xCount = 0; xCount <= previewXResolution - 1; xCount++) {

    const normX = xCount / (previewXResolution - 1)
    const localY = Math.sin(normX * 2.0 * Math.PI) * target.height / 6

    const x = previewPadding + previewWidth * normX
    const y = target.height / 2 + localY
    const radius = minRadius + Math.sin(normX * Math.PI) * (maxRadius - minRadius)

    const point = new VectorPoint()
    vec3.copy(point.location, vec3.set(temp.location, x, y, 0.0))
    point.lineWidth = radius
    corePositionStroke.points.push(point)
  }

  VectorStrokeLogic.smooth(corePositionStroke)

  const resamplingUnitLength = target.width / 40.0
  const resampledLine = VectorStrokeLogic.createResampledLine(corePositionStroke, resamplingUnitLength)

  const resampled_FirstPoint = resampledLine.points[0]
  const resampled_SecondPoint = resampledLine.points[1]
  const resampled_LastPreviousPoint = resampledLine.points[resampledLine.points.length - 2]
  const resampled_LastPoint = resampledLine.points[resampledLine.points.length - 1]

  // creating stroke shape
  const leftStroke = new VectorStroke()
  const rightStroke = new VectorStroke()

  Logic_Points.segmentMat(temp.capMatrix, resampled_FirstPoint.location, resampled_SecondPoint.location)

  for (let angle = 0.0; angle < 1.0; angle += previewCapUnitAngle) {

    const radius = resampled_FirstPoint.lineWidth
    const x = Math.cos(Math.PI - angle * Math.PI / 2) * radius
    const y = -Math.sin(Math.PI - angle * Math.PI / 2) * radius

    {
      vec3.set(temp.localLocation, x, y, 0.0)
      vec3.transformMat4(temp.location, temp.localLocation, temp.capMatrix)

      const point = new VectorPoint()
      vec3.copy(point.location, temp.location)
      leftStroke.points.push(point)
    }

    {
      vec3.set(temp.localLocation, x, -y, 0.0)
      vec3.transformMat4(temp.location, temp.localLocation, temp.capMatrix)

      const point = new VectorPoint()
      vec3.copy(point.location, temp.location)
      rightStroke.points.push(point)
    }
  }

  for (let index = 0; index < resampledLine.points.length - 1; index++) {

    const point_From = resampledLine.points[index]
    const point_To = resampledLine.points[index + 1]
    Logic_Points.segmentMat(temp.capMatrix, point_From.location, point_To.location)

    const radius = point_From.lineWidth
    const x = 0.0
    const y = -radius

    {
      vec3.set(temp.localLocation, x, y, 0.0)
      vec3.transformMat4(temp.location, temp.localLocation, temp.capMatrix)

      const point = new VectorPoint()
      vec3.copy(point.location, temp.location)
      leftStroke.points.push(point)
    }

    {
      vec3.set(temp.localLocation, x, -y, 0.0)
      vec3.transformMat4(temp.location, temp.localLocation, temp.capMatrix)

      const point = new VectorPoint()
      vec3.copy(point.location, temp.location)
      rightStroke.points.push(point)
    }
  }

  Logic_Points.segmentMat(temp.capMatrix, resampled_LastPreviousPoint.location, resampled_LastPoint.location)
  temp.capMatrix[12] = resampled_LastPoint.location[0]
  temp.capMatrix[13] = resampled_LastPoint.location[1]

  for (let angle = previewCapUnitAngle; angle <= 1.0; angle += previewCapUnitAngle) {

    const radius = resampled_LastPoint.lineWidth
    const x = Math.cos(Math.PI / 2 - angle * Math.PI / 2) * radius
    const y = -Math.sin(Math.PI / 2 - angle * Math.PI / 2) * radius

    {
      vec3.set(temp.localLocation, x, y, 0.0)
      vec3.transformMat4(temp.location, temp.localLocation, temp.capMatrix)

      const point = new VectorPoint()
      vec3.copy(point.location, temp.location)
      leftStroke.points.push(point)
    }

    {
      vec3.set(temp.localLocation, x, -y, 0.0)
      vec3.transformMat4(temp.location, temp.localLocation, temp.capMatrix)

      const point = new VectorPoint()
      vec3.copy(point.location, temp.location)
      rightStroke.points.push(point)
    }
  }

  canvasRender.setContext(target)
  canvasRender.clear()

  // drawing stroke shape
  const boundingStroke = new VectorStroke()
  boundingStroke.points = [...leftStroke.points, ...Lists.reverse(rightStroke.points)]

  canvasRender.setStrokeWidth(1.0)
  canvasRender.beginPath()
  canvasRender.moveToV(boundingStroke.points[0].location)
  for (const point of boundingStroke.points) {

    canvasRender.lineToV(point.location)
  }

  switch (pointerType) {

    case PointerTypeID.brush:
    case PointerTypeID.brushWithCircularRange:
      canvasRender.setFillColorV(baseColor)
      canvasRender.fill()
      break

    case PointerTypeID.circularRange:
      canvasRender.setStrokeColorV(drawStyle.mouseCursorCircleColor)
      canvasRender.stroke()
      break
  }

  // drawing influence range
  switch (pointerType) {

    case PointerTypeID.brushWithCircularRange:
      canvasRender.setStrokeColorV(drawStyle.mouseCursorCircleColor)
      canvasRender.beginPath()
      canvasRender.circle(resampled_FirstPoint.location[0], resampled_FirstPoint.location[1], pointerBaseSize)
      canvasRender.stroke()
      break
  }

  const showPoints = !true
  if (showPoints) {

    for (const point of leftStroke.points) {
      canvasRender.setFillColor(1.0, 0.0, 0.0, 1.0)
      canvasRender.beginPath()
      canvasRender.circle(point.location[0], point.location[1], 2.0)
      canvasRender.fill()
    }

    for (const point of rightStroke.points) {
      canvasRender.setFillColor(0.0, 1.0, 0.0, 1.0)
      canvasRender.beginPath()
      canvasRender.circle(point.location[0], point.location[1], 2.0)
      canvasRender.fill()
    }
  }
}
