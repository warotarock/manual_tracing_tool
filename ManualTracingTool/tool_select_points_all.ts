
namespace ManualTracingTool {

    export class Tool_Select_All_LinePoint extends ToolBase {

        executeToggleSelection(env: ToolEnvironment) {

            if (env.currentVectorLayer == null) {

                return;
            }

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            let existsSelectedPoints = this.isSelectedAnyPoint(editableKeyframeLayers, env);

            this.executeModifySelection(editableKeyframeLayers, existsSelectedPoints, env);
        }

        executeSelectAll(env: ToolEnvironment) {

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            this.executeModifySelection(editableKeyframeLayers, false, env);
        }

        executeClearSelectAll(env: ToolEnvironment) {

            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

            this.executeModifySelection(editableKeyframeLayers, true, env);
        }

        private executeModifySelection(editableKeyframeLayers: List<ViewKeyframeLayer>, clearSelection: boolean, env: ToolEnvironment) {

            let selectionInfo: VectorLayerEditorSelectionInfo;

            if (clearSelection) {

                selectionInfo = this.createSelectionInfo_ClearAllSelection(editableKeyframeLayers, env);
            }
            else {

                selectionInfo = this.createSelectionInfo_SelectAll(editableKeyframeLayers, env);
            }

            if (selectionInfo.selectedPoints.length == 0) {
                return;
            }

            selectionInfo.updateLineSelectionState();

            this.executeCommand(selectionInfo, env);

            selectionInfo.resetModifyStates();

            env.setRedrawMainWindowEditorWindow();
        }

        private isSelectedAnyPoint(editableKeyframeLayers: List<ViewKeyframeLayer>, env: ToolEnvironment): boolean {

            let isSelected = false;

            for (let viewKeyframeLayer of editableKeyframeLayers) {

                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {

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
            }

            return isSelected;
        }

        private createSelectionInfo_SelectAll(editableKeyframeLayers: List<ViewKeyframeLayer>, env: ToolEnvironment): VectorLayerEditorSelectionInfo {

            let selectionInfo = new VectorLayerEditorSelectionInfo();

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

        private createSelectionInfo_ClearAllSelection(editableKeyframeLayers: List<ViewKeyframeLayer>, env: ToolEnvironment): VectorLayerEditorSelectionInfo {

            let selectionInfo = new VectorLayerEditorSelectionInfo();

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

            command.executeCommand(env);

            env.commandHistory.addCommand(command);
        }
    }
}
