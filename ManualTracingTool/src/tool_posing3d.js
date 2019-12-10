var ManualTracingTool;
(function (ManualTracingTool) {
    // Base tool classes
    class Tool_Posing3d_ToolBase extends ManualTracingTool.ModalToolBase {
        constructor() {
            super(...arguments);
            this.inputSideOptionCount = 0;
            this.editPoint = null;
            this.editLine = null;
        }
        setInputSide(buttonIndex, inputSideID, env) {
            return false;
        }
        getInputSideID(buttonIndex, env) {
            return ManualTracingTool.InputSideID.none;
        }
        copyInputLocationToPoint(e) {
            if (this.editPoint == null) {
                this.editPoint = new ManualTracingTool.LinePoint();
            }
            vec3.copy(this.editPoint.location, e.location);
        }
        copyInputLocationToLine(e) {
            if (this.editLine == null) {
                this.editLine = new ManualTracingTool.VectorLine();
            }
            let point = new ManualTracingTool.LinePoint();
            vec3.copy(point.location, e.location);
            vec3.copy(point.adjustingLocation, e.location);
            this.editLine.points.push(point);
        }
    }
    ManualTracingTool.Tool_Posing3d_ToolBase = Tool_Posing3d_ToolBase;
    class Tool_Posing3d_PointInputToolBase extends Tool_Posing3d_ToolBase {
        constructor() {
            super(...arguments);
            this.inputSideOptionCount = 1;
            this.tempTargetLocation = vec3.create();
        }
        mouseDown(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (!e.isLeftButtonPressing()) {
                return;
            }
            this.execute(e, env);
        }
        mouseMove(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            env.setRedrawEditorWindow();
            if (!e.isLeftButtonPressing()) {
                return;
            }
            this.execute(e, env);
        }
        setInputSide(buttonIndex, inputSideID, env) {
            if (env.currentPosingData != null) {
                let inputData = this.getInputData(env);
                if (buttonIndex == 0) {
                    if (inputSideID == ManualTracingTool.InputSideID.front) {
                        inputData.inputSideID = ManualTracingTool.InputSideID.back;
                    }
                    else {
                        inputData.inputSideID = ManualTracingTool.InputSideID.front;
                    }
                    return true;
                }
            }
            return false;
        }
        getInputSideID(buttonIndex, env) {
            if (env.currentPosingData != null) {
                let inputData = this.getInputData(env);
                return inputData.inputSideID;
            }
            else {
                return ManualTracingTool.InputSideID.none;
            }
        }
        getInputData(env) {
            throw ('Tool_Posing3d_ToolBase: not implemented!');
        }
        execute(e, env) {
            let inputData = this.getInputData(env);
            let hited = env.posing3DLogic.processMouseInputLocation(this.tempTargetLocation, e.location, inputData, env.currentPosingData, env.posing3DView);
            if (!hited) {
                return;
            }
            this.executeCommand(this.tempTargetLocation, e.location, e, env);
        }
        executeCommand(inputLocation, inputLocation2D, e, env) {
            throw ('Tool_Posing3d_ToolBase: not implemented!');
        }
    }
    ManualTracingTool.Tool_Posing3d_PointInputToolBase = Tool_Posing3d_PointInputToolBase;
    let JointPartInputMode;
    (function (JointPartInputMode) {
        JointPartInputMode[JointPartInputMode["none"] = 0] = "none";
        JointPartInputMode[JointPartInputMode["directionInput"] = 1] = "directionInput";
        JointPartInputMode[JointPartInputMode["rollInput"] = 2] = "rollInput";
    })(JointPartInputMode || (JointPartInputMode = {}));
    class Tool_Posing3d_JointPartInputToolBase extends Tool_Posing3d_PointInputToolBase {
        constructor() {
            super(...arguments);
            this.location3D = vec3.create();
            this.location2D = vec3.create();
            this.location2DTo = vec3.create();
            this.enableDirectionInput = true;
            this.enableRollInput = true;
            this.jointPartInputMode = JointPartInputMode.none;
            this.mouseOnInputMode = JointPartInputMode.none;
            this.inputLocation = vec3.create();
            this.relativeMouseLocation = vec3.create();
            this.tmpMatrix = mat4.create();
            this.vecZ = vec3.create();
            this.relativeInputLocation = vec3.create();
            this.rollInputRootMatrix = mat4.create();
            this.rollInputLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.lastMatrix = mat4.create();
            this.startAngle = 0.0;
            this.lastAngle = 0.0;
        }
        getInputModeForMouseLocation(resultRelativeMouseLocation, env) {
            let inputData = this.getInputData(env);
            let circleRadius = this.getBoneInputCircleRadius(env) * env.drawStyle.posing3DBoneInputCircleHitRadius;
            if (!inputData.inputDone) {
                return JointPartInputMode.directionInput;
            }
            else {
                if (inputData.inputDone && inputData.directionInputDone) {
                    env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, inputData.inputLocation, env.currentPosingData.real3DViewHalfWidth);
                    let distance = vec3.distance(env.mouseCursorLocation, this.location2D);
                    if (resultRelativeMouseLocation != null) {
                        vec3.subtract(resultRelativeMouseLocation, this.location2D, env.mouseCursorLocation);
                    }
                    if (distance <= circleRadius) {
                        return JointPartInputMode.directionInput;
                    }
                    else {
                        return JointPartInputMode.rollInput;
                    }
                }
            }
            return JointPartInputMode.none;
        }
        mouseDown(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (!e.isLeftButtonPressing()) {
                return;
            }
            env.setRedrawEditorWindow();
            let jointPartInputMode = this.getInputModeForMouseLocation(this.relativeMouseLocation, env);
            if (jointPartInputMode == JointPartInputMode.rollInput) {
                let inputData = this.getInputData(env);
                let hited = env.posing3DLogic.processMouseInputLocation(inputData.rollInputLocation, e.location, inputData, env.currentPosingData, env.posing3DView);
                if (!hited) {
                    return;
                }
                mat4.copy(this.lastMatrix, inputData.matrix);
                this.startAngle = this.calculateAngle(inputData);
                this.lastAngle = inputData.rollInputAngle;
            }
            if (jointPartInputMode != JointPartInputMode.none) {
                this.jointPartInputMode = jointPartInputMode;
                this.execute(e, env);
            }
        }
        mouseMove(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            let jointPartInputMode = this.getInputModeForMouseLocation(null, env);
            if (jointPartInputMode != this.mouseOnInputMode) {
                this.mouseOnInputMode = jointPartInputMode;
                env.setRedrawEditorWindow();
            }
            if (!e.isLeftButtonPressing()) {
                return;
            }
            if (this.jointPartInputMode == JointPartInputMode.directionInput) {
                this.execute(e, env);
            }
            else if (this.jointPartInputMode == JointPartInputMode.rollInput) {
                let inputData = this.getInputData(env);
                let hited = env.posing3DLogic.processMouseInputLocation(inputData.rollInputLocation, e.location, inputData, env.currentPosingData, env.posing3DView);
                if (hited) {
                    this.execute(e, env);
                }
            }
        }
        mouseUp(e, env) {
            this.jointPartInputMode = JointPartInputMode.none;
            env.setRedrawWebGLWindow();
            env.setRedrawEditorWindow();
        }
        getBoneInputCircleRadius(env) {
            return env.getViewScaledLength(env.drawStyle.posing3DBoneInputCircleRadius);
        }
        onDrawEditor(env, drawEnv) {
            let inputData = this.getInputData(env);
            if (!inputData.inputDone) {
                return;
            }
            let circleRadius = this.getBoneInputCircleRadius(env);
            if (this.enableDirectionInput && inputData.directionInputDone) {
                env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, inputData.inputLocation, env.currentPosingData.real3DViewHalfWidth);
                let strokeWidth = (this.mouseOnInputMode == JointPartInputMode.directionInput) ? 4.0 : 2.0;
                drawEnv.drawCircle(this.location2D, circleRadius, env.getViewScaledLength(strokeWidth), drawEnv.style.posing3DBoneHeadColor);
            }
            if (this.enableRollInput && this.jointPartInputMode == JointPartInputMode.rollInput) {
                vec3.set(this.location3D, inputData.matrix[12], inputData.matrix[13], inputData.matrix[14]);
                env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.location3D, env.currentPosingData.real3DViewHalfWidth);
                env.posing3DView.calculate2DLocationFrom3DLocation(this.location2DTo, inputData.inputLocation, env.currentPosingData.real3DViewHalfWidth);
                drawEnv.drawLine(this.location2D, this.location2DTo, env.getViewScaledLength(4.0), drawEnv.style.posing3DBoneGrayColor);
                vec3.set(this.location3D, this.rollInputRootMatrix[12], this.rollInputRootMatrix[13], this.rollInputRootMatrix[14]);
                env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.location3D, env.currentPosingData.real3DViewHalfWidth);
                env.posing3DView.calculate2DLocationFrom3DLocation(this.location2DTo, inputData.rollInputLocation, env.currentPosingData.real3DViewHalfWidth);
                drawEnv.drawLine(this.location2D, this.location2DTo, env.getViewScaledLength(2.0), drawEnv.style.posing3DBoneGrayColor);
                drawEnv.drawCircle(this.location2D, env.getViewScaledLength(2.0), env.getViewScaledLength(4.0), drawEnv.style.posing3DBoneGrayColor);
                let strokeWidth = (this.mouseOnInputMode == JointPartInputMode.rollInput) ? 4.0 : 2.0;
                drawEnv.drawCircle(this.location2DTo, env.getViewScaledLength(5.0), env.getViewScaledLength(strokeWidth), drawEnv.style.posing3DBoneForwardColor);
            }
        }
        calculateAngle(inputData) {
            mat4.invert(this.tmpMatrix, this.lastMatrix);
            vec3.transformMat4(this.relativeInputLocation, inputData.rollInputLocation, this.tmpMatrix);
            vec3.set(this.vecZ, 0.0, 0.0, this.relativeInputLocation[2]);
            mat4.translate(this.rollInputRootMatrix, this.lastMatrix, this.vecZ);
            return Math.atan2(this.relativeInputLocation[1], this.relativeInputLocation[0]);
        }
        execute(e, env) {
            vec3.add(this.location2D, e.location, this.relativeMouseLocation);
            let inputData = this.getInputData(env);
            let hited = env.posing3DLogic.processMouseInputLocation(this.inputLocation, this.location2D, inputData, env.currentPosingData, env.posing3DView);
            if (!hited) {
                return;
            }
            this.executeCommand(this.inputLocation, this.location2D, e, env);
        }
        executeCommand(inputLocation, inputLocation2D, e, env) {
            let inputData = this.getInputData(env);
            // Set inputs
            if (this.jointPartInputMode == JointPartInputMode.directionInput) {
                vec3.copy(inputData.inputLocation, inputLocation);
                vec3.copy(inputData.inputLocation2D, inputLocation2D);
                inputData.inputDone = true;
                inputData.directionInputDone = true;
            }
            else if (this.jointPartInputMode == JointPartInputMode.rollInput) {
                let angle = this.calculateAngle(inputData);
                inputData.rollInputDone = true;
                inputData.rollInputAngle = this.lastAngle + (angle - this.startAngle);
                if (inputData.rollInputAngle <= 0.0) {
                    inputData.rollInputAngle += Math.PI * 2.0;
                }
                if (inputData.rollInputAngle >= Math.PI * 2.0) {
                    inputData.rollInputAngle -= Math.PI * 2.0;
                }
            }
            // Calculate
            env.posing3DLogic.calculateAll(env.currentPosingData, env.currentPosingModel, env.posing3DView);
            this.updateAdditionalPart(inputLocation, env);
            env.setRedrawWebGLWindow();
            env.setRedrawEditorWindow();
            env.setRedrawSubtoolWindow();
        }
        updateAdditionalPart(inputLocation, env) {
        }
    }
    ManualTracingTool.Tool_Posing3d_JointPartInputToolBase = Tool_Posing3d_JointPartInputToolBase;
    class Tool_Posing3d_LineInputToolBase extends Tool_Posing3d_ToolBase {
        mouseDown(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (e.isLeftButtonPressing()) {
                this.editLine = new ManualTracingTool.VectorLine();
                this.copyInputLocationToLine(e);
                return;
            }
        }
        mouseMove(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (this.editLine == null) {
                return;
            }
            if (!e.isLeftButtonPressing()) {
                return;
            }
            env.setRedrawEditorWindow();
            this.copyInputLocationToLine(e);
        }
        mouseUp(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (e.isLeftButtonReleased()) {
                if (this.editLine == null) {
                    return;
                }
                ManualTracingTool.Logic_Edit_Line.calculateParameters(this.editLine);
                if (this.editLine.points.length <= 1 || this.editLine.totalLength < 1) {
                    return;
                }
                this.executeCommand(env);
                return;
            }
        }
        executeCommand(env) {
        }
    }
    ManualTracingTool.Tool_Posing3d_LineInputToolBase = Tool_Posing3d_LineInputToolBase;
    // Each tools
    class Tool_Posing3d_LocateHead extends Tool_Posing3d_LineInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = 'マウスでクリックすると頭の位置が決まり、さらにドラッグするとスケールが変更できます。<br />次の操作に移るには画面右のパネルの「頭の向き」をクリックします。';
            this.tempVec3 = vec3.fromValues(0.0, 0.0, 0.0);
            this.centerLocationSum = vec3.fromValues(0.0, 0.0, 0.0);
            this.centerLocation3D = vec3.fromValues(0.0, 0.0, 0.0);
            this.subLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.inputRadius = 0.0;
            this.inputRadiusAdjustRate = 1.2;
            this.minInputRadius = 25.0;
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null);
        }
        prepareModal(e, env) {
            if (env.currentPosingData == null) {
                return false;
            }
            vec3.copy(this.centerLocationSum, e.location);
            this.inputRadius = this.minInputRadius;
            return true;
        }
        mouseDown(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (e.isLeftButtonPressing()) {
                env.startModalTool(this);
                this.executeCommand(env);
            }
        }
        mouseMove(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (!e.isLeftButtonPressing() || !env.isModalToolRunning()) {
                return;
            }
            vec3.subtract(this.subLocation, e.location, this.centerLocationSum);
            this.inputRadius = vec3.length(this.subLocation);
            if (this.inputRadius < this.minInputRadius) {
                this.inputRadius = this.minInputRadius;
            }
            this.executeCommand(env);
        }
        mouseUp(e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (!env.isModalToolRunning()) {
                return;
            }
            env.endModalTool();
        }
        executeCommand(env) {
            /*
            // Center of head sphere
            //let locationCountSum = 0.0;
            vec3.set(this.centerLocationSum, 0.0, 0.0, 0.0);
            //let lastLength = 0.0;
            let totalCount = 0.0;
            for (let point of this.editLine.points) {

                //let segmentLength = point.totalLength - lastLength;
                //vec3.scale(this.tempVec3, point.location, segmentLength / this.editLine.totalLength);
                //vec3.add(this.centerLocationSum, this.centerLocationSum, this.tempVec3);
                //lastLength = point.totalLength;

                vec3.add(this.centerLocationSum, this.centerLocationSum, point.location);
                totalCount += 1;
            }

            if (totalCount > 0) {

                vec3.scale(this.centerLocationSum, this.centerLocationSum, 1 / totalCount);
            }
            */
            //console.log('頭の配置');
            //console.log(this.centerLocationSum);
            /*
            // Radius
            let radiusSum = 0.0;
            //let lastLength2 = 0.0;
            let totalCount2 = 0.0;
            for (let point of this.editLine.points) {

                //let segmentLength = point.totalLength - lastLength2;
                //vec3.subtract(this.subLocation, point.location, this.centerLocationSum);
                //radiusSum += vec3.length(this.subLocation) * (segmentLength / this.editLine.totalLength);
                //lastLength2 = point.totalLength;

                vec3.subtract(this.subLocation, point.location, this.centerLocationSum);
                radiusSum += vec3.length(this.subLocation);
                totalCount2 += 1;
            }

            if (totalCount2 > 0) {

                radiusSum *= 1 / totalCount2;
            }

            //console.log(radiusSum);
            */
            let radiusSum = this.inputRadius * this.inputRadiusAdjustRate;
            // Expects model is located 2.0m away from camera at first, then calculate zoom rate as real3DViewHalfWidth
            //     headSphereSize[m] / real3DViewHalfWidth[m] = radiusSum[px] / real2DViewWidth[px]
            //     real3DViewHalfWidth[m] / headSphereSize[m] = real2DViewWidth[px] / radiusSum[px]
            //     real3DViewHalfWidth[m]                     = (real2DViewWidth[px] / radiusSum[px]) * headSphereSize[m]
            let real2DViewWidth = env.mainWindow.width / 2;
            env.currentPosingData.real3DViewHalfWidth = (real2DViewWidth / radiusSum) * env.currentPosingModel.headSphereSize;
            // debug
            //env.currentPosingData.viewZoomRate = env.currentPosingModel.headSphereSize / 50.0;
            //this.centerLocationSum[0] = env.mainWindow.width / 2 + radiusSum;
            //this.centerLocationSum[0] = env.mainWindow.width / 2;
            //this.centerLocationSum[1] = env.mainWindow.height / 2;
            //for (let point of this.editLine.points) {
            //    point.location[0] = this.centerLocationSum[0];
            //    point.adjustedLocation[0] = this.centerLocationSum[0];
            //}
            // debug
            env.posing3DView.calculate3DLocationFrom2DLocation(this.centerLocation3D, this.centerLocationSum, 2.0 // 2.0m
            , env.currentPosingData.real3DViewHalfWidth);
            //console.log(this.centerLocation);
            // Set inputs
            let headLocationInputData = env.currentPosingData.headLocationInputData;
            vec3.copy(headLocationInputData.center, this.centerLocation3D);
            headLocationInputData.radius = radiusSum;
            headLocationInputData.editLine = this.editLine;
            headLocationInputData.inputDone = true;
            env.currentPosingData.headRotationInputData.inputDone = false;
            // Calculate
            env.posing3DLogic.calculateHeadLocation(env.currentPosingData, env.currentPosingModel);
            env.setRedrawWebGLWindow();
            env.setRedrawSubtoolWindow();
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateHead = Tool_Posing3d_LocateHead;
    class Tool_Posing3d_RotateHead extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '画面に表示された球のどこかをクリックすると頭の向きが決まります。<br />画面右のパネルで「手前」となっているボタンをクリックすると奥側を指定できるようになります。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && env.currentPosingData.headLocationInputData.inputDone);
        }
        getInputData(env) {
            return env.currentPosingData.headRotationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_RotateHead = Tool_Posing3d_RotateHead;
    class Tool_Posing3d_LocateBody extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '半透明の球のどこかをクリックすると頭の向きを正面として胴が配置されます。<br />少し外側をクリックすると画面に対して真横を指定できます。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && env.currentPosingData.headLocationInputData.inputDone);
        }
        getInputData(env) {
            return env.currentPosingData.bodyLocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateBody = Tool_Posing3d_LocateBody;
    class Tool_Posing3d_LocateHips extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '腰を配置します。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && env.currentPosingData.bodyLocationInputData.inputDone);
        }
        getInputData(env) {
            return env.currentPosingData.hipsLocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateHips = Tool_Posing3d_LocateHips;
    class Tool_Posing3d_LocateLeftShoulder extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = 'ヒジのあたりの位置を指定して肩を配置します。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone));
        }
        getInputData(env) {
            return env.currentPosingData.leftShoulderLocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateLeftShoulder = Tool_Posing3d_LocateLeftShoulder;
    class Tool_Posing3d_LocateRightShoulder extends Tool_Posing3d_LocateLeftShoulder {
        getInputData(env) {
            return env.currentPosingData.rightShoulderLocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateRightShoulder = Tool_Posing3d_LocateRightShoulder;
    class Tool_Posing3d_LocateLeftArm1 extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = 'ヒジのあたりの位置を指定して上腕を配置します。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone));
        }
        getInputData(env) {
            return env.currentPosingData.leftArm1LocationInputData;
        }
        updateAdditionalPart(inputLocation, env) {
            env.currentPosingData.leftShoulderLocationInputData.inputDone = true;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateLeftArm1 = Tool_Posing3d_LocateLeftArm1;
    class Tool_Posing3d_LocateRightArm1 extends Tool_Posing3d_LocateLeftArm1 {
        constructor() {
            super(...arguments);
            this.helpText = 'ヒジのあたりの位置を指定して上腕を配置します。';
        }
        getInputData(env) {
            return env.currentPosingData.rightArm1LocationInputData;
        }
        updateAdditionalPart(inputLocation, env) {
            env.currentPosingData.rightShoulderLocationInputData.inputDone = true;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateRightArm1 = Tool_Posing3d_LocateRightArm1;
    class Tool_Posing3d_LocateLeftLeg1 extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = 'ヒザのあたりの位置を指定して上脚を配置します。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && env.currentPosingData.hipsLocationInputData.inputDone);
        }
        getInputData(env) {
            return env.currentPosingData.leftLeg1LocationInputData;
        }
        executeCommandExt(inputLocation, env) {
            env.currentPosingData.leftShoulderLocationInputData.inputDone = true;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateLeftLeg1 = Tool_Posing3d_LocateLeftLeg1;
    class Tool_Posing3d_LocateRightLeg1 extends Tool_Posing3d_LocateLeftLeg1 {
        constructor() {
            super(...arguments);
            this.helpText = 'ヒザのあたりの位置を指定して上脚を配置します。';
        }
        getInputData(env) {
            return env.currentPosingData.rightLeg1LocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateRightLeg1 = Tool_Posing3d_LocateRightLeg1;
    class Tool_Posing3d_LocateLeftArm2 extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '手首のあたりの位置を指定して下腕を配置します。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && env.currentPosingData.leftArm1LocationInputData.inputDone);
        }
        getInputData(env) {
            return env.currentPosingData.leftArm2LocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateLeftArm2 = Tool_Posing3d_LocateLeftArm2;
    class Tool_Posing3d_LocateRightArm2 extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '手首のあたりの位置を指定して下腕を配置します。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && env.currentPosingData.rightArm1LocationInputData.inputDone);
        }
        getInputData(env) {
            return env.currentPosingData.rightArm2LocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateRightArm2 = Tool_Posing3d_LocateRightArm2;
    class Tool_Posing3d_LocateLeftLeg2 extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '足首のあたりの位置を指定して下脚を配置します。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && env.currentPosingData.leftLeg1LocationInputData.inputDone);
        }
        getInputData(env) {
            return env.currentPosingData.leftLeg2LocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateLeftLeg2 = Tool_Posing3d_LocateLeftLeg2;
    class Tool_Posing3d_LocateRightLeg2 extends Tool_Posing3d_JointPartInputToolBase {
        constructor() {
            super(...arguments);
            this.helpText = '足首のあたりの位置を指定して下脚を配置します。';
        }
        isAvailable(env) {
            return (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && env.currentPosingData != null
                && env.currentPosingData.rightLeg1LocationInputData.inputDone);
        }
        getInputData(env) {
            return env.currentPosingData.rightLeg2LocationInputData;
        }
    }
    ManualTracingTool.Tool_Posing3d_LocateRightLeg2 = Tool_Posing3d_LocateRightLeg2;
    class Command_Posing3d_LocateHead extends ManualTracingTool.CommandBase {
        execute(env) {
            this.errorCheck();
        }
        undo(env) {
        }
        redo(env) {
            this.execute(env);
        }
        errorCheck() {
        }
    }
    ManualTracingTool.Command_Posing3d_LocateHead = Command_Posing3d_LocateHead;
})(ManualTracingTool || (ManualTracingTool = {}));
