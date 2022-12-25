import * as React from 'react'

interface UI_ScrollViewOption {

  children: any
  wheelScrollY?: number
  direction?: 'vertical' | 'horizontal'
  alignment?: '' | 'center'
  shrink?: boolean
}

export function UI_ScrollView(
  { children, wheelScrollY = 16, direction = 'vertical', alignment = '', shrink = true }: UI_ScrollViewOption
) {

  const containerRef = React.useRef<HTMLDivElement>(null)

  const scroll = React.useCallback(({ dx, dy }) => {
    if (direction == 'vertical') {

      containerRef.current.scrollTop += dy
    }
    else {

      containerRef.current.scrollLeft += dx
    }

  },
    [(direction == 'vertical' ? containerRef.current?.scrollTop : containerRef.current?.scrollLeft)]
  )

  const internalState = React.useRef({
    lastMouseX: null,
    lastMouseY: null,
    isMouseDown: false,
    isTouch: false,
    isScrolling: false,
    isFocused: false,
  })

  const endScroll = () => {

    internalState.current.isMouseDown = false
    internalState.current.isTouch = false
    internalState.current.lastMouseX = null
    internalState.current.lastMouseY = null
    internalState.current.isScrolling = false
  }

  const view_PointerDown = (e: React.PointerEvent) => {

    let x = e.pageX
    let y = e.pageY

    internalState.current.isMouseDown = true
    internalState.current.lastMouseX = x
    internalState.current.lastMouseY = y

    // e.preventDefault()

    //console.log('onMouseDown', x, y)
  }

  const view_PointerEnter = (e: React.PointerEvent) => {

    internalState.current.isFocused = true

    // console.log('onMouseEnter')
  }

  const view_PointerLeave = (e: React.PointerEvent) => {

    internalState.current.isFocused = false

    // console.log('onMouseLeave')
  }

  const view_Wheel = (e: React.WheelEvent) => {

    let scrollDistance = (e.deltaY > 0 ? wheelScrollY : -wheelScrollY)

    let dx = (direction == 'horizontal' ? scrollDistance : 0)
    let dy = (direction == 'vertical' ? scrollDistance : 0)

    scroll({ dx, dy })

    // console.log('onMouseLeave')
  }

  const window_onPointerMove = (e) => {

    let x = e.pageX
    let y = e.pageY

    if (!internalState.current.isMouseDown) {

      internalState.current.lastMouseX = x
      internalState.current.lastMouseY = y
      return
    }

    if (internalState.current.isFocused && internalState.current.isMouseDown) {

      containerRef.current.setPointerCapture(e.pointerId)
    }

    internalState.current.isScrolling = true

    const dx = -(x - internalState.current.lastMouseX)
    const dy = -(y - internalState.current.lastMouseY)
    internalState.current.lastMouseX = x
    internalState.current.lastMouseY = y

    scroll({ dx, dy })

    //console.log('onMouseMove', dx, dy)
  }

  const window_PointerUp = () => {

    endScroll()
  }

  const window_KeyDown = (e: KeyboardEvent) => {

    if (e.key === ' ') {

      if (internalState.current.isFocused) {

        internalState.current.isMouseDown = true

        // console.log('isScrolling')
      }
    }
  }

  const window_KeyUp = (e: KeyboardEvent) => {

    if (e.key === ' ') {

      endScroll()
    }
  }

  React.useEffect(() => {

    window.addEventListener('keydown', window_KeyDown)
    window.addEventListener('keyup', window_KeyUp)
    window.addEventListener('pointerup', window_PointerUp)
    window.addEventListener('pointermove', window_onPointerMove)

    return function cleanup() {

      window.removeEventListener('keydown', window_KeyDown)
      window.removeEventListener('keyup', window_KeyUp)
      window.removeEventListener('pointerup', window_PointerUp)
      window.removeEventListener('pointermove', window_onPointerMove)
    }
  }, [])

  return (
    <div ref={containerRef} className={`ui-scroll-view-container ${direction == 'vertical' ? 'vertical' : 'horizontal'} ${alignment == 'center' ? 'center' : ''} ${shrink ? '' : 'no-shrink'}`}
      onPointerDown={view_PointerDown}
      onPointerEnter={view_PointerEnter}
      onPointerLeave={view_PointerLeave}
      onWheel={view_Wheel}
    >
      {children}
    </div>
  )
}
