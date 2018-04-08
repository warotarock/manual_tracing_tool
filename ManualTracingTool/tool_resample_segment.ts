
namespace ManualTracingTool {

    class Tool_Resample_Segment_EditLine {

        targetLine: VectorLine = null;

        oldPointList: List<LinePoint> = null;
        newPointList: List<LinePoint> = null;
    }

    export class Tool_Resample_Segment extends ToolBase {

        resamplingUnitLength = 8.0;

        keydown(e: KeyboardEvent, env: ToolEnvironment) { // @override

            if (e.key == 'Enter') {

                this.executeCommand(env);
            }
        }

        private executeCommand(env: ToolEnvironment) {


        }

        private collectEditTargets(layer: VectorLayer): boolean {

            let modifiedGroupCount = 0;
            for (let group of layer.groups) {

                let modifiedLineCount = 0;

                for (let line of group.lines) {




                }

                if (modifiedLineCount > 0) {

                    group.linePointModifyFlag = VectorGroupModifyFlagID.modifyLines;
                }

                if (group.modifyFlag != VectorGroupModifyFlagID.none || group.linePointModifyFlag != VectorGroupModifyFlagID.none) {

                    modifiedGroupCount++;
                }
            }

            return true;
        }

        private collectEditTargets_Line(line: VectorLine): Tool_Resample_Segment_EditLine {

            let result = new Tool_Resample_Segment_EditLine();
            result.oldPointList = line.points;
            result.newPointList = new List<LinePoint>();

            let currentIndex = 0;
            let segmentStartIndex = -1;
            let segmentEndIndex = -1;

            let existsTargetSegment = false;

            while (currentIndex < line.points.length) {

                let currentPoint = line.points[currentIndex];

                let isSelectedSegment = (currentPoint.isSelected);

                // selected segment
                if (isSelectedSegment) {

                    segmentStartIndex = currentIndex;

                    // search end of selected segment
                    for (let i = segmentStartIndex; i < line.points.length; i++) {

                        let point = line.points[i];

                        segmentEndIndex = i;

                        if (!point.isSelected) {
                            break;
                        }
                    }

                    // if exists selected segment, execute resampling
                    if (segmentEndIndex > segmentStartIndex) {


                    }
                    // if not exists, execute insert original point
                    else {

                        let point = line.points[currentIndex];

                        result.newPointList.push(point);
                    }

                    currentIndex = segmentEndIndex + 1;
                }
                // non-selected segment
                else {

                    segmentStartIndex = currentIndex;

                    // search end of non-selected segment
                    for (let i = segmentStartIndex; i < line.points.length; i++) {

                        let point = line.points[i];

                        segmentEndIndex = i;

                        if (point.isSelected) {

                            break;
                        }
                    }

                    // execute insert original point
                    for (let i = segmentStartIndex; i <= segmentEndIndex; i++) {

                        let point = line.points[i];

                        result.newPointList.push(point);
                    }

                    currentIndex = segmentEndIndex + 1;
                }
            }

            return result;
        }
    }

    export class Command_Resample_Segment extends CommandBase {

        targetLines: List<VectorLine> = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            this.calculateLineParameters();
        }

        redo(env: ToolEnvironment) { // @override

            this.calculateLineParameters();
        }

        errorCheck() {

            if (this.targetLines == null) {
                throw ('Command_TransformLattice: line is null!');
            }
        }

        private calculateLineParameters() {

            Logic_Edit_Line.calculateParametersV(this.targetLines);
        }
    }
}
