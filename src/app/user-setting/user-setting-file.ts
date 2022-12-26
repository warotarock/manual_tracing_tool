import { Platform } from '../../platform'
import { UserStorage } from '../../platform/user-strage'
import { Lists } from '../common-logics'
import { LocalSetting, LocalSettingFileSection } from './local-setting'
import { ShortcutKeyLogic } from './shortcut-key'
import { UserUIStateLogic } from './user-ui-state'

export class UserSettingFileLogic {

  localSetting = new LocalSetting()

  static readonly localStorage_ActiveSettingNameKey = 'activeSettingName'
  static readonly localStorage_DefaultDocumentDataKey = 'Manual tracing tool save data'

  private uiState: UserUIStateLogic | null = null
  private shortcutKey: ShortcutKeyLogic | null = null

  link (uiState: UserUIStateLogic, shortcutKey: ShortcutKeyLogic) {

    this.uiState = uiState
    this.shortcutKey = shortcutKey
  }

  loadSettings() {

    const activeSettingName = UserStorage.getItem<string>(UserSettingFileLogic.localStorage_ActiveSettingNameKey)
    const localSetting: LocalSetting = UserStorage.getItem(activeSettingName)

    if (!localSetting) {
      return
    }

    this.uiState.fixLoadedUIStates(localSetting)

    // @migration
    if (!localSetting.fileSections) {

      localSetting.fileSections = []
    }

    if (!localSetting.shortcutKeySettings) {

      localSetting.shortcutKeySettings = this.shortcutKey.createDefaultShortcutKeySettings()
    }

    if (!localSetting.autoNumberingEnabled) {

      localSetting.autoNumberingEnabled = false
    }

    // TODO: デバッグ用。削除する
    // localSetting.shortcutKeySettings = shortcutKey.createDefaultShortcutKeySettings()

    this.localSetting = localSetting

    this.shortcutKey.shortcutKeySettings = localSetting.shortcutKeySettings
  }

  saveSettings() {

    this.localSetting.shortcutKeySettings = this.shortcutKey.shortcutKeySettings

    const activeSettingName = UserStorage.getItem<string>(UserSettingFileLogic.localStorage_ActiveSettingNameKey)

    UserStorage.setItem(activeSettingName, this.localSetting)
  }

  getOpenFileEnvironments() {

    return {
      fileSections: this.localSetting.fileSections,
      lastUsedFilePaths: this.localSetting.lastUsedFilePaths
    }
  }

  addFileSection(fileSection: LocalSettingFileSection) {

    const new_FileSections = this.localSetting.fileSections
      .filter(section => section.path != fileSection.path)

    new_FileSections.push(fileSection)

    this.setFileSections(new_FileSections)

    this.saveSettings()
  }

  removeFileSection(fileSection: LocalSettingFileSection) {

    const new_FileSections = this.localSetting.fileSections
      .filter(section => section != fileSection)

    this.setFileSections(new_FileSections)

    this.saveSettings()
  }

  registerLastUsedFile(filePath: string) {

    const fileName = Platform.path.getFileName(filePath)

    let paths = this.localSetting.lastUsedFilePaths

    for (let index = 0; index < paths.length; index++) {

        if (paths[index] == filePath) {

          Lists.removeAt(paths, index)
        }
    }

    Lists.insertAt(paths, 0, filePath)

    if (paths.length > this.localSetting.maxLastUsedFilePaths) {

        paths = Lists.getRange(paths, 0, this.localSetting.maxLastUsedFilePaths)
    }

    this.localSetting.lastUsedFilePaths = paths

    // TODO: ファイルパスの書式の検証
    this.localSetting.currentDirectoryPath = Platform.path.getDirectoryPath(filePath)

    this.saveSettings()
  }

  private setFileSections(new_FileSections: LocalSettingFileSection[]) {

    let index = 0
    new_FileSections.forEach(item => item.index = index++)

    this.localSetting.fileSections = new_FileSections
  }
}
