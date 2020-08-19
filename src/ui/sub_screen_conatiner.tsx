import * as React from 'react';
import 'rc-slider/assets/index.css';

export interface UI_SubScreenContainerRef {

  hide?: () => void;
  show?: () => void;

  onEscape?: (e: React.KeyboardEvent) => void;
}

export function UI_SubScreenContainer(
  { children, className = '', subScreenContainerRef = null }
  : { children: any, className?: string, subScreenContainerRef?: React.MutableRefObject<UI_SubScreenContainerRef>} ) {

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {

    subScreenContainerRef.current= {

      show: () => {

        containerRef.current.parentElement.classList.remove('hidden');
        containerRef.current.focus();
      },

      hide: () => {

        containerRef.current.parentElement.classList.add('hidden');
      }
    }

    return function cleanup() {
    };
  });

  function keyPress(e: React.KeyboardEvent) {

    // console.log(e.key);

    if (e.key == 'Escape') {

      if (subScreenContainerRef.current.onEscape) {

        subScreenContainerRef.current.onEscape(e);

        e.stopPropagation();
      }
    }
  }

  return (
    <div ref={containerRef} className={`default-container ${className}`} onKeyDown={keyPress} tabIndex={0}>{children}</div>
  );
}
