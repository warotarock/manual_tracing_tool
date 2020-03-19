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
    var Tool_Resample_Segment_EditLine = /** @class */ (function () {
        function Tool_Resample_Segment_EditLine() {
            this.targetLine = null;
            this.oldPoints = null;
            this.newPoints = null;
        }
        return Tool_Resample_Segment_EditLine;
    }());
    var Tool_Resample_Segment = /** @class */ (function (_super) {
        __extends(Tool_Resample_Segment, _super);
        function Tool_Resample_Segment() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'エンターキーで選択中の頂点の間を画面の拡大率に合わせて再分割します。';
            _this.targetGroups = null;
            _this.editLines = null;
            return _this;
        }
        Tool_Resample_Segment.prototype.isAvailable = function (env) {
            return (env.isCurrentLayerVectorLayer()
                && ManualTracingTool.Layer.isEditTarget(env.currentVectorLayer));
        };
        Tool_Resample_Segment.prototype.toolWindowItemClick = function (env) {
            env.setCurrentOperationUnitID(ManualTracingTool.OperationUnitID.linePoint);
            env.setRedrawMainWindow();
        };
        Tool_Resample_Segment.prototype.keydown = function (e, env) {
            if (e.key == 'Enter') {
                if (env.currentVectorLayer != null) {
                    this.executeCommand(env);
                    return true;
                }
            }
            return false;
        };
        Tool_Resample_Segment.prototype.executeCommand = function (env) {
            if (this.collectEditTargets(env.currentVectorGeometry, env)) {
                var command = new Command_Resample_Segment();
                command.editLines = this.editLines;
                command.useGroups(this.targetGroups);
                command.executeCommand(env);
                env.commandHistory.addCommand(command);
                env.setRedrawMainWindowEditorWindow();
            }
        };
        Tool_Resample_Segment.prototype.collectEditTargets = function (geometry, env) {
            var _this = this;
            var viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            var targetGroups = new List();
            var editLines = new List();
            var resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, function (group) {
                var existsInGroup = false;
                for (var _i = 0, _a = group.lines; _i < _a.length; _i++) {
                    var line = _a[_i];
                    if (line.isSelected && _this.existsSelectedSegment(line)) {
                        var editLine = new Tool_Resample_Segment_EditLine();
                        editLine.targetLine = line;
                        editLine.oldPoints = line.points;
                        editLine.newPoints = _this.createResampledPoints(editLine.targetLine, resamplingUnitLength);
                        editLines.push(editLine);
                        existsInGroup = true;
                    }
                }
                if (existsInGroup) {
                    targetGroups.push(group);
                }
            });
            this.targetGroups = targetGroups;
            this.editLines = editLines;
            return (editLines.length > 0);
        };
        Tool_Resample_Segment.prototype.existsSelectedSegment = function (line) {
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
        Tool_Resample_Segment.prototype.createResampledPoints = function (line, resamplingUnitLength) {
            var currentIndex = 0;
            var segmentStartIndex = -1;
            var segmentEndIndex = -1;
            var newPoints = new List();
            while (currentIndex < line.points.length) {
                var currentPoint = line.points[currentIndex];
                // selected segment
                if (currentPoint.isSelected) {
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
                        ManualTracingTool.Logic_Edit_Points.resamplePoints(newPoints, line.points, segmentStartIndex, segmentEndIndex, resamplingUnitLength);
                    }
                    // if no segment, execute insert current point
                    else {
                        var point = line.points[currentIndex];
                        newPoints.push(point);
                    }
                    currentIndex = segmentEndIndex + 1;
                }
                // non-selected segment
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
                    // execute insert original points
                    for (var i = segmentStartIndex; i <= segmentEndIndex; i++) {
                        var point = line.points[i];
                        newPoints.push(point);
                    }
                    currentIndex = segmentEndIndex + 1;
                }
            }
            return newPoints;
        };
        return Tool_Resample_Segment;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_Resample_Segment = Tool_Resample_Segment;
    var Command_Resample_Segment = /** @class */ (function (_super) {
        __extends(Command_Resample_Segment, _super);
        function Command_Resample_Segment() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editLines = null;
            return _this;
        }
        Command_Resample_Segment.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_Resample_Segment.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editLines; _i < _a.length; _i++) {
                var editLine = _a[_i];
                editLine.targetLine.points = editLine.oldPoints;
            }
            this.updateRelatedObjects();
        };
        Command_Resample_Segment.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editLines; _i < _a.length; _i++) {
                var editLine = _a[_i];
                editLine.targetLine.points = editLine.newPoints;
            }
            this.updateRelatedObjects();
        };
        Command_Resample_Segment.prototype.updateRelatedObjects = function () {
            for (var _i = 0, _a = this.editLines; _i < _a.length; _i++) {
                var editLine = _a[_i];
                ManualTracingTool.Logic_Edit_Line.calculateParameters(editLine.targetLine);
            }
        };
        return Command_Resample_Segment;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Resample_Segment = Command_Resample_Segment;
})(ManualTracingTool || (ManualTracingTool = {}));
