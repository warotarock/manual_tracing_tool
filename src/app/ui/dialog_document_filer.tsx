import * as React from 'react'
import { LocalSettingFileSection } from '../preferences/local_setting'
import { UserSettingLogic } from '../preferences/user_setting'
import { Strings } from '../logics/conversion'
import { Platform } from '../../platform/platform'
import { UI_OverlayContainer, UI_OverlayContainerRef, UI_OverlayContainerTypeID } from './overlay_conatiner'

export interface UI_Dialog_DocumentFilerRef {

  show?(userSetting: UserSettingLogic): void
  hide?(): void

  value_Change?: (filePath: string) => void

  userSetting?: UserSettingLogic
}

export interface UI_FileOpenDialogParam {

  uiRef: UI_Dialog_DocumentFilerRef
}

interface FileSectionItem {

  key: number
  type: 'last-used' | 'add' | 'folder'
  name: string
  icon: string
  section?: LocalSettingFileSection
}

interface FileItem {

  key: number
  name: string
  icon: string
  path: string
}

export function UI_Dialog_DocumentFiler({ uiRef }: UI_FileOpenDialogParam) {

  const overlayContainerRef = React.useRef<UI_OverlayContainerRef>(null)

  const [currentSectionItem, setCurrentSectionItem] = React.useState<FileSectionItem>(() => {
    return null
  })

  const [fileSectionItems, setFileSectionItems] = React.useState<FileSectionItem[]>(() => {
    return []
  })

  const [currentFileItem, setCurrentFileItem] = React.useState<FileItem>(() => {
    return null
  })

  const [fileItems, setFileItems] = React.useState<FileItem[]>(() => {
    return []
  })

  React.useEffect(() => {

    uiRef.show = (userSetting: UserSettingLogic) => {

      overlayContainerRef.current.show()

      uiRef.userSetting = userSetting

      prepareItems(null)
    }

    uiRef.hide = () => {

      overlayContainerRef.current.hide()
    }

    overlayContainerRef.current.onEscape = (_e: React.KeyboardEvent) => {

      uiRef.hide()
    }

    return function cleanup() {

      uiRef.show = null
      uiRef.hide = null
    }
  })

  function prepareItems(reselectSectionPath: string) {

    const environments = uiRef.userSetting.getOpenFileEnvironments()

    const fileSectionItems: FileSectionItem[] = []
    let keyCount = 0

    fileSectionItems.push({
      key: keyCount++,
      type: 'last-used',
      name: '最近使用したファイル',
      icon: 'history'
    })

    environments.fileSections.forEach(section => {
      fileSectionItems.push({
        key: keyCount++,
        type: 'folder',
        name: section.name,
        icon: 'folder_open',
        section: section
      })
    })

    if (Platform.supportsNative()) {

      fileSectionItems.push({
        key: keyCount++,
        type: 'add',
        name: '場所の追加',
        icon: 'add'
      })
    }

    setFileSectionItems(fileSectionItems)

    let select_FileSectionItem: FileSectionItem = fileSectionItems[0]

    if (!Strings.isNullOrEmpty(reselectSectionPath)) {

      const sectionItem = fileSectionItems.find(item => item.type == 'folder' &&  item.section.path == reselectSectionPath)

      if (sectionItem) {

        select_FileSectionItem = sectionItem
      }
    }

    changeCurrentFileSection(select_FileSectionItem)
  }

  async function changeCurrentFileSection(sectionItem: FileSectionItem) {

    switch (sectionItem.type) {

      case 'folder': {

        const files = Platform.fileSystem.getFileInfos(sectionItem.section.path)

        const items: FileItem[] = []
        let keyCount = 0

        files.filter(file => Strings.endsWith(file.path, '.ora') || Strings.endsWith(file.path, '.json'))
          .forEach(file => {
            items.push({
              key: keyCount++,
              name: file.name,
              icon: (Strings.endsWith(file.name, '.ora') ? 'perm_media' : 'image'),
              path: file.path
            })
          })

        setCurrentFileItem(items[0])
        setFileItems(items)

        break
      }

      case 'last-used': {

        const environments = uiRef.userSetting.getOpenFileEnvironments()

        const items: FileItem[] = []
        let keyCount = 0

        environments.lastUsedFilePaths.forEach(path => {
          items.push({
            key: keyCount++,
            name: Platform.path.basename(path),
            icon: (Strings.endsWith(path, '.ora') ? 'perm_media' : 'image'),
            path: path
          })
        })

        setCurrentFileItem(items[0])
        setFileItems(items)

        break
      }
    }

    setCurrentSectionItem(sectionItem)
  }

  async function selectDirectoryToAdd() {

    const path = await Platform.fileSystem.openFileDialog('c:\\')

    if (!Strings.isNullOrEmpty(path)) {

      console.log(path)

      const newItem: LocalSettingFileSection = {
        index: fileItems.length,
        name: Platform.path.basename(path),
        path: path
      }

      uiRef.userSetting.addFileSection(newItem)

      prepareItems(path)
    }
  }

  function sectionItem_Click(sectionItem: FileSectionItem) {

    switch (sectionItem.type) {

      case 'folder':
      case 'last-used':
        changeCurrentFileSection(sectionItem)
        break

      case 'add':
        selectDirectoryToAdd().then()
        break
    }
  }

  function sectionItem_Delete_Click(event: React.MouseEvent, sectionItem: FileSectionItem) {

    event.stopPropagation()

    uiRef.userSetting.removeFileSection(sectionItem.section)

    prepareItems(null)
  }

  function ok_Click() {

    if (currentFileItem == null) {
      return
    }

    if (uiRef.value_Change) {

      uiRef.value_Change(currentFileItem.path)
    }

    uiRef.hide()
  }

  return (
    <UI_OverlayContainer
      type={UI_OverlayContainerTypeID.dialogScreen}
      overlayContainerRef={overlayContainerRef}
      className='dialog-document-filer-container'>

      <div className='sections-container'>
        <div className='section-label'>ファイルの場所</div>
        <div className='section-list'>
        {
          fileSectionItems.map(sectionItem => (
            <div key={sectionItem.key} className={`section-item selectable-item ${sectionItem == currentSectionItem ? 'selected' : ''}`}>

              <div className="section-item-inner selectable-item-inner"
                onMouseUp={() => { sectionItem_Click(sectionItem) } }
              >
                <div className='name'>
                  <i className='material-icons'>{sectionItem.icon}</i>
                  <span>{sectionItem.name}</span>
                </div>
                {
                  sectionItem.type == 'folder' &&
                  <i className='button material-icons' onMouseUp={(e) => { sectionItem_Delete_Click(e, sectionItem) }}>close</i>
                }
              </div>
            </div>
          ))
        }
        </div>
      </div>

      <div className='files-container'>
        <div className='section-info'>
          { currentSectionItem != null && <i className='material-icons'>{currentSectionItem.icon}</i>}
          <span>{ currentSectionItem != null ? currentSectionItem.name : '' }</span>
        </div>
        <div className='file-list'>
          <ul>
          {
            fileItems.map(fileItem => (
              <li key={fileItem.key}
                className={`selectable-item ${fileItem == currentFileItem ? 'selected' : ''}`}
                onMouseDown={() => { setCurrentFileItem(fileItem) } }
              >
                <div className="selectable-item-inner">
                  <i className='material-icons'>{fileItem.icon}</i>
                  <span className='name'>{fileItem.name}</span>
                  <span className='path'>{fileItem.path}</span>
                </div>
              </li>
            ))
          }
          </ul>
        </div>
        <div className='file-commands'>
          <div className='file-info'>{ currentFileItem ? currentFileItem.name : '' }</div>
          <button className='app-button-primary' onClick={ () => ok_Click() }>開く</button>
          <button className='app-button-cancel' onClick={ () => uiRef.hide() }>キャンセル</button>
        </div>
      </div>
    </UI_OverlayContainer>
  )
}
