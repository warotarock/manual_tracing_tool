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
    var Command_EditGeometry_EditData = /** @class */ (function () {
        function Command_EditGeometry_EditData() {
            this.targetGroup = null;
            this.oldLines = null;
            this.newLines = null;
        }
        return Command_EditGeometry_EditData;
    }());
    var Command_FilterGeometry = /** @class */ (function (_super) {
        __extends(Command_FilterGeometry, _super);
        function Command_FilterGeometry() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editDatas = null;
            return _this;
        }
        Command_FilterGeometry.prototype.prepareEditData = function (env) {
            var _this = this;
            this.useGroups();
            var viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            var editDatas = new List();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, function (group) {
                var newLines = List();
                for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                    var line = _a[_i];
                    if (!line.isSelected) {
                        continue;
                    }
                    var newLine = new ManualTracingTool.VectorLine();
                    for (var _b = 0, _c = line.points; _b < _c.length; _b++) {
                        var point = _c[_b];
                        if (!point.isSelected) {
                            continue;
                        }
                        newLine.points.push(ManualTracingTool.LinePoint.clone(point));
                    }
                    if (newLine.points.length > 0) {
                        newLines.push(newLine);
                    }
                }
                if (newLines.length > 0) {
                    var editData = new Command_EditGeometry_EditData();
                    editData.targetGroup = group;
                    editData.newLines = newLines;
                    editData.oldLines = group.lines;
                    editDatas.push(editData);
                    _this.targetGroups.push(group);
                }
            });
            if (editDatas.length > 0) {
                this.editDatas = editDatas;
                return true;
            }
            else {
                return false;
            }
        };
        Command_FilterGeometry.prototype.isAvailable = function (env) {
            return (this.editDatas != null);
        };
        Command_FilterGeometry.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_FilterGeometry.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editDatas; _i < _a.length; _i++) {
                var editData = _a[_i];
                editData.targetGroup.lines = editData.oldLines;
            }
        };
        Command_FilterGeometry.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editDatas; _i < _a.length; _i++) {
                var editData = _a[_i];
                editData.targetGroup.lines = editData.newLines;
            }
        };
        return Command_FilterGeometry;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_FilterGeometry = Command_FilterGeometry;
    var Command_CopyGeometry = /** @class */ (function (_super) {
        __extends(Command_CopyGeometry, _super);
        function Command_CopyGeometry() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.copy_VectorGroup = null;
            return _this;
        }
        Command_CopyGeometry.prototype.prepareEditData = function (env) {
            var viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            var copy_GroupData = new ManualTracingTool.VectorGroup();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, function (group) {
                for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                    var line = _a[_i];
                    if (!line.isSelected) {
                        continue;
                    }
                    var newLine = new ManualTracingTool.VectorLine();
                    for (var _b = 0, _c = line.points; _b < _c.length; _b++) {
                        var point = _c[_b];
                        if (!point.isSelected) {
                            continue;
                        }
                        newLine.points.push(ManualTracingTool.LinePoint.clone(point));
                    }
                    if (newLine.points.length > 0) {
                        ManualTracingTool.Logic_Edit_Line.calculateParameters(newLine);
                        copy_GroupData.lines.push(newLine);
                    }
                }
            });
            if (copy_GroupData.lines.length > 0) {
                this.copy_VectorGroup = copy_GroupData;
                return true;
            }
            else {
                return false;
            }
        };
        Command_CopyGeometry.prototype.isAvailable = function (env) {
            return (this.copy_VectorGroup != null);
        };
        Command_CopyGeometry.prototype.execute = function (env) {
            // env.clipboard.copy_VectorGroup = this.copy_VectorGroup;
            Platform.clipboard.writeText(JSON.stringify(this.copy_VectorGroup));
        };
        return Command_CopyGeometry;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_CopyGeometry = Command_CopyGeometry;
    var Command_PasteGeometry = /** @class */ (function (_super) {
        __extends(Command_PasteGeometry, _super);
        function Command_PasteGeometry() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editData = null;
            _this.copy_Lines = null;
            return _this;
        }
        Command_PasteGeometry.prototype.prepareEditData = function (env) {
            if (!this.isAvailable(env)) {
                return false;
            }
            this.editData = new Command_EditGeometry_EditData();
            this.editData.targetGroup = env.currentVectorGroup;
            this.editData.oldLines = env.currentVectorGroup.lines;
            this.editData.newLines = ListClone(env.currentVectorGroup.lines);
            // let copy_Lines: List<VectorLine> = JSON.parse(JSON.stringify(env.clipboard.copy_VectorGroup.lines));
            for (var _i = 0, _a = this.copy_Lines; _i < _a.length; _i++) {
                var line = _a[_i];
                line.isSelected = true;
                for (var _b = 0, _c = line.points; _b < _c.length; _b++) {
                    var point = _c[_b];
                    point.isSelected = true;
                }
            }
            ListAddRange(this.editData.newLines, this.copy_Lines);
            return true;
        };
        Command_PasteGeometry.prototype.isAvailable = function (env) {
            // return (env.currentVectorGroup != null
            //     && env.clipboard.copy_VectorGroup != null);
            if (Platform.clipboard.availableFormats('clipboard') == null) {
                return false;
            }
            try {
                var copy_group = JSON.parse(Platform.clipboard.readText('clipboard'));
                if (!copy_group || !copy_group.lines) {
                    return false;
                }
                this.copy_Lines = copy_group.lines;
            }
            catch (e) {
                return false;
            }
            return true;
        };
        Command_PasteGeometry.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_PasteGeometry.prototype.undo = function (env) {
            this.editData.targetGroup.lines = this.editData.oldLines;
        };
        Command_PasteGeometry.prototype.redo = function (env) {
            this.editData.targetGroup.lines = this.editData.newLines;
        };
        return Command_PasteGeometry;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_PasteGeometry = Command_PasteGeometry;
})(ManualTracingTool || (ManualTracingTool = {}));
