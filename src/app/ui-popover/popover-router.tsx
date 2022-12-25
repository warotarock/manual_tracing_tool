import * as React from 'react'
import { UI_BrushPropertyBoxPopover, UI_BrushPropertyBoxRef } from './brush-property-box'
import { UI_MainMenuButtonRef, UI_MainMenuPopover } from './main-menu-button'
import { UI_SelectBoxPopover, UI_SelectBoxPopoverRef } from './selectbox'

export interface UI_PopoverRouterParam {

  mainMenuUIRef: UI_MainMenuButtonRef
  brushPropertyBoxRef: UI_BrushPropertyBoxRef
  selectBoxRef: UI_SelectBoxPopoverRef
}

export function UI_PopoverRouter({ mainMenuUIRef, brushPropertyBoxRef, selectBoxRef }: UI_PopoverRouterParam) {

  return (
    <>
      <UI_MainMenuPopover uiRef={mainMenuUIRef} />
      <UI_BrushPropertyBoxPopover uiRef={brushPropertyBoxRef} />
      <UI_SelectBoxPopover uiRef={selectBoxRef} />
    </>
  )
}
