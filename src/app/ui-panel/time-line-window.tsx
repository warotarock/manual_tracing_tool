import * as React from 'react'
import { DocumentContext } from '../context'
import { OnionSkinMode } from '../document-data'
import { int } from '../common-logics'
import { MainCommandButtonID, NumberInputControlID } from '../ui/constants'
import { UI_CommandButtonItem, UI_CommandButtons, UI_CommandButtonsRef, UI_NumberSpinner } from '../ui-common-controls'
import { UI_PopoverContainerAlign, UI_SelectBox, UI_SelectBoxOption, UI_SelectBoxPopoverRef } from '../ui-popover'

export interface UI_TimeLineWindowRef {

  update?: (ctx: DocumentContext) => void
  commandButton_Clicked?: (item: UI_CommandButtonItem) => void
  numberInput_Changed?(id: NumberInputControlID, value: int): void

  selectBoxPopoverRef?: UI_SelectBoxPopoverRef
}

export interface UI_TimeLineWindowParam {

  uiRef: UI_TimeLineWindowRef
}

export function UI_TimeLineWindow({ uiRef }: UI_TimeLineWindowParam) {

  const commandButtonsRef = React.useMemo<UI_CommandButtonsRef>(() => {

    return {
      items: [
        { index: MainCommandButtonID.timeLine_inertKeyframe, icon: 'add', title: 'キーフレームを挿入' },
        { index: MainCommandButtonID.timeLine_deleteKeyframe, icon: 'remove', title: 'キーフレームを削除' },
        { index: MainCommandButtonID.timeLine_moveKeyframe_minus, icon: 'arrowleft', title: 'キーフレームを前に移動' },
        { index: MainCommandButtonID.timeLine_moveKeyframe_plus, icon: 'arrowright', title: 'キーフレームを後に移動' },
      ],

      commandButton_Clicked: (item: UI_CommandButtonItem) => {

        if (uiRef.commandButton_Clicked) {

          uiRef.commandButton_Clicked(item)
        }
      }
    }
  }, [])

  const onionSkinModeOptions = React.useMemo<UI_SelectBoxOption[]>(() => {

    return [
      { index: OnionSkinMode.disabled, label: '非表示', data: 1 },
      { index: OnionSkinMode.showOnTopLayer, label: '前面に表示', data: 2 },
      { index: OnionSkinMode.showOnLowestLayer, label: '背面に表示', data: 3 },
    ]
  }, [])

  const [maxFrame, set_maxFrame] = React.useState(0)
  const [loopStartFrame, set_loopStartFrame] = React.useState(0)
  const [loopEndFrame, set_loopEndFrame] = React.useState(0)
  const [selected_OnionSkinModeOptions, set_selected_OnionSkinModeOptions] = React.useState<UI_SelectBoxOption[]>([])
  const [onionSkinBackwardLevel, set_onionSkinBackwardLevel] = React.useState(0)
  const [onionSkinForwardLevel, set_onionSkinForwardLevel] = React.useState(0)

  React.useEffect(() => {

    uiRef.update = (ctx: DocumentContext) => {

      set_maxFrame(ctx.documentData.animationSettingData.maxFrame)
      set_loopStartFrame(ctx.documentData.animationSettingData.loopStartFrame)
      set_loopEndFrame(ctx.documentData.animationSettingData.loopEndFrame)
      set_selected_OnionSkinModeOptions(onionSkinModeOptions.filter(option => option.data === ctx.documentData.animationSettingData.onionSkinMode))
      set_onionSkinBackwardLevel(ctx.documentData.animationSettingData.onionSkinBackwardLevel)
      set_onionSkinForwardLevel(ctx.documentData.animationSettingData.onionSkinForwardLevel)
    }

    return function cleanup() {

      uiRef.update = null
    }
  }, [])

  function spinnerButton_Clicked(index: int) {

    uiRef.commandButton_Clicked({ index })
  }

  function onionSkinModeOptions_Changed(item: UI_SelectBoxOption | null) {

    if (uiRef.numberInput_Changed && item) {

      uiRef.numberInput_Changed(NumberInputControlID.onionSkinMode, item.data)
    }
  }

  return (
    <div className='command-buttons'>
      <UI_CommandButtons uiRef={commandButtonsRef} />
      <div className='command-button-group'>
        <UI_NumberSpinner title='最大フレーム'
          value={maxFrame}
          buttonIndexs={[
            MainCommandButtonID.timeLine_changeMaxFrame_minus, MainCommandButtonID.timeLine_changeMaxFrame_plus]}
          onClick={spinnerButton_Clicked}
        />
        <UI_NumberSpinner title='ループ開始フレーム'
          value={loopStartFrame}
          buttonIndexs={[
            MainCommandButtonID.timeLine_changeLoopStartFrame_minus, MainCommandButtonID.timeLine_changeLoopStartFrame_plus]}
          onClick={spinnerButton_Clicked}
        />
        <UI_NumberSpinner title='ループ終了フレーム'
          value={loopEndFrame}
          buttonIndexs={[
            MainCommandButtonID.timeLine_changeLoopEndFrame_minus, MainCommandButtonID.timeLine_changeLoopEndFrame_plus]}
          onClick={spinnerButton_Clicked}
        />
      </div>
      <div className='command-button-group'>
        <UI_SelectBox title='オニオンスキン'
          selectBoxPopoverRef={uiRef.selectBoxPopoverRef}
          popoberAlign={UI_PopoverContainerAlign.top}
          options={onionSkinModeOptions}
          values={selected_OnionSkinModeOptions}
          onChange={onionSkinModeOptions_Changed}
        />
        <UI_NumberSpinner title='オニオンスキン表示レベル（前）'
          value={onionSkinBackwardLevel}
          buttonIndexs={[
            MainCommandButtonID.timeLine_changeOnionSkinBackwardLevel_minus, MainCommandButtonID.timeLine_changeOnionSkinBackwardLevel_plus]}
          onClick={spinnerButton_Clicked}
        />
        <UI_NumberSpinner title='オニオンスキン表示レベル（後）'
          value={onionSkinForwardLevel}
          buttonIndexs={[
            MainCommandButtonID.timeLine_changeOnionSkinForwardLevel_minus, MainCommandButtonID.timeLine_changeOnionSkinForwardLevel_plus]}
          onClick={spinnerButton_Clicked}
        />
      </div>
    </div>
  )
}
