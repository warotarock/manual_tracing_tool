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
            // Common caluculation methods for input
            this.tempTargetLocation = vec3.create();
            this.tempCenterLocation = vec3.create();
            this.tempLocalLocation = vec3.create();
            this.tempResultLocation = vec3.create();
            this.tempInvMat = mat4.create();
        }
        Posing3DLogic.prototype.processMouseInputLocation = function (result, location2D, targetData, posingData, posing3DView) {
            posing3DView.calculate3DLocationFrom2DLocation(this.tempTargetLocation, location2D, 2.0 // 2.0m
            , posingData.real3DViewHalfWidth);
            vec3.transformMat4(this.tempLocalLocation, this.tempTargetLocation, posing3DView.viewMatrix);
            this.tempCenterLocation[0] = targetData.parentMatrix[12];
            this.tempCenterLocation[1] = targetData.parentMatrix[13];
            this.tempCenterLocation[2] = targetData.parentMatrix[14];
            vec3.transformMat4(this.tempCenterLocation, this.tempCenterLocation, posing3DView.viewMatrix);
            // r * r = x * x + y * y + z * z;
            // z * z = r * r - x * x - y * y;
            // z = sqrt(r * r - x * x - y * y);
            var x = this.tempLocalLocation[0] - this.tempCenterLocation[0];
            var y = this.tempLocalLocation[1] - this.tempCenterLocation[1];
            var z = 0.0;
            var r = targetData.hitTestSphereRadius;
            var dist = r * r - x * x - y * y;
            if (dist >= 0) {
                z = Math.sqrt(dist);
            }
            if (targetData.inputSideID == ManualTracingTool.InputSideID.back) {
                z = -z;
            }
            this.tempResultLocation[0] = this.tempCenterLocation[0] + x;
            this.tempResultLocation[1] = this.tempCenterLocation[1] + y;
            this.tempResultLocation[2] = this.tempCenterLocation[2] + z;
            vec3.transformMat4(result, this.tempResultLocation, posing3DView.cameraMatrix);
            return true;
        };
        Posing3DLogic.prototype.calculateBodyPartDirection = function (inputData, rootMatrix, mode, posingData, posing3DView) {
            if (!inputData.directionInputDone) {
                mat4.copy(inputData.matrix, rootMatrix);
                return;
            }
            this.processMouseInputLocation(this.inputLocation, inputData.inputLocation2D, inputData, posingData, posing3DView);
            //vec3.copy(this.inputLocation, inputData.inputLocation);
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
            // Calculates location for roll input
            if (!inputData.rollInputDone) {
                //this.translationOf(this.rootLocation, rootMatrix);
                //vec3.subtract(this.relativeInputLocation, this.inputLocation, this.rootLocation);
                //vec3.scale(this.relativeInputLocation, this.relativeInputLocation, 0.5);
                //vec3.set(this.vecY, 0.0, vec3.length(this.relativeInputLocation), 0.0);
                //mat4.translate(inputData.rollInputRootMatrix, inputData.matrix, this.vecY);
                //vec3.set(this.vecZ, 0.0, 0.0, -vec3.length(this.vecY));
                //vec3.transformMat4(inputData.rollInputLocation, this.vecZ, inputData.rollInputRootMatrix);
            }
            else {
                mat4.rotateZ(inputData.matrix, inputData.matrix, inputData.rollInputAngle);
            }
        };
        Posing3DLogic.prototype.translationOf = function (vec, mat) {
            vec3.set(vec, mat[12], mat[13], mat[14]);
        };
        // Caluculation methods for each part od body
        Posing3DLogic.prototype.calculateAll = function (posingData, posingModel, posing3DView) {
            mat4.identity(posingData.rootMatrix);
            if (posingData.headLocationInputData.inputDone) {
                this.calculateHeadLocation(posingData, posingModel);
            }
            if (posingData.headRotationInputData.inputDone) {
                this.calculateHeadRotation(posingData, posingModel, posing3DView);
            }
            if (posingData.bodyLocationInputData.inputDone) {
                this.calculateBodyLocation(posingData, posingModel, posing3DView);
            }
            if (posingData.bodyRotationInputData.inputDone) {
                this.calculateBodyRotation(posingData, posingModel, posing3DView);
            }
            this.calculateLeftShoulderDirection(posingData, posingModel, posing3DView);
            this.calculateRightShoulderDirection(posingData, posingModel, posing3DView);
            if (posingData.hipsLocationInputData.inputDone) {
                this.calculateHipsLocation(posingData, posingModel, posing3DView);
            }
            if (posingData.leftArm1LocationInputData.inputDone) {
                this.calculateLeftArm1Direction(posingData, posingModel, posing3DView);
            }
            if (posingData.leftArm2LocationInputData.inputDone) {
                this.calculateLeftArm2Direction(posingData, posingModel, posing3DView);
            }
            if (posingData.rightArm1LocationInputData.inputDone) {
                this.calculateRightArm1Direction(posingData, posingModel, posing3DView);
            }
            if (posingData.rightArm2LocationInputData.inputDone) {
                this.calculateRightArm2Direction(posingData, posingModel, posing3DView);
            }
            if (posingData.leftLeg1LocationInputData.inputDone) {
                this.calculateLeftLeg1Direction(posingData, posingModel, posing3DView);
            }
            if (posingData.leftLeg2LocationInputData.inputDone) {
                this.calculateLeftLeg2Direction(posingData, posingModel, posing3DView);
            }
            if (posingData.rightLeg1LocationInputData.inputDone) {
                this.calculateRightLeg1Direction(posingData, posingModel, posing3DView);
            }
            if (posingData.rightLeg2LocationInputData.inputDone) {
                this.calculateRightLeg2Direction(posingData, posingModel, posing3DView);
            }
            if (posingData.headTwistInputData.inputDone) {
                this.calculateHeadTwist(posingData, posingModel, posing3DView);
            }
        };
        Posing3DLogic.prototype.calculateHeadLocation = function (posingData, posingModel) {
            var headLocationInputData = posingData.headLocationInputData;
            // Input matrix
            if (headLocationInputData.inputDone) {
                mat4.identity(posingData.rootMatrix);
                mat4.translate(posingData.rootMatrix, posingData.rootMatrix, headLocationInputData.center);
            }
            else {
                mat4.identity(posingData.rootMatrix);
            }
            // Result location
            vec3.scale(this.tmpVec3, posingModel.headCenterLocation, -1.0);
            mat4.translate(posingData.headMatrix, posingData.rootMatrix, this.tmpVec3);
            mat4.translate(posingData.headTopMatrix, posingData.headMatrix, posingModel.headTopLocation);
            mat4.translate(posingData.neckSphereMatrix, posingData.headMatrix, posingModel.neckSphereLocation);
            // Sub locations
            this.calculateHeadSubLocations(posingData, posingModel);
        };
        Posing3DLogic.prototype.calculateHeadRotation = function (posingData, posingModel, posing3DView) {
            var headRotationInputData = posingData.headRotationInputData;
            // Input matrix
            if (headRotationInputData.inputDone) {
                this.calculateBodyPartDirection(headRotationInputData, posingData.neckSphereMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            }
            else {
                mat4.copy(headRotationInputData.matrix, posingData.neckSphereMatrix);
            }
            // Result location
            mat4.translate(posingData.headMatrix, headRotationInputData.matrix, posingModel.neckSphereLocation);
            mat4.rotateX(posingData.headMatrix, posingData.headMatrix, Math.PI);
            // Sub locations
            this.calculateHeadSubLocations(posingData, posingModel);
        };
        Posing3DLogic.prototype.calculateHeadTwist = function (posingData, posingModel, posing3DView) {
            var headTwistInputData = posingData.headTwistInputData;
            var headLocationInputData = posingData.headLocationInputData;
            var headRotationInputData = posingData.headRotationInputData;
            // Main calculation
            if (headTwistInputData.inputDone) {
                mat4.invert(this.invMatrix, posingData.neckSphereMatrix);
                vec3.transformMat4(this.relativeInputLocation, headTwistInputData.tempInputLocation, this.invMatrix);
                vec3.scale(this.relativeInputLocation, this.relativeInputLocation, -1.0);
                vec3.transformMat4(headTwistInputData.inputLocation, this.relativeInputLocation, posingData.neckSphereMatrix);
                this.calculateBodyPartDirection(headTwistInputData, posingData.neckSphereMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
                mat4.multiply(this.tmpMatrix, this.invMatrix, headRotationInputData.matrix);
                mat4.multiply(headTwistInputData.matrix, headTwistInputData.matrix, this.tmpMatrix);
            }
            else {
                mat4.copy(headTwistInputData.matrix, posingData.headRotationInputData.matrix);
            }
            // Calclates sub locations
            //this.calculateHeadSubLocations(posingData, posingModel, headTwistInputData.matrix);
            mat4.copy(headLocationInputData.headMatrix, headTwistInputData.matrix);
        };
        Posing3DLogic.prototype.calculateHeadSubLocations = function (posingData, posingModel) {
            mat4.translate(posingData.chestRootMatrix, posingData.headMatrix, posingModel.neckSphereLocation);
        };
        Posing3DLogic.prototype.calculateBodyLocation = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.bodyLocationInputData, posingData.chestRootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Result location
            mat4.copy(posingData.chestMatrix, posingData.bodyLocationInputData.matrix);
            // Calclates sub locations
            this.calculateBodySubLocations(posingData, posingModel);
        };
        Posing3DLogic.prototype.calculateBodyRotation = function (posingData, posingModel, posing3DView) {
            var bodyRotationInputData = posingData.bodyRotationInputData;
            // Main calculation
            if (posingData.bodyRotationInputData.inputDone) {
                vec3.copy(this.inputLocation, bodyRotationInputData.inputLocation);
                mat4.invert(this.tmpMatrix, posingData.bodyRotationCenterMatrix);
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
            this.calculateBodySubLocations(posingData, posingModel);
        };
        Posing3DLogic.prototype.calculateHipsLocation = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.hipsLocationInputData, posingData.hipsRootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Result location
            mat4.copy(posingData.hipsMatrix, posingData.hipsLocationInputData.matrix);
            // Calclates sub locations
            this.calculateBodySubLocations(posingData, posingModel);
        };
        Posing3DLogic.prototype.calculateBodySubLocations = function (posingData, posingModel) {
            // Body rotation
            mat4.translate(posingData.bodyRotationCenterMatrix, posingData.bodyLocationInputData.matrix, posingModel.bodyRotationSphereLocation);
            // Shoulder
            mat4.translate(posingData.shoulderRootMatrix, posingData.chestMatrix, posingModel.shoulderSphereLocation);
            // Hips
            mat4.translate(posingData.hipsRootMatrix, posingData.chestMatrix, posingModel.bodyRotationSphereLocation);
            // Left leg root
            mat4.translate(posingData.leftLeg1RootMatrix, posingData.hipsMatrix, posingModel.leftLeg1Location);
            //mat4.rotateX(
            //    posingData.bodyLocationInputData.leftLeg1RootMatrix
            //    , posingData.bodyLocationInputData.leftLeg1RootMatrix
            //    , -Math.PI / 2);
            // Right leg root
            mat4.translate(posingData.rightLeg1RootMatrix, posingData.hipsMatrix, posingModel.rightLeg1Location);
            //mat4.rotateX(
            //    posingData.bodyLocationInputData.rightLeg1RootMatrix
            //    , posingData.bodyLocationInputData.rightLeg1RootMatrix
            //    , Math.PI / 2);
        };
        Posing3DLogic.prototype.calculateLeftShoulderDirection = function (posingData, posingModel, posing3DView) {
            // Main calculation
            if (!posingData.leftShoulderLocationInputData.directionInputDone) {
                mat4.translate(this.tmpMatrix, posingData.chestMatrix, posingModel.leftArm1Location);
                this.translationOf(posingData.leftShoulderLocationInputData.inputLocation, this.tmpMatrix);
                posingData.leftShoulderLocationInputData.directionInputDone = true;
            }
            this.calculateBodyPartDirection(posingData.leftShoulderLocationInputData, posingData.shoulderRootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Result location
            vec3.set(this.tmpVec3, 0.0, 0.0, -vec3.length(posingModel.leftArm1Location));
            mat4.translate(posingData.leftArm1RootMatrix, posingData.leftShoulderLocationInputData.matrix, this.tmpVec3);
        };
        Posing3DLogic.prototype.calculateRightShoulderDirection = function (posingData, posingModel, posing3DView) {
            // Main calculation
            if (!posingData.rightShoulderLocationInputData.directionInputDone) {
                mat4.translate(this.tmpMatrix, posingData.chestMatrix, posingModel.rightArm1Location);
                this.translationOf(posingData.rightShoulderLocationInputData.inputLocation, this.tmpMatrix);
                posingData.rightShoulderLocationInputData.directionInputDone = true;
            }
            this.calculateBodyPartDirection(posingData.rightShoulderLocationInputData, posingData.shoulderRootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Result location
            vec3.set(this.tmpVec3, 0.0, 0.0, -vec3.length(posingModel.rightArm1Location));
            mat4.translate(posingData.rightArm1RootMatrix, posingData.rightShoulderLocationInputData.matrix, this.tmpVec3);
        };
        Posing3DLogic.prototype.calculateLeftArm1Direction = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.leftArm1LocationInputData, posingData.leftArm1RootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftArm1LocationInputData, posingModel.leftArm1HeadLocation);
        };
        Posing3DLogic.prototype.calculateRightArm1Direction = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.rightArm1LocationInputData, posingData.rightArm1RootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightArm1LocationInputData, posingModel.rightArm1HeadLocation);
        };
        Posing3DLogic.prototype.calculateLeftLeg1Direction = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.leftLeg1LocationInputData, posingData.leftLeg1RootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
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
        Posing3DLogic.prototype.calculateRightLeg1Direction = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.rightLeg1LocationInputData, posingData.rightLeg1RootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
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
        Posing3DLogic.prototype.calculateLeftArm2Direction = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.leftArm2LocationInputData, posingData.leftArm1LocationInputData.childJointRootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftArm2LocationInputData, posingModel.leftArm2HeadLocation);
        };
        Posing3DLogic.prototype.calculateRightArm2Direction = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.rightArm2LocationInputData, posingData.rightArm1LocationInputData.childJointRootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.rightArm2LocationInputData, posingModel.rightArm2HeadLocation);
        };
        Posing3DLogic.prototype.calculateLeftLeg2Direction = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.leftLeg2LocationInputData, posingData.leftLeg1LocationInputData.childJointRootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
            // Calclates sub locations
            this.calculateArmLegSubLocations(posingData.leftLeg2LocationInputData, posingModel.leftLeg2HeadLocation);
        };
        Posing3DLogic.prototype.calculateRightLeg2Direction = function (posingData, posingModel, posing3DView) {
            // Main calculation
            this.calculateBodyPartDirection(posingData.rightLeg2LocationInputData, posingData.rightLeg1LocationInputData.childJointRootMatrix, Posing3D_BodyLocateMode.keepFrontUp, posingData, posing3DView);
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
