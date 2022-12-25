import * as React from 'react'
import { float } from '../common-logics'

export class PopoverRef {

  onPopoverOpened(){}
  onPopoverClosed(){}
}

export enum UI_PopoverContainerAlign {
  bottom,
  left,
  right,
  top,
  topLeft,
  topRight
}

export interface UI_PopoverContainerParam {

  children: any
  uiRef: UI_PopoverContainerRef
  fullHeight?: boolean
  offset?: { x: float, y: float }
  onDissmiss?()
  onEscape?: (e: React.KeyboardEvent) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export class UI_PopoverContainerRef {

  show(popoverRef: PopoverRef, popoverParentElement: HTMLElement, align?: UI_PopoverContainerAlign) {}
  close(popoverRef: PopoverRef) {}
  isShown(): boolean { return false }
}

export function UI_PopoverContent({ children, uiRef, fullHeight, offset, onDissmiss, onEscape, onVisibilityChange }: UI_PopoverContainerParam) {

  const hidden_ContainerRef = React.useRef<HTMLDivElement>(null)
  const content_ContainerRef = React.useRef<HTMLDivElement>(null)
  const [visible, set_visible] = React.useState(false)
  const visiblity_Ref = React.useRef(false)
  const backDropClickedRef = React.useRef(false)

  React.useEffect(() => {

    uiRef.show = (popoverRef, popoverParentElement, align = UI_PopoverContainerAlign.left) => {

      if (!hidden_ContainerRef.current || !content_ContainerRef.current) {
        return
      }

      const anchorRect = popoverParentElement.getBoundingClientRect()
      const documentBodyRect = document.body.getBoundingClientRect()

      const horizontalOffset = offset?.x ?? 0
      const verticalOffset = offset?.y ?? 0

      const alignLeft = (align == UI_PopoverContainerAlign.left || align == UI_PopoverContainerAlign.topLeft)
      const alignRight = (align == UI_PopoverContainerAlign.right || align == UI_PopoverContainerAlign.topRight)
      const alignBottom = align == UI_PopoverContainerAlign.bottom
      const alignTop = (align == UI_PopoverContainerAlign.top || align == UI_PopoverContainerAlign.topLeft || align == UI_PopoverContainerAlign.topRight)

      let left = anchorRect.left;
      let right = documentBodyRect.width - anchorRect.right;

      if (alignLeft) {

        left += horizontalOffset
        right = 0
      }

      if (alignRight) {

        left = 0
        right += horizontalOffset
      }

      if (alignBottom) {

        left += horizontalOffset
        right -= horizontalOffset
      }

      content_ContainerRef.current.style.left = `${left}px`
      content_ContainerRef.current.style.right = `${right}px`

      if (alignTop) {

        content_ContainerRef.current.style.top = 'unset'
        content_ContainerRef.current.style.bottom = `${documentBodyRect.height - anchorRect.top + verticalOffset}px` // TODO: オフセットを解像度に対応させる
      }
      else {

        content_ContainerRef.current.style.top = `${anchorRect.bottom + verticalOffset}px` // TODO: オフセットを解像度に対応させる
        content_ContainerRef.current.style.bottom = 'unset'
        content_ContainerRef.current.style.maxHeight = `${documentBodyRect.height - anchorRect.bottom - 10}px` // TODO: オフセットを解像度に対応させる
      }

      if (fullHeight) {

        content_ContainerRef.current.style.bottom = '0'
      }

      setVisibility(true)

      hidden_ContainerRef.current.parentElement.classList.remove('hidden')

      if (onVisibilityChange) {

        onVisibilityChange(true)
      }

      backDropClickedRef.current = false

      // for handling keydown event
      window.setTimeout(() => {
        content_ContainerRef.current.focus();
      }, 100);

      popoverRef.onPopoverOpened()
    }

    uiRef.close = (popoverRef) => {

      if (hidden_ContainerRef.current && content_ContainerRef.current) {

        hidden_ContainerRef.current.parentElement.classList.add('hidden')

        setVisibility(false)

        if (onVisibilityChange) {

          onVisibilityChange(false)
        }
      }

      popoverRef.onPopoverClosed()
    }

    uiRef.isShown = () => {
      return visiblity_Ref.current
    }

    return function cleanup() {

      uiRef.show = null
      uiRef.close = null
    }
  }, [])

  function setVisibility(visiblity: boolean) {

    set_visible(visiblity)
    visiblity_Ref.current = visiblity
  }

  function popoverContainer_KeyDown(e: React.KeyboardEvent) {

    // console.log(e.key);

    if (e.key == 'Escape') {

      if (onEscape) {

        onEscape(e);

        e.stopPropagation();
      }
    }
  }

  function backdrop_PointerDown(e: React.MouseEvent) {

    e.preventDefault()

    backDropClickedRef.current = true
  }

  function backdrop_PointerUp(e: React.PointerEvent) {

    e.preventDefault()

    if (backDropClickedRef.current) {

      backDropClickedRef.current = false

      if (onDissmiss) {

        onDissmiss()
      }
    }
  }

  function contentContainer_PointerMove(e: React.PointerEvent) {

    backDropClickedRef.current = false
  }

  function stopPropagation(e: React.PointerEvent | React.MouseEvent | React.TouchEvent) {

    e.stopPropagation()
  }

  return (
    <div ref={hidden_ContainerRef} className={`popover-hidden-container ${visible ?  'visible' : ''}`}>
      <div
        className='popover-content-backdrop'
        onPointerDown={backdrop_PointerDown}
        onPointerUp={backdrop_PointerUp}
        onPointerMove={stopPropagation} // to prevent scrolling for controls under the backdrop
      >
        <div ref={content_ContainerRef}
          className='popover-content-container'
          tabIndex={0} // for handling keydown event
          onClick={stopPropagation} // to prevent same event for backdrop
          onPointerDown={stopPropagation} // to prevent same event for backdrop
          onKeyDown={popoverContainer_KeyDown}
          onPointerMove={contentContainer_PointerMove}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
