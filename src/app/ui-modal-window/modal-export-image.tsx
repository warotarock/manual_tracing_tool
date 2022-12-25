import * as React from 'react'
import { Platform } from '../../platform'
import { float, int, Strings } from '../common-logics'
import { DocumentContext } from '../context'
import { DocumentBackGroundTypeID, ImageFileTypeID } from '../document-data'
import { DocumentFileNameLogic } from '../document-logic'
import { ModalWindowRef } from '../ui'
import { UI_CheckBox, UI_NumberInput } from '../ui-common-controls'
import { UI_RibbonUI_InputLabel, UI_RibbonUI_TextInput, UI_RibbonUI_ToggleButton, UI_RibbonUI_ToggleButtonGroup } from '../ui-ribbon'
import { RibbonUIControlID } from '../ui/constants'
import { LocalSetting } from '../user-setting'
import { UI_ModalWindowContainer, UI_ModalWindowContainerRef } from './modal-window-container'

export interface UI_Modal_ExportImageRef extends ModalWindowRef {

  show?(docContext: DocumentContext, localSetting: LocalSetting): void
  hide?(): void
  onClose?(param: ExportImageFileParam)
}

export interface UI_Modal_ExportImageParam {

  uiRef: UI_Modal_ExportImageRef
}

export interface ExportImageFileParam {

  fileName: string
  exportDirectory: string
  scale: float
  imageFileType: ImageFileTypeID
  backGroundType: DocumentBackGroundTypeID
  autoNumberingEnabled: boolean
  exportingCount: int
}

