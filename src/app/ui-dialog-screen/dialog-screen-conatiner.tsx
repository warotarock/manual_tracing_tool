import * as React from 'react'
import { DialogScreenRef } from '../ui'

export interface UI_DialogScreenContainerRef {

  show?: (dialogRef: DialogScreenRef) => void
  hide?: (dialogRef: DialogScreenRef) => void
}

export interface UI_DialogScreenContainerParam {

  children: any
  className?: string
  isVisibleOnInit?: boolean
  overlayContainerRef?: UI_DialogScreenContainerRef
  onEscape?: (e: React.KeyboardEvent) => void
}

export function UI_DialogScreenContainer(
  { children, className = '', isVisibleOnInit = true, overlayContainerRef = null, onEscape } : UI_DialogScreenContainerParam ) {

  const containerRef = React.useRef<HTMLDivElement>(null)
  const [visible, set_visible] = React.useState(isVisibleOnInit)

  React.useEffect(() => {

    overlayContainerRef.show = (dialogRef) => {
      // console.log('UI_DialogScreenContainer show')

      containerRef.current.parentElement.classList.remove('hidden')

      set_visible(true)

      dialogRef.onDialogScreenOpened()

      // for handling keydown event
      window.setTimeout(() => {
        containerRef.current.focus()
      }, 100)
    }

    overlayContainerRef.hide = (dialogRef) => {

      containerRef.current.parentElement.classList.add('hidden')

      set_visible(false)

      dialogRef.onDialogScreenClosed()
    }

    return function cleanup() {
    }
  }, [])

  function container_keyDown(e: React.KeyboardEvent) {

    // console.log(e.key)

    if (e.key == 'Escape') {

      if (onEscape) {

        onEscape(e)

        e.stopPropagation()
      }
    }
  }

  return (
    <div ref={containerRef}
      className={`dialog-screen-container ${className} ${!visible ? 'hidden' : ''}`}
      tabIndex={0} // for handling keydown event
      onKeyDown={container_keyDown}
    >
      {visible ? children : null}
    </div>
  )
}
