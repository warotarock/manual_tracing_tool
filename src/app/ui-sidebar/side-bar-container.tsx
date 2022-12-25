import * as React from 'react'
import { SideBarContentID } from '../ui/constants'

export interface UI_SideBarContentInfo {

  key: number
  id: SideBarContentID
  component: any
  uiRef: any
  icon: string
  isOpened?: boolean
}

export interface UI_SideBarContainerRef {

  update?: () => void
  setContentOpened?: (id: SideBarContentID, opened: boolean) => void
  isContentOpened?: (id: SideBarContentID) => boolean
  toggleVisibility?: (id: SideBarContentID) => void
  onContentOpened?: (cotentInfo: UI_SideBarContentInfo) => void
  onContentClosed?: (cotentInfo: UI_SideBarContentInfo) => void
}

export interface UI_SideBarContainerParam {

  dockingTo: 'left' | 'right'
  isMobileMode: boolean
  contents: UI_SideBarContentInfo[]
  uiRef: UI_SideBarContainerRef
}

export function UI_SideBarContainer({ dockingTo, isMobileMode, contents, uiRef }: UI_SideBarContainerParam ) {

  const [contentInfos, set_contentInfos] = React.useState(contents)

  React.useEffect(() => {

    uiRef.update = () => {

      updateContents()
    }

    uiRef.setContentOpened = (id, opened) => {

      const contentInfo = getContentInfo(id)

      setContentOpened(contentInfo, opened)
    }

    uiRef.isContentOpened = (id) => {

      const contentInfo = getContentInfo(id)

      return contentInfo.isOpened ?? false
    }

    uiRef.toggleVisibility = (id) => {

      const contentInfo = getContentInfo(id)

      tab_Clicked(contentInfo)
    }

    return function cleanup() {

      uiRef.update = null
      uiRef.toggleVisibility = null
      uiRef.setContentOpened = null
    }
  }, [])

  function leftRightClass(): string {

    return (dockingTo == 'left' ? 'left-panel' : 'right-panel')
  }

  function closedClass(contentInfo: UI_SideBarContentInfo): string {

    return (!contentInfo.isOpened ? 'closed' : '')
  }

  function getContentInfo(id: SideBarContentID) {

    return contents.find(ct => ct.id == id)
  }

  function setContentOpened(contentInfo: UI_SideBarContentInfo, open: boolean) {

    contentInfo.isOpened = open
  }

  function updateContents() {

    set_contentInfos(contentInfos.slice())
  }

  function tab_Clicked(contentInfo: UI_SideBarContentInfo) {

    const contendOpened = !contentInfo.isOpened

    setContentOpened(contentInfo, !contentInfo.isOpened)

    updateContents()

    if (contendOpened) {

      if (uiRef.onContentOpened) {

        uiRef.onContentOpened(contentInfo)
      }
    }
    else {

      if (uiRef.onContentClosed) {

        uiRef.onContentClosed(contentInfo)
      }
    }
  }

  return (
    <React.Fragment>
      <div className={`side-panel-tabs ${contents.length == 0 ? ' hidden': ''} ${isMobileMode ? 'hidden' : ''}`}>
        {contentInfos.map(contentInfo => (
            <div key={contentInfo.key} className={`side-panel-tab ${leftRightClass()} ${closedClass(contentInfo)}`}
              onPointerDown={() => tab_Clicked(contentInfo)}
            >
              <i className="material-icons">{contentInfo.icon}</i>
            </div>
          )
        )}
      </div>
      <div className={`side-panel-contents ${leftRightClass()} ${isMobileMode ? 'mobile-screen' : ''}`}>
        {contentInfos.map(contentInfo => (
            <div key={contentInfo.key} className={`side-panel-content ${leftRightClass()} ${closedClass(contentInfo)}`}>
              <div className={`content-container ${leftRightClass()}`}>
                <div className={`content-inner-container ${closedClass(contentInfo)}`}>
                  <contentInfo.component uiRef={contentInfo.uiRef}></contentInfo.component>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </React.Fragment>
  )
}
