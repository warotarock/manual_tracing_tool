import * as React from 'react';

export function UI_ScrollView({ content, contentRef = null, wheelScrollY = 16 }) {

    const containerRef = React.useRef(null);

    const internalState = React.useRef({
        lastMouseX: null,
        lastMouseY: null,
        isMouseDown: false,
        isTouch: false,
        isScrolling: false,
        isFocused: false,
    });

    const scroll = React.useCallback(({ dx, dy }) => {

        containerRef.current.scrollTop += dy;

    }, [containerRef.current?.scrollTop]);

    const endScroll = () => {

        internalState.current.isMouseDown = false;
        internalState.current.isTouch = false;
        internalState.current.lastMouseX = null;
        internalState.current.lastMouseY = null;
        internalState.current.isScrolling = false;
    }

    const onMouseDown = (e: React.MouseEvent) => {

        let x = e.pageX;
        let y = e.pageY;

        internalState.current.isMouseDown = true;
        internalState.current.lastMouseX = x;
        internalState.current.lastMouseY = y;

        e.preventDefault();

        //console.log('onMouseDown', x, y);
    };

    const onMouseUp = (e: MouseEvent) => {

        endScroll();
    };

    const onMouseMove = (e: MouseEvent) => {

        let x = e.pageX;
        let y = e.pageY;

        if (!internalState.current.isMouseDown) {

            internalState.current.lastMouseX = x;
            internalState.current.lastMouseY = y;
            return;
        }

        internalState.current.isScrolling = true;

        const dx = -(x - internalState.current.lastMouseX);
        const dy = -(y - internalState.current.lastMouseY);
        internalState.current.lastMouseX = x;
        internalState.current.lastMouseY = y;

        scroll({ dx, dy });

        //console.log('onMouseMove', dx, dy);
    };

    const onMouseEnter = (e: React.MouseEvent) => {

        internalState.current.isFocused = true;

        // console.log('onMouseEnter');
    };

    const onMouseLeave = (e: React.MouseEvent) => {

        internalState.current.isFocused = false;

        // console.log('onMouseLeave');
    };

    const onTouchStart = (e: React.TouchEvent) => {

        if (!e.touches || !e.touches[0]) {
            return;
        }

        let x = e.touches[0].pageX;
        let y = e.touches[0].pageY;

        internalState.current.isTouch = true;
        internalState.current.lastMouseX = x;
        internalState.current.lastMouseY = y;

        //console.log('onTouchStart', x, y);
    };

    const onTouchUp = (e: MouseEvent) => {

        endScroll();
    };

    const onTouchMove = (e: TouchEvent) => {

        if (!e.touches || !e.touches[0]) {
            return;
        }

        let x = e.touches[0].pageX;
        let y = e.touches[0].pageY;

        if (!internalState.current.isTouch) {

            internalState.current.lastMouseX = x;
            internalState.current.lastMouseY = y;
            return;
        }

        internalState.current.isScrolling = true;

        const dx = -(x - internalState.current.lastMouseX);
        const dy = -(y - internalState.current.lastMouseY);
        internalState.current.lastMouseX = x;
        internalState.current.lastMouseY = y;

        scroll({ dx, dy });

        //console.log('onTouchMove', dx, dy);
    };

    const onWheel = (e: React.WheelEvent) => {

        let dx = 0;
        let dy = (e.deltaY > 0 ? wheelScrollY : -wheelScrollY);

        scroll({ dx, dy });

        // console.log('onMouseLeave');
    };

    const onKeyDown = (e: KeyboardEvent) => {

        if (e.key === ' ') {

            if (internalState.current.isFocused) {

                internalState.current.isMouseDown = true;

                // console.log('isScrolling');
            }
        }
    };

    const onKeyUp = (e: KeyboardEvent) => {

        if (e.key === ' ') {

            onMouseUp(null);
        }
    };

    React.useEffect(() => {

        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchend', onTouchUp);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return function cleanup() {

            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchend', onTouchUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    });

    return (
        <div ref={containerRef} className="ui-scroll-view-container"
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onWheel={onWheel}
        >
            {content({ ref: contentRef })}
        </div>
    );
}
