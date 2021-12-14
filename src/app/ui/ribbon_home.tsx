import * as React from 'react'
import { UI_RibbonUIRef } from './ribbon_ui'
import { DocumentContext } from '../context/document_context'

export function UI_RibbonUI_Home({ uiRef }: { uiRef: UI_RibbonUIRef }) {

  const [, set_subToolID] = React.useState(uiRef.docContext.subtoolID)

  React.useEffect(() => {

    uiRef.updateHomeUI = (docContext: DocumentContext) => {

      set_subToolID(docContext.subtoolID)
    }

    return function cleanup() {

      uiRef.updateHomeUI = null
    }
  })

  return (
    <div className="ribbon-ui-home">
    </div>
  )
}
