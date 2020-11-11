import { List } from '../base/conversion';
import { VectorStrokeGroup, } from '../base/data';
import { ToolEnvironment, ToolBase, ViewKeyframeLayer, } from '../base/tool';

import { VectorLayerEditorSelectionInfo, SelectionEditMode } from '../logics/selector';
import { Command_Select } from '../tools/select_brush_select';

export class Tool_Select_All_LinePoint extends ToolBase {

    executeToggleSelection(env: ToolEnvironment) {

        //if (env.currentVectorLayer == null) {
        //    return;
        //}

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        let existsSelectedPoints = this.isSelectedAnyPoint(viewKeyframeLayers);

        this.executeModifySelection(viewKeyframeLayers, existsSelectedPoints, env);
    }

    executeSelectAll(env: ToolEnvironment) {

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        this.executeModifySelection(viewKeyframeLayers, false, env);
    }

    executeClearSelectAll(env: ToolEnvironment) {

        let viewKeyframeLayers = env.collectEditTargetViewKeyframeLayers();

        this.executeModifySelection(viewKeyframeLayers, true, env);
    }

    private executeModifySelection(editableKeyframeLayers: List<ViewKeyframeLayer>, clearSelection: boolean, env: ToolEnvironment) {

        let selectionInfo: VectorLayerEditorSelectionInfo;

        if (clearSelection) {

            selectionInfo = this.createSelectionInfo_ClearAllSelection(editableKeyframeLayers);
        }
        else {

            selectionInfo = this.createSelectionInfo_SelectAll(editableKeyframeLayers);
        }

        if (selectionInfo.selectedPoints.length == 0) {
            return;
        }

        selectionInfo.updateLineSelectionState();

        this.executeCommand(selectionInfo, env);

        selectionInfo.resetModifyStates();

        env.setRedrawMainWindowEditorWindow();
    }

    private isSelectedAnyPoint(viewKeyframeLayers: List<ViewKeyframeLayer>): boolean {

        let isSelected = false;

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

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

    private createSelectionInfo_SelectAll(viewKeyframeLayers: List<ViewKeyframeLayer>): VectorLayerEditorSelectionInfo {

        let selectionInfo = new VectorLayerEditorSelectionInfo();

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            for (let line of group.lines) {

                for (let point of line.points) {

                    if (!point.isSelected) {

                        selectionInfo.selectPoint(line, point, SelectionEditMode.setSelected);
                    }
                }
            }
        });

        return selectionInfo;
    }

    private createSelectionInfo_ClearAllSelection(viewKeyframeLayers: List<ViewKeyframeLayer>): VectorLayerEditorSelectionInfo {

        let selectionInfo = new VectorLayerEditorSelectionInfo();

        ViewKeyframeLayer.forEachGroup(viewKeyframeLayers, (group: VectorStrokeGroup) => {

            for (let line of group.lines) {

                for (let point of line.points) {

                    if (point.isSelected) {

                        selectionInfo.selectPoint(line, point, SelectionEditMode.setUnselected);
                    }
                }
            }
        });

        return selectionInfo;
    }

    private executeCommand(selectionInfo: VectorLayerEditorSelectionInfo, env: ToolEnvironment) {

        let command = new Command_Select();
        command.selectionInfo = selectionInfo;

        env.commandHistory.executeCommand(command, env);
    }
}
