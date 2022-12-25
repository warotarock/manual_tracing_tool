import * as React from 'react'
import { int } from '../common-logics'
import { UI_Icon_MaterialIcon } from '../ui-common-controls'
import { UI_SelectBox, UI_SelectBoxOption, UI_SelectBoxPopoverRef } from '../ui-popover'
import { ShortcutKeyLogic, ShortcutKeySetting, UserSettingFileLogic } from '../user-setting'
import { DialogScreenRef } from '../ui'
import { UI_DialogScreenContainer, UI_DialogScreenContainerRef } from './dialog-screen-conatiner'

export interface UI_Dialog_ShortcutKeysRef extends DialogScreenRef {

  show?(userSetting: UserSettingFileLogic, shortcutKey: ShortcutKeyLogic): void
  close?(): void

  fileItem_Selected?: (filePath: string) => void
  filePath_Fixed?: (filePath: string) => void

  selectBoxPopoverRef?: UI_SelectBoxPopoverRef
}

interface UI_Dialog_ShortcutKeysParam {

  uiRef: UI_Dialog_ShortcutKeysRef
}

interface ShortcutKeyItem {

  index: int
  keyOption: UI_SelectBoxOption
  modifierOption: UI_SelectBoxOption
  commandOption: UI_SelectBoxOption
  setting: ShortcutKeySetting
}

