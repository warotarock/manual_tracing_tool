import * as React from 'react'
import { Platform } from '../../platform'
import { ModalWindowRef } from '../ui'
import { UI_ModalWindowContainer, UI_ModalWindowContainerRef } from './modal-window-container'

export interface UI_Modal_ImageFileReferenceRef extends ModalWindowRef {

  show?(): void
  hide?(): void
  onClose?(filePath: string, image: HTMLImageElement)
}

export interface UI_Modal_ImageFileReferenceParam {

  uiRef: UI_Modal_ImageFileReferenceRef
}

export function UI_Modal_ImageFileReference({ uiRef }: UI_Modal_ImageFileReferenceParam) {

  const fileRef = React.useRef<HTMLInputElement>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const modalWindowContainerRef = React.useMemo<UI_ModalWindowContainerRef>(() => ({}), [])
  const [available, set_available] = React.useState(false)

  React.useEffect(() => {

    uiRef.show = () => {

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

  function image_Clicked() {

    fileRef.current.click()
  }

  function file_Changed(e: React.ChangeEvent<HTMLInputElement>) {

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

  function ok_Clicked() {

    if (!available) {
      return
    }

    uiRef.hide()

    if (fileRef.current.files.length == 0) {
      return
    }

    if (uiRef.onClose) {

      const file = fileRef.current.files[0]

      // TODO: ブラウザで使用できない'path'の使用をやめる。
      let filePath: string
      if ('path' in file) {

        filePath = Platform.path.getPlatformIndependentPath(file['path'])
      }
      else {

        filePath = file.name
      }

      uiRef.onClose(filePath, imageRef.current)
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
      modalWindowTitle='画像ファイルの選択'
      uiRef={modalWindowContainerRef}
      onEscape={modal_Escaped}
    >
      <div className='modal-image-file-reference'>

        <input type='file' accept='image/jpeg,image/png,image/gif,image/bmp' ref={fileRef} onChange={file_Changed} />

        <div className='image' onClick={image_Clicked}>
          <div className={`text ${available ? 'hidden' : ''}`} >
            クリックして画像ファイルを<br/>選択してください。
          </div>
          <img ref={imageRef} className={!available ? 'hidden' : ''} />
        </div>

        <div className='ok-cancel-buttons'>
          <button className={`app-button-primary ${!available ? 'disabled' : ''}`} onClick={ok_Clicked}>決定</button>
          <button className='app-button-cancel' onClick={cancel_Clicked}>キャンセル</button>
        </div>
      </div>
    </UI_ModalWindowContainer>
  )
}
