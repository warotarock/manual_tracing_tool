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
            _this.inputSideOptionCount = 1;
            _this.tempTargetLocation = vec3.create();
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
        Tool_Posing3d_PointInputToolBase.prototype.setInputSide = function (buttonIndex, inputSideID, env) {
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
        Tool_Posing3d_PointInputToolBase.prototype.getInputSideID = function (buttonIndex, env) {
            if (env.currentPosingData != null) {
                var inputData = this.getInputData(env);
                return inputData.inputSideID;
            }
            else {
                return ManualTracingTool.InputSideID.none;
            }
        };
        Tool_Posing3d_PointInputToolBase.prototype.getInputData = function (env) {
            throw ('Tool_Posing3d_ToolBase: not implemented!');
        };
        Tool_Posing3d_PointInputToolBase.prototype.execute = function (e, env) {
            var inputData = this.getInputData(env);
            var hited = env.posing3DLogic.processMouseInputLocation(this.tempTargetLocation, e.location, inputData, env.currentPosingData, env.posing3DView);
            if (!hited) {
                return;
            }
            this.executeCommand(this.tempTargetLocation, e, env);
        };
        Tool_Posing3d_PointInputToolBase.prototype.executeCommand = function (inputLocation, e, env) {
            throw ('Tool_Posing3d_ToolBase: not implemented!');
        };
        return Tool_Posing3d_PointInputToolBase;
    }(Tool_Posing3d_ToolBase));
    ManualTracingTool.Tool_Posing3d_PointInputToolBase = Tool_Posing3d_PointInputToolBase;
    var JointPartInputMode;
    (function (JointPartInputMode) {
        JointPartInputMode[JointPartInputMode["none"] = 0] = "none";
        JointPartInputMode[JointPartInputMode["directionInput"] = 1] = "directionInput";
        JointPartInputMode[JointPartInputMode["rollInput"] = 2] = "rollInput";
    })(JointPartInputMode || (JointPartInputMode = {}));
    var Tool_Posing3d_JointPartInputToolBase = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_JointPartInputToolBase, _super);
        function Tool_Posing3d_JointPartInputToolBase() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.location3D = vec3.create();
            _this.location2D = vec3.create();
            _this.location2DTo = vec3.create();
            _this.enableDirectionInput = true;
            _this.enableRollInput = true;
            _this.jointPartInputMode = JointPartInputMode.none;
            _this.mouseOnInputMode = JointPartInputMode.none;
            _this.inputLocation = vec3.create();
            _this.relativeMouseLocation = vec3.create();
            _this.tmpMatrix = mat4.create();
            _this.vecZ = vec3.create();
            _this.relativeInputLocation = vec3.create();
            _this.rollInputRootMatrix = mat4.create();
            _this.rollInputLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.lastMatrix = mat4.create();
            _this.startAngle = 0.0;
            _this.lastAngle = 0.0;
            return _this;
        }
        Tool_Posing3d_JointPartInputToolBase.prototype.getInputModeForMouseLocation = function (resultRelativeMouseLocation, env) {
            var inputData = this.getInputData(env);
            var circleRadius = this.getBoneInputCircleRadius(env) * env.drawStyle.posing3DBoneInputCircleHitRadius;
            if (!inputData.inputDone) {
                return JointPartInputMode.directionInput;
            }
            else {
                if (inputData.inputDone && inputData.directionInputDone) {
                    env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, inputData.inputLocation, env.currentPosingData.real3DViewHalfWidth);
                    var distance = vec3.distance(env.mouseCursorLocation, this.location2D);
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
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.mouseDown = function (e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            if (!e.isLeftButtonPressing()) {
                return;
            }
            env.setRedrawEditorWindow();
            var jointPartInputMode = this.getInputModeForMouseLocation(this.relativeMouseLocation, env);
            if (jointPartInputMode == JointPartInputMode.rollInput) {
                var inputData = this.getInputData(env);
                var hited = env.posing3DLogic.processMouseInputLocation(inputData.rollInputLocation, e.location, inputData, env.currentPosingData, env.posing3DView);
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
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.mouseMove = function (e, env) {
            if (env.currentPosingData == null) {
                return;
            }
            var jointPartInputMode = this.getInputModeForMouseLocation(null, env);
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
                var inputData = this.getInputData(env);
                var hited = env.posing3DLogic.processMouseInputLocation(inputData.rollInputLocation, e.location, inputData, env.currentPosingData, env.posing3DView);
                if (hited) {
                    this.execute(e, env);
                }
            }
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.mouseUp = function (e, env) {
            this.jointPartInputMode = JointPartInputMode.none;
            env.setRedrawWebGLWindow();
            env.setRedrawEditorWindow();
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.getBoneInputCircleRadius = function (env) {
            return env.getViewScaledLength(env.drawStyle.posing3DBoneInputCircleRadius);
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.onDrawEditor = function (env, drawEnv) {
            var inputData = this.getInputData(env);
            if (!inputData.inputDone) {
                return;
            }
            var circleRadius = this.getBoneInputCircleRadius(env);
            if (this.enableDirectionInput && inputData.directionInputDone) {
                env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, inputData.inputLocation, env.currentPosingData.real3DViewHalfWidth);
                var strokeWidth = (this.mouseOnInputMode == JointPartInputMode.directionInput) ? 4.0 : 2.0;
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
                var strokeWidth = (this.mouseOnInputMode == JointPartInputMode.rollInput) ? 4.0 : 2.0;
                drawEnv.drawCircle(this.location2DTo, env.getViewScaledLength(5.0), env.getViewScaledLength(strokeWidth), drawEnv.style.posing3DBoneForwardColor);
            }
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.calculateAngle = function (inputData) {
            mat4.invert(this.tmpMatrix, this.lastMatrix);
            vec3.transformMat4(this.relativeInputLocation, inputData.rollInputLocation, this.tmpMatrix);
            vec3.set(this.vecZ, 0.0, 0.0, this.relativeInputLocation[2]);
            mat4.translate(this.rollInputRootMatrix, this.lastMatrix, this.vecZ);
            return Math.atan2(this.relativeInputLocation[1], this.relativeInputLocation[0]);
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.execute = function (e, env) {
            vec3.add(this.location2D, e.location, this.relativeMouseLocation);
            var inputData = this.getInputData(env);
            var hited = env.posing3DLogic.processMouseInputLocation(this.inputLocation, this.location2D, inputData, env.currentPosingData, env.posing3DView);
            if (!hited) {
                return;
            }
            this.executeCommand(this.inputLocation, e, env);
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.executeCommand = function (inputLocation, e, env) {
            var inputData = this.getInputData(env);
            // Set inputs
            if (this.jointPartInputMode == JointPartInputMode.directionInput) {
                vec3.copy(inputData.inputLocation, inputLocation);
                vec3.copy(inputData.inputLocation2D, e.location);
                inputData.inputDone = true;
                inputData.directionInputDone = true;
            }
            else if (this.jointPartInputMode == JointPartInputMode.rollInput) {
                var angle = this.calculateAngle(inputData);
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
        };
        Tool_Posing3d_JointPartInputToolBase.prototype.updateAdditionalPart = function (inputLocation, env) {
        };
        return Tool_Posing3d_JointPartInputToolBase;
    }(Tool_Posing3d_PointInputToolBase));
    ManualTracingTool.Tool_Posing3d_JointPartInputToolBase = Tool_Posing3d_JointPartInputToolBase;
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
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null);
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
            , env.currentPosingData.real3DViewHalfWidth);
            // Set inputs
            var headLocationInputData = env.currentPosingData.headLocationInputData;
            vec3.copy(headLocationInputData.center, this.centerLocation);
            headLocationInputData.radius = radiusSum;
            headLocationInputData.editLine = this.editLine;
            headLocationInputData.inputDone = true;
            env.currentPosingData.headRotationInputData.inputDone = false;
            // Calculate
            env.posing3DLogic.calculateHeadLocation(env.currentPosingData, env.currentPosingModel);
            env.setRedrawWebGLWindow();
            env.setRedrawSubtoolWindow();
        };
        return Tool_Posing3d_LocateHead;
    }(Tool_Posing3d_LineInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateHead = Tool_Posing3d_LocateHead;
    var Tool_Posing3d_RotateHead = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_RotateHead, _super);
        function Tool_Posing3d_RotateHead() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '画面に表示された球のどこかをクリックすると頭の向きが決まります。<br />画面右のパネルで「手前」となっているボタンをクリックすると奥側を指定できるようになります。';
            return _this;
        }
        Tool_Posing3d_RotateHead.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.headLocationInputData.inputDone);
        };
        Tool_Posing3d_RotateHead.prototype.getInputData = function (env) {
            return env.currentPosingData.headRotationInputData;
        };
        return Tool_Posing3d_RotateHead;
    }(Tool_Posing3d_JointPartInputToolBase));
    ManualTracingTool.Tool_Posing3d_RotateHead = Tool_Posing3d_RotateHead;
    var Tool_Posing3d_LocateBody = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateBody, _super);
        function Tool_Posing3d_LocateBody() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '半透明の球のどこかをクリックすると頭の向きを正面として胴が配置されます。<br />少し外側をクリックすると画面に対して真横を指定できます。';
            return _this;
        }
        Tool_Posing3d_LocateBody.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.headLocationInputData.inputDone);
        };
        Tool_Posing3d_LocateBody.prototype.getInputData = function (env) {
            return env.currentPosingData.bodyLocationInputData;
        };
        return Tool_Posing3d_LocateBody;
    }(Tool_Posing3d_JointPartInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateBody = Tool_Posing3d_LocateBody;
    var Tool_Posing3d_LocateHips = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateHips, _super);
        function Tool_Posing3d_LocateHips() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '腰を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateHips.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.bodyLocationInputData.inputDone);
        };
        Tool_Posing3d_LocateHips.prototype.getInputData = function (env) {
            return env.currentPosingData.hipsLocationInputData;
        };
        return Tool_Posing3d_LocateHips;
    }(Tool_Posing3d_JointPartInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateHips = Tool_Posing3d_LocateHips;
    var Tool_Posing3d_LocateLeftShoulder = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateLeftShoulder, _super);
        function Tool_Posing3d_LocateLeftShoulder() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'ヒジのあたりの位置を指定して肩を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateLeftShoulder.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone));
        };
        Tool_Posing3d_LocateLeftShoulder.prototype.getInputData = function (env) {
            return env.currentPosingData.leftShoulderLocationInputData;
        };
        return Tool_Posing3d_LocateLeftShoulder;
    }(Tool_Posing3d_JointPartInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateLeftShoulder = Tool_Posing3d_LocateLeftShoulder;
    var Tool_Posing3d_LocateRightShoulder = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateRightShoulder, _super);
        function Tool_Posing3d_LocateRightShoulder() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Tool_Posing3d_LocateRightShoulder.prototype.getInputData = function (env) {
            return env.currentPosingData.rightShoulderLocationInputData;
        };
        return Tool_Posing3d_LocateRightShoulder;
    }(Tool_Posing3d_LocateLeftShoulder));
    ManualTracingTool.Tool_Posing3d_LocateRightShoulder = Tool_Posing3d_LocateRightShoulder;
    var Tool_Posing3d_LocateLeftArm1 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateLeftArm1, _super);
        function Tool_Posing3d_LocateLeftArm1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'ヒジのあたりの位置を指定して上腕を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateLeftArm1.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone));
        };
        Tool_Posing3d_LocateLeftArm1.prototype.getInputData = function (env) {
            return env.currentPosingData.leftArm1LocationInputData;
        };
        Tool_Posing3d_LocateLeftArm1.prototype.updateAdditionalPart = function (inputLocation, env) {
            env.currentPosingData.leftShoulderLocationInputData.inputDone = true;
        };
        return Tool_Posing3d_LocateLeftArm1;
    }(Tool_Posing3d_JointPartInputToolBase));
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
        Tool_Posing3d_LocateRightArm1.prototype.updateAdditionalPart = function (inputLocation, env) {
            env.currentPosingData.rightShoulderLocationInputData.inputDone = true;
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
        Tool_Posing3d_LocateLeftLeg1.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.hipsLocationInputData.inputDone);
        };
        Tool_Posing3d_LocateLeftLeg1.prototype.getInputData = function (env) {
            return env.currentPosingData.leftLeg1LocationInputData;
        };
        Tool_Posing3d_LocateLeftLeg1.prototype.executeCommandExt = function (inputLocation, env) {
            env.currentPosingData.leftShoulderLocationInputData.inputDone = true;
        };
        return Tool_Posing3d_LocateLeftLeg1;
    }(Tool_Posing3d_JointPartInputToolBase));
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
        return Tool_Posing3d_LocateRightLeg1;
    }(Tool_Posing3d_LocateLeftLeg1));
    ManualTracingTool.Tool_Posing3d_LocateRightLeg1 = Tool_Posing3d_LocateRightLeg1;
    var Tool_Posing3d_LocateLeftArm2 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateLeftArm2, _super);
        function Tool_Posing3d_LocateLeftArm2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '手首のあたりの位置を指定して下腕を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateLeftArm2.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.leftArm1LocationInputData.inputDone);
        };
        Tool_Posing3d_LocateLeftArm2.prototype.getInputData = function (env) {
            return env.currentPosingData.leftArm2LocationInputData;
        };
        return Tool_Posing3d_LocateLeftArm2;
    }(Tool_Posing3d_JointPartInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateLeftArm2 = Tool_Posing3d_LocateLeftArm2;
    var Tool_Posing3d_LocateRightArm2 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateRightArm2, _super);
        function Tool_Posing3d_LocateRightArm2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '手首のあたりの位置を指定して下腕を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateRightArm2.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.rightArm1LocationInputData.inputDone);
        };
        Tool_Posing3d_LocateRightArm2.prototype.getInputData = function (env) {
            return env.currentPosingData.rightArm2LocationInputData;
        };
        return Tool_Posing3d_LocateRightArm2;
    }(Tool_Posing3d_JointPartInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateRightArm2 = Tool_Posing3d_LocateRightArm2;
    var Tool_Posing3d_LocateLeftLeg2 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateLeftLeg2, _super);
        function Tool_Posing3d_LocateLeftLeg2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '足首のあたりの位置を指定して下脚を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateLeftLeg2.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.leftLeg1LocationInputData.inputDone);
        };
        Tool_Posing3d_LocateLeftLeg2.prototype.getInputData = function (env) {
            return env.currentPosingData.leftLeg2LocationInputData;
        };
        return Tool_Posing3d_LocateLeftLeg2;
    }(Tool_Posing3d_JointPartInputToolBase));
    ManualTracingTool.Tool_Posing3d_LocateLeftLeg2 = Tool_Posing3d_LocateLeftLeg2;
    var Tool_Posing3d_LocateRightLeg2 = /** @class */ (function (_super) {
        __extends(Tool_Posing3d_LocateRightLeg2, _super);
        function Tool_Posing3d_LocateRightLeg2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = '足首のあたりの位置を指定して下脚を配置します。';
            return _this;
        }
        Tool_Posing3d_LocateRightLeg2.prototype.isAvailable = function (env) {
            return (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && env.currentPosingData != null
                && env.currentPosingData.rightLeg1LocationInputData.inputDone);
        };
        Tool_Posing3d_LocateRightLeg2.prototype.getInputData = function (env) {
            return env.currentPosingData.rightLeg2LocationInputData;
        };
        return Tool_Posing3d_LocateRightLeg2;
    }(Tool_Posing3d_JointPartInputToolBase));
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
