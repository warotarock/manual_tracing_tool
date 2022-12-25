import { int } from "../common-logics"

export class LocalSetting {

  currentDirectoryPath: string = null
  referenceDirectoryPath: string = ''
  autoNumberingEnabled = false
  exportPath: string = null
  lastUsedFilePaths: string[] = []
  maxLastUsedFilePaths = 5
  fileSections: LocalSettingFileSection[] = []
  uiStates: UIState[] = []
  shortcutKeySettings: ShortcutKeySetting[] = []
}

export class LocalSettingFileSection {

  index = 0
  name = ''
  path = ''
}

export class UIState {

  name: string = ''
  visible = true
}

export class UIStateNames {

  static readonly touchOperationPanel = 'touchOperationPanel'
  static readonly layerWindow = 'layerWindow'
  static readonly paletteSelectorWindow = 'paletteSelectorWindow'
  static readonly colorMixerWindow = 'colorMixerWindow'
  static readonly timeLineWindow = 'timeLineWindow'
}

export class ShortcutKeySetting {

  id: int = 0
  shortcutKeyID: int = 0
  modifierKeyID: int = 0
  commandID: int = 0
}
