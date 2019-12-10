var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_Select_All_LinePoint extends ManualTracingTool.ToolBase {
        executeToggleSelection(env) {
            if (env.currentVectorLayer == null) {
                return;
            }
            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            let existsSelectedPoints = this.isSelectedAnyPoint(editableKeyframeLayers, env);
            this.executeModifySelection(editableKeyframeLayers, existsSelectedPoints, env);
        }
        executeSelectAll(env) {
            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            this.executeModifySelection(editableKeyframeLayers, false, env);
        }
        executeClearSelectAll(env) {
            let editableKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            this.executeModifySelection(editableKeyframeLayers, true, env);
        }
        executeModifySelection(editableKeyframeLayers, clearSelection, env) {
            let selectionInfo;
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
        isSelectedAnyPoint(editableKeyframeLayers, env) {
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
        createSelectionInfo_SelectAll(editableKeyframeLayers, env) {
            let selectionInfo = new ManualTracingTool.VectorLayerEditorSelectionInfo();
            for (let viewKeyframeLayer of editableKeyframeLayers) {
                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {
                    for (let line of group.lines) {
                        for (let point of line.points) {
                            if (!point.isSelected) {
                                selectionInfo.selectPoint(line, point, ManualTracingTool.SelectionEditMode.setSelected);
                            }
                        }
                    }
                }
            }
            return selectionInfo;
        }
        createSelectionInfo_ClearAllSelection(editableKeyframeLayers, env) {
            let selectionInfo = new ManualTracingTool.VectorLayerEditorSelectionInfo();
            for (let viewKeyframeLayer of editableKeyframeLayers) {
                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {
                    for (let line of group.lines) {
                        for (let point of line.points) {
                            if (point.isSelected) {
                                selectionInfo.selectPoint(line, point, ManualTracingTool.SelectionEditMode.setUnselected);
                            }
                        }
                    }
                }
            }
            return selectionInfo;
        }
        executeCommand(selectionInfo, env) {
            let command = new ManualTracingTool.Command_Select();
            command.selectionInfo = selectionInfo;
            command.execute(env);
            env.commandHistory.addCommand(command);
        }
    }
    ManualTracingTool.Tool_Select_All_LinePoint = Tool_Select_All_LinePoint;
})(ManualTracingTool || (ManualTracingTool = {}));
