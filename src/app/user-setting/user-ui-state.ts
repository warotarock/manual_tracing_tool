import { LocalSetting,  UIState, UIStateNames } from './local-setting'
import { UserSettingFileLogic } from './user-setting-file'

export class UserUIStateLogic {

  private settingFile: UserSettingFileLogic | null = null

  link(settingFile: UserSettingFileLogic) {

    this.settingFile = settingFile
  }

  static createDefaultUIStates(): UIState[] {

    return [
      { name: UIStateNames.touchOperationPanel, visible: true },
      { name: UIStateNames.layerWindow, visible: true },
      { name: UIStateNames.paletteSelectorWindow, visible: false },
      { name: UIStateNames.colorMixerWindow, visible: false },
      { name: UIStateNames.timeLineWindow, visible: false },
    ]
  }

  fixLoadedUIStates(localSetting: LocalSetting) {

    const defaultStates = UserUIStateLogic.createDefaultUIStates()

    if (localSetting.uiStates == undefined) {

      localSetting.uiStates = []
    }

    for (const defaultState of defaultStates) {

      if (localSetting.uiStates.findIndex(state => state.name == defaultState.name) == -1) {

        localSetting.uiStates.push(defaultState)
      }
    }
  }

  getUIState(uiStateName: string): UIState | null {

    const uiState = this.settingFile.localSetting.uiStates.find(state => state.name == uiStateName)

    return uiState ?? null
  }
}
