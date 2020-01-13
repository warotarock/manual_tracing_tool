var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_Select_All_LinePoint extends ManualTracingTool.ToolBase {
        executeToggleSelection(env) {
            if (env.currentVectorLayer == null) {
                return;
            }
            let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            let existsSelectedPoints = this.isSelectedAnyPoint(viewKeyframeLayers, env);
            this.executeModifySelection(viewKeyframeLayers, existsSelectedPoints, env);
        }
        executeSelectAll(env) {
            let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            this.executeModifySelection(viewKeyframeLayers, false, env);
        }
        executeClearSelectAll(env) {
            let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();
            this.executeModifySelection(viewKeyframeLayers, true, env);
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
        isSelectedAnyPoint(viewKeyframeLayers, env) {
            let isSelected = false;
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
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
            });
            return isSelected;
        }
        createSelectionInfo_SelectAll(viewKeyframeLayers, env) {
            let selectionInfo = new ManualTracingTool.VectorLayerEditorSelectionInfo();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
                for (let line of group.lines) {
                    for (let point of line.points) {
                        if (!point.isSelected) {
                            selectionInfo.selectPoint(line, point, ManualTracingTool.SelectionEditMode.setSelected);
                        }
                    }
                }
            });
            return selectionInfo;
        }
        createSelectionInfo_ClearAllSelection(viewKeyframeLayers, env) {
            let selectionInfo = new ManualTracingTool.VectorLayerEditorSelectionInfo();
            ManualTracingTool.ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group) => {
                for (let line of group.lines) {
                    for (let point of line.points) {
                        if (point.isSelected) {
                            selectionInfo.selectPoint(line, point, ManualTracingTool.SelectionEditMode.setUnselected);
                        }
                    }
                }
            });
            return selectionInfo;
        }
        executeCommand(selectionInfo, env) {
            let command = new ManualTracingTool.Command_Select();
            command.selectionInfo = selectionInfo;
            command.executeCommand(env);
            env.commandHistory.addCommand(command);
        }
    }
    ManualTracingTool.Tool_Select_All_LinePoint = Tool_Select_All_LinePoint;
})(ManualTracingTool || (ManualTracingTool = {}));
