
namespace ManualTracingTool {

    export enum Posing3D_BodyLocateMode {

        keepFrontUp = 1,
        yawPitch = 2
    }

    export class Posing3DLogic {

        inputLocation = vec3.create();

        upVector = vec3.create();
        tmpMatrix = mat4.create();
        invMatrix = mat4.create();
        tmpVec3 = vec3.create();
        vecX = vec3.create();
        vecY = vec3.create();
        vecZ = vec3.create();

        headMatrix = mat4.create();
        bodyRootMatrix = mat4.create();

        relativeInputLocation = vec3.create();
        relativeRotationMatrix = mat4.create();
        rootLocation = vec3.create();
        originVector = vec3.create();
        bodyMatrix = mat4.create();

        yawRotationMatrix = mat4.create();
        pitchRotationMatrix = mat4.create();

        // Common caluculation methods for input

        calculateBodyPartDirection(inputData: DirectionInputData, rootMatrix: Mat4, mode: Posing3D_BodyLocateMode) {

            if (!inputData.inputDone) {

                mat4.copy(inputData.matrix, rootMatrix);
                return;
            }

            vec3.copy(this.inputLocation, inputData.inputLocation);

            // Calculates relative location of input from root of body
            mat4.copy(this.bodyRootMatrix, rootMatrix);
            mat4.invert(this.tmpMatrix, this.bodyRootMatrix);
            vec3.transformMat4(this.relativeInputLocation, this.inputLocation, this.tmpMatrix);
            vec3.normalize(this.relativeInputLocation, this.relativeInputLocation);

            if (mode == Posing3D_BodyLocateMode.keepFrontUp) {

                // Calculates transform matrix from bodyRootMatrix to bodyMatris(=result)
                vec3.set(this.upVector, 1.0, 0.0, 0.0);
                vec3.set(this.originVector, 0.0, 0.0, 0.0);
                mat4.lookAt(this.relativeRotationMatrix, this.originVector, this.relativeInputLocation, this.upVector);
                mat4.invert(this.relativeRotationMatrix, this.relativeRotationMatrix);

                mat4.multiply(this.bodyMatrix, rootMatrix, this.relativeRotationMatrix);
                mat4.rotateZ(this.bodyMatrix, this.bodyMatrix, Math.PI / 2);
            }
            else {

                // Calculates transform matrix from bodyRootMatrix to bodyMatris(=result)
                vec3.set(this.vecZ, 0.0, 0.0, 1.0);
                vec3.set(this.tmpVec3, this.relativeInputLocation[0], this.relativeInputLocation[1], 0.0);
                vec3.normalize(this.vecY, this.tmpVec3);
                vec3.cross(this.vecX, this.vecY, this.vecZ);
                mat4.identity(this.yawRotationMatrix);
                Maths.setVectorsMat4(this.yawRotationMatrix, this.vecX, this.vecY, this.vecZ);

                mat4.invert(this.invMatrix, this.yawRotationMatrix);
                vec3.transformMat4(this.vecY, this.relativeInputLocation, this.invMatrix);
                vec3.set(this.vecX, 1.0, 0.0, 0.0);
                vec3.cross(this.vecZ, this.vecX, this.vecY);
                mat4.identity(this.pitchRotationMatrix);
                Maths.setVectorsMat4(this.pitchRotationMatrix, this.vecX, this.vecY, this.vecZ);

                mat4.multiply(this.bodyMatrix, rootMatrix, this.yawRotationMatrix);
                mat4.multiply(this.bodyMatrix, this.bodyMatrix, this.pitchRotationMatrix);
                mat4.rotateX(this.bodyMatrix, this.bodyMatrix, Math.PI / 2);
            }

            mat4.copy(inputData.matrix, this.bodyMatrix);
        }

        // Caluculation methods for each part od body

