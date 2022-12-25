import * as React from 'react'
import { int } from '../common-logics'
import { UI_Icon_MaterialIcon, UI_Icon_MaterialIcon_IconName } from './icon-material-icon'

export interface UI_CommandButtonItem {

  index: int
  icon?: UI_Icon_MaterialIcon_IconName
  isSeparator?: boolean
  isSelected?: boolean
  title?: string
}

export interface UI_CommandButtonParam {

  commandButtonItem: UI_CommandButtonItem
  border?: boolean
  menuButton?: boolean
  onClick?: (item: UI_CommandButtonItem) => void
}

export function UI_CommandButton({ commandButtonItem: item, border = false, menuButton = false, onClick }: UI_CommandButtonParam) {

  return (
    <div className={`ui-command-button selectable-item${item.isSelected ? ' selected' : ''}${border ? ' button-border' : ''}${menuButton ? ' menu-button-border' : ''}`}>
      <div
        title={item.title ? item.title : null}
        className={` selectable-item-inner`}
        onMouseDown={(e) => {
          if (onClick) {
            onClick(item)
          }
          e.preventDefault()
        }}
      >
        <UI_Icon_MaterialIcon iconName={item.icon} />
      </div>
    </div>
  )
}
