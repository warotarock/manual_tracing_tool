import * as React from 'react'

export interface UI_ColorSliderParam {

  min?: number
  max?: number
  step?: number
  railColor?: string
  trackColor?: string
  showText?: boolean

  value: number
  onChange?(value: number): void
}

export function UI_ColorSlider({ min = 0, max = 100, step = 1, railColor = '#ddd', trackColor = '#000', value = 0, showText = false, onChange = null }: UI_ColorSliderParam) {

  const head_Ref = React.useRef<HTMLDivElement>()
  const tail_Ref = React.useRef<HTMLDivElement>()

  function slider_PointerDown(e: React.PointerEvent) {

    if (!onChange) {
      return
    }

    const div = e.nativeEvent.target as HTMLDivElement
    const railRect = div.getBoundingClientRect()
    const headRect = head_Ref.current.getBoundingClientRect()
    const tailRect = tail_Ref.current.getBoundingClientRect()

    let position = (e.nativeEvent.offsetX - headRect.width) / (railRect.width - headRect.width - tailRect.width)
    if (position > 1.0) {
      position = 1.0
    }
    if (position < 0.0) {
      position = 0.0
    }

    let newValue = Number((min + position * (max - min)).toFixed(2))
    newValue = Math.floor(newValue / step) * step

    // console.log(position, newValue)

    onChange(newValue)

    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function slider_PointerMove(e: React.PointerEvent) {

    if (!onChange) {
      return
    }

    if (e.buttons != 0) {

      slider_PointerDown(e)
    }
  }

  return (
    <div className="ui-color-slider-container">
      <div className="rail"
        onPointerDown={slider_PointerDown}
        onPointerMove={slider_PointerMove}
      >
        <div className={`rail-body head ${value > min ? 'filled' : 'not-filled'}`}
          ref={head_Ref}
          style={{ backgroundColor: value > min ? trackColor : railColor }}
        >
        </div>
        <div className="rail-body track filled"
          style={{
            width: `${((value - min) / (max - min) * 100).toFixed(2)}%`,
            backgroundColor: trackColor
          }}>
        </div>
        <div className="rail-body rest not-filled" style={{ backgroundColor: railColor }}>
        </div>
        <div className={`rail-body head ${value >= max ? 'filled' : 'not-filled'}`}
          ref={tail_Ref}
          style={{ backgroundColor: value >= max ? trackColor : railColor }}
        >
        </div>
      </div>
      {
        showText &&
        <div className='text-container'>
          <div className='text'>
            {value.toFixed(2)}
          </div>
        </div>
      }
    </div>
  )
}
