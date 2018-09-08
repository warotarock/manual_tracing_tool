
namespace ManualTracingTool {

    export class Tool_Select_All_LinePoint extends ToolBase {

        execute(env: ToolEnvironment) {

            if (env.currentVectorLayer == null) {

                return;
            }

            let existsSelectedPoints = this.isSelectedAnyPoint(env);

            let selectionInfo: VectorLayerEditorSelectionInfo;

            if (existsSelectedPoints) {

                selectionInfo = this.createSelectionInfo_ClearAllSelection(env);
            }
            else {

                selectionInfo = this.createSelectionInfo_SelectAll(env);
            }

            selectionInfo.updateLineSelectionState();

            this.executeCommand(selectionInfo, env);

            selectionInfo.resetModifyStatus();

            env.setRedrawMainWindowEditorWindow();
        }

        private isSelectedAnyPoint(env: ToolEnvironment): boolean {

            let isSelected = false;

            for (let group of env.currentVectorLayer.geometry.groups) {

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

            for (let group of env.currentVectorLayer.geometry.groups) {

                for (let line of group.lines) {

                    for (let point of line.points) {

                        if (!point.isSelected) {

                            selectionInfo.selectPoint(line, point, SelectionEditMode.setSelected);
                        }
                    }
                }
            }

            return selectionInfo;
        }

        private createSelectionInfo_ClearAllSelection(env: ToolEnvironment): VectorLayerEditorSelectionInfo {

            let selectionInfo = new VectorLayerEditorSelectionInfo();

            for (let group of env.currentVectorLayer.geometry.groups) {

                for (let line of group.lines) {

                    for (let point of line.points) {

                        if (point.isSelected) {

                            selectionInfo.selectPoint(line, point, SelectionEditMode.setUnselected);
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
