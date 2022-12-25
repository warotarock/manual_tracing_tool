import * as React from 'react'
import { ColorLogic, float, int } from '../common-logics'
import { UI_ColorSlider, UI_NumberInput } from '../ui-common-controls'

export interface UI_ColorMixerWindowRef {

  update?(color: Vec4): void

  color_Change?: (newColor: Vec4) => void
}

export interface UI_ColorMixerWindowParam {

  uiRef: UI_ColorMixerWindowRef
}

export function UI_ColorMixerWindow({ uiRef }: UI_ColorMixerWindowParam) {

  const [rgbaValue, setRGBAValue] = React.useState(() => {
    return vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  })

  const [hsvValue, setHSVValue] = React.useState(() => {
    return vec4.fromValues(0.0, 0.0, 0.0, 0.0)
  })

  React.useEffect(() => {

    uiRef.update = (color: Vec4) => {

      const newRGBA = vec4.clone(color)

      setValueFromRGBA(newRGBA)
    }

    return function cleanup() {

      uiRef.update = null
    }
  }, [])

  function setValueFromRGBA(newRGBA: Vec4) {

    const newHSV = vec4.create()
    ColorLogic.rgbToHSVv(newHSV, newRGBA)

    setRGBAValue(newRGBA)
    setHSVValue(newHSV)

    return newRGBA
  }

  function setValueFromHSV(newHSV: Vec4) {

    const newRGBA = vec4.clone(rgbaValue)
    ColorLogic.hsvToRGBv(newRGBA, newHSV)

    setRGBAValue(newRGBA)
    setHSVValue(newHSV)

    return newRGBA
  }

  function ARGB_Changed(index: int, value: float) {

    const newRGBA = vec4.clone(rgbaValue)
    newRGBA[index] = value

    const newRGBAValue = setValueFromRGBA(newRGBA)

    if (uiRef.color_Change) {

      uiRef.color_Change(newRGBAValue)
    }

    // console.log('onChangeARGB', index, newRGBAValue)
  }

  function HSV_Changed(index: int, value: float) {

    const newHSV = vec4.clone(hsvValue)
    newHSV[index] = value

    const newRGBAValue = setValueFromHSV(newHSV)

    if (uiRef.color_Change) {

      uiRef.color_Change(newRGBAValue)
    }

    // console.log('onChangeHSV', index, newRGBAValue)
  }

  return (
    <div className="color-mixer-window">
      <canvas className="color-canvas" id="colorMixer_colorCanvas"></canvas>
      <ColorSlider label="A" trackColor="#888" index={3} value={rgbaValue[3]} onChange={ARGB_Changed} />
      <ColorSlider label="R" trackColor="#f55" index={0} value={rgbaValue[0]} onChange={ARGB_Changed} />
      <ColorSlider label="G" trackColor="#0d0" index={1} value={rgbaValue[1]} onChange={ARGB_Changed} />
      <ColorSlider label="B" trackColor="#22d" index={2} value={rgbaValue[2]} onChange={ARGB_Changed} />
      <ColorSlider label="H" trackColor="#dd0" index={0} value={hsvValue[0]} onChange={HSV_Changed}  />
      <ColorSlider label="S" trackColor="#0dd" index={1} value={hsvValue[1]} onChange={HSV_Changed}  />
      <ColorSlider label="V" trackColor="#d0d" index={2} value={hsvValue[2]} onChange={HSV_Changed}  />
    </div>
  )
}

interface ColorSliderParam {

  label: string
  trackColor: string
  index: number
  value: number
  onChange?: (index: int, value: float) => void
}

function ColorSlider({label, trackColor, index, value, onChange}: ColorSliderParam) {

  const input_Ref = React.useRef<HTMLInputElement>(null)

  function input_Changed(newValue: number) {

    if (!onChange) {
      return
    }

    onChange(index, newValue)
  }

  function slider_Changed(newValue: number) {

    if (!onChange) {
      return
    }

    onChange(index, newValue)
  }

  return (
    <div className="color-mixer-value-slider">
      <div className="label">
        <div className="label-text">{label}</div>
      </div>
      <div className="input" style={{borderBottom: `solid 2px ${trackColor}`}}>
        <UI_NumberInput
          digit={2} step={0.01} min={0.0} max={1.0}
          value={value}
          onChange={input_Changed}
        />
      </div>
      <div className="range">
        <UI_ColorSlider
          min={0.0} max={1.0} step={0.01}
          value={value}
          trackColor={trackColor}
          onChange={slider_Changed}
        />
      </div>
    </div>
  )
}
