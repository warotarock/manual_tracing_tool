import { ShortcutKeyLogic, UserSettingFileLogic, UserUIStateLogic } from './user-setting'

export class App_UserSetting {

  settingFile = new UserSettingFileLogic()
  userUIState = new UserUIStateLogic()
  shortcutKey = new ShortcutKeyLogic()

  link() {

    this.settingFile.link(this.userUIState, this.shortcutKey)
    this.userUIState.link(this.settingFile)
  }

  loadSettings() {

    this.shortcutKey.initializeDefaultSettings()

    this.settingFile.loadSettings()
  }

  saveSettings() {

    this.settingFile.saveSettings()
  }
}
