import * as React from 'react';
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';

import { int, float } from 'base/conversion';
import { ColorLogic } from 'logics/color';

import { RCLib } from 'ui/rc_lib';

export interface UI_ColorMixerWindowRef {

  update?(color: Vec4): void;

  color_Change?: (newColor: Vec4) => void;
}

export interface UI_PaletteSelectorWindowParam {

  uiRef: UI_ColorMixerWindowRef;
}

export function UI_ColorMixerWindow({ uiRef }: UI_PaletteSelectorWindowParam) {

  const [rgbaValue, setRGBAValue] = React.useState(() => {
    return vec4.fromValues(0.0, 0.0, 0.0, 1.0)
  });

  const [hsvValue, setHSVValue] = React.useState(() => {
    return vec4.fromValues(0.0, 0.0, 0.0, 0.0)
  });

  React.useEffect(() => {

    uiRef.update = (color: Vec4) => {

      const newRGBA = vec4.clone(color);

      setValueFromRGBA(newRGBA);
    };

    return function cleanup() {

      uiRef.update = null;
    };
  });

  function setValueFromRGBA(newRGBA: Vec4) {

    const newHSV = vec4.create();
    ColorLogic.rgbToHSVv(newHSV, newRGBA)

    setRGBAValue(newRGBA);
    setHSVValue(newHSV);
  }

  function setValueFromHSV(newHSV: Vec4) {

    const newRGBA = vec4.clone(rgbaValue);
    ColorLogic.hsvToRGBv(newRGBA, newHSV)

    setRGBAValue(newRGBA);
    setHSVValue(newHSV);
  }

  function onChangeARGB(index: int, value: float) {

    const newRGBA = vec4.clone(rgbaValue);
    newRGBA[index] = value;

    setValueFromRGBA(newRGBA);

    if (uiRef.color_Change) {

      uiRef.color_Change(rgbaValue);
    }

    // console.log('onChangeARGB', index, value);
  }

  function onChangeHSV(index: int, value: float) {

    const newHSV = vec4.clone(hsvValue);
    newHSV[index] = value;

    setValueFromHSV(newHSV);

    if (uiRef.color_Change) {

      uiRef.color_Change(rgbaValue);
    }

    // console.log('onChangeHSV', value);
  }

  return (
    <React.Fragment>
      <canvas id="colorMixer_colorCanvas"></canvas>
      <ColorSlider label="A" railColor="#eee" trackColor="#888" index={3} value={rgbaValue[3]} onChange={onChangeARGB} />
      <ColorSlider label="R" railColor="#eee" trackColor="#f55" index={0} value={rgbaValue[0]} onChange={onChangeARGB} />
      <ColorSlider label="G" railColor="#eee" trackColor="#0d0" index={1} value={rgbaValue[1]} onChange={onChangeARGB} />
      <ColorSlider label="B" railColor="#eee" trackColor="#22d" index={2} value={rgbaValue[2]} onChange={onChangeARGB} />
      <ColorSlider label="H" railColor="#eee" trackColor="#dd0" index={0} value={hsvValue[0]} onChange={onChangeHSV}  />
      <ColorSlider label="S" railColor="#eee" trackColor="#0dd" index={1} value={hsvValue[1]} onChange={onChangeHSV}  />
      <ColorSlider label="V" railColor="#eee" trackColor="#d0d" index={2} value={hsvValue[2]} onChange={onChangeHSV}  />
    </React.Fragment>
  );
}

function ColorSlider({label, railColor, trackColor, index, value, onChange=undefined}) {

  const input_Ref = React.useRef<HTMLInputElement>(null);

  function inputChanged() {

    if (!onChange) {
      return;
    }

    const value = RCLib.getInputElementNumber(input_Ref.current, 0.0);

    onChange(index, value);
  }

  function sliderChanged(value) {

    if (!onChange) {
      return;
    }

    onChange(index, value);
  }

  return (
    <div className="colorMixerValueSlide">
      <div className="label">{label}</div>
      <input
          type="number" step="0.01" min="0.0" max="1.0"
          style={{borderBottom: `solid 2px ${trackColor}`}}
          ref={input_Ref}
          value={value.toFixed(2)}
          onChange={inputChanged}
      />
      <div className="range">
        <Slider
          min={0.0} max={1.0} step={0.01}
          value={value.toFixed(2)}
          handleStyle={{ opacity: 0, cursor: 'pointer' }}
          railStyle={{ backgroundColor: railColor, height: '14px', borderRadius: '0' }}
          trackStyle={{ backgroundColor: trackColor, height: '14px', borderRadius: '0' }}
          onChange={sliderChanged}
        />
      </div>
    </div>
  );
}
