
namespace ManualTracingTool {

    export function UI_ScrollView({ content, contentRef = null, wheelScrollY = 16 }) {

        const containerRef = React.useRef(null);

        const internalState = React.useRef({
            lastMouseX: null,
            lastMouseY: null,
            isMouseDown: false,
            isScrolling: false,
            isFocused: false,
        });

        const runScroll = ({ dx, dy }) => {

            containerRef.current.scrollTop += dy;
        };

        const scroll = React.useCallback(({ dx, dy }) => {

            runScroll({ dx, dy });

        }, [containerRef.current?.scrollTop]);

        const onMouseDown = (e: React.MouseEvent) => {

            internalState.current.isMouseDown = true;
            internalState.current.lastMouseX = e.clientX;
            internalState.current.lastMouseY = e.clientY;

            e.preventDefault();
        };

        const onMouseUp = (e: MouseEvent) => {

            internalState.current.isMouseDown = false;
            internalState.current.lastMouseX = null;
            internalState.current.lastMouseY = null;
            internalState.current.isScrolling = false;
        };

        const onMouseMove = (e: MouseEvent) => {

            if (!internalState.current.isMouseDown) {

                internalState.current.lastMouseX = e.clientX;
                internalState.current.lastMouseY = e.clientY;
                return;
            }

            internalState.current.isScrolling = true;

            const dx = -(e.clientX - internalState.current.lastMouseX);
            const dy = -(e.clientY - internalState.current.lastMouseY);
            internalState.current.lastMouseX = e.clientX;
            internalState.current.lastMouseY = e.clientY;

            scroll({ dx, dy });

            // console.log(dx, dy);
        };

        const onMouseEnter = (e: React.MouseEvent) => {

            internalState.current.isFocused = true;

            // console.log('onMouseEnter');
        };

        const onMouseLeave = (e: React.MouseEvent) => {

            internalState.current.isFocused = false;

            // console.log('onMouseLeave');
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
            window.addEventListener('keydown', onKeyDown);
            window.addEventListener('keyup', onKeyUp);

            return function cleanup() {

                window.removeEventListener('mouseup', onMouseUp);
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('keyup', onKeyUp);
            };
        });

        return (
            <div ref={containerRef} className="ui-scroll-view-container"
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onWheel={onWheel}
            >
                {content({ ref: contentRef })}
            </div>
        );
    }
}