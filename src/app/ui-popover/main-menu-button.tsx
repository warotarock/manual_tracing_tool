import * as React from 'react'
import { Platform } from '../../platform'
import { Strings } from '../common-logics'
import { DocumentContext } from '../context'
import { MainCommandButtonID } from '../ui'
import { UI_CommandButton, UI_CommandButtonItem, UI_Icon_MaterialIcon } from '../ui-common-controls'
import { PopoverRef, UI_PopoverContainerRef, UI_PopoverContent } from './popover-container'

export class UI_MainMenuButtonRef extends PopoverRef {

  docContext: DocumentContext | null = null
  showPopover(parentNode: HTMLElement){}
  commandButton_Clicked(id: MainCommandButtonID){}
}

export interface UI_MainMenuButtonParam {

  uiRef: UI_MainMenuButtonRef
}

export function UI_MainMenuButton({ uiRef }: UI_MainMenuButtonParam) {

  const popoverParent_Ref = React.useRef<HTMLDivElement>(null)

  const [commandButtonItem] = React.useState<UI_CommandButtonItem>(() => ({ index: 1, icon: 'menu' }))

  function box_Clicked() {

    uiRef.showPopover(popoverParent_Ref.current)
  }

  return (
    <div className='main-menu-button' ref={popoverParent_Ref}>
      <UI_CommandButton
        commandButtonItem={commandButtonItem}
        menuButton={true}
        onClick={box_Clicked}
      />
    </div>
  )
}

export function UI_MainMenuPopover({ uiRef }: UI_MainMenuButtonParam) {

  const popoverContentRef = React.useMemo(() => new UI_PopoverContainerRef(), [])

  const menuItems = React.useMemo<UI_CommandButtonItem[]>(() => {
    return [
      { index: MainCommandButtonID.newFile, icon: 'filenew', title: '新規作成' },
      { index: MainCommandButtonID.openFile, icon: 'fileopen', title: '開く' },
      { index: MainCommandButtonID.saveFile, icon: 'save', title: '保存' },
      { index: MainCommandButtonID.saveAs, icon: 'saveas', title: '名前をつけて保存' },
      { index: MainCommandButtonID.export, icon: 'export', title: 'エクスポート' },
      { index: MainCommandButtonID.shortcutKeys, icon: 'settings', title: 'キーボード設定' },
    ]
  }, [])

  const [documentFilePath, set_documentFilePath] = React.useState('')

  React.useEffect(() => {

    uiRef.showPopover = (parentNode) => {

      set_documentFilePath(getFileName(uiRef.docContext?.documentFilePath ?? ''))

      popoverContentRef.show(uiRef, parentNode)
    }

    return function cleanup() {

      uiRef.showPopover = null
    }
  }, [])

  function getFileName(filePath: string) {

    if (Strings.isNullOrEmpty(filePath)) {
      return ''
    }

    return Platform.path.getFileName(filePath)
  }

  function popover_Exit() {

    popoverContentRef.close(uiRef)
  }

  function item_Clicked(item: UI_CommandButtonItem, e: React.MouseEvent) {

    e.stopPropagation()

    popoverContentRef.close(uiRef)

    uiRef.commandButton_Clicked(item.index)
  }

  return (
    <UI_PopoverContent
      uiRef={popoverContentRef}
      offset={{ x: 6, y: -3 }}
      onDissmiss={popover_Exit}
      onEscape={popover_Exit}
    >
      <div className='main-menu-popover'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='file-name'>
          <input type="text" readOnly={true} value={documentFilePath}/>
        </div>
        <div className='main-menu-commands-container'>
          {
            menuItems.map(item => (
              <div key={item.index}
                className='main-menu-item selectable-item'
                onClick={(e) => item_Clicked(item, e) }
              >
                <UI_Icon_MaterialIcon iconName={item.icon} />
                <div className="main-menu-item-text">
                  {item.title}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </UI_PopoverContent>
  )
}
