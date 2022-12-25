import { int } from '../common-logics'
import { ShortcutKeySetting } from './local-setting'

export type ShortcutKeyName =
  '1' |
  '2' |
  '3' |
  '4' |
  '5' |
  '6' |
  '7' |
  '8' |
  '9' |
  '0' |
  'A' |
  'B' |
  'C' |
  'D' |
  'E' |
  'F' |
  'G' |
  'H' |
  'I' |
  'J' |
  'K' |
  'L' |
  'M' |
  'N' |
  'O' |
  'P' |
  'Q' |
  'R' |
  'S' |
  'T' |
  'U' |
  'V' |
  'W' |
  'X' |
  'Y' |
  'Z' |
  '-' |
  '^' |
  '|' |
  '@' |
  '[' |
  ']' |
  ';' |
  ':' |
  ',' |
  '.' |
  '/' |
  '\\' |
  'Up' |
  'Right' |
  'Down' |
  'Left' |
  'Space' |
  'Delete' |
  'BackSpace' |
  'Enter' |
  'Escape' |
  'Tab' |
  'Home'

export type ModifierKeyName =
  '' |
  'Ctrl' |
  'Alt' |
  'Shift'

export enum ShortcutCommandID {

  none = 0,

  setting_shortcutKey = 101,

  document_new        = 201,
  document_save       = 202,
  document_saveAs     = 203,
  document_open       = 204,
  document_export     = 205,

  view_pan            = 301,
  view_zoomIn         = 302,
  view_zoomOut        = 303,
  view_rotateCW       = 304,
  view_rotateCCW      = 305,
  view_mirrorX        = 306,
  view_mirrorY        = 307,
  view_reset          = 308,
  view_toggleHome     = 309,
  view_toggleLayerPanel   = 310,
  view_togglePalletePanel = 311,
  view_toggleMixerPanel   = 312,

  edit_undo           = 401,
  edit_redo           = 402,
  edit_copy           = 403,
  edit_cut            = 404,
  edit_paste          = 405,
  edit_delete         = 406,
  edit_fix            = 407,
  edit_selectAll      = 409,
  edit_cancel         = 408,
  edit_unselectAll    = 410,
  edit_grabMove       = 411,
  edit_rotate         = 412,
  edit_scale          = 413,
  edit_setPibot       = 414,

  tool_subTool1 = 501,
  tool_subTool2 = 502,
  tool_subTool3 = 503,
  tool_subTool4 = 504,
  tool_subTool5 = 505,
  tool_subTool6 = 506,
  tool_subTool7 = 507,
  tool_subTool8 = 508,
  tool_subTool9 = 509,
  tool_subTool0 = 510,
  tool_toggleMainEdit  = 511,
  tool_togglePenEraser = 512,

  layer_newLayer      = 601,
  layer_pickLayer     = 602,
  layer_previousLayer = 603,
  layer_nextLayer     = 604,

  timeline_previousKeyframe = 701,
  timeline_nextKeyframe     = 702,
}

export interface ShortcutKey {

  shortcutKeyID: int
  keyName: ShortcutKeyName
  keyString: string
  lineNumber: int
}

export interface ModifierKey {

  modifierKeyID: int
  keyName: ModifierKeyName
  lineNumber: int
}

export enum ShortcutCategoryID {

  menu = 1,
  view = 2,
  tool = 3,
  edit = 4,
  layer = 5,
  timeline = 6,
}

export interface ShortcutCategory {

  categoryID: ShortcutCategoryID
  categoryName: string
  lineNumber: int
}

export interface ShortcutCommand {

  commandID: int
  commandName: string
  categoryID: int
  lineNumber: int

  category: ShortcutCategory
}

export class ShortcutKeyLogic {

  shortcutKeys: ShortcutKey[] = []
  modifierKeys: ModifierKey[] = []
  shortcutCategorys: ShortcutCategory[] = []
  shortcutCommands: ShortcutCommand[] = []
  shortcutKeySettings: ShortcutKeySetting[] = []

  private cache_key: string = ''
  private cache_shiftKey = false
  private cacche_ctrlKey = false
  private cache_altKey = false
  private cached_shortcutKeySettings: ShortcutKeySetting[] = []

