import * as React from 'react'
import { ColorLogic, float, int, Strings } from '../common-logics'
import { SubToolID } from '../tool'
import { RibbonUIControlID } from '../ui'
import { UI_RibbonUIRef } from './ribbon-ui'

export function UI_RibbonUI_Separator() {

  return (
    <div className="separator">
    </div>
  )
}

export interface UI_RibbonUI_ButtonParam {

  ribbonUIRef: UI_RibbonUIRef
  icon: string
  label: string[]
  id: RibbonUIControlID
}

export function UI_RibbonUI_Button({ ribbonUIRef, icon, label, id }: UI_RibbonUI_ButtonParam ) {

  return (
    <div className="button"
      onPointerDown={() => ribbonUIRef.button_Clicked(id)}
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

  icon: string
  label: string[]
  subtoolID: SubToolID
  currentSubtoolID: SubToolID
  onClick?(subtoolID: SubToolID): void
}

export function UI_RibbonUI_SubToolButton({ icon, label, subtoolID, currentSubtoolID, onClick }: UI_RibbonUI_SubToolButtonParam ) {

  return (
    <div className={`tool-button selectable-item ${subtoolID == currentSubtoolID ? 'selected' : ''}`}
      onPointerDown={() => onClick(subtoolID)}
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
  large?: boolean
  onClick?(id: int, value: number): void
}

export function UI_RibbonUI_ToggleButtonGroup({children, id, currentValue, large, onClick}: UI_RibbonUI_ToggleButtonGroup) {

  return (
    <div className={`toggle-button-group${large ? ' large' : ''}`}>
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
    <div className={`toggle-button selectable-item ${currentValue==value ? 'selected' : ''}`} onPointerDown={handleClick}>
      <div className="toggle-button-inner selectable-item-inner-sq">{label}</div>
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
    <div className={"rgba-color"} onPointerDown={handleClick}>
      <div className="alpha alpha-checker-background-pallete">
        <div className="alpha-color" style={{backgroundColor:`rgba(${ColorLogic.rgbaToRgbaString(value)})`}}></div>
      </div>
      <div className="rgb" style={{backgroundColor:`#${ColorLogic.rgbToHex2String(value)}`}}></div>
    </div>
  )
}
