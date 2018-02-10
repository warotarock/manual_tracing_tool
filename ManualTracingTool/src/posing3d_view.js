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
    // Rendering
    var ImageResource = (function () {
        function ImageResource() {
            this.fileName = null;
            this.image = new RenderImage();
            this.loaded = false;
            this.isGLTexture = true;
        }
        ImageResource.prototype.file = function (fileName) {
            this.fileName = fileName;
            return this;
        };
        ImageResource.prototype.tex = function (isGLTexture) {
            this.isGLTexture = isGLTexture;
            return this;
        };
        return ImageResource;
    }());
    ManualTracingTool.ImageResource = ImageResource;
    var ModelResource = (function () {
        function ModelResource() {
            this.modelName = null;
            this.model = new RenderModel();
        }
        return ModelResource;
    }());
    ManualTracingTool.ModelResource = ModelResource;
    var ModelFile = (function () {
        function ModelFile() {
            this.fileName = null;
            this.modelResources = new List();
            this.modelResourceDictionary = new Dictionary();
            this.loaded = false;
        }
        ModelFile.prototype.file = function (fileName) {
            this.fileName = fileName;
            return this;
        };
        return ModelFile;
    }());
    ManualTracingTool.ModelFile = ModelFile;
    var DrawImageType;
    (function (DrawImageType) {
        DrawImageType[DrawImageType["visualImage"] = 1] = "visualImage";
        DrawImageType[DrawImageType["depthImage"] = 2] = "depthImage";
    })(DrawImageType || (DrawImageType = {}));
    var JointPartDrawingUnit = (function () {
        function JointPartDrawingUnit() {
            this.aName = "";
            this.targetData = null;
            this.dependentInputData = null;
            this.parentMatrix = null;
            this.drawModel = true;
            this.modelResource = null;
            this.visualModelAlpha = 1.0;
            this.hitTestSphereRadius = 0.0;
            this.hitTestSphereAlpha = 0.5;
        }
        return JointPartDrawingUnit;
    }());
    var Posing3DView = (function () {
        function Posing3DView() {
            // Posing
            // Rendering
            this.render = null;
            this.pickingWindow = null;
            this.posingFigureShader = new PosingFigureShader();
            this.depthShader = new DepthShader();
            this.imageResurces = new List();
            this.axisModel = null;
            this.zTestShpereModel = null;
            this.zTestShpereEdgeModel = null;
            this.headModel = null;
            this.bodyModel = null;
            this.leftArm1Model = null;
            this.leftArm2Model = null;
            this.rightArm1Model = null;
            this.rightArm2Model = null;
            this.leftLeg1Model = null;
            this.leftLeg2Model = null;
            this.rightLeg1Model = null;
            this.rightLeg2Model = null;
            this.drawingUnits = new List();
            this.modelLocation = vec3.create();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelMatrix = mat4.create();
            this.normalMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelViewMatrix = mat4.create();
            this.projectionMatrix = mat4.create();
            this.projectionInvMatrix = mat4.create();
            this.cameraMatrix = mat4.create();
            this.locationMatrix = mat4.create();
            this.tempVec3 = vec3.create();
            this.invProjectedVec3 = vec3.create();
            this.tmpMatrix = mat4.create();
            this.screenLocation = vec3.create();
        }
        Posing3DView.prototype.initialize = function (render, pickingWindow) {
            this.render = render;
            this.pickingWindow = pickingWindow;
            this.render.initializeShader(this.posingFigureShader);
            this.render.initializeShader(this.depthShader);
            this.render.setShader(this.depthShader);
            this.depthShader.setMaxDepth(pickingWindow.maxDepth);
        };
        Posing3DView.prototype.storeResources = function (modelFile, imageResurces) {
            this.axisModel = modelFile.modelResourceDictionary['Axis'];
            this.zTestShpereModel = modelFile.modelResourceDictionary['ZTestSphere'];
            this.zTestShpereEdgeModel = modelFile.modelResourceDictionary['ZTestSphereEdge'];
            this.headModel = modelFile.modelResourceDictionary['Head'];
            this.bodyModel = modelFile.modelResourceDictionary['Body1'];
            this.leftArm1Model = modelFile.modelResourceDictionary['Arm1'];
            this.leftArm2Model = modelFile.modelResourceDictionary['Arm1'];
            this.rightArm1Model = modelFile.modelResourceDictionary['Arm1'];
            this.rightArm2Model = modelFile.modelResourceDictionary['Arm1'];
            this.leftLeg1Model = modelFile.modelResourceDictionary['Leg1'];
            this.leftLeg2Model = modelFile.modelResourceDictionary['Leg1'];
            this.rightLeg1Model = modelFile.modelResourceDictionary['Leg1'];
            this.rightLeg2Model = modelFile.modelResourceDictionary['Leg1'];
            this.imageResurces.push(imageResurces[0]);
        };
        Posing3DView.prototype.buildDrawingStructures = function (env) {
            var posingData = env.currentPosingData;
            var posingModel = env.currentPosingModel;
            this.drawingUnits = new List();
            // Left arms
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "leftArm1LocationInputData";
                unit.targetData = posingData.leftArm1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.parentMatrix = posingData.bodyLocationInputData.leftArm1RootMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftArm1;
                unit.hitTestSphereRadius = vec3.length(posingModel.leftArm1HeadLocation);
                unit.modelResource = this.leftArm1Model;
                this.drawingUnits.push(unit);
            }
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "leftArm2LocationInputData";
                unit.targetData = posingData.leftArm2LocationInputData;
                unit.dependentInputData = posingData.leftArm1LocationInputData;
                unit.parentMatrix = posingData.leftArm1LocationInputData.childJointRootMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftArm2;
                unit.hitTestSphereRadius = vec3.length(posingModel.leftArm2HeadLocation);
                unit.modelResource = this.leftArm2Model;
                this.drawingUnits.push(unit);
            }
            // Right arm
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "rightArm1LocationInputData";
                unit.targetData = posingData.rightArm1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.parentMatrix = posingData.bodyLocationInputData.rightArm1RootMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightArm1;
                unit.hitTestSphereRadius = vec3.length(posingModel.rightArm1HeadLocation);
                unit.modelResource = this.rightArm1Model;
                this.drawingUnits.push(unit);
            }
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "rightArm2LocationInputData";
                unit.targetData = posingData.rightArm2LocationInputData;
                unit.dependentInputData = posingData.rightArm1LocationInputData;
                unit.parentMatrix = posingData.rightArm1LocationInputData.childJointRootMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightArm2;
                unit.hitTestSphereRadius = vec3.length(posingModel.rightArm2HeadLocation);
                unit.modelResource = this.rightArm2Model;
                this.drawingUnits.push(unit);
            }
            // Left leg
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "leftLeg1LocationInputData";
                unit.targetData = posingData.leftLeg1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.parentMatrix = posingData.bodyLocationInputData.leftLeg1RootMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftLeg1;
                unit.hitTestSphereRadius = vec3.length(posingModel.leftLeg1HeadLocation);
                unit.modelResource = this.leftLeg1Model;
                this.drawingUnits.push(unit);
            }
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "rightLeg2LocationInputData";
                unit.targetData = posingData.leftLeg2LocationInputData;
                unit.dependentInputData = posingData.leftLeg1LocationInputData;
                unit.parentMatrix = posingData.leftLeg1LocationInputData.childJointRootMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftLeg2;
                unit.hitTestSphereRadius = vec3.length(posingModel.leftLeg2HeadLocation);
                unit.modelResource = this.leftLeg2Model;
                this.drawingUnits.push(unit);
            }
            // Right leg
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "rightLeg1LocationInputData";
                unit.targetData = posingData.rightLeg1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.parentMatrix = posingData.bodyLocationInputData.rightLeg1RootMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightLeg1;
                unit.hitTestSphereRadius = vec3.length(posingModel.rightLeg1HeadLocation);
                unit.modelResource = this.rightLeg1Model;
                this.drawingUnits.push(unit);
            }
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "rightLeg2LocationInputData";
                unit.targetData = posingData.rightLeg2LocationInputData;
                unit.dependentInputData = posingData.rightLeg1LocationInputData;
                unit.parentMatrix = posingData.rightLeg1LocationInputData.childJointRootMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightLeg2;
                unit.hitTestSphereRadius = vec3.length(posingModel.rightLeg2HeadLocation);
                unit.modelResource = this.rightLeg2Model;
                this.drawingUnits.push(unit);
            }
            // Head twist
            {
                var unit = new JointPartDrawingUnit();
                unit.aName = "headTwistInputData";
                unit.targetData = posingData.headTwistInputData;
                unit.dependentInputData = posingData.headRotationInputData;
                unit.parentMatrix = posingData.headLocationInputData.neckSphereMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.twistHead;
                unit.hitTestSphereRadius = posingModel.headTwistSphereSize;
                unit.drawModel = false;
                this.drawingUnits.push(unit);
            }
        };
        Posing3DView.prototype.drawVisualImage = function (env) {
            var posingData = env.currentPosingData;
            var posingModel = env.currentPosingModel;
            if (this.drawingUnits.length == 0) {
                this.buildDrawingStructures(env);
            }
            this.render.setDepthTest(true);
            this.render.setCulling(true);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
            this.caluculateCameraMatrix(posingData.real3DViewHalfWidth, env.mainWindow);
            // Draws input manipulaters
            this.drawHeadSphere(DrawImageType.visualImage, env);
            this.drawBodySphere(DrawImageType.visualImage, env);
            this.drawBodyRotationSphere(DrawImageType.visualImage, env);
            for (var _i = 0, _a = this.drawingUnits; _i < _a.length; _i++) {
                var drawingUnit = _a[_i];
                if (env.subToolIndex == drawingUnit.subToolID) {
                    //this.drawAxis(drawingUnit.parentMatrix, 0.3, 0.5, env);
                    this.drawArmLegSphere(DrawImageType.visualImage, drawingUnit.targetData.inputSideID, drawingUnit.parentMatrix, drawingUnit.hitTestSphereRadius, env);
                }
            }
            // Draws visual models
            this.render.clearDepthBuffer();
            if (this.isHeadDrawable(env)) {
                this.setShaderParameters(posingData.headLocationInputData.headMatrix, false, this.posingFigureShader);
                this.posingFigureShader.setAlpha(1.0);
                this.drawModel(this.headModel.model, this.imageResurces[0].image);
            }
            if (this.isBodyDrawable(env)) {
                this.setShaderParameters(posingData.bodyLocationInputData.bodyMatrix, false, this.posingFigureShader);
                this.posingFigureShader.setAlpha(1.0);
                this.drawModel(this.bodyModel.model, this.imageResurces[0].image);
                var debugDraw = false;
                if (debugDraw) {
                    this.drawAxis(posingData.bodyLocationInputData.leftArm1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.bodyLocationInputData.rightArm1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.bodyLocationInputData.leftLeg1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.bodyLocationInputData.rightLeg1RootMatrix, 0.1, 0.5, env);
                }
            }
            for (var _b = 0, _c = this.drawingUnits; _b < _c.length; _b++) {
                var drawingUnit = _c[_b];
                if (drawingUnit.drawModel && drawingUnit.targetData.inputDone) {
                    this.setShaderParameters(drawingUnit.targetData.matrix, false, this.posingFigureShader);
                    this.posingFigureShader.setAlpha(drawingUnit.visualModelAlpha);
                    this.drawModel(drawingUnit.modelResource.model, this.imageResurces[0].image);
                    //this.drawAxis(drawingUnit.targetData.matrix, 0.2, 0.5, env);
                }
            }
        };
        Posing3DView.prototype.drawPickingImage = function (env) {
            var posingModel = env.currentPosingModel;
            this.render.setDepthTest(true);
            this.render.setCulling(true);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
            this.render.setBlendType(WebGLRenderBlendType.src);
            var posingData = env.currentPosingData;
            this.drawHeadSphere(DrawImageType.depthImage, env);
            this.drawBodySphere(DrawImageType.depthImage, env);
            this.drawBodyRotationSphere(DrawImageType.depthImage, env);
            for (var _i = 0, _a = this.drawingUnits; _i < _a.length; _i++) {
                var drawingUnit = _a[_i];
                if (env.subToolIndex == drawingUnit.subToolID) {
                    this.drawArmLegSphere(DrawImageType.depthImage, drawingUnit.targetData.inputSideID, drawingUnit.parentMatrix, drawingUnit.hitTestSphereRadius, env);
                }
            }
            //if (env.subToolIndex == Posing3DSubToolID.lodcateLeftArm1) {
            //    this.drawArmLegSphere(DrawImageType.depthImage
            //        , posingData.leftArm1LocationInputData.inputSideID
            //        , posingData.bodyRotationInputData.leftArm1RootMatrix
            //        , vec3.length(posingModel.leftArm1HeadLocation)
            //        , env);
            //}
            //if (env.subToolIndex == Posing3DSubToolID.lodcateRightArm1) {
            //    this.drawArmLegSphere(DrawImageType.depthImage
            //        , posingData.rightArm1LocationInputData.inputSideID
            //        , posingData.bodyRotationInputData.rightArm1RootMatrix
            //        , vec3.length(posingModel.rightArm1HeadLocation)
            //        , env);
            //}
            //if (env.subToolIndex == Posing3DSubToolID.lodcateLeftLeg1) {
            //    this.drawArmLegSphere(DrawImageType.depthImage
            //        , posingData.leftLeg1LocationInputData.inputSideID
            //        , posingData.bodyRotationInputData.leftLeg1RootMatrix
            //        , vec3.length(posingModel.leftLeg1HeadLocation)
            //        , env);
            //}
            //if (env.subToolIndex == Posing3DSubToolID.lodcateRightLeg1) {
            //    this.drawArmLegSphere(DrawImageType.depthImage
            //        , posingData.rightLeg1LocationInputData.inputSideID
            //        , posingData.bodyRotationInputData.rightLeg1RootMatrix
            //        , vec3.length(posingModel.rightLeg1HeadLocation)
            //        , env);
            //}
            this.render.setBlendType(WebGLRenderBlendType.blend);
        };
        Posing3DView.prototype.drawHeadSphere = function (drawImageType, env) {
            var posingData = env.currentPosingData;
            var needsDrawing = (posingData != null
                && posingData.headLocationInputData.inputDone
                && (env.subToolIndex == ManualTracingTool.Posing3DSubToolID.locateHead || env.subToolIndex == ManualTracingTool.Posing3DSubToolID.rotateHead));
            if (!needsDrawing) {
                return;
            }
            mat4.copy(this.locationMatrix, posingData.headLocationInputData.matrix);
            var scale = env.currentPosingModel.headSphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.headRotationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.headRotationInputData.inputSideID, env);
            }
        };
        Posing3DView.prototype.drawBodySphere = function (drawImageType, env) {
            var posingData = env.currentPosingData;
            var needsDrawing = (posingData != null
                && posingData.headLocationInputData.inputDone
                && posingData.headRotationInputData.inputDone
                && env.subToolIndex == ManualTracingTool.Posing3DSubToolID.locateBody);
            if (!needsDrawing) {
                return;
            }
            ManualTracingTool.Maths.getTranslationMat4(this.tempVec3, posingData.headLocationInputData.bodyRootMatrix);
            mat4.identity(this.tmpMatrix);
            mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3);
            var scale = env.currentPosingModel.bodySphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.bodyLocationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.bodyLocationInputData.inputSideID, env);
            }
        };
        Posing3DView.prototype.drawBodyRotationSphere = function (drawImageType, env) {
            var posingData = env.currentPosingData;
            var needsDrawing = (posingData != null
                && posingData.bodyLocationInputData.inputDone
                && env.subToolIndex == ManualTracingTool.Posing3DSubToolID.rotateBody);
            if (!needsDrawing) {
                return;
            }
            ManualTracingTool.Maths.getTranslationMat4(this.tempVec3, posingData.bodyLocationInputData.rotationCenterMatrix);
            mat4.identity(this.tmpMatrix);
            mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3);
            var scale = env.currentPosingModel.bodyRotationSphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.bodyRotationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.bodyRotationInputData.inputSideID, env);
            }
        };
        Posing3DView.prototype.drawArmLegSphere = function (drawImageType, inputSideID, rootMatrix, scale, env) {
            var posingData = env.currentPosingData;
            ManualTracingTool.Maths.getTranslationMat4(this.tempVec3, rootMatrix);
            mat4.identity(this.tmpMatrix);
            mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3);
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, inputSideID, env);
            }
        };
        Posing3DView.prototype.isHeadDrawable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.headRotationInputData.inputDone);
        };
        Posing3DView.prototype.isBodyDrawable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.bodyLocationInputData.inputDone);
        };
        Posing3DView.prototype.isLeftArm1Drawable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.leftArm1LocationInputData.inputDone);
        };
        Posing3DView.prototype.isRightArm1Drawable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.rightArm1LocationInputData.inputDone);
        };
        Posing3DView.prototype.isLeftLeg1Drawable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.leftLeg1LocationInputData.inputDone);
        };
        Posing3DView.prototype.isRightLeg1Drawable = function (env) {
            return (env.currentPosingData != null
                && env.currentPosingData.rightLeg1LocationInputData.inputDone);
        };
        Posing3DView.prototype.setShaderParameters = function (locationMatrix, flipSide, shader) {
            var gl = this.render.gl;
            mat4.copy(this.modelMatrix, locationMatrix);
            if (flipSide) {
                mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.tempVec3, 1.0, -1.0, 1.0));
                this.render.setCullingBackFace(false);
            }
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, this.modelMatrix);
            mat4.copy(this.normalMatrix, this.modelViewMatrix);
            this.normalMatrix[12] = 0.0;
            this.normalMatrix[13] = 0.0;
            this.normalMatrix[14] = 0.0;
            if (flipSide) {
                mat4.scale(this.normalMatrix, this.normalMatrix, vec3.set(this.tempVec3, -1.0, -1.0, -1.0));
            }
            this.render.setShader(shader);
            shader.setProjectionMatrix(this.projectionMatrix);
            shader.setModelViewMatrix(this.modelViewMatrix);
            shader.setNormalMatrix(this.normalMatrix);
            this.render.setCullingBackFace(true);
        };
        Posing3DView.prototype.drawZTestSphere = function (locationMatrix, inputSideID, env) {
            var modelResource = this.zTestShpereModel;
            var flipSide = (inputSideID == ManualTracingTool.InputSideID.back);
            this.setShaderParameters(locationMatrix, flipSide, this.posingFigureShader);
            if (this.isHeadDrawable(env)) {
                this.posingFigureShader.setAlpha(0.3);
            }
            else {
                this.posingFigureShader.setAlpha(0.8);
            }
            this.drawModel(modelResource.model, this.imageResurces[0].image);
            this.render.setCullingBackFace(true);
        };
        Posing3DView.prototype.drawZTestSphereDepth = function (locationMatrix, inputSideID, env) {
            var flipSide = (inputSideID == ManualTracingTool.InputSideID.back);
            this.setShaderParameters(locationMatrix, flipSide, this.depthShader);
            var modelResource1 = this.zTestShpereModel;
            this.drawModel(this.zTestShpereModel.model, this.imageResurces[0].image);
            var modelResource2 = this.zTestShpereEdgeModel;
            this.drawModel(this.zTestShpereEdgeModel.model, this.imageResurces[0].image);
        };
        Posing3DView.prototype.drawAxis = function (locationMatrix, scale, alpha, env) {
            mat4.copy(this.modelMatrix, locationMatrix);
            mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            this.setShaderParameters(this.modelMatrix, false, this.posingFigureShader);
            this.posingFigureShader.setAlpha(alpha);
            this.drawModel(this.axisModel.model, this.imageResurces[0].image);
        };
        Posing3DView.prototype.drawSphere = function (locationMatrix, scale, alpha, env) {
            mat4.copy(this.locationMatrix, locationMatrix);
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            this.posingFigureShader.setAlpha(alpha);
            this.drawZTestSphere(this.locationMatrix, ManualTracingTool.InputSideID.front, env);
        };
        Posing3DView.prototype.drawModel = function (model, image) {
            var gl = this.render.gl;
            this.render.setBuffers(model, [image]);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, image.texture);
            this.render.drawElements(model);
        };
        Posing3DView.prototype.caluculateCameraMatrix = function (real3DViewHalfWidth, canvasWindow) {
            // Tareget position
            vec3.set(this.modelLocation, 0.0, 0.0, 0.0);
            // Camera position
            vec3.set(this.lookatLocation, 0.0, -1.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            vec3.set(this.eyeLocation, 0.0, 0.0, 0.0);
            // 2D scale
            var viewScale = canvasWindow.viewScale;
            var real2DViewHalfWidth = canvasWindow.width / 2 / viewScale;
            var real2DViewHalfHeight = canvasWindow.height / 2 / viewScale;
            // Projection
            var aspect = canvasWindow.height / canvasWindow.width;
            var orthoWidth = real3DViewHalfWidth / viewScale;
            mat4.ortho(this.projectionMatrix, -orthoWidth, orthoWidth, -orthoWidth, orthoWidth, 0.1, 10.0);
            var viewOffsetX = -(canvasWindow.viewLocation[0]) / real2DViewHalfWidth; // Normalize to fit to ortho matrix range (0.0-1.0)
            var viewOffsetY = (canvasWindow.viewLocation[1]) / real2DViewHalfHeight;
            mat4.identity(this.tmpMatrix);
            mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, aspect, 1.0, 1.0));
            mat4.rotateZ(this.tmpMatrix, this.tmpMatrix, -canvasWindow.viewRotation * Math.PI / 180.0);
            mat4.translate(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, viewOffsetX / aspect, viewOffsetY, 0.0));
            mat4.multiply(this.projectionMatrix, this.tmpMatrix, this.projectionMatrix);
            mat4.invert(this.projectionInvMatrix, this.projectionMatrix);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            mat4.invert(this.cameraMatrix, this.viewMatrix);
        };
        Posing3DView.prototype.calculate3DLocationFrom2DLocation = function (result, real2DLocation, depth, real3DViewHalfWidth, canvasWindow) {
            this.caluculateCameraMatrix(real3DViewHalfWidth, canvasWindow);
            vec3.transformMat4(this.screenLocation, real2DLocation, canvasWindow.transformMatrix);
            var viewHalfWidth = canvasWindow.width / 2;
            var viewHalfHeight = canvasWindow.height / 2;
            this.screenLocation[0] = (this.screenLocation[0] - viewHalfWidth) / viewHalfWidth;
            this.screenLocation[1] = -(this.screenLocation[1] - viewHalfHeight) / viewHalfHeight;
            this.screenLocation[2] = 0.0;
            vec3.transformMat4(this.invProjectedVec3, this.screenLocation, this.projectionInvMatrix);
            this.invProjectedVec3[2] = -depth;
            vec3.transformMat4(result, this.invProjectedVec3, this.cameraMatrix);
        };
        Posing3DView.prototype.pick3DLocationFromDepthImage = function (result, location2d, real3DViewHalfWidth, pickingWindow) {
            vec3.transformMat4(this.tempVec3, location2d, pickingWindow.transformMatrix);
            if (this.tempVec3[0] < 0 || this.tempVec3[0] >= pickingWindow.width
                || this.tempVec3[1] < 0 || this.tempVec3[1] >= pickingWindow.height) {
                return false;
            }
            var imageData = pickingWindow.context.getImageData(Math.floor(this.tempVec3[0]), Math.floor(this.tempVec3[1]), 1, 1);
            var r = imageData.data[0];
            var g = imageData.data[1];
            var b = imageData.data[2];
            if (r == 0 && g == 0 && b == 0) {
                return false;
            }
            var depth = (r / 255) + (g / Math.pow(255, 2)) + (b / Math.pow(255, 3));
            depth *= pickingWindow.maxDepth;
            this.calculate3DLocationFrom2DLocation(result, location2d, depth, real3DViewHalfWidth, pickingWindow);
            return true;
        };
        return Posing3DView;
    }());
    ManualTracingTool.Posing3DView = Posing3DView;
    var PosingFigureShader = (function (_super) {
        __extends(PosingFigureShader, _super);
        function PosingFigureShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.aPosition = -1;
            _this.aNormal = -1;
            _this.aTexCoord = -1;
            _this.uTexture0 = null;
            _this.uNormalMatrix = null;
            _this.uAlpha = null;
            return _this;
        }
        PosingFigureShader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'attribute vec3 aPosition;'
                + 'attribute vec3 aNormal;'
                + 'attribute vec2 aTexCoord;'
                + 'uniform mat4 uPMatrix;'
                + 'uniform mat4 uMVMatrix;'
                + 'uniform mat4 uNormalMatrix;'
                + 'varying vec3 vPosition;'
                + 'varying vec3 vNormal;'
                + 'varying vec2 vTexCoord;'
                + 'void main(void) {'
                + '	   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);'
                + '	   vPosition = (uMVMatrix * vec4(aPosition, 1.0)).xyz;'
                + '    vNormal = (uNormalMatrix * vec4(aNormal, 1.0)).xyz;'
                + '    vTexCoord = aTexCoord;'
                + '}';
        };
        PosingFigureShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'varying vec3 vPosition;'
                + 'varying vec3 vNormal;'
                + 'varying vec2 vTexCoord;'
                + 'uniform sampler2D uTexture0;'
                + 'uniform float uAlpha;'
                + 'void main(void) {'
                + "    vec3  directionalLight = normalize(vec3(0.0, 1.0, 1.0));"
                + "    vec3  nnormal = normalize(vNormal);"
                + "    float directional = clamp(dot(nnormal, directionalLight), 0.0, 1.0);"
                + "    vec3  viewVec = normalize(vPosition);"
                + "    float specular = pow(max(dot(nnormal, normalize(directionalLight - viewVec)), 0.0), 5.0);"
                + "    vec4 texColor = texture2D(uTexture0, vTexCoord);"
                + '    gl_FragColor = vec4(texColor.rgb * 0.2 + texColor.rgb * directional * 0.8, texColor.a * uAlpha);'
                + '}';
        };
        PosingFigureShader.prototype.initializeAttributes = function () {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PosingFigureShader();
        };
        PosingFigureShader.prototype.initializeAttributes_PosingFigureShader = function () {
            var gl = this.gl;
            this.aPosition = this.getAttribLocation('aPosition');
            this.aNormal = this.getAttribLocation('aNormal');
            this.aTexCoord = this.getAttribLocation('aTexCoord');
            this.uTexture0 = this.getUniformLocation('uTexture0');
            this.uNormalMatrix = this.getUniformLocation('uNormalMatrix');
            this.uAlpha = this.getUniformLocation('uAlpha');
        };
        PosingFigureShader.prototype.setBuffers = function (model, images) {
            var gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();
            this.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, model.vertexDataStride);
            this.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, model.vertexDataStride);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, images[0].texture);
            gl.uniform1i(this.uTexture0, 0);
        };
        PosingFigureShader.prototype.setNormalMatrix = function (matrix) {
            this.gl.uniformMatrix4fv(this.uNormalMatrix, false, matrix);
        };
        PosingFigureShader.prototype.setAlpha = function (alpha) {
            this.gl.uniform1f(this.uAlpha, alpha);
        };
        return PosingFigureShader;
    }(RenderShader));
    ManualTracingTool.PosingFigureShader = PosingFigureShader;
    var DepthShader = (function (_super) {
        __extends(DepthShader, _super);
        function DepthShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.uMaxDepth = null;
            return _this;
        }
        DepthShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = ''
                + this.floatPrecisionDefinitionCode
                + 'varying vec3 vPosition;'
                + 'varying vec3 vNormal;'
                + 'varying vec2 vTexCoord;'
                + 'uniform sampler2D uTexture0;'
                + 'uniform float uMaxDepth;'
                + 'uniform float uAlpha;'
                + 'void main(void) {'
                + '    float z1 = (-vPosition.z) / uMaxDepth * 255.0;'
                + '    float z2 = fract(z1) * 255.0;'
                + '    float z3 = fract(z2) * 255.0;'
                + '    float r = floor(z1) / 255.0;'
                + '    float g = floor(z2) / 255.0;'
                + '    float b = floor(z3) / 255.0;'
                + '    gl_FragColor = vec4(r, g, b , 1.0);'
                + '}';
        };
        DepthShader.prototype.initializeAttributes = function () {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PosingFigureShader();
            this.initializeAttributes_DepthShader();
        };
        DepthShader.prototype.initializeAttributes_DepthShader = function () {
            this.uMaxDepth = this.getUniformLocation('uMaxDepth');
        };
        DepthShader.prototype.setMaxDepth = function (depth) {
            this.gl.uniform1f(this.uMaxDepth, depth);
        };
        return DepthShader;
    }(PosingFigureShader));
    ManualTracingTool.DepthShader = DepthShader;
})(ManualTracingTool || (ManualTracingTool = {}));