  initializeDefaultSettings() {

    const keys = this.createDefaultShortcutKeys()
    const commands = this.createDefaultShortcutCommands()
    this.shortcutKeys = keys.shortcutKeys
    this.modifierKeys = keys.modifierKeys
    this.shortcutCategorys = commands.shortcutCategorys
    this.shortcutCommands = commands.shortcutCommands

    this.shortcutKeySettings = this.createDefaultShortcutKeySettings()
  }

  createDefaultShortcutKeys(): { shortcutKeys: ShortcutKey[], modifierKeys: ModifierKey[] } {

    const shortcutKeys: ShortcutKey[] = [
        { shortcutKeyID: 1, keyName: '1', keyString: '1', lineNumber: 0 },
        { shortcutKeyID: 2, keyName: '2', keyString: '2', lineNumber: 0 },
        { shortcutKeyID: 3, keyName: '3', keyString: '3', lineNumber: 0 },
        { shortcutKeyID: 4, keyName: '4', keyString: '4', lineNumber: 0 },
        { shortcutKeyID: 5, keyName: '5', keyString: '5', lineNumber: 0 },
        { shortcutKeyID: 6, keyName: '6', keyString: '6', lineNumber: 0 },
        { shortcutKeyID: 7, keyName: '7', keyString: '7', lineNumber: 0 },
        { shortcutKeyID: 8, keyName: '8', keyString: '8', lineNumber: 0 },
        { shortcutKeyID: 9, keyName: '9', keyString: '9', lineNumber: 0 },
        { shortcutKeyID: 10, keyName: '0', keyString: '0', lineNumber: 0 },
        { shortcutKeyID: 11, keyName: 'A', keyString: 'A', lineNumber: 0 },
        { shortcutKeyID: 12, keyName: 'B', keyString: 'B', lineNumber: 0 },
        { shortcutKeyID: 13, keyName: 'C', keyString: 'C', lineNumber: 0 },
        { shortcutKeyID: 14, keyName: 'D', keyString: 'D', lineNumber: 0 },
        { shortcutKeyID: 15, keyName: 'E', keyString: 'E', lineNumber: 0 },
        { shortcutKeyID: 16, keyName: 'F', keyString: 'F', lineNumber: 0 },
        { shortcutKeyID: 17, keyName: 'G', keyString: 'G', lineNumber: 0 },
        { shortcutKeyID: 18, keyName: 'H', keyString: 'H', lineNumber: 0 },
        { shortcutKeyID: 19, keyName: 'I', keyString: 'I', lineNumber: 0 },
        { shortcutKeyID: 20, keyName: 'J', keyString: 'J', lineNumber: 0 },
        { shortcutKeyID: 21, keyName: 'K', keyString: 'K', lineNumber: 0 },
        { shortcutKeyID: 22, keyName: 'L', keyString: 'L', lineNumber: 0 },
        { shortcutKeyID: 23, keyName: 'M', keyString: 'M', lineNumber: 0 },
        { shortcutKeyID: 24, keyName: 'N', keyString: 'N', lineNumber: 0 },
        { shortcutKeyID: 25, keyName: 'O', keyString: 'O', lineNumber: 0 },
        { shortcutKeyID: 26, keyName: 'P', keyString: 'P', lineNumber: 0 },
        { shortcutKeyID: 27, keyName: 'Q', keyString: 'Q', lineNumber: 0 },
        { shortcutKeyID: 28, keyName: 'R', keyString: 'R', lineNumber: 0 },
        { shortcutKeyID: 29, keyName: 'S', keyString: 'S', lineNumber: 0 },
        { shortcutKeyID: 30, keyName: 'T', keyString: 'T', lineNumber: 0 },
        { shortcutKeyID: 31, keyName: 'U', keyString: 'U', lineNumber: 0 },
        { shortcutKeyID: 32, keyName: 'V', keyString: 'V', lineNumber: 0 },
        { shortcutKeyID: 33, keyName: 'W', keyString: 'W', lineNumber: 0 },
        { shortcutKeyID: 34, keyName: 'X', keyString: 'X', lineNumber: 0 },
        { shortcutKeyID: 35, keyName: 'Y', keyString: 'Y', lineNumber: 0 },
        { shortcutKeyID: 36, keyName: 'Z', keyString: 'Z', lineNumber: 0 },
        { shortcutKeyID: 37, keyName: '-', keyString: '-', lineNumber: 0 },
        { shortcutKeyID: 38, keyName: '^', keyString: '^', lineNumber: 0 },
        { shortcutKeyID: 39, keyName: '|', keyString: '|', lineNumber: 0 },
        { shortcutKeyID: 40, keyName: '@', keyString: '@', lineNumber: 0 },
        { shortcutKeyID: 41, keyName: '[', keyString: '[', lineNumber: 0 },
        { shortcutKeyID: 42, keyName: ']', keyString: ']', lineNumber: 0 },
        { shortcutKeyID: 43, keyName: ';', keyString: ';', lineNumber: 0 },
        { shortcutKeyID: 44, keyName: ':', keyString: ':', lineNumber: 0 },
        { shortcutKeyID: 45, keyName: ',', keyString: ',', lineNumber: 0 },
        { shortcutKeyID: 46, keyName: '.', keyString: '.', lineNumber: 0 },
        { shortcutKeyID: 47, keyName: '/', keyString: '/', lineNumber: 0 },
        { shortcutKeyID: 48, keyName: '\\', keyString: '\\', lineNumber: 0 },
        { shortcutKeyID: 49, keyName: 'Up', keyString: 'ArrowUp', lineNumber: 0 },
        { shortcutKeyID: 50, keyName: 'Right', keyString: 'ArrowRight', lineNumber: 0 },
        { shortcutKeyID: 51, keyName: 'Down', keyString: 'ArrowDown', lineNumber: 0 },
        { shortcutKeyID: 52, keyName: 'Left', keyString: 'ArrowLeft', lineNumber: 0 },
        { shortcutKeyID: 53, keyName: 'Space', keyString: ' ', lineNumber: 0 },
        { shortcutKeyID: 54, keyName: 'Delete', keyString: 'Delete', lineNumber: 0 },
        { shortcutKeyID: 55, keyName: 'BackSpace', keyString: 'BackSpace', lineNumber: 0 },
        { shortcutKeyID: 56, keyName: 'Enter', keyString: 'Enter', lineNumber: 0 },
        { shortcutKeyID: 57, keyName: 'Escape', keyString: 'Escape', lineNumber: 0 },
        { shortcutKeyID: 58, keyName: 'Tab', keyString: 'Tab', lineNumber: 0 },
        { shortcutKeyID: 59, keyName: 'Home', keyString: 'Home', lineNumber: 0 },
      ]

    {
      let lineNumber = 1
      shortcutKeys.forEach(item => item.lineNumber = lineNumber++)
    }

    const modifierKeys: ModifierKey[] = [
      { modifierKeyID: 1, keyName: '', lineNumber: 0 },
      { modifierKeyID: 2, keyName: 'Ctrl', lineNumber: 0 },
      { modifierKeyID: 3, keyName: 'Shift', lineNumber: 0 },
      { modifierKeyID: 4, keyName: 'Alt', lineNumber: 0 },
    ]

    {
      let lineNumber = 1
      modifierKeys.forEach(item => item.lineNumber = lineNumber++)
    }

    return {
      shortcutKeys,
      modifierKeys
    }
  }

