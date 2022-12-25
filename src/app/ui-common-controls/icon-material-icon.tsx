import * as React from 'react'

export type UI_Icon_MaterialIcon_IconName = '' |
  'add' |
  'arrowdown' |
  'arrowleft' |
  'arrowright' |
  'arrowup' |
  'check' |
  'clear' |
  'close' |
  'colorize' |
  'copy' |
  'crossarrow' |
  'cut' |
  'doublearrowleft' |
  'doublearrowright' |
  'expandleft' |
  'expandless' |
  'expandmore' |
  'expandright' |
  'export' |
  'filenew' |
  'fileopen' |
  'folder' |
  'history' |
  'layers' |
  'image' |
  'invisible' |
  'media' |
  'menu' |
  'paint' |
  'palette' |
  'paste' |
  'pencil' |
  'playcircle' |
  'radiochecked' |
  'radiounchecked' |
  'redo' |
  'remove' |
  'reset_form' |
  'rotate' |
  'save' |
  'saveas' |
  'scale' |
  'settings' |
  'touchoperationpanel' |
  'tune' |
  'undo' |
  'visible' |
  'zoomin' |
  'zoomout'

export interface UI_Icon_MaterialIcon_Param {

  iconName: UI_Icon_MaterialIcon_IconName
}

export function UI_Icon_MaterialIcon({ iconName }: UI_Icon_MaterialIcon_Param) {

  return (
    <i className='material-icons'>{iconName}</i>
  )
}
