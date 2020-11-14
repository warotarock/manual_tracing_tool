import { List, ListRemoveAt } from '../base/conversion';
import { Layer, VectorLayer, VectorLayerReferenceLayer, VectorStrokeGroup } from '../base/data';
import { ToolEnvironment } from '../base/tool';

export class CommandBase {

  isContinued = false;

  execute(env: ToolEnvironment) { // @virtual

  }

  undo(env: ToolEnvironment) { // @virtual

  }

  redo(env: ToolEnvironment) { // @virtual

  }

  targetGroups: List<VectorStrokeGroup> = null;

  useGroup(group: VectorStrokeGroup) {

    if (!this.targetGroups) {

      this.useGroups();
    }

    this.targetGroups.push(group);
  }

  useGroups(targetGroups?: List<VectorStrokeGroup>) {

    if (targetGroups) {

      this.targetGroups = targetGroups;
    }
    else {

      this.targetGroups = new List<VectorStrokeGroup>();
    }
  }

  private replacedReferenceInfos: ReplacedReferenceInfo[] = [];

  protected replaceReference<T>(target: T, propertyKeyName: keyof(T), oldReference: any, newReference: any) {

    const propertyName = String(propertyKeyName);

    if ((propertyName in target) && target[propertyName] == oldReference) {

      this.replacedReferenceInfos.push(
        {
          propertyName: propertyName,
          target: target,
          oldReference: target[propertyName],
          newReference: newReference,
        }
      );

      target[propertyName] = newReference;
    }
  }

  protected replaceReferenceRecursive(layer: Layer, oldReference: any, newReference: any) {

    if (VectorLayer.isVectorLayerWithOwnData(layer)) {

      const vectorLayer = <VectorLayer>layer;

      this.replaceReference(vectorLayer, 'posingLayer', oldReference, newReference);
      this.replaceReference(vectorLayer, 'keyframes', oldReference, newReference);
    }
    else if (VectorLayerReferenceLayer.isVectorLayerReferenceLayer(layer)) {

      let vRefLayer = <VectorLayerReferenceLayer>layer;

      this.replaceReference(vRefLayer, 'referenceLayer', oldReference, newReference);
      this.replaceReference(vRefLayer, 'keyframes', oldReference, newReference);
    }

    for (const child of layer.childLayers) {

      this.replaceReferenceRecursive(child, oldReference, newReference);
    }
  }

  protected existsReplacedReference(): boolean {

    return (this.replacedReferenceInfos.length > 0);
  }

  protected undoReplacedReferences() {

    for (const unlinkedLayerInfo of this.replacedReferenceInfos) {

      unlinkedLayerInfo.target[unlinkedLayerInfo.propertyName] = unlinkedLayerInfo.oldReference;
    }
  }

  protected redoReplacedReferences() {

    for (const unlinkedLayerInfo of this.replacedReferenceInfos) {

      unlinkedLayerInfo.target[unlinkedLayerInfo.propertyName] = unlinkedLayerInfo.newReference;
    }
  }
}

interface ReplacedReferenceInfo {

  propertyName: string;
  target: any;
  oldReference: any;
  newReference: any;
}

export class CommandHistory {

  maxHistory = 300;

  historyList = new List<CommandBase>();
  redoList = new List<CommandBase>();

  executeCommand(command: CommandBase, env: ToolEnvironment) {

    command.execute(env);

    if (command.targetGroups != null) {

      VectorStrokeGroup.setGroupsUpdated(command.targetGroups);

      env.setLazyRedraw();
    }

    this.addCommand(command);
  }

  addCommand(command: CommandBase) {

    this.historyList.push(command);

    if (this.historyList.length > this.maxHistory) {

      ListRemoveAt(this.historyList, 0);
    }

    if (this.redoList.length > 0) {
      this.redoList = new List<CommandBase>();
    }
  }

  private getUndoCommand(): CommandBase {

    if (this.historyList.length == 0) {
      return null;
    }

    return this.historyList[this.historyList.length - 1];
  }

  private getRedoCommand(): CommandBase {

    if (this.redoList.length == 0) {
      return null;
    }

    return this.redoList[this.redoList.length - 1];
  }

  undo(env: ToolEnvironment) {

    let command: CommandBase = null;

    do {

      command = this.getUndoCommand();

      if (command == null) {
        return;
      }

      command.undo(env);

      if (command.targetGroups != null) {

        VectorStrokeGroup.setGroupsUpdated(command.targetGroups);

        env.setLazyRedraw();
      }

      this.redoList.push(command);
      ListRemoveAt(this.historyList, this.historyList.length - 1);
    }
    while (command.isContinued);
  }

  redo(env: ToolEnvironment) {

    let command: CommandBase = null;

    do {

      command = this.getRedoCommand();

      if (command == null) {
        return;
      }

      command.redo(env);

      if (command.targetGroups != null) {

        VectorStrokeGroup.setGroupsUpdated(command.targetGroups);

        env.setLazyRedraw();
      }

      ListRemoveAt(this.redoList, this.redoList.length - 1);
      this.historyList.push(command);

      command = this.getRedoCommand();
    }
    while (command != null && command.isContinued);
  }
}
