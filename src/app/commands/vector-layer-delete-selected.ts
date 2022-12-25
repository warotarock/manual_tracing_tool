import { VectorPointModifyFlagID, VectorLayerGeometry } from "../document-data";
import { Command_VectorLayer_Delete_Base } from "./vector-layer-delete-base"

export class Command_VectorLayer_DeleteSelected extends Command_VectorLayer_Delete_Base {

  protected setFlagsForGeometry(geometry: VectorLayerGeometry) { // @override

    VectorLayerGeometry.forEachPoint(geometry, (point) => {

      if (point.isSelected) {

        point.modifyFlag = VectorPointModifyFlagID.delete
      }
    })
  }
}
