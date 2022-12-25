import * as React from 'react'
import { DocumentContext } from '../context'
import { MainToolTab, MainToolTabID } from '../tool'

export interface UI_RibbonUITabsRef {

  update?(docContext: DocumentContext): void
  item_Clicked?(tabID: MainToolTabID): void
}

export interface UI_RibbonUITabsParam {

  uiRef: UI_RibbonUITabsRef
}

export function UI_RibbonUITabs({ uiRef }: UI_RibbonUITabsParam) {

  const [current_tabID, set_current_tabID] = React.useState(MainToolTabID.none)
  const [mainToolTabs, set_MainToolTabs] = React.useState<MainToolTab[]>([])

  React.useEffect(() => {

    uiRef.update = (docContext) => {

      set_current_tabID(docContext.mainToolTabID)
      set_MainToolTabs(docContext.mainToolTabs)
    }

    return function cleanup() {

      uiRef.update = null
    }
  }, [])

  function item_Clicked(id: MainToolTabID) {

    if (uiRef.item_Clicked) {

      uiRef.item_Clicked(id)
    }
  }

  return (
    <div className="tabs">
      { mainToolTabs.map(tab =>

        <React.Fragment key={tab.tabID}>
          { tab.tabID == MainToolTabID.group &&
            <UI_RibbonTab tabID={MainToolTabID.group} label="グループ" current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { tab.tabID == MainToolTabID.drawing &&
            <UI_RibbonTab tabID={MainToolTabID.drawing} label="線画" current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { tab.tabID == MainToolTabID.pointBrushFill &&
            <UI_RibbonTab tabID={MainToolTabID.pointBrushFill} label="ブラシ塗り" current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { tab.tabID == MainToolTabID.autoFill &&
            <UI_RibbonTab tabID={MainToolTabID.autoFill} label="自動囲み塗り" current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { tab.tabID == MainToolTabID.imageFileReference &&
            <UI_RibbonTab tabID={MainToolTabID.imageFileReference} label="画像ファイル" current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { tab.tabID == MainToolTabID.posing &&
            <UI_RibbonTab tabID={MainToolTabID.posing} label="3Dポーズ" current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { (tab.tabID == MainToolTabID.edit || tab.tabID == MainToolTabID.edit_disabled) &&
            <UI_RibbonTab tabID={MainToolTabID.edit} label="編集" disabled={tab.tabID == MainToolTabID.edit_disabled} current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { tab.tabID == MainToolTabID.document &&
            <UI_RibbonTab tabID={MainToolTabID.document} label="ドキュメント" current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { tab.tabID == MainToolTabID.layer &&
            <UI_RibbonTab tabID={MainToolTabID.layer} label="レイヤー" current_tabID={current_tabID} handleClick={item_Clicked} />
          }
          { tab.tabID == MainToolTabID.view &&
            <UI_RibbonTab tabID={MainToolTabID.view} label="表示/設定" current_tabID={current_tabID} handleClick={item_Clicked} />
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
    <div className={`tab${current_tabID == tabID ? ' selected': ''}${disabled ? ' disabled': ''}`} onPointerDown={clicked}>
      <div className="tab-label">{label}</div>
    </div>
  )
}
