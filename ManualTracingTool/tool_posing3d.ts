
namespace ManualTracingTool {

    // Base tool classes

    export class Tool_Posing3d_ToolBase extends ToolBase {

        inputSideOptionCount = 0;
        editPoint: LinePoint = null; 
        editLine: VectorLine = null;

        setInputSide(buttonIndex: int, inputSideID: InputSideID, env: ToolEnvironment): boolean { // @virtual

            return false;
        }

        getInputSideID(buttonIndex: int, env: ToolEnvironment): InputSideID { // @virtual

            return InputSideID.none;
        }

        protected copyInputLocationToPoint(e: ToolMouseEvent) {

            if (this.editPoint == null) {

                this.editPoint = new LinePoint();
            }

            vec3.copy(this.editPoint.location, e.location);
        }

        protected copyInputLocationToLine(e: ToolMouseEvent) {

            if (this.editLine == null) {

                this.editLine = new VectorLine();
            }

            let point = new LinePoint();
            vec3.copy(point.location, e.location);
            vec3.copy(point.adjustingLocation, e.location);

            this.editLine.points.push(point);
        }
    }

    export class Tool_Posing3d_PointInputToolBase extends Tool_Posing3d_ToolBase {

        inputSideOptionCount = 1;

        private targetLocation = vec3.create();

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (env.currentPosingData == null) {
                return;
            }

            if (!e.isLeftButtonPressing()) {
                return;
            }

            this.execute(e, env);
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (env.currentPosingData == null) {
                return;
            }

            env.setRedrawEditorWindow();

            if (!e.isLeftButtonPressing()) {
                return;
            }

            this.execute(e, env);
        }

        setInputSide(buttonIndex: int, inputSideID: InputSideID, env: ToolEnvironment): boolean { // @override

            if (env.currentPosingData != null) {

                let inputData = this.getInputData(env);

                if (buttonIndex == 0) {

                    if (inputSideID == InputSideID.front) {
                        inputData.inputSideID = InputSideID.back;
                    }
                    else {
                        inputData.inputSideID = InputSideID.front;
                    }

                    return true;
                }
            }

            return false;
        }

        getInputSideID(buttonIndex: int, env: ToolEnvironment): InputSideID { // @override

            if (env.currentPosingData != null) {

                let inputData = this.getInputData(env);

                return inputData.inputSideID;
            }
            else {

                return InputSideID.none;
            }
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData { // @virtual

            throw ('Tool_Posing3d_ToolBase: not implemented!');
        }

        private execute(e: ToolMouseEvent, env: ToolEnvironment) {

            this.copyInputLocationToPoint(e);

            let targetPoint = this.editPoint;

            let hited = env.posing3DView.pick3DLocationFromDepthImage(
                this.targetLocation
                , targetPoint.location
                , env.currentPosingData.real3DViewHalfWidth
                , env.pickingWindow);

            if (!hited) {
                return;
            }

            this.executeCommand(this.targetLocation, env);
        }

        protected executeCommand(inputLocation: Vec3, env: ToolEnvironment) { // @virtual

            throw ('Tool_Posing3d_ToolBase: not implemented!');
        }
    }

    export class Tool_Posing3d_JointPartInputToolBase extends Tool_Posing3d_PointInputToolBase {

        protected executeCommand(inputLocation: Vec3, env: ToolEnvironment) { // @override

            let inputData = this.getInputData(env);

            // Set inputs
            vec3.copy(inputData.inputLocation, inputLocation);
            inputData.editLine = this.editLine;
            inputData.inputDone = true;

            // Calculate
            env.posing3DLogic.calculateAll(env.currentPosingData, env.currentPosingModel);

            // Update dependent input

            env.setRedrawWebGLWindow();
            env.setRedrawSubtoolWindow();
        }
    }

    export class Tool_Posing3d_LineInputToolBase extends Tool_Posing3d_ToolBase {

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (env.currentPosingData == null) {
                return;
            }

            if (e.isLeftButtonPressing()) {

                this.editLine = new VectorLine();

                this.copyInputLocationToLine(e);

                return;
            }
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

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

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            if (env.currentPosingData == null) {
                return;
            }

            if (e.isLeftButtonReleased()) {

                if (this.editLine == null) {
                    return;
                }

                Logic_Edit_Line.calculateParameters(this.editLine);

                if (this.editLine.points.length <= 1 || this.editLine.totalLength < 1) {
                    return;
                }

                this.executeCommand(env);

                return;
            }
        }

