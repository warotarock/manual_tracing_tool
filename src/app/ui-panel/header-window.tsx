import * as React from 'react'
import { MainCommandButtonID } from '../ui/constants'
import { UI_CommandButtonItem, UI_CommandButtons, UI_CommandButtonsRef } from '../ui-common-controls'

export interface UI_HeaderWindowRef {

  update?(): void

  commandButton_Click?: (id: MainCommandButtonID) => void
}

export interface UI_HeaderWindowParam {

  uiRef: UI_HeaderWindowRef
}

export function UI_HeaderWindow({ uiRef }: UI_HeaderWindowParam) {

  const file_CommandButtonsRef = React.useMemo<UI_CommandButtonsRef>(() => {

    return {
      items: [
        { index: MainCommandButtonID.openFile, icon: 'folder', title: 'ファイルを開く' },
        { index: MainCommandButtonID.saveFile, icon: 'save', title: '保存' },
        { index: MainCommandButtonID.export, icon: 'export', title: 'エクスポート' },
        { index: MainCommandButtonID.undo, icon: 'undo', title: '元に戻す' },
        { index: MainCommandButtonID.redo, icon: 'redo', title: 'やり直し' },
      ],

      commandButton_Clicked: (item: UI_CommandButtonItem) => {

        if (uiRef.commandButton_Click) {

          uiRef.commandButton_Click(item.index)
        }
      }
    }
  }, [])

  const view_CommandButtonsRef = React.useMemo<UI_CommandButtonsRef>(() => {

    return {
      items: [
        { index: MainCommandButtonID.layerWindow, icon: 'layers' },
        { index: MainCommandButtonID.paletteWindow, icon: 'palette' },
        { index: MainCommandButtonID.colorMixerWindow, icon: 'colorize' },
        { index: MainCommandButtonID.timeLineWindow, icon: 'playcircle' },
      ],

      commandButton_Clicked: (item: UI_CommandButtonItem) => {

        if (uiRef.commandButton_Click) {

          uiRef.commandButton_Click(item.index)
        }
      }
    }
  }, [])

  React.useEffect(() => {

      return function cleanup() {

          uiRef.update = null
      }
  }, [])

  return (
    <React.Fragment>

        <div className='file-commands'>
          <UI_CommandButtons uiRef={file_CommandButtonsRef} />
        </div>
        <div className='file-name'>
          <input type="text" id="fileName" />
        </div>
        <div className='view-commands'>
          <UI_CommandButtons uiRef={view_CommandButtonsRef} />
        </div>

    </React.Fragment>
  )
}