        calculateAll(posingData: PosingData, posingModel: PosingModel) {

            if (posingData.headLocationInputData.inputDone) {
                this.calculateHeadLocation(posingData, posingModel);
            }

            if (posingData.headRotationInputData.inputDone) {
                this.calculateHeadRotation(posingData, posingModel);
            }

            if (posingData.bodyLocationInputData.inputDone) {
                this.calculateBodyLocation(posingData, posingModel, Posing3D_BodyLocateMode.keepFrontUp);
            }

            if (posingData.bodyRotationInputData.inputDone) {
                this.calculateBodyRotation(posingData, posingModel);
            }

            if (posingData.leftArm1LocationInputData.inputDone) {
                this.calculateLeftArm1Direction(posingData, posingModel);
            }

            if (posingData.leftArm2LocationInputData.inputDone) {
                this.calculateLeftArm2Direction(posingData, posingModel);
            }

            if (posingData.rightArm1LocationInputData.inputDone) {
                this.calculateRightArm1Direction(posingData, posingModel);
            }

            if (posingData.rightArm2LocationInputData.inputDone) {
                this.calculateRightArm2Direction(posingData, posingModel);
            }

            if (posingData.leftLeg1LocationInputData.inputDone) {
                this.calculateLeftLeg1Direction(posingData, posingModel);
            }

            if (posingData.leftLeg2LocationInputData.inputDone) {
                this.calculateLeftLeg2Direction(posingData, posingModel);
            }

            if (posingData.rightLeg1LocationInputData.inputDone) {
                this.calculateRightLeg1Direction(posingData, posingModel);
            }

            if (posingData.rightLeg2LocationInputData.inputDone) {
                this.calculateRightLeg2Direction(posingData, posingModel);
            }

            if (posingData.headTwistInputData.inputDone) {
                this.calculateHeadTwist(posingData, posingModel);
            }
        }

        calculateHeadLocation(posingData: PosingData, posingModel: PosingModel) {

            let headLocationInputData = posingData.headLocationInputData;

            // Main calculation
            if (headLocationInputData.inputDone) {

                mat4.identity(headLocationInputData.matrix);
                mat4.translate(headLocationInputData.matrix, headLocationInputData.matrix, headLocationInputData.center);
            }
            else {

                mat4.identity(headLocationInputData.matrix);
            }

            // Calclates sub locations
            this.calculateHeadSubLocations(posingData, posingModel, headLocationInputData.matrix);

            // Affect to after process
            this.calculateHeadRotation(posingData, posingModel);
        }

        calculateHeadRotation(posingData: PosingData, posingModel: PosingModel) {

            let headRotationInputData = posingData.headRotationInputData;

            let headLocationInputData = posingData.headLocationInputData;

            // Main calculation
            if (headRotationInputData.inputDone) {

                vec3.copy(this.inputLocation, headRotationInputData.inputLocation);

                // Calculates head matrix
                vec3.set(this.upVector, 0.0, 0.0, 1.0);
                mat4.lookAt(this.headMatrix, headLocationInputData.center, this.inputLocation, this.upVector);
                mat4.invert(this.headMatrix, this.headMatrix);
                mat4.rotateX(this.headMatrix, this.headMatrix, -Math.PI / 2);
                mat4.copy(headRotationInputData.matrix, this.headMatrix);
            }
            else {

                mat4.copy(headRotationInputData.matrix, headLocationInputData.matrix);
            }

            mat4.translate(headRotationInputData.neckSphereMatrix, headRotationInputData.matrix, posingModel.neckSphereLocation);

            // Calclates sub locations
            this.calculateHeadSubLocations(posingData, posingModel, headRotationInputData.matrix);

            // Affect to after process
            this.calculateHeadTwist(posingData, posingModel);
        }

        calculateHeadTwist(posingData: PosingData, posingModel: PosingModel) {
            
            let headTwistInputData = posingData.headTwistInputData;

            let headLocationInputData = posingData.headLocationInputData;
            let headRotationInputData = posingData.headRotationInputData;

            // Main calculation
            if (headTwistInputData.inputDone) {

                mat4.invert(this.invMatrix, headRotationInputData.neckSphereMatrix);

                vec3.transformMat4(this.relativeInputLocation, headTwistInputData.tempInputLocation, this.invMatrix);
                vec3.scale(this.relativeInputLocation, this.relativeInputLocation, -1.0);
                vec3.transformMat4(headTwistInputData.inputLocation, this.relativeInputLocation, headRotationInputData.neckSphereMatrix);

                this.calculateBodyPartDirection(
                    headTwistInputData
                    , headRotationInputData.neckSphereMatrix
                    , Posing3D_BodyLocateMode.keepFrontUp
                );

                mat4.multiply(this.tmpMatrix, this.invMatrix, headRotationInputData.matrix);

                mat4.multiply(headTwistInputData.matrix, headTwistInputData.matrix, this.tmpMatrix);
            }
            else {

                mat4.copy(headTwistInputData.matrix, posingData.headRotationInputData.matrix);
            }

            // Calclates sub locations
            //this.calculateHeadSubLocations(posingData, posingModel, headTwistInputData.matrix);
            mat4.copy(headLocationInputData.headMatrix, headTwistInputData.matrix);
        }