export function UI_Modal_ExportImage({ uiRef }: UI_Modal_ExportImageParam) {

  const modalWindowContainerRef = React.useMemo<UI_ModalWindowContainerRef>(() => ({}), [])

  const [exportFileName, set_exportFileName] = React.useState('')
  const [exportDirectory, set_exportDirectory] = React.useState('')
  const [autoNumberingEnabled, set_autoNumberingEnabled] = React.useState(false)
  const [exportingCount, set_exportingCount] = React.useState(0)
  const [imageFileType, set_imageFileType] = React.useState(ImageFileTypeID.png)
  const [backGroundType, set_backGroundType] = React.useState(DocumentBackGroundTypeID.lastPaletteColor)
  const [exportScale, set_exportScale] = React.useState<float | null>(null)

  const docContextRef = React.useRef<DocumentContext>(null)
  const lastExportFileNameRef = React.useRef('')

  const available = React.useMemo<boolean>(() => {

    return (!Strings.isNullOrEmpty(exportFileName) && !Strings.isNullOrEmpty(exportDirectory))

  }, [exportFileName, exportDirectory])

  React.useEffect(() => {

    uiRef.show = (docContext, localSetting) => {

      docContextRef.current = docContext

      if (Strings.isNullOrEmpty(docContext.documentData.exportImageSetting.fileName)) {

        const exportFileName = DocumentFileNameLogic.getExportFileName(docContext.documentFilePath, false, 0)
        set_exportFileName(exportFileName)
      }
      else {

        set_exportFileName(docContext.documentData.exportImageSetting.fileName)
      }

      if (Strings.isNullOrEmpty(docContext.documentData.exportImageSetting.exportDirectory)
        && !Strings.isNullOrEmpty(docContext.documentFilePath)) {

        const exportDirectory = Platform.path.getDirectoryPath(docContext.documentFilePath)
        set_exportDirectory(exportDirectory)
      }
      else {

        set_exportDirectory(docContext.documentData.exportImageSetting.exportDirectory)
      }

      set_imageFileType(docContext.documentData.exportImageSetting.imageFileType)
      set_backGroundType(docContext.documentData.exportImageSetting.backGroundType)
      set_exportScale(docContext.documentData.exportImageSetting.scale)
      set_exportScale(docContext.documentData.exportImageSetting.scale)
      set_autoNumberingEnabled(docContext.documentData.exportImageSetting.autoNumberingEnabled)
      set_exportingCount(docContext.documentData.exportImageSetting.exportingCount)

      modalWindowContainerRef.show(uiRef)
    }

    uiRef.hide = () => {

      modalWindowContainerRef.hide(uiRef)
    }

    return function cleanup() {

      uiRef.show = null
      uiRef.hide = null
    }
  }, [])

  function ok_Clicked() {

    if (!available) {
      return
    }

    lastExportFileNameRef.current = exportFileName

    uiRef.hide()

    if (uiRef.onClose) {

      const fileName = DocumentFileNameLogic.getExportFileName(exportFileName, autoNumberingEnabled, exportingCount)

      uiRef.onClose(
        {
          fileName: fileName,
          exportDirectory: exportDirectory,
          imageFileType: imageFileType,
          backGroundType: backGroundType,
          scale: (exportScale ?? 1.0),
          autoNumberingEnabled,
          exportingCount: exportingCount
        }
      )
    }
  }

  function cancel_Clicked() {

    uiRef.hide()
  }

  function modal_Escaped() {

    uiRef.hide()
  }

  return (
    <UI_ModalWindowContainer
      modalWindowTitle='イメージのエクスポート'
      uiRef={modalWindowContainerRef}
      onEscape={modal_Escaped}
    >
      <div className='modal-export-image'>
        <div className='section-item'>
          <div className='label'>ファイル名（拡張子を除く）</div>
          <UI_RibbonUI_TextInput value={exportFileName}
            onChange={(value) => {
              set_exportFileName(value)
            }}
          />
        </div>
        <div className='section-item auto-nmber-subsection'>
          <div className='checkbox'
            onPointerDown={() =>
              set_autoNumberingEnabled(!autoNumberingEnabled)
            }
          >
            <UI_CheckBox value={autoNumberingEnabled} />
            <UI_RibbonUI_InputLabel label={'連番を付加'} />
          </div>
          <UI_NumberInput value={exportingCount} digit={0} step={1} min={0} max={999}
            onChange={(value) => {
              set_exportingCount(value)
            }}
          />
        </div>
        <div className='section-item'>
          <div className='label'>エクスポート先</div>
          <UI_RibbonUI_TextInput value={exportDirectory}
            onChange={(value) => {
              set_exportDirectory(value)
            }}
          />
        </div>
        <div className='section-spacer'></div>
        <div className='section-item'>
          <div className='label'>画像形式</div>
          <UI_RibbonUI_ToggleButtonGroup id={RibbonUIControlID.vectorLayer_drawLineType} currentValue={imageFileType} large={true}
            onClick={ (id, value) =>
              set_imageFileType(value)
            }
          >
            <UI_RibbonUI_ToggleButton label="png" value={ImageFileTypeID.png} />
            <UI_RibbonUI_ToggleButton label="jpeg" value={ImageFileTypeID.jpeg} />
          </UI_RibbonUI_ToggleButtonGroup>
        </div>
        <div className='section-spacer'></div>
        <div className='section-item'>
          <div className='label'>背景</div>
          <UI_RibbonUI_ToggleButtonGroup id={RibbonUIControlID.vectorLayer_drawLineType} currentValue={backGroundType} large={true}
            onClick={ (id, value) =>
              set_backGroundType(value)
            }
          >
            <UI_RibbonUI_ToggleButton label="最後のパレットの色" value={DocumentBackGroundTypeID.lastPaletteColor} />
            <UI_RibbonUI_ToggleButton label="透過色" value={DocumentBackGroundTypeID.transparent} />
          </UI_RibbonUI_ToggleButtonGroup>
        </div>
        <div className='section-spacer'></div>
        <div className='section-item'>
          <UI_RibbonUI_InputLabel label={'スケール'} />
          <UI_NumberInput value={exportScale} digit={2} step={0.01} min={0.1} max={10.0}
            onChange={(value) => {
              set_exportScale(value)
            }}
          />
        </div>
        <div className='ok-cancel-buttons'>
          <button className={`app-button-primary ${!available ? 'disabled' : ''}`} onClick={ok_Clicked}>エクスポート</button>
          <button className='app-button-cancel' onClick={cancel_Clicked}>キャンセル</button>
        </div>
      </div>
    </UI_ModalWindowContainer>
  )
}
