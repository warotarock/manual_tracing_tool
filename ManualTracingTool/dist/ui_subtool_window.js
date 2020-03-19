var ManualTracingTool;
(function (ManualTracingTool) {
    function UI_SubToolWindow(_a) {
        var ref = _a.ref;
        var _b = React.useState([]), items = _b[0], setItems = _b[1];
        var _c = React.useState(0), active_SubToolIndex = _c[0], setActive_SubToolIndex = _c[1];
        React.useEffect(function () {
            ref.update = function (items, subToolIndex) {
                setItems(items);
                setActive_SubToolIndex(subToolIndex);
            };
            return function cleanup() {
                ref.update = null;
            };
        });
        return (React.createElement("div", null, items.map(function (item) { return (React.createElement("div", { key: item.subToolIndex, className: "list-item " + item.tool.toolBarImage.cssImageClassName + " " + (active_SubToolIndex == item.subToolIndex ? 'active' : ''), style: { backgroundPosition: "0 -" + item.tool.toolBarImageIndex * 64 + "px", opacity: (item.isAvailable ? 1.0 : 0.5) }, onClick: function () { ref.item_Click(item); } },
            React.createElement("div", { className: 'spacer' }),
            item.buttons.length > 0 &&
                React.createElement("div", { className: 'command-button image-splite-system', style: { backgroundPosition: "-" + (item.buttonStateID - 1) * 64 + "px 0" }, onClick: function () { ref.itemButton_Click(item); } }))); })));
    }
    ManualTracingTool.UI_SubToolWindow = UI_SubToolWindow;
})(ManualTracingTool || (ManualTracingTool = {}));
