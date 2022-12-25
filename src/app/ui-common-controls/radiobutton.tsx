import * as React from 'react'
import { int } from '../common-logics'
import { UI_Icon_MaterialIcon } from './icon-material-icon'

export interface UI_RadioButtonRefParam {

  index?: number
  selectedIndex?:  number
  label?: string
  onClick?(indexnull): void
}

export function UI_RadioButton({index = 0, selectedIndex = -1, label = '', onClick = null }: UI_RadioButtonRefParam) {

  return (
    <div className='radio-button selectable-item'
      onPointerDown={() => onClick(index)}
    >
      <div className='radio-button-marker'>
        <UI_Icon_MaterialIcon iconName={ index == selectedIndex ? 'radiochecked' : 'radiounchecked'} />
      </div>
      <div className='radio-button-label'>
        <span>{label}</span>
      </div>
    </div>
  )
}

export interface RadioSelectionOption {

  index: int
  label: string
  data?: any
}

export interface UI_RadioButtonsParam {

  options: RadioSelectionOption[]
  selectedIndex:  number
  onClick?(indexnull): void
}

export function UI_RadioButtons({options, selectedIndex, onClick = null}: UI_RadioButtonsParam) {

  return <>
    { options.map(option => (
      <UI_RadioButton
        key={option.index}
        index={option.index}
        selectedIndex={selectedIndex}
        label={option.label}
        onClick={() => {
          if (onClick) {
            onClick(option)
          }
        }}
      />
    )) }
  </>
}