  createDefaultShortcutCommands(): { shortcutCategorys: ShortcutCategory[], shortcutCommands: ShortcutCommand[] } {

    const shortcutCategorys: ShortcutCategory[] = [
      { categoryID: ShortcutCategoryID.menu, categoryName: 'メニュー', lineNumber: 0 },
      { categoryID: ShortcutCategoryID.view, categoryName: '表示', lineNumber: 0 },
      { categoryID: ShortcutCategoryID.tool, categoryName: 'ツール', lineNumber: 0 },
      { categoryID: ShortcutCategoryID.edit, categoryName: '編集', lineNumber: 0 },
      { categoryID: ShortcutCategoryID.layer, categoryName: 'レイヤー', lineNumber: 0 },
      { categoryID: ShortcutCategoryID.timeline, categoryName: 'ライムライン', lineNumber: 0 },
    ]

    {
      let lineNumber = 1
      shortcutCategorys.forEach(item => item.lineNumber = lineNumber++)
    }

    const shortcutCommands: ShortcutCommand[] = []

    // メニュー
    let categoryID = ShortcutCategoryID.menu
    this.addCommand(shortcutCommands, ShortcutCommandID.document_new, '新規作成', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.document_save, '保存', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.document_saveAs, '名前をつけて保存', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.document_open, '開く', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.document_export, 'エクスポート', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.setting_shortcutKey, 'キーボード設定', categoryID)
    // 表示
    categoryID = ShortcutCategoryID.view
    this.addCommand(shortcutCommands, ShortcutCommandID.view_pan, 'ビューを移動', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_zoomIn, 'ビューを拡大', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_zoomOut, 'ビューを縮小', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_rotateCW, 'ビューを右に回転', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_rotateCCW, 'ビューを左に回転', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_mirrorX, '左右反転', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_reset, 'ビューをリセット', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_toggleHome, 'ビューの位置を戻す', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_toggleLayerPanel, 'レイヤーパネルの表示', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_togglePalletePanel, 'パレットパネルの表示', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.view_toggleMixerPanel, 'カラーミキサーパネルの表示', categoryID)
    // 編集
    categoryID = ShortcutCategoryID.edit
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_undo, 'もとに戻す', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_redo, 'やりなおす', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_copy, 'コピー', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_cut, '切り取り', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_paste, '貼り付け', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_delete, '削除', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_fix, '確定', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_cancel, 'キャンセル', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_selectAll, '全て選択', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_unselectAll, '選択解除', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_grabMove, '移動', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_rotate, '回転', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_scale, '拡大/縮小', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.edit_setPibot, 'ピボットの指定', categoryID)
    // ツール
    categoryID = ShortcutCategoryID.tool
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool1, 'サブツール１', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool2, 'サブツール２', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool3, 'サブツール３', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool4, 'サブツール４', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool5, 'サブツール５', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool6, 'サブツール６', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool7, 'サブツール７', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool8, 'サブツール８', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool9, 'サブツール９', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_subTool0, 'サブツール０', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_toggleMainEdit, 'メイン/編集', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.tool_togglePenEraser, 'ペン/消しゴム', categoryID)
    // レイヤー
    categoryID = ShortcutCategoryID.layer
    this.addCommand(shortcutCommands, ShortcutCommandID.layer_newLayer, 'レイヤーを作成', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.layer_pickLayer, 'レイヤーの選択', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.layer_previousLayer, '上のレイヤーを選択', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.layer_nextLayer, '下のレイヤーを選択', categoryID)
    // ライムライン
    categoryID = ShortcutCategoryID.timeline
    this.addCommand(shortcutCommands, ShortcutCommandID.timeline_previousKeyframe, '前のキーフレーム', categoryID)
    this.addCommand(shortcutCommands, ShortcutCommandID.timeline_nextKeyframe, '次のキーフレーム', categoryID)

    let lineNumber = 1
    for (const command of shortcutCommands){

      command.lineNumber = lineNumber++
      command.category = shortcutCategorys.find(category => category.categoryID == command.categoryID) ?? null
    }

    return {
      shortcutCategorys,
      shortcutCommands
    }
  }

  createDefaultShortcutKeySettings(): ShortcutKeySetting[] {

    const tempSettings: { commandID: ShortcutCommandID, key: ShortcutKeyName, modifier: ModifierKeyName  }[] = []

    tempSettings.push({ commandID: ShortcutCommandID.document_new, key: 'N', modifier: 'Ctrl' })
    tempSettings.push({ commandID: ShortcutCommandID.document_save, key: 'S', modifier: 'Ctrl' })
    tempSettings.push({ commandID: ShortcutCommandID.view_pan, key: 'Space', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.view_zoomIn, key: 'F', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.view_zoomOut, key: 'D', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.view_rotateCW, key: 'R', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.view_rotateCCW, key: 'T', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.view_mirrorX, key: 'M', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.view_toggleHome, key: 'Q', modifier: 'Shift' })
    tempSettings.push({ commandID: ShortcutCommandID.view_toggleHome, key: 'Q', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.view_toggleHome, key: 'Home', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_undo, key: 'Z', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_undo, key: 'Z', modifier: 'Ctrl' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_redo, key: 'Y', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_redo, key: 'Y', modifier: 'Ctrl' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_copy, key: 'C', modifier: 'Ctrl' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_cut, key: 'X', modifier: 'Ctrl' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_paste, key: 'V', modifier: 'Ctrl' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_delete, key: 'Delete', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_delete, key: 'X', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_fix, key: 'Enter', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_cancel, key: 'Escape', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_selectAll, key: 'A', modifier: 'Ctrl' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_unselectAll, key: 'A', modifier: 'Alt' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_grabMove, key: 'G', modifier: 'Shift' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_rotate, key: 'R', modifier: 'Shift' })
    tempSettings.push({ commandID: ShortcutCommandID.edit_scale, key: 'S', modifier: 'Shift' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool1, key: '1', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool2, key: '2', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool3, key: '3', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool4, key: '4', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool5, key: '5', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool6, key: '6', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool7, key: '7', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool8, key: '8', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool9, key: '9', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_subTool0, key: '0', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_toggleMainEdit, key: 'Tab', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.tool_togglePenEraser, key: 'E', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.layer_pickLayer, key: 'W', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.layer_previousLayer, key: 'A', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.layer_nextLayer, key: 'S', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.timeline_previousKeyframe, key: 'C', modifier: '' })
    tempSettings.push({ commandID: ShortcutCommandID.timeline_nextKeyframe, key: 'V', modifier: '' })

    const settings: ShortcutKeySetting[] = []

    let tempID = 1
    for (const tempSetting of tempSettings) {

      const shortcutKey = this.shortcutKeys.find(k => k.keyName == tempSetting.key)

      if (!shortcutKey) {
        throw new Error('ERROR-0000: Invalid key for default shortcut key')
      }

      const modifierKey = this.modifierKeys.find(k => k.keyName == tempSetting.modifier)

      if (!modifierKey) {
        throw new Error('ERROR-0000: Invalid modifier for default shortcut key')
      }

      const command = this.shortcutCommands.find(com => com.commandID == tempSetting.commandID)

      if (!command) {
        throw new Error('ERROR-0000: Invalid command for default shortcut key')
      }

      settings.push({
        id: tempID,
        commandID: tempSetting.commandID,
        shortcutKeyID: shortcutKey.shortcutKeyID,
        modifierKeyID: modifierKey.modifierKeyID,
      })

      tempID++
    }

    return settings
  }

  private addCommand(target: ShortcutCommand[], commandID: ShortcutCommandID, commandName: string, categoryID: ShortcutCategoryID) {

    target.push({ commandID, commandName, categoryID, lineNumber: 0, category: null })
  }

  addShortcutKeySetting(setting: ShortcutKeySetting) {

    this.shortcutKeySettings.sort((a, b) => a.id - b.id)

    const new_id = this.shortcutKeySettings.reduce((previous, current) => {
      if (previous == current.id) {
        return current.id + 1
      }
      else {
        return previous
      }
    }, 1 )

    setting.id = new_id

    this.shortcutKeySettings.push(setting)
  }

  removeShortcutKeySetting(setting: ShortcutKeySetting) {

    this.shortcutKeySettings = this.shortcutKeySettings.filter(skt => skt != setting)
  }

  getCommandIDFromKeyInput(key: string, shiftKey: boolean, ctrlKey: boolean, altKey: boolean): ShortcutCommandID {

    let shortcutKeySettings: ShortcutKeySetting[]

    if (key == this.cache_key
      && shiftKey == this.cache_shiftKey
      && ctrlKey == this.cacche_ctrlKey
      && altKey == this.cache_altKey
    ) {

      shortcutKeySettings = this.cached_shortcutKeySettings
    }
    else {

      const upperCase_key = key.length == 1 ? key.toUpperCase() : key

      const shortcutKey = this.shortcutKeys.find(sk => sk.keyString == upperCase_key)

      const modifierKeyName = this.getModifierKeyNameFromKeyState(shiftKey, ctrlKey, altKey)

      const modifierKey = this.modifierKeys.find(mk => mk.keyName == modifierKeyName)

      if (shortcutKey && modifierKey) {

        shortcutKeySettings = this.shortcutKeySettings.filter(setting =>
          setting.shortcutKeyID == shortcutKey.shortcutKeyID
          && setting.modifierKeyID == modifierKey.modifierKeyID
        )
      }
      else {

        shortcutKeySettings = []
      }
    }

    this.cached_shortcutKeySettings = shortcutKeySettings

    if (shortcutKeySettings.length > 0) {

      return shortcutKeySettings[0].commandID
    }
    else {

      return ShortcutCommandID.none
    }
  }

  private getModifierKeyNameFromKeyState(shiftKey: boolean, ctrlKey: boolean, altKey: boolean): ModifierKeyName {

    if (shiftKey) {

      return 'Shift'
    }
    else if (ctrlKey) {

      return 'Ctrl'
    }
    else if (altKey) {

      return 'Alt'
    }
    else {

      return ''
    }
  }
}
