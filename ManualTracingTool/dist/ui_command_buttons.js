var ManualTracingTool;
(function (ManualTracingTool) {
    function UI_CommandButtons(_a) {
        var props = _a.props;
        var _b = React.useState((function () {
            var init_Items = [];
            for (var i = 0; i < 30; i++) {
                init_Items.push(i);
            }
            return init_Items;
        })()), items = _b[0], setItems = _b[1];
        return (React.createElement("div", null, items.map(function (i) { return (React.createElement("div", { key: i }, i)); })));
    }
    ManualTracingTool.UI_CommandButtons = UI_CommandButtons;
})(ManualTracingTool || (ManualTracingTool = {}));
