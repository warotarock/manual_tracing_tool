var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var UI_MenuButtons = /** @class */ (function (_super) {
        __extends(UI_MenuButtons, _super);
        function UI_MenuButtons(props) {
            var _this = _super.call(this, props) || this;
            _this.state = {
                activeElementID: ''
            };
            return _this;
        }
        UI_MenuButtons.prototype.render = function () {
            return (React.createElement(React.Fragment, null,
                React.createElement("div", { id: "menu_btnDrawTool", className: this.getClassName('menu_btnDrawTool') }, "Draw"),
                React.createElement("div", { id: "menu_btnEditTool", className: this.getClassName('menu_btnEditTool') }, "Edit"),
                React.createElement("div", { id: "menu_btnMiscTool", className: this.getClassName('menu_btnMiscTool') }, "Setting")));
        };
        UI_MenuButtons.prototype.getClassName = function (id) {
            if (this.state.activeElementID == id) {
                return 'selectedMainButton';
            }
            else {
                return 'unselectedMainButton';
            }
        };
        return UI_MenuButtons;
    }(React.Component));
    ManualTracingTool.UI_MenuButtons = UI_MenuButtons;
})(ManualTracingTool || (ManualTracingTool = {}));
