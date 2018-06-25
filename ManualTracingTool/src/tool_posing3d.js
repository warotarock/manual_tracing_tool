var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    // Base tool classes
    var Tool_Posing3d_ToolBase = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_ToolBase, _super);
        function Tool_Posing3d_ToolBase() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.inputSideOptionCount = 0;
            _this.editPoint = null;
            _this.editLine = null;
            return _this;
        }
        Tool_Posing3d_ToolBase.prototype.setInputSide = function (buttonIndex, inputSideID, env) {
            return false;
        };
        Tool_Posing3d_ToolBase.prototype.getInputSideID = function (buttonIndex, env) {
            return ManualTracingTool.InputSideID.none;
        };
        Tool_Posing3d_ToolBase.prototype.copyInputLocationToPoint = function (e) {
            if (this.editPoint == null) {
                this.editPoint = new ManualTracingTool.LinePoint();
            }
            vec3.copy(this.editPoint.location, e.location);
        };
        Tool_Posing3d_ToolBase.prototype.copyInputLocationToLine = function (e) {
            if (this.editLine == null) {
                this.editLine = new ManualTracingTool.VectorLine();
            }
            var point = new ManualTracingTool.LinePoint();
            vec3.copy(point.location, e.location);
            vec3.copy(point.adjustingLocation, e.location);
            this.editLine.points.push(point);
        };
        return Tool_Posing3d_ToolBase;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_Posing3d_ToolBase = Tool_Posing3d_ToolBase;
    var Tool_Posing3d_PointInputToolBase = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_PointInputToolBase, _super);
        function Tool_Posing3d_PointInputToolBase() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.inputSideOptionCount = 0;
            _this.targetLocation = vec3.create();
            return _this;
        }
        Tool_Posing3d_PointInputToolBase.prototype.mouseDown = function (e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (!e.isLeftButtonPressing()) {
                return;
            }
            this.execute(e, env);
        };
        Tool_Posing3d_PointInputToolBase.prototype.mouseMove = function (e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            env.setRedrawEditorWindow();
            if (!e.isLeftButtonPressing()) {
                return;
            }
            this.execute(e, env);
        };
        Tool_Posing3d_PointInputToolBase.prototype.execute = function (e, env) {
            this.copyInputLocationToPoint(e);
            var targetPoint = this.editPoint;
            var hited = env.posing3DView.pick3DLocationFromDepthImage(this.targetLocation, targetPoint.location, env.currentPosingData.real3DViewHalfWidth, env.pickingWindow);
            if (!hited) {
                return;
            }
            this.executeCommand(this.targetLocation, env);
        };
        Tool_Posing3d_PointInputToolBase.prototype.executeCommand = function (inputLocation, env) {
        };
        return Tool_Posing3d_PointInputToolBase;
    }(Tool_Posing3d_ToolBase));
    ManualTracingTool.Tool_Posing3d_PointInputToolBase = Tool_Posing3d_PointInputToolBase;
    var Tool_Posing3d_LineInputToolBase = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LineInputToolBase, _super);
        function Tool_Posing3d_LineInputToolBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Tool_Posing3d_LineInputToolBase.prototype.mouseDown = function (e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (e.isLeftButtonPressing()) {
                this.editLine = new ManualTracingTool.VectorLine();
                this.copyInputLocationToLine(e);
                return;
            }
        };
        Tool_Posing3d_LineInputToolBase.prototype.mouseMove = function (e, env) {
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
        };
        Tool_Posing3d_LineInputToolBase.prototype.mouseUp = function (e, env) {
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
        };
        Tool_Posing3d_LineInputToolBase.prototype.executeCommand = function (env) {
        };
        return Tool_Posing3d_LineInputToolBase;
    }(Tool_Posing3d_ToolBase));
    ManualTracingTool.Tool_Posing3d_LineInputToolBase = Tool_Posing3d_LineInputToolBase;
    // Each tools
    var Tool_Posing3d_LocateHead = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateHead, _super);
        function Tool_Posing3d_LocateHead() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'マウスで円を描いてみてください。頭の配置が決まります。<br />次の操作に移るには画面右のパネルの「頭の向き」をクリックします。';
            _this.tempVec3 = vec3.fromValues(0.0, 0.0, 0.0);
            _this.centerLocationSum = vec3.fromValues(0.0, 0.0, 0.0);
            _this.centerLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.subLocation = vec3.fromValues(0.0, 0.0, 0.0);
            return _this;
        }
        Tool_Posing3d_LocateHead.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null);
        };
        Tool_Posing3d_LocateHead.prototype.executeCommand = function (env) {
            // Center of head sphere
            var locationCountSum = 0.0;
            vec3.set(this.centerLocationSum, 0.0, 0.0, 0.0);
            var lastLength = 0.0;
            for (var _i = 0, _a = this.editLine.points; _i < _a.length; _i++) {
                var point = _a[_i];
                var segmentLength = point.totalLength - lastLength;
                vec3.scale(this.tempVec3, point.location, segmentLength / this.editLine.totalLength);
                vec3.add(this.centerLocationSum, this.centerLocationSum, this.tempVec3);
                lastLength = point.totalLength;
            }
            // Radius
            var radiusSum = 0.0;
            var lastLength2 = 0.0;
            for (var _b = 0, _c = this.editLine.points; _b < _c.length; _b++) {
                var point = _c[_b];
                var segmentLength = point.totalLength - lastLength2;
                vec3.subtract(this.subLocation, point.location, this.centerLocationSum);
                radiusSum += vec3.length(this.subLocation) * (segmentLength / this.editLine.totalLength);
                lastLength2 = point.totalLength;
            }
            // Expects model is located 2.0m away from camera at first, then calculate zoom rate
            //     headSphereSize[m] / real3DViewHalfWidth[m] = radiusSum[px] / real2DViewWidth[px]
            //     real3DViewHalfWidth[m] / headSphereSize[m] = real2DViewWidth[px] / radiusSum[px]
            //     real3DViewHalfWidth[m]                     = (real2DViewWidth[px] / radiusSum[px]) * headSphereSize[m]
            var real2DViewWidth = env.mainWindow.width / 2;
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
            env.posing3DView.calculate3DLocationFrom2DLocation(this.centerLocation, this.centerLocationSum, 2.0 // 2.0m
            , env.currentPosingData.real3DViewHalfWidth, env.mainWindow);
            // Set inputs
            var headLocationInputData = env.currentPosingData.headLocationInputData;
            vec3.copy(headLocationInputData.center, this.centerLocation);
            headLocationInputData.radius = radiusSum;
            headLocationInputData.editLine = this.editLine;
            headLocationInputData.inputDone = true;
            // Calculate
            env.posing3DLogic.calculateHeadLocation(env.currentPosingData, env.currentPosingModel);
            env.setRedrawWebGLWindow();
            env.setRedrawLayerWindow();
        };
        return Tool_Posing3d_LocateHead;
    }(Tool_Posing3d_LineInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateHead = Tool_Posing3d_LocateHead;
    var Tool_Posing3d_RotateHead = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_RotateHead, _super);
        function Tool_Posing3d_RotateHead() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '画面に表示された球のどこかをクリックすると頭の向きが決まります。<br />画面右のパネルで「手前」となっているボタンをクリックすると奥側を指定できるようになります。';
            _this.inputSideOptionCount = 1;
            return _this;
        }
        Tool_Posing3d_RotateHead.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.headLocationInputData.inputDone);
        };
        Tool_Posing3d_RotateHead.prototype.setInputSide = function (buttonIndex, inputSideID, env) {
            if (env.currentPosingData != null) {
                if (buttonIndex == 0) {
                    if (inputSideID == ManualTracingTool.InputSideID.front) {
                        env.currentPosingData.headRotationInputData.inputSideID = ManualTracingTool.InputSideID.back;
                    }
                    else {
                        env.currentPosingData.headRotationInputData.inputSideID = ManualTracingTool.InputSideID.front;
                    }
                    return true;
                }
            }
            return false;
        };
        Tool_Posing3d_RotateHead.prototype.getInputSideID = function (buttonIndex, env) {
            if (env.currentPosingData != null) {
                return env.currentPosingData.headRotationInputData.inputSideID;
            }
            else {
                return ManualTracingTool.InputSideID.none;
            }
        };
        Tool_Posing3d_RotateHead.prototype.executeCommand = function (inputLocation, env) {
            var headRotationInputData = env.currentPosingData.headRotationInputData;
            var headTwistInputData = env.currentPosingData.headTwistInputData;
            // Set inputs
            vec3.copy(headRotationInputData.inputLocation, inputLocation);
            headRotationInputData.editLine = this.editLine;
            headRotationInputData.inputDone = true;
            headTwistInputData.inputDone = false;
            // Calculate
            env.posing3DLogic.calculateHeadRotation(env.currentPosingData, env.currentPosingModel);
            env.setRedrawWebGLWindow();
            env.setRedrawLayerWindow();
        };
        return Tool_Posing3d_RotateHead;
    }(Tool_Posing3d_PointInputToolBase));
    ManualTracingTool.Tool_Posing3d_RotateHead = Tool_Posing3d_RotateHead;
    var Tool_Posing3d_TwistHead = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_TwistHead, _super);
        function Tool_Posing3d_TwistHead() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '追加の頭の角度指定です。<br />使いづらくてゴメン…。';
            _this.inputSideOptionCount = 1;
            return _this;
        }
        Tool_Posing3d_TwistHead.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.headRotationInputData.inputDone);
        };
        Tool_Posing3d_TwistHead.prototype.setInputSide = function (buttonIndex, inputSideID, env) {
            if (env.currentPosingData != null) {
                if (buttonIndex == 0) {
                    if (inputSideID == ManualTracingTool.InputSideID.front) {
                        env.currentPosingData.headTwistInputData.inputSideID = ManualTracingTool.InputSideID.back;
                    }
                    else {
                        env.currentPosingData.headTwistInputData.inputSideID = ManualTracingTool.InputSideID.front;
                    }
                    return true;
                }
            }
            return false;
        };
        Tool_Posing3d_TwistHead.prototype.getInputSideID = function (buttonIndex, env) {
            if (env.currentPosingData != null) {
                return env.currentPosingData.headTwistInputData.inputSideID;
            }
            else {
                return ManualTracingTool.InputSideID.none;
            }
        };
        Tool_Posing3d_TwistHead.prototype.executeCommand = function (inputLocation, env) {
            var headTwistInputData = env.currentPosingData.headTwistInputData;
            // Set inputs
            vec3.copy(headTwistInputData.inputLocation, inputLocation);
            headTwistInputData.editLine = this.editLine;
            headTwistInputData.inputDone = true;
            // Calculate
            env.posing3DLogic.calculateHeadTwist(env.currentPosingData, env.currentPosingModel);
            env.setRedrawWebGLWindow();
            env.setRedrawLayerWindow();
        };
        return Tool_Posing3d_TwistHead;
    }(Tool_Posing3d_PointInputToolBase));
    ManualTracingTool.Tool_Posing3d_TwistHead = Tool_Posing3d_TwistHead;
    var Tool_Posing3d_LocateBody = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateBody, _super);
        function Tool_Posing3d_LocateBody() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '半透明の球のどこかをクリックすると頭の向きを正面として胴が配置されます。<br />少し外側をクリックすると画面に対して真横を指定できます。';
            _this.inputSideOptionCount = 1;
            return _this;
        }
        Tool_Posing3d_LocateBody.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.headLocationInputData.inputDone
                && env.currentPosingData.headRotationInputData.inputDone);
        };
        Tool_Posing3d_LocateBody.prototype.setInputSide = function (buttonIndex, inputSideID, env) {
            if (env.currentPosingData != null) {
                if (buttonIndex == 0) {
                    if (inputSideID == ManualTracingTool.InputSideID.front) {
                        env.currentPosingData.bodyLocationInputData.inputSideID = ManualTracingTool.InputSideID.back;
                    }
                    else {
                        env.currentPosingData.bodyLocationInputData.inputSideID = ManualTracingTool.InputSideID.front;
                    }
                    return true;
                }
            }
            return false;
        };
        Tool_Posing3d_LocateBody.prototype.getInputSideID = function (buttonIndex, env) {
            if (env.currentPosingData != null) {
                return env.currentPosingData.bodyLocationInputData.inputSideID;
            }
            else {
                return ManualTracingTool.InputSideID.none;
            }
        };
        Tool_Posing3d_LocateBody.prototype.executeCommand = function (inputLocation, env) {
            var bodyLocationInputData = env.currentPosingData.bodyLocationInputData;
            var bodyRotationInputData = env.currentPosingData.bodyRotationInputData;
            // Set inputs
            vec3.copy(bodyLocationInputData.inputLocation, inputLocation);
            bodyLocationInputData.editLine = this.editLine;
            bodyLocationInputData.inputDone = true;
            bodyRotationInputData.inputDone = false;
            // Calculate
            env.posing3DLogic.calculateBodyLocation(env.currentPosingData, env.currentPosingModel, ManualTracingTool.Posing3D_BodyLocateMode.keepFrontUp);
            // Update dependent input
            var resetRotation = true;
            if (resetRotation) {
                mat4.copy(env.currentPosingData.bodyRotationInputData.matrix, env.currentPosingData.bodyLocationInputData.matrix);
                env.currentPosingData.bodyRotationInputData.inputDone = false;
            }
            else {
                if (env.currentPosingData.bodyRotationInputData.inputDone) {
                    env.posing3DLogic.calculateBodyRotation(env.currentPosingData, env.currentPosingModel);
                }
            }
            env.setRedrawWebGLWindow();
            env.setRedrawLayerWindow();
        };
        return Tool_Posing3d_LocateBody;
    }(Tool_Posing3d_PointInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateBody = Tool_Posing3d_LocateBody;
    var Tool_Posing3d_RatateBody = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_RatateBody, _super);
        function Tool_Posing3d_RatateBody() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '半透明の球のどこかをクリックすると胴の水平方向の向きを変えられます。';
            _this.inputSideOptionCount = 1;
            return _this;
        }
        Tool_Posing3d_RatateBody.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.bodyLocationInputData.inputDone);
        };
        Tool_Posing3d_RatateBody.prototype.setInputSide = function (buttonIndex, inputSideID, env) {
            if (env.currentPosingData != null) {
                if (buttonIndex == 0) {
                    if (inputSideID == ManualTracingTool.InputSideID.front) {
                        env.currentPosingData.bodyRotationInputData.inputSideID = ManualTracingTool.InputSideID.back;
                    }
                    else {
                        env.currentPosingData.bodyRotationInputData.inputSideID = ManualTracingTool.InputSideID.front;
                    }
                    return true;
                }
            }
            return false;
        };
        Tool_Posing3d_RatateBody.prototype.getInputSideID = function (buttonIndex, env) {
            if (env.currentPosingData != null) {
                return env.currentPosingData.bodyRotationInputData.inputSideID;
            }
            else {
                return ManualTracingTool.InputSideID.none;
            }
        };
        Tool_Posing3d_RatateBody.prototype.executeCommand = function (inputLocation, env) {
            // Set inputs
            var bodyRotationInputData = env.currentPosingData.bodyRotationInputData;
            vec3.copy(bodyRotationInputData.inputLocation, inputLocation);
            bodyRotationInputData.editLine = this.editLine;
            bodyRotationInputData.inputDone = true;
            // Calculate
            env.posing3DLogic.calculateBodyRotation(env.currentPosingData, env.currentPosingModel);
            env.setRedrawWebGLWindow();
            env.setRedrawLayerWindow();
        };
        return Tool_Posing3d_RatateBody;
    }(Tool_Posing3d_PointInputToolBase));
    ManualTracingTool.Tool_Posing3d_RatateBody = Tool_Posing3d_RatateBody;
    var Tool_Posing3d_LocateLeftArm1 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateLeftArm1, _super);
        function Tool_Posing3d_LocateLeftArm1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'ヒジのあたりの位置を指定して上腕を配置します。';
            _this.inputSideOptionCount = 1;
            return _this;
        }
        Tool_Posing3d_LocateLeftArm1.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone));
        };
        Tool_Posing3d_LocateLeftArm1.prototype.setInputSide = function (buttonIndex, inputSideID, env) {
            if (env.currentPosingData != null) {
                var inputData = this.getInputData(env);
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
        };
        Tool_Posing3d_LocateLeftArm1.prototype.getInputSideID = function (buttonIndex, env) {
            if (env.currentPosingData != null) {
                var inputData = this.getInputData(env);
                return inputData.inputSideID;
            }
            else {
                return ManualTracingTool.InputSideID.none;
            }
        };
        Tool_Posing3d_LocateLeftArm1.prototype.getInputData = function (env) {
            return env.currentPosingData.leftArm1LocationInputData;
        };
        Tool_Posing3d_LocateLeftArm1.prototype.executeCalculation = function (env) {
            env.posing3DLogic.calculateLeftArm1Direction(env.currentPosingData, env.currentPosingModel);
        };
        Tool_Posing3d_LocateLeftArm1.prototype.executeCommand = function (inputLocation, env) {
            var inputData = this.getInputData(env);
            // Set inputs
            vec3.copy(inputData.inputLocation, inputLocation);
            inputData.editLine = this.editLine;
            inputData.inputDone = true;
            // Calculate
            this.executeCalculation(env);
            // Update dependent input
            env.setRedrawWebGLWindow();
            env.setRedrawLayerWindow();
        };
        return Tool_Posing3d_LocateLeftArm1;
    }(Tool_Posing3d_PointInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateLeftArm1 = Tool_Posing3d_LocateLeftArm1;
    var Tool_Posing3d_LocateRightArm1 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateRightArm1, _super);
        function Tool_Posing3d_LocateRightArm1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'ヒジのあたりの位置を指定して上腕を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateRightArm1.prototype.getInputData = function (env) {
            return env.currentPosingData.rightArm1LocationInputData;
        };
        Tool_Posing3d_LocateRightArm1.prototype.executeCalculation = function (env) {
            env.posing3DLogic.calculateRightArm1Direction(env.currentPosingData, env.currentPosingModel);
        };
        return Tool_Posing3d_LocateRightArm1;
    }(Tool_Posing3d_LocateLeftArm1));
    ManualTracingTool.Tool_Posing3d_LocateRightArm1 = Tool_Posing3d_LocateRightArm1;
    var Tool_Posing3d_LocateLeftLeg1 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateLeftLeg1, _super);
        function Tool_Posing3d_LocateLeftLeg1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'ヒザのあたりの位置を指定して上脚を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateLeftLeg1.prototype.getInputData = function (env) {
            return env.currentPosingData.leftLeg1LocationInputData;
        };
        Tool_Posing3d_LocateLeftLeg1.prototype.executeCalculation = function (env) {
            env.posing3DLogic.calculateLeftLeg1Direction(env.currentPosingData, env.currentPosingModel);
        };
        return Tool_Posing3d_LocateLeftLeg1;
    }(Tool_Posing3d_LocateLeftArm1));
    ManualTracingTool.Tool_Posing3d_LocateLeftLeg1 = Tool_Posing3d_LocateLeftLeg1;
    var Tool_Posing3d_LocateRightLeg1 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateRightLeg1, _super);
        function Tool_Posing3d_LocateRightLeg1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'ヒザのあたりの位置を指定して上脚を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateRightLeg1.prototype.getInputData = function (env) {
            return env.currentPosingData.rightLeg1LocationInputData;
        };
        Tool_Posing3d_LocateRightLeg1.prototype.executeCalculation = function (env) {
            env.posing3DLogic.calculateRightLeg1Direction(env.currentPosingData, env.currentPosingModel);
        };
        return Tool_Posing3d_LocateRightLeg1;
    }(Tool_Posing3d_LocateLeftArm1));
    ManualTracingTool.Tool_Posing3d_LocateRightLeg1 = Tool_Posing3d_LocateRightLeg1;
    var Tool_Posing3d_LocateLeftArm2 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateLeftArm2, _super);
        function Tool_Posing3d_LocateLeftArm2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '手首のあたりの位置を指定して下腕を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateLeftArm2.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.leftArm1LocationInputData.inputDone);
        };
        Tool_Posing3d_LocateLeftArm2.prototype.getInputData = function (env) {
            return env.currentPosingData.leftArm2LocationInputData;
        };
        Tool_Posing3d_LocateLeftArm2.prototype.executeCalculation = function (env) {
            env.posing3DLogic.calculateLeftArm2Direction(env.currentPosingData, env.currentPosingModel);
        };
        return Tool_Posing3d_LocateLeftArm2;
    }(Tool_Posing3d_LocateLeftArm1));
    ManualTracingTool.Tool_Posing3d_LocateLeftArm2 = Tool_Posing3d_LocateLeftArm2;
    var Tool_Posing3d_LocateRightArm2 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateRightArm2, _super);
        function Tool_Posing3d_LocateRightArm2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '手首のあたりの位置を指定して下腕を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateRightArm2.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.rightArm1LocationInputData.inputDone);
        };
        Tool_Posing3d_LocateRightArm2.prototype.getInputData = function (env) {
            return env.currentPosingData.rightArm2LocationInputData;
        };
        Tool_Posing3d_LocateRightArm2.prototype.executeCalculation = function (env) {
            env.posing3DLogic.calculateRightArm2Direction(env.currentPosingData, env.currentPosingModel);
        };
        return Tool_Posing3d_LocateRightArm2;
    }(Tool_Posing3d_LocateLeftArm1));
    ManualTracingTool.Tool_Posing3d_LocateRightArm2 = Tool_Posing3d_LocateRightArm2;
    var Tool_Posing3d_LocateLeftLeg2 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateLeftLeg2, _super);
        function Tool_Posing3d_LocateLeftLeg2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '足首のあたりの位置を指定して下脚を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateLeftLeg2.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.leftLeg1LocationInputData.inputDone);
        };
        Tool_Posing3d_LocateLeftLeg2.prototype.getInputData = function (env) {
            return env.currentPosingData.leftLeg2LocationInputData;
        };
        Tool_Posing3d_LocateLeftLeg2.prototype.executeCalculation = function (env) {
            env.posing3DLogic.calculateLeftLeg2Direction(env.currentPosingData, env.currentPosingModel);
        };
        return Tool_Posing3d_LocateLeftLeg2;
    }(Tool_Posing3d_LocateLeftArm1));
    ManualTracingTool.Tool_Posing3d_LocateLeftLeg2 = Tool_Posing3d_LocateLeftLeg2;
    var Tool_Posing3d_LocateRightLeg2 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateRightLeg2, _super);
        function Tool_Posing3d_LocateRightLeg2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '足首のあたりの位置を指定して下脚を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateRightLeg2.prototype.isAvailable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.rightLeg1LocationInputData.inputDone);
        };
        Tool_Posing3d_LocateRightLeg2.prototype.getInputData = function (env) {
            return env.currentPosingData.rightLeg2LocationInputData;
        };
        Tool_Posing3d_LocateRightLeg2.prototype.executeCalculation = function (env) {
            env.posing3DLogic.calculateRightLeg2Direction(env.currentPosingData, env.currentPosingModel);
        };
        return Tool_Posing3d_LocateRightLeg2;
    }(Tool_Posing3d_LocateLeftArm1));
    ManualTracingTool.Tool_Posing3d_LocateRightLeg2 = Tool_Posing3d_LocateRightLeg2;
    var Command_Posing3d_LocateHead = /** @class */ (function (_super) {
        __extends(Command_Posing3d_LocateHead, _super);
        function Command_Posing3d_LocateHead() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Command_Posing3d_LocateHead.prototype.execute = function (env) {
            this.errorCheck();
        };
        Command_Posing3d_LocateHead.prototype.undo = function (env) {
        };
        Command_Posing3d_LocateHead.prototype.redo = function (env) {
            this.execute(env);
        };
        Command_Posing3d_LocateHead.prototype.errorCheck = function () {
        };
        return Command_Posing3d_LocateHead;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Posing3d_LocateHead = Command_Posing3d_LocateHead;
})(ManualTracingTool || (ManualTracingTool = {}));
