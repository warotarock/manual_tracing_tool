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
    var Command_DeletePoints_EditGroup = /** @class */ (function () {
        function Command_DeletePoints_EditGroup() {
            this.group = null;
            this.oldLineList = null;
            this.newLineList = null;
        }
        return Command_DeletePoints_EditGroup;
    }());
    var Command_DeletePoints_EditLine = /** @class */ (function () {
        function Command_DeletePoints_EditLine() {
            this.targetLine = null;
            this.oldPointList = null;
            this.newPointList = null;
        }
        return Command_DeletePoints_EditLine;
    }());
    var Command_DeletePoints = /** @class */ (function (_super) {
        __extends(Command_DeletePoints, _super);
        function Command_DeletePoints() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.layer = null;
            _this.editGroups = null;
            _this.editLines = null;
            _this.deletedLines = null;
            _this.deletedPoints = null;
            return _this;
        }
        Command_DeletePoints.prototype.prepareEditTargets = function (layer, geometry) {
            if (this.errorCheck(layer)) {
                return false;
            }
            // Set modify flags to groups, lines and points. If a line has no points in result, set delete flag to the line. A group remains even if there is no lines.
            var existsChanges = this.setDeleteFlags(geometry);
            // If no change, cancel it
            if (!existsChanges) {
                return false;
            }
            this.setDeleteFlagsForGroups(layer, geometry);
            this.collectEditTargets(layer, geometry);
            return true;
        };
        Command_DeletePoints.prototype.collectEditTargets = function (layer, geometry) {
            // Collect informations for modified lines and deleted points
            var editLines = new List();
            var deletedPoints = new List();
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                if (group.linePointModifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none) {
                    continue;
                }
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.delete) {
                        for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                            var point = _e[_d];
                            deletedPoints.push(point);
                        }
                    }
                    else if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.deletePoints) {
                        // Delete points by creating new list
                        var newPointList = new List();
                        for (var _f = 0, _g = line.points; _f < _g.length; _f++) {
                            var point = _g[_f];
                            if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                                newPointList.push(point);
                            }
                            else {
                                deletedPoints.push(point);
                            }
                        }
                        var editLine = new Command_DeletePoints_EditLine();
                        editLine.targetLine = line;
                        editLine.oldPointList = line.points;
                        editLine.newPointList = newPointList;
                        editLines.push(editLine);
                    }
                }
            }
            // Collect informations for modified groups and deleted lines
            var editGroups = new List();
            var deletedLines = new List();
            for (var _h = 0, _j = geometry.groups; _h < _j.length; _h++) {
                var group = _j[_h];
                if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none) {
                    continue;
                }
                var newLineList = null;
                if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.deleteLines) {
                    newLineList = new List();
                    for (var _k = 0, _l = group.lines; _k < _l.length; _k++) {
                        var line = _l[_k];
                        if (line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.delete) {
                            newLineList.push(line);
                        }
                        else {
                            deletedLines.push(line);
                        }
                    }
                }
                else {
                    newLineList = group.lines;
                }
                var editGroup = new Command_DeletePoints_EditGroup();
                editGroup.group = group;
                editGroup.oldLineList = group.lines;
                editGroup.newLineList = newLineList;
                editGroups.push(editGroup);
            }
            // Set command arguments
            this.editGroups = editGroups;
            this.editLines = editLines;
            this.deletedLines = deletedLines;
            this.deletedPoints = deletedPoints;
            this.layer = layer;
        };
        Command_DeletePoints.prototype.setDeleteFlagsForGroups = function (layer, geometry) {
            var modifiedGroupCount = 0;
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                var deleteLineCount = 0;
                var modifiedLineCount = 0;
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    var deletePointCount = 0;
                    // Check deleting points
                    for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                        var point = _e[_d];
                        if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.delete) {
                            deletePointCount++;
                        }
                    }
                    // Set flag to delete line
                    if (deletePointCount > 0 && line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.none) {
                        if (line.points.length - deletePointCount <= 1) {
                            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.delete;
                            deleteLineCount++;
                        }
                        else {
                            line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.deletePoints;
                        }
                        modifiedLineCount++;
                    }
                }
                // Set modify flag to group
                if (deleteLineCount > 0) {
                    group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.deleteLines;
                }
                if (modifiedLineCount > 0) {
                    group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.modifyLines;
                }
                if (group.modifyFlag != ManualTracingTool.VectorGroupModifyFlagID.none || group.linePointModifyFlag != ManualTracingTool.VectorGroupModifyFlagID.none) {
                    modifiedGroupCount++;
                }
            }
        };
        Command_DeletePoints.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_DeletePoints.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editGroups; _i < _a.length; _i++) {
                var editGroup = _a[_i];
                editGroup.group.lines = editGroup.oldLineList;
            }
            for (var _b = 0, _c = this.editLines; _b < _c.length; _b++) {
                var editLine = _c[_b];
                editLine.targetLine.points = editLine.oldPointList;
                ManualTracingTool.Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
            for (var _d = 0, _e = this.deletedLines; _d < _e.length; _d++) {
                var line = _e[_d];
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
            }
            for (var _f = 0, _g = this.deletedPoints; _f < _g.length; _f++) {
                var point = _g[_f];
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
            }
        };
        Command_DeletePoints.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editGroups; _i < _a.length; _i++) {
                var editGroup = _a[_i];
                editGroup.group.lines = editGroup.newLineList;
                editGroup.group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
            }
            for (var _b = 0, _c = this.editLines; _b < _c.length; _b++) {
                var editLine = _c[_b];
                editLine.targetLine.points = editLine.newPointList;
                editLine.targetLine.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
                ManualTracingTool.Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
            for (var _d = 0, _e = this.deletedLines; _d < _e.length; _d++) {
                var line = _e[_d];
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.delete;
            }
            for (var _f = 0, _g = this.deletedPoints; _f < _g.length; _f++) {
                var point = _g[_f];
                point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
            }
        };
        Command_DeletePoints.prototype.errorCheck = function (layer) {
            if (layer == null) {
                return true;
            }
            return false;
        };
        Command_DeletePoints.prototype.setDeleteFlags = function (geometry) {
            return false;
        };
        return Command_DeletePoints;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_DeletePoints = Command_DeletePoints;
    var Command_DeleteSelectedPoints = /** @class */ (function (_super) {
        __extends(Command_DeleteSelectedPoints, _super);
        function Command_DeleteSelectedPoints() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Command_DeleteSelectedPoints.prototype.setDeleteFlags = function (geometry) {
            var deletePointCount = 0;
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    // Set flag to delete points
                    for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                        var point = _e[_d];
                        if (point.isSelected && point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.none) {
                            point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.delete;
                            deletePointCount++;
                        }
                    }
                }
            }
            return (deletePointCount > 0);
        };
        return Command_DeleteSelectedPoints;
    }(Command_DeletePoints));
    ManualTracingTool.Command_DeleteSelectedPoints = Command_DeleteSelectedPoints;
    var Command_DeleteFlagedPoints = /** @class */ (function (_super) {
        __extends(Command_DeleteFlagedPoints, _super);
        function Command_DeleteFlagedPoints() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Command_DeleteFlagedPoints.prototype.setDeleteFlags = function (geometry) {
            var deletePointCount = 0;
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    // Set flag to delete points
                    for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                        var point = _e[_d];
                        if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.delete) {
                            deletePointCount++;
                        }
                    }
                }
            }
            return (deletePointCount > 0);
        };
        return Command_DeleteFlagedPoints;
    }(Command_DeletePoints));
    ManualTracingTool.Command_DeleteFlagedPoints = Command_DeleteFlagedPoints;
})(ManualTracingTool || (ManualTracingTool = {}));
