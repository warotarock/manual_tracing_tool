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
    var Tool_Resample_Segment_EditGroup = /** @class */ (function () {
        function Tool_Resample_Segment_EditGroup() {
            this.group = null;
        }
        return Tool_Resample_Segment_EditGroup;
    }());
    var Tool_Resample_Segment_EditLine = /** @class */ (function () {
        function Tool_Resample_Segment_EditLine() {
            this.targetLine = null;
            this.oldPointList = null;
            this.newPointList = null;
        }
        return Tool_Resample_Segment_EditLine;
    }());
    var Tool_Resample_Segment = /** @class */ (function (_super) {
        __extends(Tool_Resample_Segment, _super);
        function Tool_Resample_Segment() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.resamplingUnitLength = 1.0;
            return _this;
        }
        Tool_Resample_Segment.prototype.isAvailable = function (env) {
            return (env.currentVectorLayer != null
                && env.currentVectorLayer.isVisible);
        };
        Tool_Resample_Segment.prototype.keydown = function (e, env) {
            if (e.key == 'Enter') {
                if (env.currentVectorLayer != null) {
                    this.executeCommand(env);
                }
            }
        };
        Tool_Resample_Segment.prototype.executeCommand = function (env) {
            var command = new Command_Resample_Segment();
            if (command.collectEditTargets(env.currentVectorGeometry, env)) {
                command.execute(env);
                env.commandHistory.addCommand(command);
                env.setRedrawMainWindowEditorWindow();
            }
        };
        return Tool_Resample_Segment;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_Resample_Segment = Tool_Resample_Segment;
    var Command_Resample_Segment = /** @class */ (function (_super) {
        __extends(Command_Resample_Segment, _super);
        function Command_Resample_Segment() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.resamplingUnitLength = 8.0;
            _this.editGroups = null;
            _this.editLines = null;
            return _this;
        }
        Command_Resample_Segment.prototype.collectEditTargets = function (geometry, env) {
            var editGroups = new List();
            var editLines = new List();
            var modifiedGroupCount = 0;
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                var modifiedLineCount = 0;
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (line.isSelected) {
                        var editLine = this.collectEditTargets_CreateEditLine(line);
                        if (editLine != null) {
                            editLines.push(editLine);
                            editLine.targetLine.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.reampling;
                            modifiedLineCount++;
                        }
                    }
                }
                if (modifiedLineCount == 0) {
                    continue;
                }
                var editGroup = new Tool_Resample_Segment_EditGroup();
                editGroup.group = group;
                editGroups.push(editGroup);
                group.linePointModifyFlag = ManualTracingTool.VectorGroupModifyFlagID.modifyLines;
                modifiedGroupCount++;
            }
            this.editGroups = editGroups;
            this.editLines = editLines;
            return (modifiedGroupCount > 0);
        };
        Command_Resample_Segment.prototype.collectEditTargets_ExistsSelectedSegment = function (line) {
            var selectedPointCount = 0;
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                if (point.isSelected) {
                    selectedPointCount++;
                    if (selectedPointCount >= 2) {
                        break;
                    }
                }
                else {
                    selectedPointCount = 0;
                }
            }
            return (selectedPointCount >= 2);
        };
        Command_Resample_Segment.prototype.collectEditTargets_CreateEditLine = function (line) {
            // check selected point exists
            if (!this.collectEditTargets_ExistsSelectedSegment(line)) {
                return null;
            }
            var result = new Tool_Resample_Segment_EditLine();
            result.targetLine = line;
            result.oldPointList = line.points;
            result.newPointList = new List();
            return result;
        };
        Command_Resample_Segment.prototype.executeResampling = function (env) {
            var resamplingUnitLength = env.getViewScaledLength(this.resamplingUnitLength);
            for (var _i = 0, _a = this.editLines; _i < _a.length; _i++) {
                var editLine = _a[_i];
                this.createResampledLineToEditLine(editLine, resamplingUnitLength);
            }
        };
        Command_Resample_Segment.prototype.createResampledLineToEditLine = function (editLine, resamplingUnitLength) {
            var line = editLine.targetLine;
            var currentIndex = 0;
            var segmentStartIndex = -1;
            var segmentEndIndex = -1;
            while (currentIndex < line.points.length) {
                var currentPoint = line.points[currentIndex];
                var isSelectedSegment = (currentPoint.isSelected);
                // selected segment
                if (isSelectedSegment) {
                    segmentStartIndex = currentIndex;
                    // search end of selected segment
                    for (var i = segmentStartIndex; i < line.points.length; i++) {
                        var point = line.points[i];
                        if (!point.isSelected) {
                            break;
                        }
                        segmentEndIndex = i;
                    }
                    // if exists selected segment, execute resampling
                    if (segmentEndIndex > segmentStartIndex) {
                        ManualTracingTool.Logic_Edit_Points.resamplePoints(editLine.newPointList, line.points, segmentStartIndex, segmentEndIndex, resamplingUnitLength);
                    }
                    else {
                        var point = line.points[currentIndex];
                        editLine.newPointList.push(point);
                    }
                    currentIndex = segmentEndIndex + 1;
                }
                else {
                    segmentStartIndex = currentIndex;
                    // search end of non-selected segment
                    for (var i = segmentStartIndex; i < line.points.length; i++) {
                        var point = line.points[i];
                        if (point.isSelected) {
                            break;
                        }
                        segmentEndIndex = i;
                    }
                    // execute insert original point
                    for (var i = segmentStartIndex; i <= segmentEndIndex; i++) {
                        var point = line.points[i];
                        editLine.newPointList.push(point);
                    }
                    currentIndex = segmentEndIndex + 1;
                }
            }
        };
        Command_Resample_Segment.prototype.execute = function (env) {
            this.errorCheck();
            this.executeResampling(env);
            this.redo(env);
        };
        Command_Resample_Segment.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editLines; _i < _a.length; _i++) {
                var editLine = _a[_i];
                editLine.targetLine.points = editLine.oldPointList;
            }
            this.calculateLineParameters();
        };
        Command_Resample_Segment.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editGroups; _i < _a.length; _i++) {
                var editGroup = _a[_i];
                ManualTracingTool.Logic_VectorLayer.clearGroupModifyFlags(editGroup.group);
            }
            for (var _b = 0, _c = this.editLines; _b < _c.length; _b++) {
                var editLine = _c[_b];
                editLine.targetLine.points = editLine.newPointList;
            }
            this.calculateLineParameters();
        };
        Command_Resample_Segment.prototype.errorCheck = function () {
            if (this.editLines == null) {
                throw ('Command_TransformLattice: line is null!');
            }
        };
        Command_Resample_Segment.prototype.calculateLineParameters = function () {
            for (var _i = 0, _a = this.editLines; _i < _a.length; _i++) {
                var editLine = _a[_i];
                ManualTracingTool.Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
        };
        return Command_Resample_Segment;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Resample_Segment = Command_Resample_Segment;
})(ManualTracingTool || (ManualTracingTool = {}));
