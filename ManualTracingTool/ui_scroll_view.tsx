
namespace ManualTracingTool {

    export function UI_ScrollView({ children, wheelScrollY = 16 }) {

        let containerRef = React.useRef(null);

        let internalState = React.useRef({
            lastMouseX: null,
            lastMouseY: null,
            isMouseDown: false,
            isScrolling: false,
            isFocused: false,
        });

        let runScroll = ({ dx, dy }) => {

            containerRef.current.scrollTop += dy;
        };

        let scroll = React.useCallback(({ dx, dy }) => {

            runScroll({ dx, dy });

        }, [containerRef.current?.scrollTop]);

        let onMouseDown = (e: React.MouseEvent) => {

            internalState.current.isMouseDown = true;
            internalState.current.lastMouseX = e.clientX;
            internalState.current.lastMouseY = e.clientY;

            e.preventDefault();
        };

        let onMouseUp = (e: MouseEvent) => {

            internalState.current.isMouseDown = false;
            internalState.current.lastMouseX = null;
            internalState.current.lastMouseY = null;
            internalState.current.isScrolling = false;
        };

        let onMouseMove = (e: MouseEvent) => {

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

        let onMouseEnter = (e: React.MouseEvent) => {

            internalState.current.isFocused = true;

            // console.log('onMouseEnter');
        };

        let onMouseLeave = (e: React.MouseEvent) => {

            internalState.current.isFocused = false;

            // console.log('onMouseLeave');
        };

        let onWheel = (e: React.WheelEvent) => {

            let dx = 0;
            let dy = (e.deltaY > 0 ? wheelScrollY : -wheelScrollY);

            scroll({ dx, dy });

            // console.log('onMouseLeave');
        };

        let onKeyDown = (e: KeyboardEvent) => {

            if (e.key === ' ') {

                if (internalState.current.isFocused) {

                    internalState.current.isMouseDown = true;

                    // console.log('isScrolling');
                }
            }
        };

        let onKeyUp = (e: KeyboardEvent) => {

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
            <div ref={containerRef} className="scroll-container"
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onWheel={onWheel}
            >
                { children() }
            </div>
        );
    }
}