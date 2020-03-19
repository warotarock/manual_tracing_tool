"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var ReactDOM = require("react-dom");
var ReactLib = /** @class */ (function () {
    function ReactLib() {
    }
    ReactLib.GetReact = function () {
        return React;
    };
    ReactLib.GetReactDOM = function () {
        return ReactDOM;
    };
    return ReactLib;
}());
window["ReactLib"] = ReactLib;
