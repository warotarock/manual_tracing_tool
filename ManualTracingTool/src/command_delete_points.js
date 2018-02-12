var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var CommandEditVectorGroup = /** @class */ (function () {
        function CommandEditVectorGroup() {
            this.group = null;
            this.oldLineList = null;
            this.newLineList = null;
        }
        return CommandEditVectorGroup;
    }());
    var CommandEditVectorLine = /** @class */ (function () {
        function CommandEditVectorLine() {
            this.line = null;
            this.oldPointList = null;
            this.newPointList = null;
        }
        return CommandEditVectorLine;
    }());
    var Command_DeletePoints = /** @class */ (function (_super) {
        __extends(Command_DeletePoints, _super);
        function Command_DeletePoints() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.layer = null;
            _this.editGroups = null;
            _this.editLines = null;
            return _this;
        }
        Command_DeletePoints.prototype.collectEditTargets = function (layer) {
            if (this.errorCheck(layer)) {
                return false;
            }
            // Collect deletion target points, if a line has no points in result, delete that line. A group remains even if there is no lines.
            var modifiedGroupCount = 0;
            for (var _i = 0, _a = layer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                var deleteLineCount = 0;
                var modifiedLineCount = 0;
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    var deletePointCount = 0;
                    // Set flag to delete points
                    for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                        var point = _e[_d];
                        if (point.isSelected && point.modifyFlag == ManualTracingTool.ModifyFlagID.none) {
                            point.modifyFlag = ManualTracingTool.ModifyFlagID.delete;
                            deletePointCount++;
                        }
                    }
                    // Set flag to delete line
                    if (deletePointCount > 0 && line.modifyFlag == ManualTracingTool.ModifyFlagID.none) {
                        if (deletePointCount >= line.points.length) {
                            line.modifyFlag = ManualTracingTool.ModifyFlagID.delete;
                            deleteLineCount++;
                        }
                        else {
                            line.modifyFlag = ManualTracingTool.ModifyFlagID.deletePoints;
                        }
                        modifiedLineCount++;
                    }
                }
                // Set modify flag to group
                if (deleteLineCount > 0) {
                    group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.deleteLines;
                }
                if (modifiedLineCount > 0) {
                    group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.deletePoints;
                }
                if (group.modifyFlag != ManualTracingTool.VectorGroupModifyFlagID.none || group.linePointModifyFlag != ManualTracingTool.VectorGroupModifyFlagID.none) {
                    modifiedGroupCount++;
                }
            }
            // If nochange, cancel it
            if (modifiedGroupCount == 0) {
                return false;
            }
            // Create command argument
            var editGroups = new List();
            var editLines = new List();
            for (var _f = 0, _g = layer.groups; _f < _g.length; _f++) {
                var group = _g[_f];
                if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none
                    && group.linePointModifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none) {
                    continue;
                }
                var newLineList = null;
                for (var _h = 0, _j = group.lines; _h < _j.length; _h++) {
                    var line = _j[_h];
                    if (line.modifyFlag == ManualTracingTool.ModifyFlagID.deletePoints) {
                        // Delete points by creating new list
                        var newPointList = new List();
                        for (var _k = 0, _l = line.points; _k < _l.length; _k++) {
                            var point = _l[_k];
                            if (point.modifyFlag == ManualTracingTool.ModifyFlagID.none) {
                                newPointList.push(point);
                            }
                        }
                        // Push to command argument
                        var editLine = new CommandEditVectorLine();
                        editLine.line = line;
                        editLine.oldPointList = line.points;
                        editLine.newPointList = newPointList;
                        editLines.push(editLine);
                    }
                    if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.deleteLines) {
                        if (line.modifyFlag != ManualTracingTool.ModifyFlagID.delete) {
                            // Delete lines by creating new list
                            if (newLineList == null) {
                                newLineList = new List();
                            }
                            newLineList.push(line);
                        }
                    }
                }
                // Push to command argument
                var editGroup = new CommandEditVectorGroup();
                editGroup.group = group;
                editGroup.oldLineList = group.lines;
                if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.deleteLines) {
                    editGroup.newLineList = newLineList;
                }
                else {
                    editGroup.newLineList = group.lines;
                }
                editGroups.push(editGroup);
            }
            // Set command arguments
            this.editGroups = editGroups;
            this.editLines = editLines;
            // Clear flags
            for (var _m = 0, _o = layer.groups; _m < _o.length; _m++) {
                var group = _o[_m];
                group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
                group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
                for (var _p = 0, _q = group.lines; _p < _q.length; _p++) {
                    var line = _q[_p];
                    line.modifyFlag = ManualTracingTool.ModifyFlagID.none;
                    for (var _r = 0, _s = line.points; _r < _s.length; _r++) {
                        var point = _s[_r];
                        point.modifyFlag = ManualTracingTool.ModifyFlagID.none;
                    }
                }
            }
            this.layer = layer;
            return true;
        };
        Command_DeletePoints.prototype.execute = function (env) {
            this.executeTargets();
        };
        Command_DeletePoints.prototype.executeTargets = function () {
            for (var _i = 0, _a = this.editGroups; _i < _a.length; _i++) {
                var editGroup = _a[_i];
                editGroup.group.lines = editGroup.newLineList;
            }
            for (var _b = 0, _c = this.editLines; _b < _c.length; _b++) {
                var editLine = _c[_b];
                editLine.line.points = editLine.newPointList;
            }
        };
        Command_DeletePoints.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editGroups; _i < _a.length; _i++) {
                var editGroup = _a[_i];
                editGroup.group.lines = editGroup.oldLineList;
            }
            for (var _b = 0, _c = this.editLines; _b < _c.length; _b++) {
                var editLine = _c[_b];
                editLine.line.points = editLine.oldPointList;
            }
        };
        Command_DeletePoints.prototype.redo = function (env) {
            this.executeTargets();
        };
        Command_DeletePoints.prototype.errorCheck = function (layer) {
            if (layer == null) {
                return true;
            }
            return false;
        };
        return Command_DeletePoints;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_DeletePoints = Command_DeletePoints;
})(ManualTracingTool || (ManualTracingTool = {}));
