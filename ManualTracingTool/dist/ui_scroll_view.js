var ManualTracingTool;
(function (ManualTracingTool) {
    function UI_ScrollView(_a) {
        var content = _a.content, _b = _a.contentRef, contentRef = _b === void 0 ? null : _b, _c = _a.wheelScrollY, wheelScrollY = _c === void 0 ? 16 : _c;
        var _d;
        var containerRef = React.useRef(null);
        var internalState = React.useRef({
            lastMouseX: null,
            lastMouseY: null,
            isMouseDown: false,
            isTouch: false,
            isScrolling: false,
            isFocused: false,
        });
        var scroll = React.useCallback(function (_a) {
            var dx = _a.dx, dy = _a.dy;
            containerRef.current.scrollTop += dy;
        }, [(_d = containerRef.current) === null || _d === void 0 ? void 0 : _d.scrollTop]);
        var endScroll = function () {
            internalState.current.isMouseDown = false;
            internalState.current.isTouch = false;
            internalState.current.lastMouseX = null;
            internalState.current.lastMouseY = null;
            internalState.current.isScrolling = false;
        };
        var onMouseDown = function (e) {
            var x = e.pageX;
            var y = e.pageY;
            internalState.current.isMouseDown = true;
            internalState.current.lastMouseX = x;
            internalState.current.lastMouseY = y;
            e.preventDefault();
            //console.log('onMouseDown', x, y);
        };
        var onMouseUp = function (e) {
            endScroll();
        };
        var onMouseMove = function (e) {
            var x = e.pageX;
            var y = e.pageY;
            if (!internalState.current.isMouseDown) {
                internalState.current.lastMouseX = x;
                internalState.current.lastMouseY = y;
                return;
            }
            internalState.current.isScrolling = true;
            var dx = -(x - internalState.current.lastMouseX);
            var dy = -(y - internalState.current.lastMouseY);
            internalState.current.lastMouseX = x;
            internalState.current.lastMouseY = y;
            scroll({ dx: dx, dy: dy });
            //console.log('onMouseMove', dx, dy);
        };
        var onMouseEnter = function (e) {
            internalState.current.isFocused = true;
            // console.log('onMouseEnter');
        };
        var onMouseLeave = function (e) {
            internalState.current.isFocused = false;
            // console.log('onMouseLeave');
        };
        var onTouchStart = function (e) {
            if (!e.touches || !e.touches[0]) {
                return;
            }
            var x = e.touches[0].pageX;
            var y = e.touches[0].pageY;
            internalState.current.isTouch = true;
            internalState.current.lastMouseX = x;
            internalState.current.lastMouseY = y;
            //console.log('onTouchStart', x, y);
        };
        var onTouchUp = function (e) {
            endScroll();
        };
        var onTouchMove = function (e) {
            if (!e.touches || !e.touches[0]) {
                return;
            }
            var x = e.touches[0].pageX;
            var y = e.touches[0].pageY;
            if (!internalState.current.isTouch) {
                internalState.current.lastMouseX = x;
                internalState.current.lastMouseY = y;
                return;
            }
            internalState.current.isScrolling = true;
            var dx = -(x - internalState.current.lastMouseX);
            var dy = -(y - internalState.current.lastMouseY);
            internalState.current.lastMouseX = x;
            internalState.current.lastMouseY = y;
            scroll({ dx: dx, dy: dy });
            //console.log('onTouchMove', dx, dy);
        };
        var onWheel = function (e) {
            var dx = 0;
            var dy = (e.deltaY > 0 ? wheelScrollY : -wheelScrollY);
            scroll({ dx: dx, dy: dy });
            // console.log('onMouseLeave');
        };
        var onKeyDown = function (e) {
            if (e.key === ' ') {
                if (internalState.current.isFocused) {
                    internalState.current.isMouseDown = true;
                    // console.log('isScrolling');
                }
            }
        };
        var onKeyUp = function (e) {
            if (e.key === ' ') {
                onMouseUp(null);
            }
        };
        React.useEffect(function () {
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
        return (React.createElement("div", { ref: containerRef, className: "ui-scroll-view-container", onMouseDown: onMouseDown, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, onTouchStart: onTouchStart, onWheel: onWheel }, content({ ref: contentRef })));
    }
    ManualTracingTool.UI_ScrollView = UI_ScrollView;
})(ManualTracingTool || (ManualTracingTool = {}));
