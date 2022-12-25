import * as React from 'react'
import { ModalWindowRef } from '../ui'

export interface UI_ModalWindowContainerRef {

  show?(modalRef: ModalWindowRef)
  hide?(modalRef: ModalWindowRef)
}

export interface UI_ModalWindowContainerParam {

  children: any
  uiRef: UI_ModalWindowContainerRef
  modalWindowTitle: string
  onEscape?: () => void
}

export function UI_ModalWindowContainer({ children, uiRef, modalWindowTitle, onEscape }: UI_ModalWindowContainerParam) {

  const backdropRef = React.useRef<HTMLDivElement>(null)
  const windowContainerRef = React.useRef<HTMLDivElement>(null)
  const backDropClickedRef = React.useRef(false)

  React.useEffect(() => {

    uiRef.show = (modalRef) => {

      backdropRef.current.parentElement.classList.remove('hidden')

      backDropClickedRef.current = false

      modalRef.onModalWindowOpened()

      // for handling keydown event
      window.setTimeout(() => {
        windowContainerRef.current.focus()
      }, 100)
    }

    uiRef.hide = (modalRef) => {

      backdropRef.current.parentElement.classList.add('hidden')

      modalRef.onModalWindowClosed()
    }

    return function cleanup() {

      uiRef.show = null
      uiRef.hide = null
    }
  }, [])

  function container_keyDown(e: React.KeyboardEvent) {

    // console.log(e.key)

    if (e.key == 'Escape') {

      if (onEscape) {

        onEscape()

        e.stopPropagation()
      }
    }
  }

  function backdrop_PointerDown(e: React.PointerEvent) {

    e.preventDefault()

    backDropClickedRef.current = true
  }

  function backdrop_PointerUp(e: React.PointerEvent) {

    e.preventDefault()

    if (backDropClickedRef.current) {

      backDropClickedRef.current = false

      if (onEscape) {

        onEscape()
      }
    }
  }

  function windowContainer_PointerMove(e: React.PointerEvent) {

    backDropClickedRef.current = false
  }

  function stopPropagation(e: React.PointerEvent | React.MouseEvent | React.TouchEvent) {

    e.stopPropagation()
  }

  return (
    <div className='modal-window-backdrop'
      ref={backdropRef}
      onPointerDown={backdrop_PointerDown}
      onPointerUp={backdrop_PointerUp}
    >
      <div ref={windowContainerRef}
        className={`modal-window-container`}
        tabIndex={0} // for handling keydown event
        onClick={stopPropagation} // to prevent same event for backdrop
        onPointerDown={stopPropagation} // to prevent same event for backdrop
        onKeyDown={container_keyDown}
        onPointerMove={windowContainer_PointerMove}
      >
        <div className='modal-window-header'>{modalWindowTitle}</div>
        <div className='modal-window-content'>{children}</div>
      </div>
    </div>
  )
}
