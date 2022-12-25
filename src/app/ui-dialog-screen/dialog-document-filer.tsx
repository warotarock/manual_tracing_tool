import * as React from 'react'
import { Platform } from '../../platform'
import { Strings } from '../common-logics'
import { DialogScreenRef } from '../ui'
import { UI_Icon_MaterialIcon, UI_Icon_MaterialIcon_IconName } from '../ui-common-controls'
import { LocalSettingFileSection, UserSettingFileLogic } from '../user-setting'
import { UI_DialogScreenContainer, UI_DialogScreenContainerRef } from './dialog-screen-conatiner'

export interface UI_Dialog_DocumentFilerRef extends DialogScreenRef {

  show?(dialogType: UI_Dialog_DocumentFiler_DialogType, lastFilePath: string, userSetting: UserSettingFileLogic): void
  close?(): void

  fileItem_Selected?: (filePath: string) => void
  filePath_Fixed?: (directoryPath: string, fileName: string) => void
}

export interface UI_Dialog_DocumentFilerParam {

  uiRef: UI_Dialog_DocumentFilerRef
}

export enum UI_Dialog_DocumentFiler_DialogType {
  none,
  open,
  saveAS,
}

enum FileSectionItemType {
  folder,
  currentDir,
  lastUsed,
  add
}

interface FileSectionItem {
  key: number
  type: FileSectionItemType
  name: string
  path: string
  icon: UI_Icon_MaterialIcon_IconName
  section?: LocalSettingFileSection
}

interface FileItem {
  key: number
  name: string
  icon: UI_Icon_MaterialIcon_IconName
  path: string
}

