var ManualTracingTool;
(function (ManualTracingTool) {
    class DivideLine_EditGroup {
        constructor() {
            this.targetGroup = null;
            this.newLines = new List();
            this.oldLines = null;
            this.editLines = new List();
        }
    }
    class DivideLine_EditLine {
        constructor() {
            this.editPoints = new List();
        }
    }
    class DivideLine_EditPoint {
        constructor() {
            this.targetPoint = null;
            this.newLengthTo = 0.0;
            this.newLengthFrom = 0.0;
            this.oldLengthTo = 0.0;
            this.oldLengthFrom = 0.0;
        }
    }
    class Selector_DeleteLinePoint_DivideLine extends ManualTracingTool.Selector_LineSegment_BrushSelect {
        constructor() {
            super(...arguments);
            this.segmentMat4 = mat4.create();
            this.invMat4 = mat4.create();
            this.normalVec = vec3.create();
            this.localLocation = vec3.create();
        }
        onLineSegmentHited(group, line, point1, point2, location, minDistanceSQ, distanceSQ) {
            this.createEditPoint(group, line, point1, point2, location, minDistanceSQ);
        }
        createEditPoint(group, line, point1, point2, location, minDistanceSQ) {
            let edited = false;
            let segmentLength = vec3.distance(point1.location, point2.location);
            if (segmentLength <= 0.0) {
                edited = true;
                point1.adjustingLengthFrom = 0.0; // fromを0.0、toを1.0とすることでセグメント全体の削除とする。これによりこのセグメントは描画時にスキップされる。
                point1.adjustingLengthTo = 1.0;
            }
            else {
                ManualTracingTool.Maths.mat4SegmentMat(this.segmentMat4, this.normalVec, point1.location, point2.location);
                mat4.invert(this.invMat4, this.segmentMat4);
                vec3.set(this.localLocation, location[0], location[1], 0.0);
                vec3.transformMat4(this.localLocation, this.localLocation, this.invMat4);
                let dy = 0 - this.localLocation[1];
                if (minDistanceSQ - dy * dy < 0) {
                    dy = 0.01;
                }
                let dx = Math.sqrt(minDistanceSQ - dy * dy);
                let x1 = this.localLocation[0] - dx;
                let x2 = this.localLocation[0] + dx;
                if (x1 > 0.0 && x1 < segmentLength && x2 >= segmentLength) {
                    let fromX = x1 / segmentLength;
                    if (fromX < point1.adjustingLengthFrom) {
                        point1.adjustingLengthFrom = fromX;
                    }
                    edited = true;
                    point1.adjustingLengthTo = 1.0;
                }
                else if (x2 > 0.0 && x2 < segmentLength && x1 <= 0.0) {
                    edited = true;
                    point1.adjustingLengthFrom = 0.0;
                    let toX = x2 / segmentLength;
                    if (toX > point1.adjustingLengthTo) {
                        point1.adjustingLengthTo = toX;
                    }
                }
                else if (x1 < 0.0 && x2 > segmentLength) {
                    edited = true;
                    point1.adjustingLengthFrom = 0.0; // セグメント全体が削除
                    point1.adjustingLengthTo = 1.0;
                }
                else if (x1 > 0.0 && x2 < segmentLength) {
                    let fromX = x1 / segmentLength;
                    if (fromX < point1.adjustingLengthFrom) {
                        edited = true;
                        point1.adjustingLengthFrom = fromX;
                    }
                    let toX = x2 / segmentLength;
                    if (toX > point1.adjustingLengthTo) {
                        edited = true;
                        point1.adjustingLengthTo = toX;
                    }
                }
            }
            if (edited) {
                this.selectionInfo.editLine(line);
                this.selectionInfo.editGroup(group);
            }
        }
        afterHitTest() {
            // doesn't clear flagas
        }
    }
    ManualTracingTool.Selector_DeleteLinePoint_DivideLine = Selector_DeleteLinePoint_DivideLine;
    class Tool_DeletePoints_DivideLine extends ManualTracingTool.Tool_BrushSelectLinePointBase {
        constructor() {
            super(...arguments);
            this.helpText = 'ブラシ選択で点を削除します。';
            this.isEditTool = false; // @override
            this.selector = new Selector_DeleteLinePoint_DivideLine();
            this.logic_Selector = this.selector; // @override
        }
        existsResults() {
            return (this.selector.selectionInfo.selectedGroups.length > 0);
        }
        executeCommand(env) {
            let command = new Command_DeletePoints_DivideLine();
            if (command.prepareEditTargets(this.selector.selectionInfo)) {
                command.executeCommand(env);
                env.commandHistory.addCommand(command);
            }
            this.selector.resetModifyStates();
            env.setRedrawCurrentLayer();
        }
    }
    ManualTracingTool.Tool_DeletePoints_DivideLine = Tool_DeletePoints_DivideLine;
    class Command_DeletePoints_DivideLine extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.editGroups = null;
            this.toLocation = vec3.create();
            this.fromLocation = vec3.create();
        }
        prepareEditTargets(selectionInfo) {
            this.useGroups();
            let editGroups = new List();
            // Collect edit data from adjusting state, it should be same with drawing algorism
            for (let selGroup of selectionInfo.selectedGroups) {
                let group = selGroup.group;
                let editGroup = new DivideLine_EditGroup();
                editGroup.targetGroup = group;
                editGroup.oldLines = group.lines;
                for (let line of group.lines) {
                    if (line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.none) {
                        editGroup.newLines.push(line);
                        continue;
                    }
                    line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
                    let newLine = null;
                    let strokeStarted = false;
                    let drawingRemaining = false;
                    for (let pointIndex = 0; pointIndex < line.points.length - 1; pointIndex++) {
                        let fromPoint = line.points[pointIndex];
                        let fromLocation = fromPoint.location;
                        let toPoint = line.points[pointIndex + 1];
                        let toLocation = toPoint.location;
                        let lengthFrom = fromPoint.adjustingLengthFrom;
                        let lengthTo = fromPoint.adjustingLengthTo;
                        fromPoint.adjustingLengthFrom = 1.0;
                        fromPoint.adjustingLengthTo = 0.0;
                        if (lengthFrom == 1.0) {
                            if (!strokeStarted) {
                                newLine = new ManualTracingTool.VectorLine();
                                newLine.points.push(fromPoint);
                            }
                            newLine.points.push(toPoint);
                            strokeStarted = true;
                            drawingRemaining = true;
                        }
                        else {
                            // draw segment's from-side part
                            if (lengthFrom > 0.0) {
                                if (!strokeStarted) {
                                    newLine = new ManualTracingTool.VectorLine();
                                    newLine.points.push(fromPoint);
                                }
                                vec3.lerp(this.toLocation, fromLocation, toLocation, lengthFrom);
                                let newPoint = new ManualTracingTool.LinePoint();
                                vec3.copy(newPoint.location, this.toLocation);
                                vec3.copy(newPoint.adjustingLocation, newPoint.location);
                                newPoint.lineWidth = ManualTracingTool.Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth);
                                newPoint.adjustingLineWidth = newPoint.lineWidth;
                                newLine.points.push(newPoint);
                                editGroup.newLines.push(newLine);
                                strokeStarted = false;
                                drawingRemaining = false;
                            }
                            // draw segment's to-side part
                            if (lengthTo > 0.0 && lengthTo < 1.0) {
                                if (drawingRemaining) {
                                    editGroup.newLines.push(newLine);
                                }
                                vec3.lerp(this.fromLocation, fromLocation, toLocation, lengthTo);
                                newLine = new ManualTracingTool.VectorLine();
                                let newPoint = new ManualTracingTool.LinePoint();
                                vec3.copy(newPoint.location, this.fromLocation);
                                vec3.copy(newPoint.adjustingLocation, newPoint.location);
                                newPoint.lineWidth = ManualTracingTool.Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth);
                                newPoint.adjustingLineWidth = newPoint.lineWidth;
                                newLine.points.push(newPoint);
                                newLine.points.push(toPoint);
                                strokeStarted = true;
                                drawingRemaining = true;
                            }
                        }
                    }
                    if (drawingRemaining) {
                        editGroup.newLines.push(newLine);
                    }
                }
                ManualTracingTool.Logic_Edit_Line.calculateParametersV(editGroup.newLines);
                editGroups.push(editGroup);
                this.useGroup(group);
            }
            if (editGroups.length > 0) {
                this.editGroups = editGroups;
                return true;
            }
            else {
                return false;
            }
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            for (let editGroup of this.editGroups) {
                editGroup.targetGroup.lines = editGroup.oldLines;
            }
        }
        redo(env) {
            for (let editGroup of this.editGroups) {
                editGroup.targetGroup.lines = editGroup.newLines;
            }
        }
    }
    ManualTracingTool.Command_DeletePoints_DivideLine = Command_DeletePoints_DivideLine;
})(ManualTracingTool || (ManualTracingTool = {}));
