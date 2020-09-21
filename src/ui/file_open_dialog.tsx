import * as React from 'react';
import 'rc-slider/assets/index.css';

import { int, float, StringEndsWith, StringIsNullOrEmpty, ListInsertAt } from '../base/conversion';
import { Platform } from '../platform/platform';
import { LocalSettingFileSection } from '../base/data';

import { UI_SubScreenContainer, UI_SubScreenContainerRef } from './sub_screen_conatiner';

export interface UI_FileOpenDialogRef {

  show?(): void;
  hide?(): void;

  value_Change?: (filePath: string) => void;
}

export interface UI_FileOpenDialogParam {

  uiRef: UI_FileOpenDialogRef;
}

interface FileSectionItem {

  key: number;
  type: 'last-used' | 'add' | 'folder';
  name: string;
  icon: string;
  section?: LocalSettingFileSection;
}

interface FileItem {

  key: number;
  name: string;
  icon: string;
  path: string;
}

export function UI_FileOpenDialog({ uiRef }: UI_FileOpenDialogParam) {

  const subScreenContainerRef = React.useRef<UI_SubScreenContainerRef>(null);

  const [currentSectionItem, setCurrentSectionItem] = React.useState<FileSectionItem>(() => {
    return null;
  });

  const [fileSectionItems, setFileSectionItems] = React.useState<FileSectionItem[]>(() => {
    return [];
  });

  const [currentFileItem, setCurrentFileItem] = React.useState<FileItem>(() => {
    return null;
  });

  const [fileItems, setFileItems] = React.useState<FileItem[]>(() => {
    return [];
  });

  React.useEffect(() => {

    uiRef.show = () => {

      subScreenContainerRef.current.show();

      prepareItems(null);
    };

    uiRef.hide = () => {

      subScreenContainerRef.current.hide();
    };

    subScreenContainerRef.current.onEscape = (e: React.KeyboardEvent) => {

      uiRef.hide();
    }

    return function cleanup() {

      uiRef.show = null;
      uiRef.hide = null;
    };
  });

  function prepareItems(reselectSectionPath: string) {

    const environments = Platform.settings.getOpenFileEnvitonments();

    const fileSectionItems: FileSectionItem[] = [];
    let keyCount = 0;

    fileSectionItems.push({
      key: keyCount++,
      type: 'last-used',
      name: '最近使用したファイル',
      icon: 'history'
    });

    environments.fileSections.forEach(section => {
      fileSectionItems.push({
        key: keyCount++,
        type: 'folder',
        name: section.name,
        icon: 'folder_open',
        section: section
      });
    });

    if (Platform.supportsNative()) {

      fileSectionItems.push({
        key: keyCount++,
        type: 'add',
        name: '場所の追加',
        icon: 'add'
      });
    }

    setFileSectionItems(fileSectionItems);

    let select_FileSectionItem: FileSectionItem = fileSectionItems[0];

    if (!StringIsNullOrEmpty(reselectSectionPath)) {

      const sectionItem = fileSectionItems.find(item => item.type == 'folder' &&  item.section.path == reselectSectionPath);

      if (sectionItem) {

        select_FileSectionItem = sectionItem;
      }
    }

    changeCurrentFileSection(select_FileSectionItem);
  }

  async function changeCurrentFileSection(sectionItem: FileSectionItem) {

    switch (sectionItem.type) {

      case 'folder': {

        const files = Platform.fileSystem.getFilesSync(sectionItem.section.path);

        const items: FileItem[] = [];
        let keyCount = 0;

        files.filter(file => StringEndsWith(file.path, '.ora') || StringEndsWith(file.path, '.json'))
          .forEach(file => {
            items.push({
              key: keyCount++,
              name: file.name,
              icon: (StringEndsWith(file.name, '.ora') ? 'perm_media' : 'image'),
              path: file.path
            });
          });

        setCurrentFileItem(items[0]);
        setFileItems(items);

        break;
      }

      case 'last-used': {

      const environments = Platform.settings.getOpenFileEnvitonments();

        const items: FileItem[] = [];
        let keyCount = 0;

        environments.lastUsedFilePaths.forEach(path => {
          items.push({
            key: keyCount++,
            name: Platform.path.basename(path),
            icon: (StringEndsWith(path, '.ora') ? 'perm_media' : 'image'),
            path: path
          });
        });

        setCurrentFileItem(items[0]);
        setFileItems(items);

        break;
      }
    }

    setCurrentSectionItem(sectionItem);
  }

  async function selectDirectoryToAdd() {

    const path = await Platform.fileSystem.selectDirectory('c:\\');

    if (!StringIsNullOrEmpty(path)) {

      console.log(path);

      const newItem: LocalSettingFileSection = {
        index: fileItems.length,
        name: Platform.path.basename(path),
        path: path
      };

      Platform.settings.addFileSection(newItem);

      prepareItems(path);
    }
  }

  function sectionItem_Click(sectionItem: FileSectionItem) {

    switch (sectionItem.type) {

      case 'folder':
      case 'last-used':
        changeCurrentFileSection(sectionItem);
        break;

      case 'add':
        selectDirectoryToAdd().then();
        break;
    }
  }

  function sectionItem_Delete_Click(event: React.MouseEvent, sectionItem: FileSectionItem) {

    event.stopPropagation();

    Platform.settings.removeFileSection(sectionItem.section);

    prepareItems(null);
  }

  function ok_Click() {

    if (currentFileItem == null) {
      return;
    }

    if (uiRef.value_Change) {

      uiRef.value_Change(currentFileItem.path);
    }

    uiRef.hide();
  }

  return (
    <UI_SubScreenContainer subScreenContainerRef={subScreenContainerRef} className='file-open-dialog-container'>

      <div className='sections-container'>
        <div className='section-label'>ファイルの場所</div>
        <div className='section-list'>
        {
          fileSectionItems.map(sectionItem => (
            <div key={sectionItem.key} className='section-item'>

              <div className={`section-item-inner ${sectionItem == currentSectionItem ? 'selected' : ''}`}
                onMouseUp={() => { sectionItem_Click(sectionItem); } }
              >
                <div className='name'>
                  <i className='material-icons'>{sectionItem.icon}</i>
                  <span>{sectionItem.name}</span>
                </div>
                {
                  sectionItem.type == 'folder' &&
                  <i className='button material-icons' onMouseUp={(e) => { sectionItem_Delete_Click(e, sectionItem); }}>close</i>
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
                onMouseDown={() => { setCurrentFileItem(fileItem); } }
              >
                <div className={`file-item-inner ${fileItem == currentFileItem ? 'selected' : ''}`}>
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
    </UI_SubScreenContainer>
  );
}
