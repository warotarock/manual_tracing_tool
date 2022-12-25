import { PosingModel } from '../document-data'
import { Maths } from '../common-logics'

type BoneData = {
  name: string,
  matrix: Mat4,
  worldMat: Mat4,
  invMat: Mat4
}

export class Posing3DModelLogic {

  private tempVec3 = vec3.create()
  private fromLocation = vec3.create()
  private toLocation = vec3.create()
  private upVector = vec3.create()

  private tempMat4 = mat4.create()
  private chestInvMat4 = mat4.create()
  private hipsInvMat4 = mat4.create()

  createPosingModel(modelData: { bones }): PosingModel {

    const posingModel = new PosingModel()

    for (let index = 0; index < modelData.bones.length; index++) {
      const bone = modelData.bones[index]

      bone.worldMat = mat4.create()
      if (bone.parent == -1) {
        mat4.copy(bone.worldMat, bone.matrix)
      }
      else {
        mat4.multiply(bone.worldMat, modelData.bones[bone.parent].worldMat, bone.matrix)
      }

      bone.invMat = mat4.create()
      mat4.invert(bone.invMat, bone.worldMat)
    }

    const head = this.findBone(modelData.bones, 'head')
    const headCenter = this.findBone(modelData.bones, 'headCenter')
    const headTop = this.findBone(modelData.bones, 'headTop')
    const chest = this.findBone(modelData.bones, 'chest')
    const hips = this.findBone(modelData.bones, 'hips')
    const hipsTop = this.findBone(modelData.bones, 'hipsTop')
    const hipL = this.findBone(modelData.bones, 'hip.L')
    const neck1 = this.findBone(modelData.bones, 'neck1')
    const neck2 = this.findBone(modelData.bones, 'neck2')

    Maths.copyTranslation(this.toLocation, headCenter.worldMat)
    vec3.transformMat4(posingModel.headCenterLocation, this.toLocation, head.invMat)

    mat4.multiply(this.tempMat4, headTop.worldMat, head.invMat)
    Maths.copyTranslation(posingModel.headTopLocation, this.tempMat4)

    Maths.copyTranslation(this.toLocation, neck2.worldMat)
    vec3.transformMat4(posingModel.neckSphereLocation, this.toLocation, head.invMat)

    Maths.copyTranslation(this.fromLocation, headTop.worldMat)
    Maths.copyTranslation(this.toLocation, neck2.worldMat)
    vec3.subtract(posingModel.headTopToNeckVector, this.fromLocation, this.toLocation)

    Maths.copyTranslation(this.fromLocation, neck2.worldMat)
    Maths.copyTranslation(this.toLocation, chest.worldMat)
    vec3.set(this.upVector, 0.0, 0.0, 1.0)
    mat4.lookAt(this.chestInvMat4, this.fromLocation, this.toLocation, this.upVector)
    mat4.multiply(posingModel.chestModelConvertMatrix, this.chestInvMat4, chest.worldMat)

    Maths.copyTranslation(this.toLocation, hips.worldMat)
    vec3.transformMat4(posingModel.bodyRotationSphereLocation, this.toLocation, this.chestInvMat4)

    vec3.subtract(this.tempVec3, this.fromLocation, this.toLocation)
    posingModel.bodySphereSize = vec3.length(this.tempVec3)

    Maths.copyTranslation(this.fromLocation, hips.worldMat)
    Maths.copyTranslation(this.toLocation, hipL.worldMat)
    vec3.set(this.upVector, 0.0, 0.0, 1.0)
    mat4.lookAt(this.hipsInvMat4, this.fromLocation, this.toLocation, this.upVector)
    mat4.multiply(posingModel.hipsModelConvertMatrix, this.hipsInvMat4, hips.worldMat)
    mat4.rotateY(posingModel.hipsModelConvertMatrix, posingModel.hipsModelConvertMatrix, Math.PI)

    Maths.copyTranslation(this.fromLocation, hips.worldMat)
    Maths.copyTranslation(this.toLocation, hipsTop.worldMat)
    vec3.subtract(this.tempVec3, this.fromLocation, this.toLocation)
    posingModel.hipsSphereSize = vec3.length(this.tempVec3)

    Maths.copyTranslation(this.toLocation, neck1.worldMat)
    vec3.transformMat4(posingModel.shoulderSphereLocation, this.toLocation, this.chestInvMat4)

    const arm1L = this.findBone(modelData.bones, 'arm1.L')
    Maths.copyTranslation(this.toLocation, arm1L.worldMat)
    vec3.transformMat4(posingModel.leftArm1Location, this.toLocation, this.chestInvMat4)

    const arm1R = this.findBone(modelData.bones, 'arm1.R')
    Maths.copyTranslation(this.toLocation, arm1R.worldMat)
    vec3.transformMat4(posingModel.rightArm1Location, this.toLocation, this.chestInvMat4)

    const arm2L = this.findBone(modelData.bones, 'arm2.L')
    posingModel.leftArm1HeadLocation[2] = -arm2L.matrix[13]

    const arm2R = this.findBone(modelData.bones, 'arm2.R')
    posingModel.rightArm1HeadLocation[2] = -arm2R.matrix[13]

    const leg1L = this.findBone(modelData.bones, 'leg1.L')
    Maths.copyTranslation(this.toLocation, leg1L.worldMat)
    vec3.transformMat4(posingModel.leftLeg1Location, this.toLocation, this.hipsInvMat4)

    const leg1R = this.findBone(modelData.bones, 'leg1.R')
    Maths.copyTranslation(this.toLocation, leg1R.worldMat)
    vec3.transformMat4(posingModel.rightLeg1Location, this.toLocation, this.hipsInvMat4)

    const leg2L = this.findBone(modelData.bones, 'leg2.L')
    posingModel.leftLeg1HeadLocation[2] = -leg2L.matrix[13]

    const leg2R = this.findBone(modelData.bones, 'leg2.R')
    posingModel.rightLeg1HeadLocation[2] = -leg2R.matrix[13]

    return posingModel
  }

  private findBone(bones: BoneData[], boneName: string): BoneData {

    for (const bone of bones) {

      if (bone.name == boneName) {

        return bone
      }
    }

    return null
  }
}