        protected executeCommand(env: ToolEnvironment) {
        }
    }

    // Each tools

    export class Tool_Posing3d_LocateHead extends Tool_Posing3d_LineInputToolBase {

        helpText = 'マウスで円を描いてみてください。頭の配置が決まります。<br />次の操作に移るには画面右のパネルの「頭の向き」をクリックします。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
            );
        }

        tempVec3 = vec3.fromValues(0.0, 0.0, 0.0);
        centerLocationSum = vec3.fromValues(0.0, 0.0, 0.0);
        centerLocation = vec3.fromValues(0.0, 0.0, 0.0);
        subLocation = vec3.fromValues(0.0, 0.0, 0.0);

        protected executeCommand(env: ToolEnvironment) {

            // Center of head sphere
            let locationCountSum = 0.0;
            vec3.set(this.centerLocationSum, 0.0, 0.0, 0.0);
            let lastLength = 0.0;
            for (let point of this.editLine.points) {

                let segmentLength = point.totalLength - lastLength;
                vec3.scale(this.tempVec3, point.location, segmentLength / this.editLine.totalLength);
                vec3.add(this.centerLocationSum, this.centerLocationSum, this.tempVec3);

                lastLength = point.totalLength;
            }

            // Radius
            let radiusSum = 0.0;
            let lastLength2 = 0.0;
            for (let point of this.editLine.points) {

                let segmentLength = point.totalLength - lastLength2;
                vec3.subtract(this.subLocation, point.location, this.centerLocationSum);
                radiusSum += vec3.length(this.subLocation) * (segmentLength / this.editLine.totalLength);

                lastLength2 = point.totalLength;
            }

            // Expects model is located 2.0m away from camera at first, then calculate zoom rate
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

            env.posing3DView.calculate3DLocationFrom2DLocation(
                this.centerLocation
                , this.centerLocationSum
                , 2.0 // 2.0m
                , env.currentPosingData.real3DViewHalfWidth
                , env.mainWindow);

            // Set inputs
            let headLocationInputData = env.currentPosingData.headLocationInputData;

            vec3.copy(headLocationInputData.center, this.centerLocation);
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

    export class Tool_Posing3d_RotateHead extends Tool_Posing3d_PointInputToolBase {

        helpText = '画面に表示された球のどこかをクリックすると頭の向きが決まります。<br />画面右のパネルで「手前」となっているボタンをクリックすると奥側を指定できるようになります。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.headLocationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

            return env.currentPosingData.headRotationInputData;
        }

        protected executeCommand(inputLocation: Vec3, env: ToolEnvironment) {

            let headRotationInputData = env.currentPosingData.headRotationInputData;
            let headTwistInputData = env.currentPosingData.headTwistInputData;

            // Set inputs
            vec3.copy(headRotationInputData.inputLocation, inputLocation);
            headRotationInputData.editLine = this.editLine;
            headRotationInputData.inputDone = true;
            headTwistInputData.inputDone = false;

            // Calculate
            env.posing3DLogic.calculateHeadRotation(env.currentPosingData, env.currentPosingModel);

            env.setRedrawWebGLWindow();
            env.setRedrawSubtoolWindow();
        }
    }

    export class Tool_Posing3d_TwistHead extends Tool_Posing3d_PointInputToolBase {

        helpText = '追加の頭の角度指定です。<br />使いづらくてゴメン…。';

        inputSideOptionCount = 1;

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.headRotationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

            return env.currentPosingData.headTwistInputData;
        }

        protected executeCommand(inputLocation: Vec3, env: ToolEnvironment) {

            let headTwistInputData = env.currentPosingData.headTwistInputData;

            // Set inputs
            vec3.copy(headTwistInputData.tempInputLocation, inputLocation);
            headTwistInputData.editLine = this.editLine;
            headTwistInputData.inputDone = true;

            // Calculate
            env.posing3DLogic.calculateHeadTwist(env.currentPosingData, env.currentPosingModel);

            env.setRedrawWebGLWindow();
            env.setRedrawSubtoolWindow();
        }
    }

    export class Tool_Posing3d_LocateBody extends Tool_Posing3d_PointInputToolBase {

        helpText = '半透明の球のどこかをクリックすると頭の向きを正面として胴が配置されます。<br />少し外側をクリックすると画面に対して真横を指定できます。';

        inputSideOptionCount = 1;

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.headLocationInputData.inputDone
                );
        }

        setInputSide(buttonIndex: int, inputSideID: InputSideID, env: ToolEnvironment): boolean { // @virtual

            if (env.currentPosingData != null) {

                if (buttonIndex == 0) {

                    if (inputSideID == InputSideID.front) {
                        env.currentPosingData.bodyLocationInputData.inputSideID = InputSideID.back;
                    }
                    else {
                        env.currentPosingData.bodyLocationInputData.inputSideID = InputSideID.front;
                    }

                    return true;
                }
            }

            return false;
        }

        getInputSideID(buttonIndex: int, env: ToolEnvironment): InputSideID { // @virtual

            if (env.currentPosingData != null) {

                return env.currentPosingData.bodyLocationInputData.inputSideID;
            }
            else {

                return InputSideID.none;
            }
        }

        protected executeCommand(inputLocation: Vec3, env: ToolEnvironment) {

            let bodyLocationInputData = env.currentPosingData.bodyLocationInputData;
            let bodyRotationInputData = env.currentPosingData.bodyRotationInputData;

            // Set inputs
            vec3.copy(bodyLocationInputData.inputLocation, inputLocation);
            bodyLocationInputData.editLine = this.editLine;
            bodyLocationInputData.inputDone = true;
            bodyRotationInputData.inputDone = false;

            env.posing3DLogic.calculateAll(env.currentPosingData, env.currentPosingModel);

            env.setRedrawWebGLWindow();
            env.setRedrawSubtoolWindow();
        }
    }

    export class Tool_Posing3d_RatateBody extends Tool_Posing3d_PointInputToolBase {

        helpText = '半透明の球のどこかをクリックすると胴の水平方向の向きを変えられます。';

        inputSideOptionCount = 1;

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null
                && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.bodyLocationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

            return env.currentPosingData.bodyRotationInputData;
        }

        protected executeCommand(inputLocation: Vec3, env: ToolEnvironment) {

            // Set inputs
            let bodyRotationInputData = env.currentPosingData.bodyRotationInputData;

            vec3.copy(bodyRotationInputData.inputLocation, inputLocation);
            bodyRotationInputData.editLine = this.editLine;
            bodyRotationInputData.inputDone = true;

            // Calculate
            env.posing3DLogic.calculateAll(env.currentPosingData, env.currentPosingModel);

            env.setRedrawWebGLWindow();
            env.setRedrawSubtoolWindow();
        }
    }

    export class Tool_Posing3d_LocateHips extends Tool_Posing3d_JointPartInputToolBase {

        helpText = '腰を配置します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.bodyLocationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

            return env.currentPosingData.hipsLocationInputData;
        }
    }

    export class Tool_Posing3d_LocateLeftShoulder extends Tool_Posing3d_JointPartInputToolBase {

        helpText = 'ヒジのあたりの位置を指定して肩を配置します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone)
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

            return env.currentPosingData.leftShoulderLocationInputData;
        }
    }

    export class Tool_Posing3d_LocateRightShoulder extends Tool_Posing3d_LocateLeftShoulder {

        protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

            return env.currentPosingData.rightShoulderLocationInputData;
        }
    }

    export class Tool_Posing3d_LocateLeftArm1 extends Tool_Posing3d_JointPartInputToolBase {

        helpText = 'ヒジのあたりの位置を指定して上腕を配置します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone)
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

            return env.currentPosingData.leftArm1LocationInputData;
        }
    }

    export class Tool_Posing3d_LocateRightArm1 extends Tool_Posing3d_LocateLeftArm1 {

        helpText = 'ヒジのあたりの位置を指定して上腕を配置します。';

        protected getInputData(env: ToolEnvironment): DirectionInputData {

            return env.currentPosingData.rightArm1LocationInputData;
        }
    }

    export class Tool_Posing3d_LocateLeftLeg1 extends Tool_Posing3d_JointPartInputToolBase {

        helpText = 'ヒザのあたりの位置を指定して上脚を配置します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.hipsLocationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData {

            return env.currentPosingData.leftLeg1LocationInputData;
        }
    }

    export class Tool_Posing3d_LocateRightLeg1 extends Tool_Posing3d_LocateLeftLeg1 {

        helpText = 'ヒザのあたりの位置を指定して上脚を配置します。';

        protected getInputData(env: ToolEnvironment): DirectionInputData {

            return env.currentPosingData.rightLeg1LocationInputData;
        }
    }

    export class Tool_Posing3d_LocateLeftArm2 extends Tool_Posing3d_JointPartInputToolBase {

        helpText = '手首のあたりの位置を指定して下腕を配置します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.leftArm1LocationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData {

            return env.currentPosingData.leftArm2LocationInputData;
        }
    }

    export class Tool_Posing3d_LocateRightArm2 extends Tool_Posing3d_JointPartInputToolBase {

        helpText = '手首のあたりの位置を指定して下腕を配置します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.rightArm1LocationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData {

            return env.currentPosingData.rightArm2LocationInputData;
        }
    }

    export class Tool_Posing3d_LocateLeftLeg2 extends Tool_Posing3d_JointPartInputToolBase {

        helpText = '足首のあたりの位置を指定して下脚を配置します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.leftLeg1LocationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData {

            return env.currentPosingData.leftLeg2LocationInputData;
        }
    }

    export class Tool_Posing3d_LocateRightLeg2 extends Tool_Posing3d_JointPartInputToolBase {

        helpText = '足首のあたりの位置を指定して下脚を配置します。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return (
                env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.rightLeg1LocationInputData.inputDone
            );
        }

        protected getInputData(env: ToolEnvironment): DirectionInputData {

            return env.currentPosingData.rightLeg2LocationInputData;
        }
    }

    export class Command_Posing3d_LocateHead extends CommandBase {

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();
        }

        undo(env: ToolEnvironment) { // @override
        }

        redo(env: ToolEnvironment) { // @override

            this.execute(env);
        }

        errorCheck() {
        }
    }
}
