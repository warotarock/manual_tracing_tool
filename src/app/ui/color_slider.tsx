import * as React from 'react'

export interface UI_ColorSliderParam {

  min?: number
  max?: number
  step?: number
  value?: number
  railColor?: string
  trackColor?: string
  onChange?(value: number): void
}

export function UI_ColorSlider({ min = 0, max = 100, step = 1, value = 0, railColor = '#eee', trackColor = '#000', onChange = null }: UI_ColorSliderParam) {

  function onPointerDown(e: React.PointerEvent) {

    if (!onChange) {
      return
    }

    const div = e.nativeEvent.target as HTMLDivElement
    const rect = div.getBoundingClientRect()

    const position = e.nativeEvent.offsetX / rect.width

    let newValue = Number((min + position * (max - min)).toFixed(2))
    if (position > 0.99) {
      newValue = 1
    }

    // console.log(position, newValue)

    onChange(newValue)
  }

  function onPointerMove(e: React.PointerEvent) {

    if (!onChange) {
      return
    }

    if (e.buttons != 0) {

      onPointerDown(e)
    }
  }

  return (
    <div className="ui-color-slider-container">
      <div className="rail"
        style={{ backgroundColor: railColor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <div className="track"
          style={ {
            width: `${((value - min) / (max - min) * 100).toFixed(2)}%`,
            backgroundColor: trackColor
          }}>
        </div>
      </div>
    </div>
  )
}