export function UI_Dialog_DocumentFiler({ uiRef }: UI_Dialog_DocumentFilerParam) {

  const [dialogType, set_dialogType] = React.useState(UI_Dialog_DocumentFiler_DialogType.none)

  const [currentFileSectionItem, set_currentFileSectionItem] = React.useState<FileSectionItem>(null)

  const [fileSectionItems, set_fileSectionItems] = React.useState<FileSectionItem[]>(() => {
    return []
  })

  const [currentFileItem, set_currentFileItem] = React.useState<FileItem>(null)

  const [fileItems, set_fileItems] = React.useState<FileItem[]>(() => {
    return []
  })

  const [fileName, set_fileName] = React.useState('')
  const [directoryPath, set_directoryPath] = React.useState('')
  const [directoryIcon, set_directoryIcon] = React.useState<UI_Icon_MaterialIcon_IconName>('')

  const userSettingRef = React.useRef<UserSettingFileLogic>(null)

  const overlayContainerRef = React.useMemo<UI_DialogScreenContainerRef>(() => ({}), [])

  React.useEffect(() => {

    uiRef.show = (type, lastFilePath, userSetting) => {

      userSettingRef.current = userSetting

      let reselectSectionPath = ''
      if (type == UI_Dialog_DocumentFiler_DialogType.saveAS && !Strings.isNullOrEmpty(lastFilePath)) {

        const lastFileName = Platform.path.getFileName(lastFilePath)

        if (!Strings.isNullOrEmpty(lastFileName)) {

          set_fileName(lastFileName)

          reselectSectionPath = Platform.path.getDirectoryPath(lastFilePath)
        }
      }

      prepareItems(type, reselectSectionPath)

      set_dialogType(type)
      set_currentFileItem(null)

      overlayContainerRef.show(uiRef)
    }

    uiRef.close = () => {

      overlayContainerRef.hide(uiRef)
    }

    return function cleanup() {

      uiRef.show = null
      uiRef.close = null
    }
  }, [])

  function prepareItems(dlgType: UI_Dialog_DocumentFiler_DialogType, reselectSectionPath: string) {

    const environments = userSettingRef.current.getOpenFileEnvironments()

    const fileSectionItems: FileSectionItem[] = []
    let keyCount = 0

    if (dlgType == UI_Dialog_DocumentFiler_DialogType.open) {

      fileSectionItems.push({
        key: keyCount++,
        type: FileSectionItemType.lastUsed,
        name: '最近使用したファイル',
        path: '最近使用したファイル',
        icon: 'history'
      })
    }

    if (dlgType == UI_Dialog_DocumentFiler_DialogType.saveAS && !Strings.isNullOrEmpty(reselectSectionPath)) {

      fileSectionItems.push({
        key: keyCount++,
        type: FileSectionItemType.currentDir,
        name: '現在の場所',
        path: Platform.path.getPlatformOrientedPath(reselectSectionPath),
        icon: 'folder'
      })
    }

    environments.fileSections.forEach(section => {
      fileSectionItems.push({
        key: keyCount++,
        type: FileSectionItemType.folder,
        name: section.name,
        path: section.path,
        icon: 'folder',
        section: section
      })
    })

    if (Platform.supportsNative()) {

      fileSectionItems.push({
        key: keyCount++,
        type: FileSectionItemType.add,
        name: '場所の追加',
        path: '場所の追加',
        icon: 'add'
      })
    }

    set_fileSectionItems(fileSectionItems)

    let select_FileSectionItem = fileSectionItems[0]

    if (!Strings.isNullOrEmpty(reselectSectionPath)) {

      const sectionItem = fileSectionItems.find(item =>
        (item.type == FileSectionItemType.folder || item.type == FileSectionItemType.currentDir)
        && item.path == reselectSectionPath)

      if (sectionItem) {

        select_FileSectionItem = sectionItem
      }
    }

    changeCurrentFileSection(select_FileSectionItem).then()
  }

  function setCurrentFileItem(fileItem: FileItem | null) {

    set_currentFileItem(fileItem)
    set_fileName(fileItem ? fileItem.name : '')
  }

  async function changeCurrentFileSection(sectionItem: FileSectionItem) {

    switch (sectionItem.type) {

      case FileSectionItemType.folder:
      case FileSectionItemType.currentDir:
      {

        const files = await Platform.fileSystem.getFileInfos(sectionItem.path)

        const fileItems: FileItem[] = []
        let keyCount = 0

        files.filter(file => Strings.endsWith(file.path, '.ora') || Strings.endsWith(file.path, '.json'))
          .forEach(file => {
            fileItems.push({
              key: keyCount++,
              name: file.name,
              icon: (Strings.endsWith(file.name, '.ora') ? 'media' : 'image'),
              path: file.path
            })
          })

        set_fileItems(fileItems)

        break
      }

      case FileSectionItemType.lastUsed: {

        const environments = userSettingRef.current.getOpenFileEnvironments()

        const fileItems: FileItem[] = []
        let keyCount = 0

        environments.lastUsedFilePaths.forEach(lufPath => {
          fileItems.push({
            key: keyCount++,
            name: Platform.path.getFileName(lufPath),
            icon: (Strings.endsWith(lufPath, '.ora') ? 'media' : 'image'),
            path: lufPath
          })
        })

        set_fileItems(fileItems)

        break
      }
    }

    set_currentFileSectionItem(sectionItem)
    set_directoryPath(sectionItem.path)
    set_directoryIcon(sectionItem.icon)
  }

  async function selectDirectoryToAdd() {

    let defaultDirectoryPath = directoryPath
    if (Strings.isNullOrEmpty(defaultDirectoryPath)) {

      // TODO: 初期ディレクトリに妥当なものを選択する
      defaultDirectoryPath = 'c:\\'
    }

    const path = await Platform.fileSystem.openFileDialog(defaultDirectoryPath)

    if (!Strings.isNullOrEmpty(path)) {

      console.log(path)

      const newItem: LocalSettingFileSection = {
        index: fileItems.length,
        name: Platform.path.getFileName(path),
        path: path
      }

      userSettingRef.current.addFileSection(newItem)

      // TODO: 追加したディレクトリに対応するセクションを正しく選択するようにする（現在のディレクトリが選択されてしまうことがある）
      prepareItems(dialogType, path)
    }
  }

  function sectionItem_Clicked(sectionItem: FileSectionItem) {

    switch (sectionItem.type) {

      case FileSectionItemType.folder:
      case FileSectionItemType.currentDir:
      case FileSectionItemType.lastUsed:
        changeCurrentFileSection(sectionItem).then()
        break

      case FileSectionItemType.add:
        selectDirectoryToAdd().then()
        break
    }
  }

  function sectionItem_Delete_Clicked(e: React.MouseEvent, sectionItem: FileSectionItem) {

    e.stopPropagation()

    userSettingRef.current.removeFileSection(sectionItem.section)

    prepareItems(dialogType, null)
  }

  function fileName_Changed(e) {

    set_fileName(e.target.value)
  }

  function fileItem_Clicked(fileItem: FileItem) {

    setCurrentFileItem(fileItem)
  }

  function ok_Clicked() {

    switch (dialogType) {

      case UI_Dialog_DocumentFiler_DialogType.open:

        if (uiRef.fileItem_Selected && currentFileItem != null) {

          uiRef.fileItem_Selected(currentFileItem.path)
        }
        break

      case UI_Dialog_DocumentFiler_DialogType.saveAS:

        if (uiRef.filePath_Fixed && !Strings.isNullOrEmpty(directoryPath) && !Strings.isNullOrEmpty(fileName)) {

          uiRef.filePath_Fixed(directoryPath, fileName)
        }
        break
    }

    uiRef.close()
  }

  function dialog_Escaped() {

    uiRef.close()
  }

  const isFileNameReadOnly = (dialogType != UI_Dialog_DocumentFiler_DialogType.saveAS)

  return (
    <UI_DialogScreenContainer
      overlayContainerRef={overlayContainerRef}
      className='dialog-document-filer-container'
      isVisibleOnInit={false}
      onEscape={dialog_Escaped}
    >

      <div className='sections-container'>
        <div className='menu-commands'>
          <button className='app-button-back' onClick={dialog_Escaped}>
            <UI_Icon_MaterialIcon iconName='expandleft'/><span>キャンセル</span>
          </button>
        </div>
        <div className='section-label'>ファイルの場所</div>
        <div className='section-list'>
        {
          fileSectionItems.map(sectionItem => (
            <div key={sectionItem.key} className={`section-item selectable-item ${sectionItem == currentFileSectionItem ? 'selected' : ''}`}>

              <div className="section-item-inner selectable-item-inner"
                onMouseUp={() => { sectionItem_Clicked(sectionItem) } }
              >
                <div className='name'>
                  <UI_Icon_MaterialIcon iconName={sectionItem.icon} />
                  <span>{sectionItem.name}</span>
                </div>
                {
                  sectionItem.type == FileSectionItemType.folder &&
                  <div className='button'
                    onClick={(e) => { sectionItem_Delete_Clicked(e, sectionItem) } }
                  >
                    <UI_Icon_MaterialIcon iconName='close' />
                  </div>
                }
              </div>
            </div>
          ))
        }
        </div>
      </div>

      <div className='files-container'>
        <div className='file-commands'>
          <input type='text' className={`file-info ${isFileNameReadOnly ? 'readonly' : ''}`} readOnly={isFileNameReadOnly} value={fileName} onChange={fileName_Changed}/>
          <button className={`app-button-primary${fileName == '' ? ' disabled' : ''}`} onClick={ () => ok_Clicked() }>{dialogType == UI_Dialog_DocumentFiler_DialogType.open ? '開く' : '保存'}</button>
        </div>
        <div className='section-info'>
          <UI_Icon_MaterialIcon iconName={directoryIcon} />
          <span>{directoryPath}</span>
        </div>
        <div className='file-list'>
          <ul>
          {
            fileItems.map(fileItem => (
              <li key={fileItem.key}
                className={`selectable-item ${fileItem == currentFileItem ? 'selected' : ''}`}
                onPointerDown={() => fileItem_Clicked(fileItem) }
              >
                <div className="selectable-item-inner">
                  <UI_Icon_MaterialIcon iconName={fileItem.icon} />
                  <span className='name'>{fileItem.name}</span>
                  <span className='path'>{fileItem.path}</span>
                </div>
              </li>
            ))
          }
          </ul>
        </div>
      </div>
    </UI_DialogScreenContainer>
  )
}
