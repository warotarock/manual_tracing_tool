import {
  VectorPointModifyFlagID, VectorLayerGeometry, VectorStrokeGroupModifyFlagID, VectorStrokeModifyFlagID,
  VectorPoint, VectorStroke, VectorStrokeGroup
} from '../document-data'

export class VectorLayerLogic {

  static clearGeometryModifyFlags(geometry: VectorLayerGeometry) {

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        this.clearGroupModifyFlags(group)
      }
    }
  }

  static clearGroupModifyFlags(group: VectorStrokeGroup) {

    group.runtime.modifyFlag = VectorStrokeGroupModifyFlagID.none
    group.runtime.linePointModifyFlag = VectorStrokeGroupModifyFlagID.none

    for (const stroke of group.lines) {

      this.clearStrokeModifyFlags(stroke)
    }
  }

  static clearStrokeModifyFlags(stroke: VectorStroke) {

    stroke.runtime.modifyFlag = VectorStrokeModifyFlagID.none

    VectorLayerLogic.clearPointModifyFlags(stroke.points)
  }

  static clearPointModifyFlags(points: VectorPoint[]) {

    for (const point of points) {

      point.modifyFlag = VectorPointModifyFlagID.none
    }
  }

  static fillGeometryDeleteFlags(geometry: VectorLayerGeometry, forceDelete: boolean) {

    for (const unit of geometry.units) {

      for (const group of unit.groups) {

        this.fillGroupDeleteFlags(group, forceDelete)
      }
    }
  }

  static fillGroupDeleteFlags(group: VectorStrokeGroup, forceDelete: boolean) {

    if (forceDelete) {

      group.runtime.modifyFlag = VectorStrokeGroupModifyFlagID.delete
    }

    let setDelete = false
    if (group.runtime.modifyFlag == VectorStrokeGroupModifyFlagID.delete) {
      setDelete = true
    }

    for (const line of group.lines) {

      this.fillLineDeleteFlags(line, setDelete)
    }
  }

  static fillLineDeleteFlags(line: VectorStroke, forceDelete: boolean) {

    if (forceDelete) {

      line.runtime.modifyFlag = VectorStrokeModifyFlagID.delete
    }

    if (line.runtime.modifyFlag == VectorStrokeModifyFlagID.delete) {

      for (const point of line.points) {

        point.modifyFlag = VectorPointModifyFlagID.delete
      }
    }
  }
}
