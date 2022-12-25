import * as React from 'react'
import { UI_RibbonUIRef } from './ribbon-ui'

export interface UI_RibbonUI_Home_Param {

  ribbonUIRef: UI_RibbonUIRef
  isVisible: boolean
}

export function UI_RibbonUI_Home({ ribbonUIRef, isVisible }: UI_RibbonUI_Home_Param) {

  const [, set_currentSubtoolID] = React.useState(ribbonUIRef.docContext.subtoolID)

  React.useEffect(() => {
  }, [])

  return (
    <div className={`ribbon-ui-home${!isVisible ? ' hidden': ''}`}>
    </div>
  )
}
