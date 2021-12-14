import * as React from 'react';

export enum UI_OverlayContainerTypeID {

  dialogScreen = 1,
  modalWindow = 2,
}

export interface UI_OverlayContainerRef {

  hide?: () => void;
  show?: () => void;

  onEscape?: (e: React.KeyboardEvent) => void;
}

export interface UI_OverlayContainerParam {

  children: any
  type: UI_OverlayContainerTypeID
  className?: string
  overlayContainerRef?: React.MutableRefObject<UI_OverlayContainerRef>
}

export function UI_OverlayContainer(
  { children, type, className = '', overlayContainerRef = null } : UI_OverlayContainerParam ) {

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visible, set_visible] = React.useState(false)

  React.useEffect(() => {

    overlayContainerRef.current= {

      show: () => {

        containerRef.current.parentElement.classList.remove('hidden');

        set_visible(true)

        window.setTimeout(() => {
          containerRef.current.focus();
        }, 100);
      },

      hide: () => {

        containerRef.current.parentElement.classList.add('hidden');

        set_visible(false)
      }
    }

    return function cleanup() {
    };
  });

  function keyPress(e: React.KeyboardEvent) {

    // console.log(e.key);

    if (e.key == 'Escape') {

      if (overlayContainerRef.current.onEscape) {

        overlayContainerRef.current.onEscape(e);

        e.stopPropagation();
      }
    }
  }

  return (
    <div ref={containerRef} className={
      `${type == UI_OverlayContainerTypeID.dialogScreen ? 'dialog-screen-container' : ''}${type == UI_OverlayContainerTypeID.modalWindow ? 'modal-window-overlay' : ''} ${className}`}
      onKeyDown={keyPress} tabIndex={0}
    >
      {visible ? children : null}
    </div>
  );
}
