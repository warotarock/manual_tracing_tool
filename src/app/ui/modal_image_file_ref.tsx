import * as React from 'react'
import { ModalWindowID } from '../window/modal_window'
import { UI_ModalsRef } from './modals'

export interface UI_Modal_ImageFileReferenceRef {

  onClose?(filePath: string, image: HTMLImageElement)
}

export interface UI_Modal_ImageFileReferenceParam {

  modalsRef: UI_ModalsRef
  uiRef: UI_Modal_ImageFileReferenceRef
}

export class ModalWindowParam_ImageFileReference {

  modalWindowID = ModalWindowID.openImageReferenceWindow
  modalWindowTitle = '画像ファイルの選択'
  uiRef: UI_Modal_ImageFileReferenceRef = {}
}

export function UI_Modal_ImageFileReference({ modalsRef, uiRef }: UI_Modal_ImageFileReferenceParam) {

  const fileRef = React.useRef<HTMLInputElement>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const [available, set_available] = React.useState(false)

  function image_Click() {

    fileRef.current.click()
  }

  function file_Change(e: React.ChangeEvent<HTMLInputElement>) {

    if (e.target.files.length == 0) {
      return
    }

    const reader = new FileReader();

    reader.onload = (event) => {

      if (typeof(event.target.result) == 'string') {

        imageRef.current.src = event.target.result

        set_available(true)
      }
    }

    reader.readAsDataURL(e.target.files[0])
  }

  function ok_Click() {

    if (!available) {
      return
    }

    modalsRef.close()

    if (fileRef.current.files.length == 0) {
      return
    }

    if (uiRef.onClose) {

      const file = fileRef.current.files[0]

      // TODO: FileとImageElementを渡してロードを二重にしないですむようにする。ブラウザで使用できない'path'の使用をやめる。
      uiRef.onClose(file['path'], imageRef.current)
    }
  }

  return (
    <div className="modal-image-file-reference">

      <input type="file" accept="image/jpeg,image/png,image/gif,image/bmp" ref={fileRef} onChange={file_Change} />

      <div className="image" onClick={image_Click}>
        <div className={`text ${available ? 'hidden' : ''}`} >
          クリックして画像ファイルを<br/>選択してください。
        </div>
        <img ref={imageRef} className={!available ? 'hidden' : ''} />
      </div>

      <div className="ok-cancel-buttons">
        <button className={`app-button-primary ${!available ? 'disabled' : ''}`} onClick={ () => ok_Click() }>決定</button>
        <button className='app-button-cancel' onClick={ () => modalsRef.close() }>キャンセル</button>
      </div>
    </div>
  )
}
