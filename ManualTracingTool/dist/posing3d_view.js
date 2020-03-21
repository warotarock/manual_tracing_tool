var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    // Rendering
    var ImageResource = /** @class */ (function () {
        function ImageResource() {
            this.fileName = null;
            this.image = new RenderImage();
            this.isGLTexture = false;
            this.cssImageClassName = '';
            this.loaded = false;
        }
        ImageResource.prototype.file = function (fileName) {
            this.fileName = fileName;
            return this;
        };
        ImageResource.prototype.cssImage = function (className) {
            this.cssImageClassName = className;
            return this;
        };
        ImageResource.prototype.tex = function (isGLTexture) {
            this.isGLTexture = isGLTexture;
            return this;
        };
        return ImageResource;
    }());
    ManualTracingTool.ImageResource = ImageResource;
    var ModelResource = /** @class */ (function () {
        function ModelResource() {
            this.modelName = null;
            this.model = new RenderModel();
        }
        return ModelResource;
    }());
    ManualTracingTool.ModelResource = ModelResource;
    var ModelFile = /** @class */ (function () {
        function ModelFile() {
            this.fileName = null;
            this.modelResources = new List();
            this.modelResourceDictionary = new Dictionary();
            this.posingModelDictionary = new Dictionary();
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
    var Posing3DView = /** @class */ (function () {
        function Posing3DView() {
            // Posing
            // Rendering
            this.render = null;
            this.webglWindow = null;
            //pickingWindow: PickingWindow = null;
            this.posingFigureShader = new PosingFigureShader();
            this.depthShader = new DepthShader();
            this.imageResurces = new List();
            this.axisModel = null;
            this.zTestShpereModel = null;
            this.zTestShpereEdgeModel = null;
            this.headModel = null;
            this.chestModel = null;
            this.leftSholderModel = null;
            this.rightSholderModel = null;
            this.hipsModel = null;
            this.leftArm1Model = null;
            this.leftArm2Model = null;
            this.rightArm1Model = null;
            this.rightArm2Model = null;
            this.leftLeg1Model = null;
            this.leftLeg2Model = null;
            this.rightLeg1Model = null;
            this.rightLeg2Model = null;
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
            this.real3DProjectionMatrix = mat4.create();
            this.locationMatrix = mat4.create();
            this.tempVec3 = vec3.create();
            this.invProjectedVec3 = vec3.create();
            this.tmpMatrix = mat4.create();
            this.screenLocation = vec3.create();
        }
        Posing3DView.prototype.initialize = function (render, webglWindow, pickingWindow) {
            this.render = render;
            this.webglWindow = webglWindow;
            //this.pickingWindow = pickingWindow;
            this.render.initializeShader(this.posingFigureShader);
            this.render.initializeShader(this.depthShader);
            this.render.setShader(this.depthShader);
            //this.depthShader.setMaxDepth(pickingWindow.maxDepth);
        };
        Posing3DView.prototype.storeResources = function (modelFile, imageResurces) {
            this.axisModel = modelFile.modelResourceDictionary['Axis'];
            this.zTestShpereModel = modelFile.modelResourceDictionary['ZTestSphere'];
            this.zTestShpereEdgeModel = modelFile.modelResourceDictionary['ZTestSphereEdge'];
            this.headModel = modelFile.modelResourceDictionary['Head02'];
            this.chestModel = modelFile.modelResourceDictionary['Chest'];
            this.leftSholderModel = modelFile.modelResourceDictionary['LeftShoulder'];
            this.rightSholderModel = modelFile.modelResourceDictionary['LeftShoulder'];
            this.hipsModel = modelFile.modelResourceDictionary['Hips'];
            this.leftArm1Model = modelFile.modelResourceDictionary['Arm1'];
            this.leftArm2Model = modelFile.modelResourceDictionary['Arm1'];
            this.rightArm1Model = modelFile.modelResourceDictionary['Arm1'];
            this.rightArm2Model = modelFile.modelResourceDictionary['Arm1'];
            this.leftLeg1Model = modelFile.modelResourceDictionary['Leg1'];
            this.leftLeg2Model = modelFile.modelResourceDictionary['Leg2'];
            this.rightLeg1Model = modelFile.modelResourceDictionary['Leg1'];
            this.rightLeg2Model = modelFile.modelResourceDictionary['Leg2'];
            this.imageResurces.push(imageResurces[0]);
        };
        Posing3DView.prototype.buildDrawingStructures = function (posingLayer) {
            var posingData = posingLayer.posingData;
            var posingModel = posingLayer.posingModel;
            var drawingUnits = new List();
            // Head top to neck
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "headLocationInputData";
                unit.targetData = posingData.headRotationInputData;
                unit.dependentInputData = posingData.headLocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.rotateHead;
                unit.modelResource = this.headModel;
                unit.drawModel = false;
                unit.targetData.parentMatrix = posingData.neckSphereMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.headTopToNeckVector);
                drawingUnits.push(unit);
            }
            // Chest and hips
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "bodyLocationInputData";
                unit.targetData = posingData.bodyLocationInputData;
                unit.dependentInputData = posingData.headLocationInputData;
                unit.modelConvertMatrix = posingModel.chestModelConvertMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateBody;
                unit.modelResource = this.chestModel;
                unit.targetData.parentMatrix = posingData.chestRootMatrix;
                unit.targetData.hitTestSphereRadius = posingModel.bodySphereSize;
                drawingUnits.push(unit);
            }
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "hipsLocationInputData";
                unit.targetData = posingData.hipsLocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.modelConvertMatrix = posingModel.hipsModelConvertMatrix;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.rotateBody;
                unit.modelResource = this.hipsModel;
                unit.targetData.parentMatrix = posingData.hipsRootMatrix;
                unit.targetData.hitTestSphereRadius = posingModel.hipsSphereSize;
                drawingUnits.push(unit);
            }
            // Left arms
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "leftShoulderLocationInputData";
                unit.targetData = posingData.leftShoulderLocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftShoulder;
                unit.modelResource = this.leftSholderModel;
                unit.targetData.parentMatrix = posingData.shoulderRootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftArm1Location);
                drawingUnits.push(unit);
            }
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "leftArm1LocationInputData";
                unit.targetData = posingData.leftArm1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftArm1;
                unit.modelResource = this.leftArm1Model;
                unit.targetData.parentMatrix = posingData.leftArm1RootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftArm1HeadLocation);
                drawingUnits.push(unit);
            }
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "leftArm2LocationInputData";
                unit.targetData = posingData.leftArm2LocationInputData;
                unit.dependentInputData = posingData.leftArm1LocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftArm2;
                unit.modelResource = this.leftArm2Model;
                unit.targetData.parentMatrix = posingData.leftArm1LocationInputData.childJointRootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftArm2HeadLocation);
                drawingUnits.push(unit);
            }
            // Right arm
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "rightShoulderLocationInputData";
                unit.targetData = posingData.rightShoulderLocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightShoulder;
                unit.modelResource = this.rightSholderModel;
                unit.targetData.parentMatrix = posingData.shoulderRootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightArm1Location);
                drawingUnits.push(unit);
            }
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "rightArm1LocationInputData";
                unit.targetData = posingData.rightArm1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightArm1;
                unit.modelResource = this.rightArm1Model;
                unit.targetData.parentMatrix = posingData.rightArm1RootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightArm1HeadLocation);
                drawingUnits.push(unit);
            }
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "rightArm2LocationInputData";
                unit.targetData = posingData.rightArm2LocationInputData;
                unit.dependentInputData = posingData.rightArm1LocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightArm2;
                unit.modelResource = this.rightArm2Model;
                unit.targetData.parentMatrix = posingData.rightArm1LocationInputData.childJointRootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightArm2HeadLocation);
                drawingUnits.push(unit);
            }
            // Left leg
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "leftLeg1LocationInputData";
                unit.targetData = posingData.leftLeg1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftLeg1;
                unit.modelResource = this.leftLeg1Model;
                unit.targetData.parentMatrix = posingData.leftLeg1RootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftLeg1HeadLocation);
                drawingUnits.push(unit);
            }
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "rightLeg2LocationInputData";
                unit.targetData = posingData.leftLeg2LocationInputData;
                unit.dependentInputData = posingData.leftLeg1LocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateLeftLeg2;
                unit.modelResource = this.leftLeg2Model;
                unit.targetData.parentMatrix = posingData.leftLeg1LocationInputData.childJointRootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftLeg2HeadLocation);
                drawingUnits.push(unit);
            }
            // Right leg
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "rightLeg1LocationInputData";
                unit.targetData = posingData.rightLeg1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightLeg1;
                unit.modelResource = this.rightLeg1Model;
                unit.targetData.parentMatrix = posingData.rightLeg1RootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightLeg1HeadLocation);
                drawingUnits.push(unit);
            }
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "rightLeg2LocationInputData";
                unit.targetData = posingData.rightLeg2LocationInputData;
                unit.dependentInputData = posingData.rightLeg1LocationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.locateRightLeg2;
                unit.modelResource = this.rightLeg2Model;
                unit.targetData.parentMatrix = posingData.rightLeg1LocationInputData.childJointRootMatrix;
                unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightLeg2HeadLocation);
                drawingUnits.push(unit);
            }
            // Head twist
            {
                var unit = new ManualTracingTool.JointPartDrawingUnit();
                unit.name = "headTwistInputData";
                unit.targetData = posingData.headTwistInputData;
                unit.dependentInputData = posingData.headRotationInputData;
                unit.subToolID = ManualTracingTool.Posing3DSubToolID.twistHead;
                unit.drawModel = false;
                unit.targetData.parentMatrix = posingData.neckSphereMatrix;
                unit.targetData.hitTestSphereRadius = posingModel.headTwistSphereSize;
                drawingUnits.push(unit);
            }
            posingLayer.drawingUnits = drawingUnits;
        };
        Posing3DView.prototype.clear = function (env) {
            this.render.setDepthTest(true);
            this.render.setCulling(true);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
        };
        Posing3DView.prototype.prepareDrawingStructures = function (posingLayer) {
            if (posingLayer.drawingUnits == null) {
                this.buildDrawingStructures(posingLayer);
            }
        };
        Posing3DView.prototype.drawManipulaters = function (posingLayer, env) {
            var posingData = posingLayer.posingData;
            var posingModel = posingLayer.posingModel;
            this.caluculateCameraMatrix(posingData);
            // Draws input manipulaters
            this.drawHeadSphere(DrawImageType.visualImage, posingLayer, env);
            for (var _i = 0, _a = posingLayer.drawingUnits; _i < _a.length; _i++) {
                var drawingUnit = _a[_i];
                if (env.subToolIndex == drawingUnit.subToolID) {
                    //this.drawAxis(drawingUnit.parentMatrix, 0.3, 0.5, env);
                    this.drawSphere(DrawImageType.visualImage, drawingUnit.targetData.inputSideID, drawingUnit.targetData.parentMatrix, drawingUnit.targetData.hitTestSphereRadius, posingLayer, env);
                }
            }
        };
        Posing3DView.prototype.drawPosingModel = function (posingLayer, env) {
            if (!ManualTracingTool.Layer.isVisible(posingLayer)) {
                return;
            }
            var posingData = posingLayer.posingData;
            var posingModel = posingLayer.posingModel;
            this.caluculateCameraMatrix(posingData);
            this.render.clearDepthBuffer();
            if (this.isHeadDrawable(posingData)) {
                this.setShaderParameters(posingData.headMatrix, false, this.posingFigureShader);
                this.posingFigureShader.setAlpha(posingLayer.layerColor[3]);
                this.drawModel(this.posingFigureShader, this.headModel.model, this.imageResurces[0].image);
            }
            if (this.isBodyDrawable(posingData)) {
                //mat4.multiply(this.tmpMatrix, posingData.bodyLocationInputData.bodyMatrix, posingModel.chestModelConvertMatrix);
                //this.setShaderParameters(this.tmpMatrix, false, this.posingFigureShader);
                //this.posingFigureShader.setAlpha(1.0);
                //this.drawModel(this.chestModel.model, this.imageResurces[0].image);
                //mat4.multiply(this.tmpMatrix, posingData.chestMatrix, posingModel.hipsModelConvertMatrix);
                //this.setShaderParameters(this.tmpMatrix, false, this.posingFigureShader);
                //this.posingFigureShader.setAlpha(1.0);
                //this.drawModel(this.hipsModel.model, this.imageResurces[0].image);
                var debugDraw = false;
                if (debugDraw) {
                    this.drawAxis(posingData.leftArm1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.rightArm1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.leftLeg1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.rightLeg1RootMatrix, 0.1, 0.5, env);
                }
            }
            for (var _i = 0, _a = posingLayer.drawingUnits; _i < _a.length; _i++) {
                var drawingUnit = _a[_i];
                if (drawingUnit.drawModel && drawingUnit.targetData.inputDone) {
                    if (drawingUnit.modelConvertMatrix != null) {
                        mat4.multiply(this.tmpMatrix, drawingUnit.targetData.matrix, drawingUnit.modelConvertMatrix);
                    }
                    else {
                        mat4.copy(this.tmpMatrix, drawingUnit.targetData.matrix);
                    }
                    this.setShaderParameters(this.tmpMatrix, false, this.posingFigureShader);
                    this.posingFigureShader.setAlpha(drawingUnit.visualModelAlpha * posingLayer.layerColor[3]);
                    this.drawModel(this.posingFigureShader, drawingUnit.modelResource.model, this.imageResurces[0].image);
                    //this.drawAxis(drawingUnit.targetData.matrix, 0.2, 0.5, env);
                }
            }
        };
        Posing3DView.prototype.drawPickingImage = function (posingLayer, env) {
            this.render.setBlendType(WebGLRenderBlendType.src);
            this.drawHeadSphere(DrawImageType.depthImage, posingLayer, env);
            this.drawBodySphere(DrawImageType.depthImage, posingLayer, env);
            this.drawBodyRotationSphere(DrawImageType.depthImage, posingLayer, env);
            for (var _i = 0, _a = posingLayer.drawingUnits; _i < _a.length; _i++) {
                var drawingUnit = _a[_i];
                if (env.subToolIndex == drawingUnit.subToolID) {
                    this.drawSphere(DrawImageType.depthImage, drawingUnit.targetData.inputSideID, drawingUnit.targetData.parentMatrix, drawingUnit.targetData.hitTestSphereRadius, posingLayer, env);
                }
            }
            this.render.setBlendType(WebGLRenderBlendType.blend);
        };
        Posing3DView.prototype.getCurrentDrawingUnit = function (env) {
            for (var _i = 0, _a = env.currentPosingLayer.drawingUnits; _i < _a.length; _i++) {
                var drawingUnit = _a[_i];
                if (env.subToolIndex == drawingUnit.subToolID) {
                    return drawingUnit;
                }
            }
            return null;
        };
        Posing3DView.prototype.drawHeadSphere = function (drawImageType, posingLayer, env) {
            var posingData = posingLayer.posingData;
            var posingModel = posingLayer.posingModel;
            var needsDrawing = (posingData != null
                && posingData.headLocationInputData.inputDone
                && env.subToolIndex == ManualTracingTool.Posing3DSubToolID.locateHead);
            if (!needsDrawing) {
                return;
            }
            mat4.copy(this.locationMatrix, posingData.rootMatrix);
            var scale = posingModel.headSphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.headRotationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.headRotationInputData.inputSideID, env);
            }
        };
        Posing3DView.prototype.drawBodySphere = function (drawImageType, posingLayer, env) {
            var posingData = posingLayer.posingData;
            var posingModel = posingLayer.posingModel;
            var needsDrawing = (posingData != null
                && posingData.headLocationInputData.inputDone
                && env.subToolIndex == ManualTracingTool.Posing3DSubToolID.locateBody);
            if (!needsDrawing) {
                return;
            }
            ManualTracingTool.Maths.getTranslationMat4(this.tempVec3, posingData.chestRootMatrix);
            mat4.identity(this.tmpMatrix);
            mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3);
            var scale = posingModel.bodySphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.bodyLocationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.bodyLocationInputData.inputSideID, env);
            }
        };
        Posing3DView.prototype.drawBodyRotationSphere = function (drawImageType, posingLayer, env) {
            var posingData = posingLayer.posingData;
            var posingModel = posingLayer.posingModel;
            var needsDrawing = (posingData != null
                && posingData.bodyLocationInputData.inputDone
                && env.subToolIndex == ManualTracingTool.Posing3DSubToolID.rotateBody);
            if (!needsDrawing) {
                return;
            }
            ManualTracingTool.Maths.getTranslationMat4(this.tempVec3, posingData.bodyRotationCenterMatrix);
            mat4.identity(this.tmpMatrix);
            mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3);
            var scale = posingModel.bodyRotationSphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.bodyRotationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.bodyRotationInputData.inputSideID, env);
            }
        };
        Posing3DView.prototype.drawSphere = function (drawImageType, inputSideID, rootMatrix, scale, posingLayer, env) {
            var posingData = posingLayer.posingData;
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
        Posing3DView.prototype.isHeadDrawable = function (posingData) {
            return (posingData != null
                && (posingData.headLocationInputData.inputDone
                    || posingData.headRotationInputData.inputDone));
        };
        Posing3DView.prototype.isBodyDrawable = function (posingData) {
            return (posingData != null
                && posingData.bodyLocationInputData.inputDone);
        };
        Posing3DView.prototype.isLeftArm1Drawable = function (posingData) {
            return (posingData != null
                && posingData.leftArm1LocationInputData.inputDone);
        };
        Posing3DView.prototype.isRightArm1Drawable = function (posingData) {
            return (posingData != null
                && posingData.rightArm1LocationInputData.inputDone);
        };
        Posing3DView.prototype.isLeftLeg1Drawable = function (posingData) {
            return (posingData != null
                && posingData.leftLeg1LocationInputData.inputDone);
        };
        Posing3DView.prototype.isRightLeg1Drawable = function (posingData) {
            return (posingData != null
                && posingData.rightLeg1LocationInputData.inputDone);
        };
        Posing3DView.prototype.setShaderParameters = function (locationMatrix, flipSide, shader) {
            var gl = this.render.gl;
            mat4.copy(this.modelMatrix, locationMatrix);
            var wnd = this.webglWindow;
            var cullingBackFace = !wnd.mirrorX;
            if (flipSide) {
                mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.tempVec3, 1.0, -1.0, 1.0));
                //cullingBackFace = !cullingBackFace;
            }
            this.render.setCullingBackFace(cullingBackFace);
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
        };
        Posing3DView.prototype.drawZTestSphere = function (locationMatrix, inputSideID, env) {
            var modelResource = this.zTestShpereModel;
            var flipSide = (inputSideID == ManualTracingTool.InputSideID.back);
            this.setShaderParameters(locationMatrix, flipSide, this.posingFigureShader);
            if (this.isHeadDrawable(env.currentPosingData)) {
                this.posingFigureShader.setAlpha(0.3);
            }
            else {
                this.posingFigureShader.setAlpha(0.8);
            }
            this.drawModel(this.posingFigureShader, modelResource.model, this.imageResurces[0].image);
            this.render.setCullingBackFace(true);
        };
        Posing3DView.prototype.drawZTestSphereDepth = function (locationMatrix, inputSideID, env) {
            var flipSide = (inputSideID == ManualTracingTool.InputSideID.back);
            this.setShaderParameters(locationMatrix, flipSide, this.depthShader);
            var modelResource1 = this.zTestShpereModel;
            this.drawModel(this.depthShader, this.zTestShpereModel.model, this.imageResurces[0].image);
            var modelResource2 = this.zTestShpereEdgeModel;
            this.drawModel(this.depthShader, this.zTestShpereEdgeModel.model, this.imageResurces[0].image);
        };
        Posing3DView.prototype.drawAxis = function (locationMatrix, scale, alpha, env) {
            mat4.copy(this.modelMatrix, locationMatrix);
            mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            this.setShaderParameters(this.modelMatrix, false, this.posingFigureShader);
            this.posingFigureShader.setAlpha(alpha);
            this.drawModel(this.posingFigureShader, this.axisModel.model, this.imageResurces[0].image);
        };
        Posing3DView.prototype.drawModel = function (shader, model, image) {
            var gl = this.render.gl;
            shader.setBuffers(model, [image]);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, image.texture);
            this.render.drawElements(model);
        };
        Posing3DView.prototype.caluculateCameraMatrix = function (posingData) {
            var wnd = this.webglWindow;
            //let real3DViewHalfWidth = posingData.real3DViewHalfWidth;
            var real3DViewHalfWidth = posingData.real3DViewMeterPerPixel * (wnd.height / 2.0);
            // Tareget position
            vec3.set(this.modelLocation, 0.0, 0.0, 0.0);
            // Camera position
            vec3.set(this.lookatLocation, 0.0, -1.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            vec3.set(this.eyeLocation, 0.0, 0.0, 0.0);
            // 2D scale
            var viewScale = wnd.viewScale;
            //let real2DViewHalfWidth = wnd.width / 2 / viewScale;
            //let real2DViewHalfHeight = wnd.height / 2 / viewScale;
            // Projection
            //let aspect = wnd.height / wnd.width;
            var orthoWidth = real3DViewHalfWidth / viewScale;
            mat4.ortho(this.real3DProjectionMatrix, -real3DViewHalfWidth, real3DViewHalfWidth, -real3DViewHalfWidth, real3DViewHalfWidth, 0.1, 10.0);
            mat4.ortho(this.projectionMatrix, -orthoWidth, orthoWidth, -orthoWidth, orthoWidth, 0.1, 10.0);
            // 2D rendering
            //mat4.identity(this.tmpMatrix);
            //{
            //    let viewOffsetX = -(wnd.viewLocation[0]) / real2DViewHalfWidth; // Normalize to fit to ortho matrix range (0.0-1.0)
            //    let viewOffsetY = (wnd.viewLocation[1]) / real2DViewHalfHeight;
            //    mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, aspect, 1.0, 1.0));
            //    if (wnd.mirrorX) {
            //        mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, -1.0, 1.0, 1.0));
            //    }
            //    if (wnd.mirrorY) {
            //        mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, 1.0, -1.0, 1.0));
            //    }
            //    mat4.rotateZ(this.tmpMatrix, this.tmpMatrix, -wnd.viewRotation * Math.PI / 180.0);
            //    mat4.translate(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, viewOffsetX / aspect, viewOffsetY, 0.0));
            //}
            wnd.caluclateGLViewMatrix(this.tmpMatrix);
            mat4.multiply(this.projectionMatrix, this.tmpMatrix, this.projectionMatrix);
            mat4.invert(this.projectionInvMatrix, this.projectionMatrix);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            mat4.invert(this.cameraMatrix, this.viewMatrix);
        };
        Posing3DView.prototype.calculate3DLocationFrom2DLocation = function (result, real2DLocation, depth, posingData) {
            var wnd = this.webglWindow;
            this.caluculateCameraMatrix(posingData);
            vec3.transformMat4(this.screenLocation, real2DLocation, wnd.transformMatrix);
            var viewHalfWidth = wnd.width / 2;
            var viewHalfHeight = wnd.height / 2;
            this.screenLocation[0] = (this.screenLocation[0] - viewHalfWidth) / viewHalfWidth;
            this.screenLocation[1] = -(this.screenLocation[1] - viewHalfHeight) / viewHalfHeight;
            this.screenLocation[2] = 0.0;
            vec3.transformMat4(this.invProjectedVec3, this.screenLocation, this.projectionInvMatrix);
            this.invProjectedVec3[2] = -depth;
            vec3.transformMat4(result, this.invProjectedVec3, this.cameraMatrix);
        };
        Posing3DView.prototype.calculate2DLocationFrom3DLocation = function (result, real3DLocation, posingData) {
            var wnd = this.webglWindow;
            this.caluculateCameraMatrix(posingData);
            vec3.transformMat4(result, real3DLocation, this.viewMatrix);
            vec3.transformMat4(result, result, this.real3DProjectionMatrix);
            result[0] *= (wnd.height / 2.0);
            result[1] *= -(wnd.height / 2.0);
        };
        Posing3DView.prototype.pick3DLocationFromDepthImage = function (result, location2d, posingData, pickingWindow) {
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
            this.calculate3DLocationFrom2DLocation(result, location2d, depth, posingData);
            return true;
        };
        return Posing3DView;
    }());
    ManualTracingTool.Posing3DView = Posing3DView;
    var PosingFigureShader = /** @class */ (function (_super) {
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
            this.vertexShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n                \nattribute vec3 aPosition;\nattribute vec3 aNormal;\nattribute vec2 aTexCoord;\n\nuniform mat4 uPMatrix;\nuniform mat4 uMVMatrix;\nuniform mat4 uNormalMatrix;\n\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\n\nvoid main(void) {\n\ngl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);\n\n    vPosition = (uMVMatrix * vec4(aPosition, 1.0)).xyz;\n    vNormal = (uNormalMatrix * vec4(aNormal, 1.0)).xyz;\n    vTexCoord = aTexCoord;\n}\n";
        };
        PosingFigureShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\n\nuniform sampler2D uTexture0;\nuniform float uAlpha;\n\nvoid main(void) {\n\n    vec3  directionalLight = normalize(vec3(0.0, 1.0, 1.0));\n\n    vec3  nnormal = normalize(vNormal);\n    float directional = clamp(dot(nnormal, directionalLight), 0.0, 1.0);\n\n    vec3  viewVec = normalize(vPosition);\n    float specular = pow(max(dot(nnormal, normalize(directionalLight - viewVec)), 0.0), 5.0);\n\n    vec4 texColor = texture2D(uTexture0, vTexCoord);\n    gl_FragColor = vec4(texColor.rgb * 0.2 + texColor.rgb * directional * 0.8, texColor.a * uAlpha);\n\n}\n";
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
    var DepthShader = /** @class */ (function (_super) {
        __extends(DepthShader, _super);
        function DepthShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.uMaxDepth = null;
            return _this;
        }
        DepthShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\n\nuniform sampler2D uTexture0;\n\nuniform float uMaxDepth;\nuniform float uAlpha;\n\nvoid main(void) {\n\n    float z1 = (-vPosition.z) / uMaxDepth * 255.0;\n    float z2 = fract(z1) * 255.0;\n    float z3 = fract(z2) * 255.0;\n\n    float r = floor(z1) / 255.0;\n    float g = floor(z2) / 255.0;\n    float b = floor(z3) / 255.0;\n\n    gl_FragColor = vec4(r, g, b , 1.0);\n\n}\n";
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