        calculateHeadSubLocations(posingData: PosingData, posingModel: PosingModel, rootMatrix: Mat4) {

            let headLocationInputData = posingData.headLocationInputData;
            let headRotationInputData = posingData.headRotationInputData;

            mat4.copy(headLocationInputData.headMatrix, rootMatrix);

            mat4.translate(headLocationInputData.bodyRootMatrix, rootMatrix, posingModel.bodySphereLocation);
        }

        calculateBodyLocation(posingData: PosingData, posingModel: PosingModel, mode: Posing3D_BodyLocateMode) {

            let bodyLocationInputData = posingData.bodyLocationInputData;

            // Main calculation
            if (bodyLocationInputData.inputDone) {

                this.calculateBodyPartDirection(bodyLocationInputData, posingData.headLocationInputData.bodyRootMatrix, mode);
            }
            else {

                mat4.copy(bodyLocationInputData.matrix, posingData.headLocationInputData.bodyRootMatrix);
            }

            // Calclates sub locations
            this.calculateBodySubLocations(posingData, posingModel, bodyLocationInputData.matrix);

            // Affect to after process
            this.calculateBodyRotation(posingData, posingModel);
        }

        calculateBodyRotation(posingData: PosingData, posingModel: PosingModel) {

            let bodyRotationInputData = posingData.bodyRotationInputData;

            // Main calculation
            if (posingData.bodyRotationInputData.inputDone) {

                vec3.copy(this.inputLocation, bodyRotationInputData.inputLocation);

                mat4.invert(this.tmpMatrix, posingData.bodyLocationInputData.rotationCenterMatrix);

                vec3.transformMat4(this.relativeInputLocation, this.inputLocation, this.tmpMatrix);
                this.relativeInputLocation[2] = 0.0;
                vec3.normalize(this.relativeInputLocation, this.relativeInputLocation);

                vec3.set(this.vecZ, 0.0, 0.0, 1.0);
                vec3.cross(this.vecX, this.relativeInputLocation, this.vecZ);

                mat4.identity(this.relativeRotationMatrix);
                Maths.setVectorsMat4(this.relativeRotationMatrix, this.vecX, this.relativeInputLocation, this.vecZ);

                mat4.multiply(bodyRotationInputData.matrix, posingData.bodyLocationInputData.matrix, this.relativeRotationMatrix);
            }
            else {

                mat4.copy(bodyRotationInputData.matrix, posingData.bodyLocationInputData.matrix);
            }

            // Calclates sub locations
            this.calculateBodySubLocations(posingData, posingModel, bodyRotationInputData.matrix);
        }

        calculateBodySubLocations(posingData: PosingData, posingModel: PosingModel, rootMatrix: Mat4) {

            // Main visual matrix
            mat4.copy(posingData.bodyLocationInputData.bodyMatrix, rootMatrix);

            // Body rotation
            mat4.translate(
                posingData.bodyLocationInputData.rotationCenterMatrix
                , posingData.bodyLocationInputData.matrix
                , posingModel.bodyRotationSphereLocation);

            // Left arm root
            mat4.translate(
                posingData.bodyLocationInputData.leftArm1RootMatrix
                , rootMatrix
                , posingModel.leftArm1Location);

            mat4.rotateZ(
                posingData.bodyLocationInputData.leftArm1RootMatrix
                , posingData.bodyLocationInputData.leftArm1RootMatrix
                , Math.PI / 2);

            // Right arm root
            mat4.translate(
                posingData.bodyLocationInputData.rightArm1RootMatrix
                , rootMatrix
                , posingModel.rightArm1Location);

            mat4.rotateZ(
                posingData.bodyLocationInputData.rightArm1RootMatrix
                , posingData.bodyLocationInputData.rightArm1RootMatrix
                , -Math.PI / 2);

            // Left leg root
            mat4.translate(
                posingData.bodyLocationInputData.leftLeg1RootMatrix
                , rootMatrix
                , posingModel.leftLeg1Location);

            //mat4.rotateX(
            //    posingData.bodyLocationInputData.leftLeg1RootMatrix
            //    , posingData.bodyLocationInputData.leftLeg1RootMatrix
            //    , -Math.PI / 2);

            // Right leg root
            mat4.translate(
                posingData.bodyLocationInputData.rightLeg1RootMatrix
                , rootMatrix
                , posingModel.rightLeg1Location);

            //mat4.rotateX(
            //    posingData.bodyLocationInputData.rightLeg1RootMatrix
            //    , posingData.bodyLocationInputData.rightLeg1RootMatrix
            //    , Math.PI / 2);
        }

