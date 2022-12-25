import * as React from 'react'
import { int } from '../common-logics'
import { UI_Icon_MaterialIcon } from './icon-material-icon'

export interface UI_NumberSpinnerParam {
  value: number
  buttonIndexs: int[]
  title?: string
  border?: boolean
  onClick?: (buttonIndex: int) => void
}

export function UI_NumberSpinner({ value, title = '', border = false, buttonIndexs, onClick }: UI_NumberSpinnerParam) {

  return (
    <div
      className={`ui-number-spinner-container${border ? ' button-border' : ''}`}
      title={title}
    >
      <div className='ui-number-spinner-button'
        onPointerDown={() => onClick(buttonIndexs[0]) }
      >
        <UI_Icon_MaterialIcon iconName='expandleft' />
      </div>
      <div className='ui-number-spinner-text'>
        {value}
      </div>
      <div className='ui-number-spinner-button'
        onPointerDown={() => onClick(buttonIndexs[1]) }
      >
        <UI_Icon_MaterialIcon iconName='expandright' />
      </div>
    </div>
  )
}
