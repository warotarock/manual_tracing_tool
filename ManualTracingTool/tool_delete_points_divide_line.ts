
namespace ManualTracingTool {

    class DivideLine_EditGroup {

        targetGroup: VectorGroup = null;

        newLines = new List<VectorLine>();
        oldLines: List<VectorLine> = null;

        editLines = new List<DivideLine_EditLine>();
    }

    class DivideLine_EditLine {

        editPoints = new List<DivideLine_EditPoint>();
    }

    class DivideLine_EditPoint {

        targetPoint: LinePoint = null;

        newLengthTo = 0.0;
        newLengthFrom = 0.0;
        oldLengthTo = 0.0;
        oldLengthFrom = 0.0;
    }

    export class Selector_DeleteLinePoint_DivideLine extends Selector_LineSegment_BrushSelect {

        private segmentMat4 = mat4.create();
        private invMat4 = mat4.create();
        private normalVec = vec3.create();
        private localLocation = vec3.create();

        edited = false;

        protected beforeHitTest() { // @override

            this.selectionInfo.clear();

            this.edited = false;
        }

        protected beforeHitTestToGroup(geometry: VectorLayerGeometry, group: VectorGroup) { // @override
        }

        protected beforeHitTestToLine(group: VectorGroup, line: VectorLine) { // @override
        }

        protected onLineSegmentHited(line: VectorLine, point1: LinePoint, point2: LinePoint, x: float, y: float, minDistance: float, distanceSQ: float) { // @override

            this.createEditPoint(line, point1, point2, x, y, minDistance);
        }

        protected afterHitTestToLine(group: VectorGroup, line: VectorLine) { // @override
        }

        protected afterHitTestToGroup(geometry: VectorLayerGeometry, group: VectorGroup) { // @override
        }

        private createEditPoint(line: VectorLine, point1: LinePoint, point2: LinePoint, x: float, y: float, minDistance: float) {

            let edited = false;

            let segmentLength = vec3.distance(point1.location, point2.location);

            if (segmentLength > 0.0) {

                Maths.mat4SegmentMat(this.segmentMat4, this.normalVec, point1.location, point2.location);
                mat4.invert(this.invMat4, this.segmentMat4);

                vec3.set(this.localLocation, x, y, 0.0);
                vec3.transformMat4(this.localLocation, this.localLocation, this.invMat4);

                let dy = 0 - this.localLocation[1];
                let r = minDistance;
                let dx = Math.sqrt(r * r - dy * dy);
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
                    point1.adjustingLengthFrom = 0.0;
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
            else {

                edited = true;
                point1.adjustingLengthFrom = 0.0;
                point1.adjustingLengthTo = 1.0;
            }

            if (edited) {

                line.modifyFlag = VectorLineModifyFlagID.edit;
                this.edited = true;
            }
        }
    }

    export class Tool_DeletePoints_DivideLine extends Tool_BrushSelectLinePointBase {

        helpText = 'ブラシ選択で点を削除します。';
        isEditTool = false; // @override

        logic_Selector: ISelector_BrushSelect = new Selector_DeleteLinePoint_DivideLine(); // @override

        toLocation = vec3.create();
        fromLocation = vec3.create();

        protected existsResults(): boolean { // @override

            let selector = <Selector_DeleteLinePoint_DivideLine>this.logic_Selector;

            return selector.edited;
        }

        protected executeCommand(env: ToolEnvironment) { // @override

            let editGroups = new List<DivideLine_EditGroup>();

            for (let viewKeyframeLayer of this.editableKeyframeLayers) {

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    for (let line of group.lines) {

                        if (line.modifyFlag == VectorLineModifyFlagID.edit) {

                            group.modifyFlag = VectorGroupModifyFlagID.edit;
                            break;
                        }
                    }
                }

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    if (group.modifyFlag == VectorGroupModifyFlagID.none) {
                        continue;
                    }

                    group.modifyFlag = VectorGroupModifyFlagID.none;

                    let editGroup = new DivideLine_EditGroup();
                    editGroup.targetGroup = group;
                    editGroup.oldLines = group.lines;

                    for (let line of group.lines) {

                        if (line.modifyFlag == VectorLineModifyFlagID.none) {

                            editGroup.newLines.push(line);
                            continue;
                        }

                        line.modifyFlag = VectorLineModifyFlagID.none;

                        let newLine: VectorLine = null;

                        let strokeStarted = false;
                        let drawingRemainging = false;

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

                                    newLine = new VectorLine();
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

                                        newLine = new VectorLine();
                                        newLine.points.push(fromPoint);
                                    }

                                    vec3.lerp(this.toLocation, fromLocation, toLocation, lengthFrom);

                                    let newPoint = new LinePoint();

                                    vec3.copy(newPoint.location, this.toLocation);
                                    vec3.copy(newPoint.adjustingLocation, newPoint.location);

                                    newPoint.lineWidth = Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth);
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

                                    newLine = new VectorLine();

                                    let newPoint = new LinePoint();

                                    vec3.copy(newPoint.location, this.fromLocation);
                                    vec3.copy(newPoint.adjustingLocation, newPoint.location);

                                    newPoint.lineWidth = Maths.lerp(lengthFrom, fromPoint.lineWidth, toPoint.lineWidth);
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

                    Logic_Edit_Line.calculateParametersV(editGroup.newLines);

                    editGroups.push(editGroup);
                }
            }

            let command = new Command_DeletePoints_DivideLine();
            command.editGroups = editGroups;

            command.execute(env);

            env.commandHistory.addCommand(command);

            env.setRedrawMainWindow();
        }
    }

    export class Command_DeletePoints_DivideLine extends CommandBase {

        editGroups: List<DivideLine_EditGroup> = null;

        execute(env: ToolEnvironment) { // @override

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            for (let editGroup of this.editGroups) {

                editGroup.targetGroup.lines = editGroup.oldLines;
            }
        }

        redo(env: ToolEnvironment) { // @override

            for (let editGroup of this.editGroups) {

                editGroup.targetGroup.lines = editGroup.newLines;
            }
        }
    }
}