        calculateLeftArm1Direction(posingData: PosingData, posingModel: PosingModel) {

            // Main calculation
            this.calculateBodyPartDirection(
                posingData.leftArm1LocationInputData
                , posingData.bodyLocationInputData.leftArm1RootMatrix
                , Posing3D_BodyLocateMode.yawPitch
            );

            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftArm1LocationInputData, posingModel.leftArm1HeadLocation);
        }

        calculateRightArm1Direction(posingData: PosingData, posingModel: PosingModel) {

            // Main calculation
            this.calculateBodyPartDirection(
                posingData.rightArm1LocationInputData
                , posingData.bodyLocationInputData.rightArm1RootMatrix
                , Posing3D_BodyLocateMode.yawPitch
            );

            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightArm1LocationInputData, posingModel.rightArm1HeadLocation);
        }

        calculateLeftLeg1Direction(posingData: PosingData, posingModel: PosingModel) {

            // Main calculation
            this.calculateBodyPartDirection(
                posingData.leftLeg1LocationInputData
                , posingData.bodyLocationInputData.leftLeg1RootMatrix
                , Posing3D_BodyLocateMode.keepFrontUp
            );

            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftLeg1LocationInputData, posingModel.leftLeg1HeadLocation);

            if (!posingData.leftLeg2LocationInputData.inputDone) {

                let frontDirectionValue = posingData.leftLeg1LocationInputData.matrix[5];

                if (frontDirectionValue > 0.0) {
                    posingData.leftLeg2LocationInputData.inputSideID = InputSideID.back;
                }
                else {
                    posingData.leftLeg2LocationInputData.inputSideID = InputSideID.front;
                }
            }
        }

        calculateRightLeg1Direction(posingData: PosingData, posingModel: PosingModel) {

            // Main calculation
            this.calculateBodyPartDirection(
                posingData.rightLeg1LocationInputData
                , posingData.bodyLocationInputData.rightLeg1RootMatrix
                , Posing3D_BodyLocateMode.keepFrontUp
            );

            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightLeg1LocationInputData, posingModel.rightLeg1HeadLocation);

            if (!posingData.rightLeg2LocationInputData.inputDone) {

                let frontDirectionValue = posingData.rightLeg1LocationInputData.matrix[5];

                if (frontDirectionValue > 0.0) {
                    posingData.rightLeg2LocationInputData.inputSideID = InputSideID.back;
                }
                else {
                    posingData.rightLeg2LocationInputData.inputSideID = InputSideID.front;
                }
            }
        }

        calculateLeftArm2Direction(posingData: PosingData, posingModel: PosingModel) {

            // Main calculation
            this.calculateBodyPartDirection(
                posingData.leftArm2LocationInputData
                , posingData.leftArm1LocationInputData.childJointRootMatrix
                , Posing3D_BodyLocateMode.keepFrontUp
            );

            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftArm2LocationInputData, posingModel.leftArm2HeadLocation);
        }

        calculateRightArm2Direction(posingData: PosingData, posingModel: PosingModel) {

            // Main calculation
            this.calculateBodyPartDirection(
                posingData.rightArm2LocationInputData
                , posingData.rightArm1LocationInputData.childJointRootMatrix
                , Posing3D_BodyLocateMode.keepFrontUp
            );

            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightArm2LocationInputData, posingModel.rightArm2HeadLocation);
        }

        calculateLeftLeg2Direction(posingData: PosingData, posingModel: PosingModel) {

            // Main calculation
            this.calculateBodyPartDirection(
                posingData.leftLeg2LocationInputData
                , posingData.leftLeg1LocationInputData.childJointRootMatrix
                , Posing3D_BodyLocateMode.keepFrontUp
            );

            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftLeg2LocationInputData, posingModel.leftLeg2HeadLocation);
        }

        calculateRightLeg2Direction(posingData: PosingData, posingModel: PosingModel) {

            // Main calculation
            this.calculateBodyPartDirection(
                posingData.rightLeg2LocationInputData
                , posingData.rightLeg1LocationInputData.childJointRootMatrix
                , Posing3D_BodyLocateMode.keepFrontUp
            );

            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightLeg2LocationInputData, posingModel.rightLeg2HeadLocation);
        }

        calculateArmLegSubLocations(parent: JointPartInputData, childLocation: Vec3) {

            mat4.translate(
                parent.childJointRootMatrix
                , parent.matrix
                , childLocation);
        }
    }
}
