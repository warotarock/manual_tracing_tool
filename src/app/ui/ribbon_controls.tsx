import * as React from 'react'
import { ColorLogic } from '../logics/color'
import { float, int, Strings } from '../logics/conversion'
import { SubToolID } from '../tool/sub_tool'
import { RibbonUIControlID } from '../window/constants'
import { UI_RibbonUIRef } from './ribbon_ui'

export function UI_RibbonUI_Separator() {

  return (
    <div className="separator">
    </div>
  )
}

export interface UI_RibbonUI_ButtonParam {

  uiRef: UI_RibbonUIRef
  icon: string
  label: string[]
  id: RibbonUIControlID
}

export function UI_RibbonUI_Button({ uiRef, icon, label, id }: UI_RibbonUI_ButtonParam ) {

  return (
    <div className="button"
      onClick={() => uiRef.button_Click(id)}
    >
      <div className="button-inner">
        <div className="icon">
          <img src={icon} />
        </div>
        <div className="label">{
          label.map((labelText, index) => (
            <React.Fragment key={index}>
              <span>{labelText}</span>{index != label.length - 1 && <br/>}
            </React.Fragment>
          ))
        }</div>
      </div>
    </div>
  )
}

export interface UI_RibbonUI_SubToolButtonParam {

  uiRef: UI_RibbonUIRef
  icon: string
  label: string[]
  subtoolID: SubToolID
}

export function UI_RibbonUI_SubToolButton({ uiRef, icon, label, subtoolID }: UI_RibbonUI_SubToolButtonParam ) {

  return (
    <div className={`tool-button selectable-item ${subtoolID == uiRef.docContext.subtoolID ? 'selected' : ''}`}
      onClick={() => uiRef.subtoolButton_Click(subtoolID)}
    >
      <div className="tool-button-inner selectable-item-inner">
        <div className="icon">
          <img src={icon} />
        </div>
        <div className="label">{
          label.map((labelText, index) => (
            <React.Fragment key={index}>
              <span>{labelText}</span>{index != label.length - 1 && <br/>}
            </React.Fragment>
          ))
        }</div>
      </div>
    </div>
  )
}

export interface UI_RibbonUI_InputLabelParam {

  label: string
}

export function UI_RibbonUI_InputLabel({  label = '' }: UI_RibbonUI_InputLabelParam) {

  return (
    <div className="input-label">{label}</div>
  )
}

export interface UI_RibbonUI_NumberInputParam {

  digit?: int
  step?: float
  min?: float
  max?: float
  value: float
  onChange?(value: float): void
}

export function UI_RibbonUI_NumberInput({ digit = 2, step = 0.05, min = 0.0, max = 100, value, onChange }: UI_RibbonUI_NumberInputParam) {

  let valueText = ''
  if (typeof(value) == 'number') {

    valueText = value.toFixed(digit)
  }

  function handleChange(event) {

    let inputValue = Number(event.target.value)

    if (isNaN(inputValue)) {

      inputValue = null
    }
    else {

      if (inputValue < min) {

        inputValue = min
      }

      if (inputValue > max) {

        inputValue = max
      }

      if (onChange) {

        onChange(inputValue)
      }
    }
  }

  return (
    <input className="number-input" type="number" step={step.toString()} value={valueText} onChange={handleChange} />
  )
}

export interface UI_RibbonUI_LabelledNumberInputParam extends UI_RibbonUI_NumberInputParam {

  label: string
}

export function UI_RibbonUI_LabelledNumberInput({ label, digit = 2, step = 0.05, min = 0.05, value, onChange }: UI_RibbonUI_LabelledNumberInputParam) {

  return (
    <div className="labelled-number-input">
      <UI_RibbonUI_InputLabel label={label} />
      <UI_RibbonUI_NumberInput digit={digit} step={step} min={min} value={value} onChange={onChange} />
    </div>
  )
}

export interface UI_RibbonUI_TextInputParam {

  maxLength?: int
  value: string
  onChange?(value: string): void
}

export function UI_RibbonUI_TextInput({ maxLength = 100, value, onChange }: UI_RibbonUI_TextInputParam) {

  let valueText = ''
  if (typeof(value) == 'string') {

    valueText = value
  }

  function handleChange(event) {

    let inputValue = event.target.value

    if (inputValue.length > maxLength) {

      inputValue = Strings.substring(inputValue, 0, maxLength)
    }

    if (onChange) {

      onChange(inputValue)
    }
  }

  return (
    <input className="text-input" value={valueText} onChange={handleChange} />
  )
}

export interface UI_RibbonUI_ToggleButtonGroup {

  children?: any
  id: int
  currentValue: number
  onClick?(id: int, value: number): void
}

export function UI_RibbonUI_ToggleButtonGroup({children, id, currentValue, onClick}: UI_RibbonUI_ToggleButtonGroup) {

  return (
    <div className="toggle-button-group">
      { React.Children.map(children, (child, i) => {
          return React.cloneElement(child as React.ReactElement, { id, currentValue, onClick })
        }
      )}
    </div>
  )
}

export interface UI_RibbonUI_ToggleButtonParam {

  label: string
  id?: int
  value: number
  currentValue?: number
  onClick?(id: int, value: number): void
}

export function UI_RibbonUI_ToggleButton({ label, id, value, currentValue, onClick }: UI_RibbonUI_ToggleButtonParam) {

  function handleClick() {

    if (onClick) {

      onClick(id, value)
    }
  }

  return (
    <div className={`toggle-button selectable-item ${currentValue==value ? 'selected' : ''}`} onClick={handleClick}>
      <div className="selectable-item-inner-sq">{label}</div>
    </div>
  )
}

export interface UI_RibbonUI_RGBAColorParam {

  value: Vec4
  onClick?(): void
}

export function UI_RibbonUI_RGBAColor({ value, onClick }: UI_RibbonUI_RGBAColorParam) {

  function handleClick() {

    if (onClick) {

      onClick()
    }
  }

  return (
    <div className={"rgba-color"} onClick={handleClick}>
      <div className="alpha alpha-checker-background">
        <div className="alpha-color" style={{backgroundColor:`rgba(${ColorLogic.rgbaToRgbaString(value)})`}}></div>
      </div>
      <div className="rgb" style={{backgroundColor:`#${ColorLogic.rgbToHex2String(value)}`}}></div>
    </div>
  )
}
