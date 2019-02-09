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
    var DivideLine_EditGroup = /** @class */ (function () {
        function DivideLine_EditGroup() {
            this.targetGroup = null;
            this.newLines = new List();
            this.oldLines = null;
            this.editLines = new List();
        }
        return DivideLine_EditGroup;
    }());
    var DivideLine_EditLine = /** @class */ (function () {
        function DivideLine_EditLine() {
            this.editPoints = new List();
        }
        return DivideLine_EditLine;
    }());
    var DivideLine_EditPoint = /** @class */ (function () {
        function DivideLine_EditPoint() {
            this.targetPoint = null;
            this.newLengthTo = 0.0;
            this.newLengthFrom = 0.0;
            this.oldLengthTo = 0.0;
            this.oldLengthFrom = 0.0;
        }
        return DivideLine_EditPoint;
    }());
    var Selector_DeleteLinePoint_DivideLine = /** @class */ (function (_super) {
        __extends(Selector_DeleteLinePoint_DivideLine, _super);
        function Selector_DeleteLinePoint_DivideLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.segmentMat4 = mat4.create();
            _this.invMat4 = mat4.create();
            _this.normalVec = vec3.create();
            _this.localLocation = vec3.create();
            _this.edited = false;
            return _this;
        }
        Selector_DeleteLinePoint_DivideLine.prototype.beforeHitTest = function () {
            this.selectionInfo.clear();
            this.edited = false;
        };
        Selector_DeleteLinePoint_DivideLine.prototype.beforeHitTestToGroup = function (geometry, group) {
        };
        Selector_DeleteLinePoint_DivideLine.prototype.beforeHitTestToLine = function (group, line) {
        };
        Selector_DeleteLinePoint_DivideLine.prototype.onLineSegmentHited = function (line, point1, point2, x, y, minDistance, distanceSQ) {
            this.createEditPoint(line, point1, point2, x, y, minDistance);
        };
        Selector_DeleteLinePoint_DivideLine.prototype.afterHitTestToLine = function (group, line) {
        };
        Selector_DeleteLinePoint_DivideLine.prototype.afterHitTestToGroup = function (geometry, group) {
        };
        Selector_DeleteLinePoint_DivideLine.prototype.createEditPoint = function (line, point1, point2, x, y, minDistance) {
            var edited = false;
            var segmentLength = vec3.distance(point1.location, point2.location);
            if (segmentLength > 0.0) {
                ManualTracingTool.Maths.mat4SegmentMat(this.segmentMat4, this.normalVec, point1.location, point2.location);
                mat4.invert(this.invMat4, this.segmentMat4);
                vec3.set(this.localLocation, x, y, 0.0);
                vec3.transformMat4(this.localLocation, this.localLocation, this.invMat4);
                var dy = 0 - this.localLocation[1];
                var r = minDistance;
                var dx = Math.sqrt(r * r - dy * dy);
                var x1 = this.localLocation[0] - dx;
                var x2 = this.localLocation[0] + dx;
                if (x1 > 0.0 && x1 < segmentLength && x2 >= segmentLength) {
                    var fromX = x1 / segmentLength;
                    if (fromX < point1.adjustingLengthFrom) {
                        point1.adjustingLengthFrom = fromX;
                    }
                    edited = true;
                    point1.adjustingLengthTo = 1.0;
                }
                else if (x2 > 0.0 && x2 < segmentLength && x1 <= 0.0) {
                    edited = true;
                    point1.adjustingLengthFrom = 0.0;
                    var toX = x2 / segmentLength;
                    if (toX > point1.adjustingLengthTo) {
                        point1.adjustingLengthTo = toX;
                    }
                }
                else if (x1 < 0.0 && x2 > segmentLength) {
                    edited = true;
                    point1.adjustingLengthFrom = 0.0;
                    point1.adjustingLengthTo = 1.0;
                }
                else if (x1 > 0.0 && x2 < segmentLength) {
                    var fromX = x1 / segmentLength;
                    if (fromX < point1.adjustingLengthFrom) {
                        edited = true;
                        point1.adjustingLengthFrom = fromX;
                    }
                    var toX = x2 / segmentLength;
                    if (toX > point1.adjustingLengthTo) {
                        edited = true;
                        point1.adjustingLengthTo = toX;
                    }
                }
            }
            else {
                edited = true;
                point1.adjustingLengthFrom = 0.0;
                point1.adjustingLengthTo = 1.0;
            }
            if (edited) {
                line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.edit;
                this.edited = true;
            }
        };
        return Selector_DeleteLinePoint_DivideLine;
    }(ManualTracingTool.Selector_LineSegment_BrushSelect));
    ManualTracingTool.Selector_DeleteLinePoint_DivideLine = Selector_DeleteLinePoint_DivideLine;
    var Tool_DeletePoints_DivideLine = /** @class */ (function (_super) {
        __extends(Tool_DeletePoints_DivideLine, _super);
        function Tool_DeletePoints_DivideLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'ブラシ選択で点を削除します。';
            _this.isEditTool = false; // @override
            _this.logic_Selector = new Selector_DeleteLinePoint_DivideLine(); // @override
            _this.toLocation = vec3.create();
            _this.fromLocation = vec3.create();
            return _this;
        }
        Tool_DeletePoints_DivideLine.prototype.existsResults = function () {
            var selector = this.logic_Selector;
            return selector.edited;
        };
        Tool_DeletePoints_DivideLine.prototype.executeCommand = function (env) {
            var editGroups = new List();
            for (var _i = 0, _a = this.editableKeyframeLayers; _i < _a.length; _i++) {
                var viewKeyframeLayer = _a[_i];
                for (var _b = 0, _c = viewKeyframeLayer.vectorLayerKeyframe.geometry.groups; _b < _c.length; _b++) {
                    var group = _c[_b];
                    for (var _d = 0, _e = group.lines; _d < _e.length; _d++) {
                        var line = _e[_d];
                        if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.edit) {
                            group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.edit;
                            break;
                        }
                    }
                }
                for (var _f = 0, _g = viewKeyframeLayer.vectorLayerKeyframe.geometry.groups; _f < _g.length; _f++) {
                    var group = _g[_f];
                    if (group.modifyFlag == ManualTracingTool.VectorGroupModifyFlagID.none) {
                        continue;
                    }
                    group.modifyFlag = ManualTracingTool.VectorGroupModifyFlagID.none;
                    var editGroup = new DivideLine_EditGroup();
                    editGroup.targetGroup = group;
                    editGroup.oldLines = group.lines;
                    for (var _h = 0, _j = group.lines; _h < _j.length; _h++) {
                        var line = _j[_h];
                        if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.none) {
                            editGroup.newLines.push(line);
                            continue;
                        }
                        line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
                        var newLine = null;
                        var strokeStarted = false;
                        var drawingRemainging = false;
                        for (var pointIndex = 0; pointIndex < line.points.length - 1; pointIndex++) {
                            var fromPoint = line.points[pointIndex];
                            var fromLocation = fromPoint.location;
                            var toPoint = line.points[pointIndex + 1];
                            var toLocation = toPoint.location;
                            var lengthFrom = fromPoint.adjustingLengthFrom;
                            var lengthTo = fromPoint.adjustingLengthTo;
                            fromPoint.adjustingLengthFrom = 1.0;
                            fromPoint.adjustingLengthTo = 0.0;
                            if (lengthFrom == 1.0) {
                                if (!strokeStarted) {
                                    newLine = new ManualTracingTool.VectorLine();
                                    newLine.points.push(fromPoint);
                                }
                                newLine.points.push(toPoint);
                                strokeStarted = true;
                                drawingRemainging = true;
                            }
                            else {
                                // draw segment's from-side part
                                if (lengthFrom > 0.0) {
                                    if (!strokeStarted) {
                                        newLine = new ManualTracingTool.VectorLine();
                                        newLine.points.push(fromPoint);
                                    }
                                    vec3.lerp(this.toLocation, fromLocation, toLocation, lengthFrom);
                                    var newPoint = new ManualTracingTool.LinePoint();
                                    vec3.copy(newPoint.location, this.toLocation);
                                    vec3.copy(newPoint.adjustingLocation, newPoint.location);
                                    newPoint.lineWidth = ManualTracingTool.Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth);
                                    newPoint.adjustingLineWidth = newPoint.lineWidth;
                                    newLine.points.push(newPoint);
                                    editGroup.newLines.push(newLine);
                                    strokeStarted = false;
                                    drawingRemainging = false;
                                }
                                // draw segment's to-side part
                                if (lengthTo > 0.0 && lengthTo < 1.0) {
                                    if (drawingRemainging) {
                                        editGroup.newLines.push(newLine);
                                    }
                                    vec3.lerp(this.fromLocation, fromLocation, toLocation, lengthTo);
                                    newLine = new ManualTracingTool.VectorLine();
                                    var newPoint = new ManualTracingTool.LinePoint();
                                    vec3.copy(newPoint.location, this.fromLocation);
                                    vec3.copy(newPoint.adjustingLocation, newPoint.location);
                                    newPoint.lineWidth = ManualTracingTool.Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth);
                                    newPoint.adjustingLineWidth = newPoint.lineWidth;
                                    newLine.points.push(newPoint);
                                    newLine.points.push(toPoint);
                                    strokeStarted = true;
                                    drawingRemainging = true;
                                }
                            }
                        }
                        if (drawingRemainging) {
                            editGroup.newLines.push(newLine);
                        }
                    }
                    ManualTracingTool.Logic_Edit_Line.calculateParametersV(editGroup.newLines);
                    editGroups.push(editGroup);
                }
            }
            var command = new Command_DeletePoints_DivideLine();
            command.editGroups = editGroups;
            command.execute(env);
            env.commandHistory.addCommand(command);
            env.setRedrawMainWindow();
        };
        return Tool_DeletePoints_DivideLine;
    }(ManualTracingTool.Tool_BrushSelectLinePointBase));
    ManualTracingTool.Tool_DeletePoints_DivideLine = Tool_DeletePoints_DivideLine;
    var Command_DeletePoints_DivideLine = /** @class */ (function (_super) {
        __extends(Command_DeletePoints_DivideLine, _super);
        function Command_DeletePoints_DivideLine() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.editGroups = null;
            return _this;
        }
        Command_DeletePoints_DivideLine.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_DeletePoints_DivideLine.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editGroups; _i < _a.length; _i++) {
                var editGroup = _a[_i];
                editGroup.targetGroup.lines = editGroup.oldLines;
            }
        };
        Command_DeletePoints_DivideLine.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editGroups; _i < _a.length; _i++) {
                var editGroup = _a[_i];
                editGroup.targetGroup.lines = editGroup.newLines;
            }
        };
        return Command_DeletePoints_DivideLine;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_DeletePoints_DivideLine = Command_DeletePoints_DivideLine;
})(ManualTracingTool || (ManualTracingTool = {}));
