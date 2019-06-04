
namespace ManualTracingTool {

    export class Tool_Select_All_LinePoint extends ToolBase {

        executeToggleSelection(env: ToolEnvironment) {

            if (env.currentVectorLayer == null) {

                return;
            }

            let existsSelectedPoints = this.isSelectedAnyPoint(env);

            this.executeModifySelection(existsSelectedPoints, env);
        }

        executeSelectAll(env: ToolEnvironment) {

            this.executeModifySelection(false, env);
        }

        executeClearSelectAll(env: ToolEnvironment) {

            this.executeModifySelection(true, env);
        }

        private executeModifySelection(clearSelection: boolean, env: ToolEnvironment) {

            let selectionInfo: VectorLayerEditorSelectionInfo;

            if (clearSelection) {

                selectionInfo = this.createSelectionInfo_ClearAllSelection(env);
            }
            else {

                selectionInfo = this.createSelectionInfo_SelectAll(env);
            }

            if (selectionInfo.selectedPoints.length == 0) {
                return;
            }

            selectionInfo.updateLineSelectionState();

            this.executeCommand(selectionInfo, env);

            selectionInfo.resetModifyStatus();

            env.setRedrawMainWindowEditorWindow();
        }

        private isSelectedAnyPoint(env: ToolEnvironment): boolean {

            let isSelected = false;

            for (let group of env.currentVectorGeometry.groups) {

                for (let line of group.lines) {

                    if (line.isSelected) {

                        isSelected = true;
                        break;
                    }

                    for (let point of line.points) {

                        if (point.isSelected) {

                            isSelected = true;
                            break;
                        }
                    }
                }
            }

            return isSelected;
        }

        private createSelectionInfo_SelectAll(env: ToolEnvironment): VectorLayerEditorSelectionInfo {

            let selectionInfo = new VectorLayerEditorSelectionInfo();

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    for (let line of group.lines) {

                        for (let point of line.points) {

                            if (!point.isSelected) {

                                selectionInfo.selectPoint(line, point, SelectionEditMode.setSelected);
                            }
                        }
                    }
                }
            }

            return selectionInfo;
        }

        private createSelectionInfo_ClearAllSelection(env: ToolEnvironment): VectorLayerEditorSelectionInfo {

            let selectionInfo = new VectorLayerEditorSelectionInfo();

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

                    for (let line of group.lines) {

                        for (let point of line.points) {

                            if (point.isSelected) {

                                selectionInfo.selectPoint(line, point, SelectionEditMode.setUnselected);
                            }
                        }
                    }
                }
            }

            return selectionInfo;
        }

        private executeCommand(selectionInfo: VectorLayerEditorSelectionInfo, env: ToolEnvironment) { // @virtual

            let command = new Command_Select();
            command.selectionInfo = selectionInfo;

            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }
}
