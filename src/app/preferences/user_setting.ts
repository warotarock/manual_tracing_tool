import { Lists } from '../logics/conversion'
import { UserStorage } from '../../platform/user_strage'
import { LocalSetting, LocalSettingFileSection } from './local_setting'

export class UserSettingLogic {

  localSetting = new LocalSetting()

  static readonly localStorage_ActiveSettingNameKey = 'activeSettingName'
  static readonly localStorage_DefaultDocumentDataKey = 'Manual tracing tool save data'

  loadSettings() {

    const activeSettingName = UserStorage.getItem<string>(UserSettingLogic.localStorage_ActiveSettingNameKey)
    const localSetting: LocalSetting = UserStorage.getItem(activeSettingName)

    if (localSetting) {

      this.localSetting = localSetting

      // @migration
      if (this.localSetting.fileSections == undefined) {

        this.localSetting.fileSections = []
      }
    }
  }

  saveSettings() {

    const activeSettingName = UserStorage.getItem<string>(UserSettingLogic.localStorage_ActiveSettingNameKey)

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

    this.saveSettings()
  }

  private setFileSections(new_FileSections: LocalSettingFileSection[]) {

    let index = 0
    new_FileSections.forEach(item => item.index = index++)

    this.localSetting.fileSections = new_FileSections
  }
}
