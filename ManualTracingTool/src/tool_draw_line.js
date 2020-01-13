var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_DrawLine extends ManualTracingTool.ToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '線を追加します。Shiftキーで直前の線から続けて塗りつぶします。';
            this.editLine = null;
            this.continuousFill = false;
        }
        isAvailable(env) {
            return (env.currentVectorLayer != null
                && ManualTracingTool.Layer.isVisible(env.currentVectorLayer));
        }
        mouseDown(e, env) {
            if (!e.isLeftButtonPressing()) {
                return;
            }
            this.continuousFill = env.isShiftKeyPressing();
            this.editLine = new ManualTracingTool.VectorLine();
            this.addPointToEditLine(e, env);
        }
        addPointToEditLine(e, env) {
            let point = new ManualTracingTool.LinePoint();
            vec3.copy(point.location, e.location);
            point.lineWidth = env.drawLineBaseWidth;
            this.editLine.points.push(point);
        }
        mouseMove(e, env) {
            if (this.editLine == null) {
                return;
            }
            this.addPointToEditLine(e, env);
            env.setRedrawEditorWindow();
        }
        mouseUp(e, env) {
            if (this.editLine == null) {
                return;
            }
            if (env.currentVectorGroup == null) {
                this.editLine = null;
                env.setRedrawEditorWindow();
                return;
            }
            this.continuousFill = (this.continuousFill || env.isShiftKeyPressing());
            this.executeCommand(env);
            env.setRedrawCurrentLayer();
            env.setRedrawEditorWindow();
            this.editLine = null;
        }
        executeCommand(env) {
            let targetGroup = env.currentVectorGroup;
            let editLine = this.editLine;
            // Crete new line
            ManualTracingTool.Logic_Edit_Line.smooth(editLine);
            let resamplingUnitLength = env.getViewScaledDrawLineUnitLength();
            let divisionCount = ManualTracingTool.Logic_Edit_Points.clalculateSamplingDivisionCount(editLine.totalLength, resamplingUnitLength);
            let resampledLine = ManualTracingTool.Logic_Edit_Line.createResampledLine(editLine, divisionCount);
            if (resampledLine.points.length < 2) {
                return;
            }
            // Collect continuous filling info
            let previousConnectedLine = null;
            let previousConnectedLine_continuousFill = false;
            if (this.continuousFill && targetGroup.lines.length >= 1) {
                let connectLine = targetGroup.lines[targetGroup.lines.length - 1];
                if (connectLine.points.length >= 2) {
                    let lastPoint = connectLine.points[connectLine.points.length - 1];
                    let point1 = resampledLine.points[0];
                    let point2 = resampledLine.points[resampledLine.points.length - 1];
                    let distance1 = vec3.squaredDistance(lastPoint.location, point1.location);
                    let distance2 = vec3.squaredDistance(lastPoint.location, point2.location);
                    if (distance2 < distance1) {
                        let revercedList = new List();
                        for (let i = resampledLine.points.length - 1; i >= 0; i--) {
                            revercedList.push(resampledLine.points[i]);
                        }
                        resampledLine.points = revercedList;
                    }
                    previousConnectedLine = targetGroup.lines[targetGroup.lines.length - 1];
                    previousConnectedLine_continuousFill = previousConnectedLine.continuousFill;
                }
            }
            let command = new Command_AddLine();
            command.prepareEditTargets(env.currentVectorGroup, resampledLine);
            command.setContiuousStates(this.continuousFill, previousConnectedLine, previousConnectedLine_continuousFill);
            command.useGroup(env.currentVectorGroup);
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
            this.editLine = null;
        }
    }
    ManualTracingTool.Tool_DrawLine = Tool_DrawLine;
    class Command_AddLine extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.group = null;
            this.line = null;
            this.continuousFill = false;
            this.previousConnectedLine = null;
            this.previousConnectedLine_continuousFill = false;
        }
        prepareEditTargets(group, line) {
            this.group = group;
            this.line = line;
            this.useGroup(group);
        }
        setContiuousStates(continuousFill, previousConnectedLine, previousConnectedLine_continuousFill) {
            this.continuousFill = continuousFill;
            this.previousConnectedLine = previousConnectedLine;
            this.previousConnectedLine_continuousFill = previousConnectedLine_continuousFill;
        }
        execute(env) {
            this.redo(env);
        }
        undo(env) {
            ListRemoveAt(this.group.lines, this.group.lines.length - 1);
            if (this.previousConnectedLine != null) {
                this.previousConnectedLine.continuousFill = this.previousConnectedLine_continuousFill;
            }
        }
        redo(env) {
            this.group.lines.push(this.line);
            if (this.previousConnectedLine != null) {
                this.previousConnectedLine.continuousFill = true;
            }
            env.setCurrentVectorLine(this.line, false);
        }
    }
    ManualTracingTool.Command_AddLine = Command_AddLine;
})(ManualTracingTool || (ManualTracingTool = {}));