export function UI_Dialog_ShortcutKeys({ uiRef }: UI_Dialog_ShortcutKeysParam) {

  const [keyOptions, set_keyOptions] = React.useState<UI_SelectBoxOption[]>([])
  const [selected_keyOptions, set_selected_keyOptions] = React.useState<UI_SelectBoxOption[]>([])

  const [modifierOptions, set_modifierOptions] = React.useState<UI_SelectBoxOption[]>([])
  const [selected_modifierOptions, set_selected_modifierOptions] = React.useState<UI_SelectBoxOption[]>([])

  const [commandOptions, set_commandOptions] = React.useState<UI_SelectBoxOption[]>([])
  const [selected_commandOptions, set_selected_commandOptions] = React.useState<UI_SelectBoxOption[]>([])

  const [shortcutKeysItems, set_shortcutKeysItems] = React.useState<ShortcutKeyItem[]>([])

  const [selectedItem, set_selectedItem] = React.useState<ShortcutKeyItem | null>(null)

  const overlayContainerRef = React.useMemo<UI_DialogScreenContainerRef>(() => ({}), [])

  const userSettingRef = React.useRef<UserSettingFileLogic>(null)
  const shortcutKeyRef = React.useRef<ShortcutKeyLogic>(null)

  React.useEffect(() => {

    uiRef.show = (userSetting, shortcutKey) => {

      userSettingRef.current = userSetting
      shortcutKeyRef.current = shortcutKey

      const new_keyOptions: UI_SelectBoxOption[] = shortcutKey.shortcutKeys.map(key => (
        { index: key.shortcutKeyID, label: key.keyName, data: key.shortcutKeyID }
      ))

      const new_modifierOptions: UI_SelectBoxOption[] = shortcutKey.modifierKeys.map(key => (
        { index: key.modifierKeyID, label: key.keyName, data: key.modifierKeyID }
      ))

      const new_commandOptions: UI_SelectBoxOption[] = shortcutKey.shortcutCommands.map(com =>(
        { index: com.commandID, label: `${com.category.categoryName} - ${com.commandName}`, data: com.commandID }
      ))

      set_keyOptions(new_keyOptions)
      set_modifierOptions(new_modifierOptions)
      set_commandOptions(new_commandOptions)

      set_shortcutKeysItems(getShortcutKeyItems(shortcutKey.shortcutKeySettings, new_keyOptions, new_modifierOptions, new_commandOptions))

      set_selected_keyOptions([])
      set_selected_modifierOptions([new_modifierOptions[0]])
      set_selected_commandOptions([])
      set_selectedItem(null)

      overlayContainerRef.show(uiRef)
    }

    uiRef.close = () => {

      set_keyOptions([])
      set_modifierOptions([])
      set_commandOptions([])
      set_shortcutKeysItems([])

      overlayContainerRef.hide(uiRef)
    }

    return function cleanup() {

      uiRef.show = null
      uiRef.close = null
    }
  }, [])

  function dialog_Escaped() {

    userSettingRef.current.saveSettings()

    uiRef.close()
  }

  function key_Changed(option: UI_SelectBoxOption | null) {

    set_selected_keyOptions([option])
  }

  function modifier_Changed(option: UI_SelectBoxOption | null) {

    set_selected_modifierOptions([option])
  }

  function command_Changed(option: UI_SelectBoxOption | null) {

    set_selected_commandOptions([option])
  }

  function item_Clicked(item: ShortcutKeyItem) {

    {
      const option = keyOptions.find(option => option.data == item.setting.shortcutKeyID)
      if (option) {
        set_selected_keyOptions([option])
      }
    }

    {
      const option = modifierOptions.find(option => option.data == item.setting.modifierKeyID)
      if (option) {
        set_selected_modifierOptions([option])
      }
    }

    {
      const option = commandOptions.find(option => option.data == item.setting.commandID)
      if (option) {
        set_selected_commandOptions([option])
      }
    }

    set_selectedItem(item)
  }

  function fixItem_Clicked() {

    if (selected_keyOptions.length == 0
      || selected_modifierOptions.length == 0
      || selected_commandOptions.length == 0
    ) {
      return
    }

    const key_option = selected_keyOptions[0]
    const modifier_option =  selected_modifierOptions[0]
    const command_option = selected_commandOptions[0]

    const isNew = (selectedItem == null)

    let new_item: ShortcutKeyItem

    const same_item = shortcutKeysItems.find(item =>
      (isNew || item != selectedItem)
      && (item.keyOption == key_option
        && item.modifierOption == modifier_option
        && item.commandOption == command_option
        )
    )

    // TODO: エラーメッセージを表示するとかする
    if (same_item) {
      return
    }

    if (!isNew) {

      new_item = selectedItem
    }
    else {

      const new_setting: ShortcutKeySetting = {
        id: 0,
        shortcutKeyID: 0,
        modifierKeyID: 0,
        commandID: 0
      }

      shortcutKeyRef.current.addShortcutKeySetting(new_setting)

      new_item = {
        index: 0,
        keyOption: null,
        modifierOption: null,
        commandOption: null,
        setting: new_setting
      }

      shortcutKeysItems.push(new_item)
    }

    new_item.keyOption = key_option,
    new_item.modifierOption = modifier_option
    new_item.commandOption = command_option

    new_item.setting.shortcutKeyID = new_item.keyOption.data
    new_item.setting.modifierKeyID = new_item.modifierOption.data
    new_item.setting.commandID = new_item.commandOption.data

    set_shortcutKeysItems(getShortcutKeyItems(
      shortcutKeyRef.current.shortcutKeySettings, keyOptions, modifierOptions, commandOptions))

    if (isNew) {

      cancelItem_Clicked()
    }
  }

  function addItem_Clicked() {

    if (selectedItem != null) {
      return
    }

    fixItem_Clicked()
  }

  function deleteItem_Clicked() {

    if (selectedItem == null) {
      return
    }

    set_shortcutKeysItems(shortcutKeysItems.filter(item => item != selectedItem))

    shortcutKeyRef.current.removeShortcutKeySetting(selectedItem.setting)

    cancelItem_Clicked()
  }

  function cancelItem_Clicked() {

    set_selected_keyOptions([])
    set_selected_modifierOptions([modifierOptions[0]])
    set_selected_commandOptions([])
    set_selectedItem(null)
  }

  function getShortcutKeyItems(
    shortcutKeySettings: ShortcutKeySetting[],
    keyOptions: UI_SelectBoxOption[],
    modifierOptions: UI_SelectBoxOption[],
    commandOptions: UI_SelectBoxOption[]
  ): ShortcutKeyItem[] {

    const items = shortcutKeySettings.map(setting => {

      const keyOption = keyOptions.find(opt => opt.data == setting.shortcutKeyID)
      const modifierOption = modifierOptions.find(opt => opt.data == setting.modifierKeyID)
      const commandOption = commandOptions.find(opt => opt.data == setting.commandID)

      return {
        index: setting.id,
        keyOption,
        modifierOption,
        commandOption,
        setting: setting
      }
    })

    let index = 0
    items.forEach(item => item.index = index++)

    items.sort((a, b) => {

      if (a.commandOption.index != b.commandOption.index) {
        return a.commandOption.index - b.commandOption.index
      }
      else if (a.keyOption.index != b.keyOption.index) {
        return a.keyOption.index - b.keyOption.index
      }
      else {
        return a.modifierOption.index - b.modifierOption.index
      }
    })

    return items
  }

  return (
    <UI_DialogScreenContainer
      overlayContainerRef={overlayContainerRef}
      className='dialog-shortcut-keys-container'
      isVisibleOnInit={false}
      onEscape={dialog_Escaped}
    >
      <div className='header'>
        <button className='app-button-back' onPointerDown={dialog_Escaped}>
          <UI_Icon_MaterialIcon iconName='expandleft'/><span>完了</span>
        </button>
      </div>
      <div className='form'>
        <div className='select'>
          <UI_SelectBox title='コマンド' placeholder='コマンド'
            selectBoxPopoverRef={uiRef.selectBoxPopoverRef}
            options={commandOptions}
            values={selected_commandOptions}
            large={true}
            onChange={(item) => command_Changed(item)}
          />
          <UI_SelectBox title='キー' placeholder='キー'
            selectBoxPopoverRef={uiRef.selectBoxPopoverRef}
            options={keyOptions}
            values={selected_keyOptions}
            large={true}
            onChange={(item) => key_Changed(item)}
          />
          <UI_SelectBox title='修飾キー' placeholder='修飾キー'
            selectBoxPopoverRef={uiRef.selectBoxPopoverRef}
            options={modifierOptions}
            values={selected_modifierOptions}
            large={true}
            onChange={(item) => modifier_Changed(item)}
          />
        </div>
        <div className='commands'>
          <button className={`app-button-cancel${selectedItem == null ? ' disabled' : ''}`}
            onPointerDown={fixItem_Clicked}
          >
            <UI_Icon_MaterialIcon iconName='check'/><span>更新</span>
          </button>
          <button className={`app-button-cancel${selectedItem != null ? ' disabled' : ''}`}
            onPointerDown={addItem_Clicked}
          >
            <UI_Icon_MaterialIcon iconName='add'/><span>追加</span>
          </button>
          <button className={`app-button-cancel${selectedItem == null ? ' disabled' : ''}`}
            onPointerDown={deleteItem_Clicked}
          >
            <UI_Icon_MaterialIcon iconName='remove'/><span>削除</span>
          </button>
          <button className={`app-button-cancel`}
            onPointerDown={cancelItem_Clicked}
          >
            <UI_Icon_MaterialIcon iconName='reset_form'/><span>クリア</span>
          </button>
        </div>
      </div>
      <div className='list'>
        <div className='header-item'>
          <div className='item-inner'>
          <div className='item-column command-text'>コマンド</div>
            <div className='item-column key-text'>キー</div>
            <div className='item-column modifier-text'>修飾キー</div>
          </div>
        </div>
        {
          shortcutKeysItems.map(item => (
            <div key={item.index}
              className={`shortcutkey-item selectable-item${item == selectedItem ? ' selected' : ''}`}
              onPointerDown={() => item_Clicked(item)}
            >
              <div className='selectable-item-inner'>
              <div className='item-column command-text'>{item.commandOption.label}</div>
                <div className='item-column key-text'>{item.keyOption.label}</div>
                <div className='item-column modifier-text'>{item.modifierOption.label}</div>
              </div>
            </div>
          ))
        }
      </div>
    </UI_DialogScreenContainer>
  )
}
