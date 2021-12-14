import * as React from 'react'
import { ImageFileReferenceLayer, Layer, PosingLayer, VectorLayer } from '../document_data'
import { MainToolTab, MainToolTabID } from '../tool/main_tool'

export interface UI_RibbonUITabsRef {

  update?(new_tabID: MainToolTabID, new_tabs:MainToolTab[]): void
  item_Click?(tabID: MainToolTabID): void
}

export interface UI_RibbonUITabsParam {

  uiRef: UI_RibbonUITabsRef
}

export function UI_RibbonUITabs({ uiRef }: UI_RibbonUITabsParam) {

  const [current_tabID, set_current_tabID] = React.useState(MainToolTabID.none)
  const [currentLayer, set_currentLayer] = React.useState<MainToolTab[]>([])

  React.useEffect(() => {

    uiRef.update = (new_tabID: MainToolTabID, new_tabs:MainToolTab[]) => {

      set_current_tabID(new_tabID)
      set_currentLayer(new_tabs)
    }

    return function cleanup() {

      uiRef.update = null
    }
  })

  function item_Click(id: MainToolTabID) {

    if (uiRef.item_Click) {

      uiRef.item_Click(id)
    }
  }

  return (
    <div className="tabs">
      { currentLayer.map(tab =>

        <React.Fragment key={tab.tabID}>
          { tab.tabID == MainToolTabID.drawing &&
            <UI_RibbonTab tabID={MainToolTabID.drawing} label="線画" current_tabID={current_tabID} handleClick={item_Click} />
          }
          { tab.tabID == MainToolTabID.autoFill &&
            <UI_RibbonTab tabID={MainToolTabID.autoFill} label="自動塗りつぶし" current_tabID={current_tabID} handleClick={item_Click} />
          }
          { tab.tabID == MainToolTabID.imageFileReference &&
            <UI_RibbonTab tabID={MainToolTabID.imageFileReference} label="画像ファイル" current_tabID={current_tabID} handleClick={item_Click} />
          }
          { tab.tabID == MainToolTabID.posing &&
            <UI_RibbonTab tabID={MainToolTabID.posing} label="3Dポーズ" current_tabID={current_tabID} handleClick={item_Click} />
          }
          { (tab.tabID == MainToolTabID.edit || tab.tabID == MainToolTabID.edit_disabled) &&
            <UI_RibbonTab tabID={MainToolTabID.edit} label="編集" disabled={tab.tabID == MainToolTabID.edit_disabled} current_tabID={current_tabID} handleClick={item_Click} />
          }
          { tab.tabID == MainToolTabID.document &&
            <UI_RibbonTab tabID={MainToolTabID.document} label="ドキュメント" current_tabID={current_tabID} handleClick={item_Click} />
          }
          { tab.tabID == MainToolTabID.layer &&
            <UI_RibbonTab tabID={MainToolTabID.layer} label="レイヤー" current_tabID={current_tabID} handleClick={item_Click} />
          }
          { tab.tabID == MainToolTabID.view &&
            <UI_RibbonTab tabID={MainToolTabID.view} label="表示" current_tabID={current_tabID} handleClick={item_Click} />
          }
        </React.Fragment>
      )}
    </div>
  )
}

interface UI_MenuButtonParam {

  tabID: MainToolTabID
  label: string
  disabled?: boolean
  current_tabID: MainToolTabID
  handleClick(id: MainToolTabID)
}

export function UI_RibbonTab({ tabID, label, disabled = false, current_tabID, handleClick }: UI_MenuButtonParam) {

  function clicked() {

    if (!disabled) {

      return handleClick(tabID)
    }
  }

  return (
    <div className={`tab${current_tabID == tabID ? ' selected': ''}${disabled ? ' disabled': ''}`} onClick={clicked}>{label}</div>
  )
}
