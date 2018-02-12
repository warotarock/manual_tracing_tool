var ManualTracingTool;
(function (ManualTracingTool) {
    var Posing3D_BodyLocateMode;
    (function (Posing3D_BodyLocateMode) {
        Posing3D_BodyLocateMode[Posing3D_BodyLocateMode["keepFrontUp"] = 1] = "keepFrontUp";
        Posing3D_BodyLocateMode[Posing3D_BodyLocateMode["yawPitch"] = 2] = "yawPitch";
    })(Posing3D_BodyLocateMode = ManualTracingTool.Posing3D_BodyLocateMode || (ManualTracingTool.Posing3D_BodyLocateMode = {}));
    var Posing3DLogic = /** @class */ (function () {
        function Posing3DLogic() {
            this.inputLocation = vec3.create();
            this.upVector = vec3.create();
            this.tmpMatrix = mat4.create();
            this.invMatrix = mat4.create();
            this.tmpVec3 = vec3.create();
            this.vecX = vec3.create();
            this.vecY = vec3.create();
            this.vecZ = vec3.create();
            this.headMatrix = mat4.create();
            this.bodyRootMatrix = mat4.create();
            this.relativeInputLocation = vec3.create();
            this.relativeRotationMatrix = mat4.create();
            this.rootLocation = vec3.create();
            this.originVector = vec3.create();
            this.bodyMatrix = mat4.create();
            this.yawRotationMatrix = mat4.create();
            this.pitchRotationMatrix = mat4.create();
        }
        // Common caluculation methods for input
        Posing3DLogic.prototype.calculateBodyPartDirection = function (inputData, rootMatrix, mode) {
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
                ManualTracingTool.Maths.setVectorsMat4(this.yawRotationMatrix, this.vecX, this.vecY, this.vecZ);
                mat4.invert(this.invMatrix, this.yawRotationMatrix);
                vec3.transformMat4(this.vecY, this.relativeInputLocation, this.invMatrix);
                vec3.set(this.vecX, 1.0, 0.0, 0.0);
                vec3.cross(this.vecZ, this.vecX, this.vecY);
                mat4.identity(this.pitchRotationMatrix);
                ManualTracingTool.Maths.setVectorsMat4(this.pitchRotationMatrix, this.vecX, this.vecY, this.vecZ);
                mat4.multiply(this.bodyMatrix, rootMatrix, this.yawRotationMatrix);
                mat4.multiply(this.bodyMatrix, this.bodyMatrix, this.pitchRotationMatrix);
                mat4.rotateX(this.bodyMatrix, this.bodyMatrix, Math.PI / 2);
            }
            mat4.copy(inputData.matrix, this.bodyMatrix);
        };
        // Caluculation methods for each part od body
        Posing3DLogic.prototype.calculateHeadLocation = function (posingData, posingModel) {
            var headLocationInputData = posingData.headLocationInputData;
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
            var headRotationInputData = posingData.headRotationInputData;
            if (headRotationInputData.inputDone) {
                headRotationInputData.matrix[12] = headLocationInputData.center[0];
                headRotationInputData.matrix[13] = headLocationInputData.center[1];
                headRotationInputData.matrix[14] = headLocationInputData.center[2];
            }
            else {
                this.calculateHeadRotation(posingData, posingModel);
            }
        };
        Posing3DLogic.prototype.calculateHeadRotation = function (posingData, posingModel) {
            var headRotationInputData = posingData.headRotationInputData;
            var headLocationInputData = posingData.headLocationInputData;
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
            // Calclates sub locations
            this.calculateHeadSubLocations(posingData, posingModel, headRotationInputData.matrix);
            // Affect to after process
            this.calculateHeadTwist(posingData, posingModel);
        };
        Posing3DLogic.prototype.calculateHeadTwist = function (posingData, posingModel) {
            var headTwistInputData = posingData.headTwistInputData;
            var headLocationInputData = posingData.headLocationInputData;
            var headRotationInputData = posingData.headRotationInputData;
            // Main calculation
            if (headTwistInputData.inputDone) {
                mat4.invert(this.invMatrix, headLocationInputData.neckSphereMatrix);
                vec3.transformMat4(this.relativeInputLocation, headTwistInputData.inputLocation, this.invMatrix);
                vec3.scale(this.relativeInputLocation, this.relativeInputLocation, -1.0);
                vec3.transformMat4(headTwistInputData.inputLocation, this.relativeInputLocation, headLocationInputData.neckSphereMatrix);
                this.calculateBodyPartDirection(headTwistInputData, headLocationInputData.neckSphereMatrix, Posing3D_BodyLocateMode.keepFrontUp);
                mat4.multiply(this.tmpMatrix, this.invMatrix, headRotationInputData.matrix);
                mat4.multiply(headTwistInputData.matrix, headTwistInputData.matrix, this.tmpMatrix);
            }
            else {
                mat4.copy(headTwistInputData.matrix, posingData.headRotationInputData.matrix);
            }
            // Calclates sub locations
            this.calculateHeadSubLocations(posingData, posingModel, headTwistInputData.matrix);
        };
        Posing3DLogic.prototype.calculateHeadSubLocations = function (posingData, posingModel, rootMatrix) {
            var headLocationInputData = posingData.headLocationInputData;
            var headRotationInputData = posingData.headRotationInputData;
            mat4.copy(headLocationInputData.headMatrix, rootMatrix);
            mat4.translate(headLocationInputData.bodyRootMatrix, rootMatrix, posingModel.bodySphereLocation);
            mat4.translate(headLocationInputData.neckSphereMatrix, headRotationInputData.matrix, posingModel.neckSphereLocation);
            //mat4.rotateX(headLocationInputData.neckSphereMatrix, headLocationInputData.neckSphereMatrix, Math.PI / 2);
        };
        Posing3DLogic.prototype.calculateBodyLocation = function (posingData, posingModel, mode) {
            var bodyLocationInputData = posingData.bodyLocationInputData;
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
        };
        Posing3DLogic.prototype.calculateBodyRotation = function (posingData, posingModel) {
            var bodyRotationInputData = posingData.bodyRotationInputData;
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
                ManualTracingTool.Maths.setVectorsMat4(this.relativeRotationMatrix, this.vecX, this.relativeInputLocation, this.vecZ);
                mat4.multiply(bodyRotationInputData.matrix, posingData.bodyLocationInputData.matrix, this.relativeRotationMatrix);
            }
            else {
                mat4.copy(bodyRotationInputData.matrix, posingData.bodyLocationInputData.matrix);
            }
            // Calclates sub locations
            this.calculateBodySubLocations(posingData, posingModel, bodyRotationInputData.matrix);
        };
        Posing3DLogic.prototype.calculateBodySubLocations = function (posingData, posingModel, rootMatrix) {
            // Main visual matrix
            mat4.copy(posingData.bodyLocationInputData.bodyMatrix, rootMatrix);
            // Body rotation
            mat4.translate(posingData.bodyLocationInputData.rotationCenterMatrix, posingData.bodyLocationInputData.matrix, posingModel.bodyRotationSphereLocation);
            // Left arm root
            mat4.translate(posingData.bodyLocationInputData.leftArm1RootMatrix, rootMatrix, posingModel.leftArm1Location);
            mat4.rotateZ(posingData.bodyLocationInputData.leftArm1RootMatrix, posingData.bodyLocationInputData.leftArm1RootMatrix, Math.PI / 2);
            // Right arm root
            mat4.translate(posingData.bodyLocationInputData.rightArm1RootMatrix, rootMatrix, posingModel.rightArm1Location);
            mat4.rotateZ(posingData.bodyLocationInputData.rightArm1RootMatrix, posingData.bodyLocationInputData.rightArm1RootMatrix, -Math.PI / 2);
            // Left leg root
            mat4.translate(posingData.bodyLocationInputData.leftLeg1RootMatrix, rootMatrix, posingModel.leftLeg1Location);
            //mat4.rotateX(
            //    posingData.bodyLocationInputData.leftLeg1RootMatrix
            //    , posingData.bodyLocationInputData.leftLeg1RootMatrix
            //    , -Math.PI / 2);
            // Right leg root
            mat4.translate(posingData.bodyLocationInputData.rightLeg1RootMatrix, rootMatrix, posingModel.rightLeg1Location);
            //mat4.rotateX(
            //    posingData.bodyLocationInputData.rightLeg1RootMatrix
            //    , posingData.bodyLocationInputData.rightLeg1RootMatrix
            //    , Math.PI / 2);
        };
        Posing3DLogic.prototype.calculateLeftArm1Direction = function (posingData, posingModel) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.leftArm1LocationInputData, posingData.bodyLocationInputData.leftArm1RootMatrix, Posing3D_BodyLocateMode.yawPitch);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftArm1LocationInputData, posingModel.leftArm1HeadLocation);
        };
        Posing3DLogic.prototype.calculateRightArm1Direction = function (posingData, posingModel) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.rightArm1LocationInputData, posingData.bodyLocationInputData.rightArm1RootMatrix, Posing3D_BodyLocateMode.yawPitch);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightArm1LocationInputData, posingModel.rightArm1HeadLocation);
        };
        Posing3DLogic.prototype.calculateLeftLeg1Direction = function (posingData, posingModel) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.leftLeg1LocationInputData, posingData.bodyLocationInputData.leftLeg1RootMatrix, Posing3D_BodyLocateMode.keepFrontUp);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftLeg1LocationInputData, posingModel.leftLeg1HeadLocation);
            if (!posingData.leftLeg2LocationInputData.inputDone) {
                var frontDirectionValue = posingData.leftLeg1LocationInputData.matrix[5];
                if (frontDirectionValue > 0.0) {
                    posingData.leftLeg2LocationInputData.inputSideID = ManualTracingTool.InputSideID.back;
                }
                else {
                    posingData.leftLeg2LocationInputData.inputSideID = ManualTracingTool.InputSideID.front;
                }
            }
        };
        Posing3DLogic.prototype.calculateRightLeg1Direction = function (posingData, posingModel) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.rightLeg1LocationInputData, posingData.bodyLocationInputData.rightLeg1RootMatrix, Posing3D_BodyLocateMode.keepFrontUp);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightLeg1LocationInputData, posingModel.rightLeg1HeadLocation);
            if (!posingData.rightLeg2LocationInputData.inputDone) {
                var frontDirectionValue = posingData.rightLeg1LocationInputData.matrix[5];
                if (frontDirectionValue > 0.0) {
                    posingData.rightLeg2LocationInputData.inputSideID = ManualTracingTool.InputSideID.back;
                }
                else {
                    posingData.rightLeg2LocationInputData.inputSideID = ManualTracingTool.InputSideID.front;
                }
            }
        };
        Posing3DLogic.prototype.calculateLeftArm2Direction = function (posingData, posingModel) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.leftArm2LocationInputData, posingData.leftArm1LocationInputData.childJointRootMatrix, Posing3D_BodyLocateMode.keepFrontUp);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftArm2LocationInputData, posingModel.leftArm2HeadLocation);
        };
        Posing3DLogic.prototype.calculateRightArm2Direction = function (posingData, posingModel) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.rightArm2LocationInputData, posingData.rightArm1LocationInputData.childJointRootMatrix, Posing3D_BodyLocateMode.keepFrontUp);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightArm2LocationInputData, posingModel.rightArm2HeadLocation);
        };
        Posing3DLogic.prototype.calculateLeftLeg2Direction = function (posingData, posingModel) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.leftLeg2LocationInputData, posingData.leftLeg1LocationInputData.childJointRootMatrix, Posing3D_BodyLocateMode.keepFrontUp);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftLeg2LocationInputData, posingModel.leftLeg2HeadLocation);
        };
        Posing3DLogic.prototype.calculateRightLeg2Direction = function (posingData, posingModel) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.rightLeg2LocationInputData, posingData.rightLeg1LocationInputData.childJointRootMatrix, Posing3D_BodyLocateMode.keepFrontUp);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightLeg2LocationInputData, posingModel.rightLeg2HeadLocation);
        };
        Posing3DLogic.prototype.calculateArmLegSubLocations = function (parent, childLocation) {
            mat4.translate(parent.childJointRootMatrix, parent.matrix, childLocation);
        };
        return Posing3DLogic;
    }());
    ManualTracingTool.Posing3DLogic = Posing3DLogic;
})(ManualTracingTool || (ManualTracingTool = {}));
