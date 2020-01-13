var ManualTracingTool;
(function (ManualTracingTool) {
    // Rendering
    class ImageResource {
        constructor() {
            this.fileName = null;
            this.image = new RenderImage();
            this.loaded = false;
            this.isGLTexture = false;
        }
        file(fileName) {
            this.fileName = fileName;
            return this;
        }
        tex(isGLTexture) {
            this.isGLTexture = isGLTexture;
            return this;
        }
    }
    ManualTracingTool.ImageResource = ImageResource;
    class ModelResource {
        constructor() {
            this.modelName = null;
            this.model = new RenderModel();
        }
    }
    ManualTracingTool.ModelResource = ModelResource;
    class ModelFile {
        constructor() {
            this.fileName = null;
            this.modelResources = new List();
            this.modelResourceDictionary = new Dictionary();
            this.posingModelDictionary = new Dictionary();
            this.loaded = false;
        }
        file(fileName) {
            this.fileName = fileName;
            return this;
        }
    }
    ManualTracingTool.ModelFile = ModelFile;
    let DrawImageType;
    (function (DrawImageType) {
        DrawImageType[DrawImageType["visualImage"] = 1] = "visualImage";
        DrawImageType[DrawImageType["depthImage"] = 2] = "depthImage";
    })(DrawImageType || (DrawImageType = {}));
    class Posing3DView {
        constructor() {
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
        initialize(render, webglWindow, pickingWindow) {
            this.render = render;
            this.webglWindow = webglWindow;
            //this.pickingWindow = pickingWindow;
            this.render.initializeShader(this.posingFigureShader);
            this.render.initializeShader(this.depthShader);
            this.render.setShader(this.depthShader);
            //this.depthShader.setMaxDepth(pickingWindow.maxDepth);
        }
        storeResources(modelFile, imageResurces) {
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
        }
        buildDrawingStructures(posingLayer) {
            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;
            let drawingUnits = new List();
            // Head top to neck
            {
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
                let unit = new ManualTracingTool.JointPartDrawingUnit();
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
        }
        clear(env) {
            this.render.setDepthTest(true);
            this.render.setCulling(true);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
        }
        prepareDrawingStructures(posingLayer) {
            if (posingLayer.drawingUnits == null) {
                this.buildDrawingStructures(posingLayer);
            }
        }
        drawManipulaters(posingLayer, env) {
            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;
            this.caluculateCameraMatrix(posingData.real3DViewHalfWidth);
            // Draws input manipulaters
            this.drawHeadSphere(DrawImageType.visualImage, posingLayer, env);
            for (let drawingUnit of posingLayer.drawingUnits) {
                if (env.subToolIndex == drawingUnit.subToolID) {
                    //this.drawAxis(drawingUnit.parentMatrix, 0.3, 0.5, env);
                    this.drawSphere(DrawImageType.visualImage, drawingUnit.targetData.inputSideID, drawingUnit.targetData.parentMatrix, drawingUnit.targetData.hitTestSphereRadius, posingLayer, env);
                }
            }
        }
        drawPosingModel(posingLayer, env) {
            if (!ManualTracingTool.Layer.isVisible(posingLayer)) {
                return;
            }
            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;
            this.caluculateCameraMatrix(posingData.real3DViewHalfWidth);
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
                let debugDraw = false;
                if (debugDraw) {
                    this.drawAxis(posingData.leftArm1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.rightArm1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.leftLeg1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.rightLeg1RootMatrix, 0.1, 0.5, env);
                }
            }
            for (let drawingUnit of posingLayer.drawingUnits) {
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
        }
        drawPickingImage(posingLayer, env) {
            this.render.setBlendType(WebGLRenderBlendType.src);
            this.drawHeadSphere(DrawImageType.depthImage, posingLayer, env);
            this.drawBodySphere(DrawImageType.depthImage, posingLayer, env);
            this.drawBodyRotationSphere(DrawImageType.depthImage, posingLayer, env);
            for (let drawingUnit of posingLayer.drawingUnits) {
                if (env.subToolIndex == drawingUnit.subToolID) {
                    this.drawSphere(DrawImageType.depthImage, drawingUnit.targetData.inputSideID, drawingUnit.targetData.parentMatrix, drawingUnit.targetData.hitTestSphereRadius, posingLayer, env);
                }
            }
            this.render.setBlendType(WebGLRenderBlendType.blend);
        }
        getCurrentDrawingUnit(env) {
            for (let drawingUnit of env.currentPosingLayer.drawingUnits) {
                if (env.subToolIndex == drawingUnit.subToolID) {
                    return drawingUnit;
                }
            }
            return null;
        }
        drawHeadSphere(drawImageType, posingLayer, env) {
            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;
            let needsDrawing = (posingData != null
                && posingData.headLocationInputData.inputDone
                && env.subToolIndex == ManualTracingTool.Posing3DSubToolID.locateHead);
            if (!needsDrawing) {
                return;
            }
            mat4.copy(this.locationMatrix, posingData.rootMatrix);
            let scale = posingModel.headSphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.headRotationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.headRotationInputData.inputSideID, env);
            }
        }
        drawBodySphere(drawImageType, posingLayer, env) {
            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;
            let needsDrawing = (posingData != null
                && posingData.headLocationInputData.inputDone
                && env.subToolIndex == ManualTracingTool.Posing3DSubToolID.locateBody);
            if (!needsDrawing) {
                return;
            }
            ManualTracingTool.Maths.getTranslationMat4(this.tempVec3, posingData.chestRootMatrix);
            mat4.identity(this.tmpMatrix);
            mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3);
            let scale = posingModel.bodySphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.bodyLocationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.bodyLocationInputData.inputSideID, env);
            }
        }
        drawBodyRotationSphere(drawImageType, posingLayer, env) {
            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;
            let needsDrawing = (posingData != null
                && posingData.bodyLocationInputData.inputDone
                && env.subToolIndex == ManualTracingTool.Posing3DSubToolID.rotateBody);
            if (!needsDrawing) {
                return;
            }
            ManualTracingTool.Maths.getTranslationMat4(this.tempVec3, posingData.bodyRotationCenterMatrix);
            mat4.identity(this.tmpMatrix);
            mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3);
            let scale = posingModel.bodyRotationSphereSize;
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            if (drawImageType == DrawImageType.visualImage) {
                this.drawZTestSphere(this.locationMatrix, posingData.bodyRotationInputData.inputSideID, env);
            }
            else {
                this.render.clearDepthBuffer();
                this.drawZTestSphereDepth(this.locationMatrix, posingData.bodyRotationInputData.inputSideID, env);
            }
        }
        drawSphere(drawImageType, inputSideID, rootMatrix, scale, posingLayer, env) {
            let posingData = posingLayer.posingData;
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
        }
        isHeadDrawable(posingData) {
            return (posingData != null
                && (posingData.headLocationInputData.inputDone
                    || posingData.headRotationInputData.inputDone));
        }
        isBodyDrawable(posingData) {
            return (posingData != null
                && posingData.bodyLocationInputData.inputDone);
        }
        isLeftArm1Drawable(posingData) {
            return (posingData != null
                && posingData.leftArm1LocationInputData.inputDone);
        }
        isRightArm1Drawable(posingData) {
            return (posingData != null
                && posingData.rightArm1LocationInputData.inputDone);
        }
        isLeftLeg1Drawable(posingData) {
            return (posingData != null
                && posingData.leftLeg1LocationInputData.inputDone);
        }
        isRightLeg1Drawable(posingData) {
            return (posingData != null
                && posingData.rightLeg1LocationInputData.inputDone);
        }
        setShaderParameters(locationMatrix, flipSide, shader) {
            let gl = this.render.gl;
            mat4.copy(this.modelMatrix, locationMatrix);
            let wnd = this.webglWindow;
            let cullingBackFace = !wnd.mirrorX;
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
        }
        drawZTestSphere(locationMatrix, inputSideID, env) {
            let modelResource = this.zTestShpereModel;
            let flipSide = (inputSideID == ManualTracingTool.InputSideID.back);
            this.setShaderParameters(locationMatrix, flipSide, this.posingFigureShader);
            if (this.isHeadDrawable(env.currentPosingData)) {
                this.posingFigureShader.setAlpha(0.3);
            }
            else {
                this.posingFigureShader.setAlpha(0.8);
            }
            this.drawModel(this.posingFigureShader, modelResource.model, this.imageResurces[0].image);
            this.render.setCullingBackFace(true);
        }
        drawZTestSphereDepth(locationMatrix, inputSideID, env) {
            let flipSide = (inputSideID == ManualTracingTool.InputSideID.back);
            this.setShaderParameters(locationMatrix, flipSide, this.depthShader);
            let modelResource1 = this.zTestShpereModel;
            this.drawModel(this.depthShader, this.zTestShpereModel.model, this.imageResurces[0].image);
            let modelResource2 = this.zTestShpereEdgeModel;
            this.drawModel(this.depthShader, this.zTestShpereEdgeModel.model, this.imageResurces[0].image);
        }
        drawAxis(locationMatrix, scale, alpha, env) {
            mat4.copy(this.modelMatrix, locationMatrix);
            mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.tempVec3, scale, scale, scale));
            this.setShaderParameters(this.modelMatrix, false, this.posingFigureShader);
            this.posingFigureShader.setAlpha(alpha);
            this.drawModel(this.posingFigureShader, this.axisModel.model, this.imageResurces[0].image);
        }
        drawModel(shader, model, image) {
            let gl = this.render.gl;
            shader.setBuffers(model, [image]);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, image.texture);
            this.render.drawElements(model);
        }
        caluculateCameraMatrix(real3DViewHalfWidth) {
            let wnd = this.webglWindow;
            // Tareget position
            vec3.set(this.modelLocation, 0.0, 0.0, 0.0);
            // Camera position
            vec3.set(this.lookatLocation, 0.0, -1.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            vec3.set(this.eyeLocation, 0.0, 0.0, 0.0);
            // 2D scale
            let viewScale = wnd.viewScale;
            //let real2DViewHalfWidth = wnd.width / 2 / viewScale;
            //let real2DViewHalfHeight = wnd.height / 2 / viewScale;
            // Projection
            //let aspect = wnd.height / wnd.width;
            let orthoWidth = real3DViewHalfWidth / viewScale;
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
        }
        calculate3DLocationFrom2DLocation(result, real2DLocation, depth, real3DViewHalfWidth) {
            let wnd = this.webglWindow;
            this.caluculateCameraMatrix(real3DViewHalfWidth);
            vec3.transformMat4(this.screenLocation, real2DLocation, wnd.transformMatrix);
            let viewHalfWidth = wnd.width / 2;
            let viewHalfHeight = wnd.height / 2;
            this.screenLocation[0] = (this.screenLocation[0] - viewHalfWidth) / viewHalfWidth;
            this.screenLocation[1] = -(this.screenLocation[1] - viewHalfHeight) / viewHalfHeight;
            this.screenLocation[2] = 0.0;
            vec3.transformMat4(this.invProjectedVec3, this.screenLocation, this.projectionInvMatrix);
            this.invProjectedVec3[2] = -depth;
            vec3.transformMat4(result, this.invProjectedVec3, this.cameraMatrix);
        }
        calculate2DLocationFrom3DLocation(result, real3DLocation, real3DViewHalfWidth) {
            let wnd = this.webglWindow;
            this.caluculateCameraMatrix(real3DViewHalfWidth);
            vec3.transformMat4(result, real3DLocation, this.viewMatrix);
            vec3.transformMat4(result, result, this.real3DProjectionMatrix);
            result[0] *= (wnd.height / 2.0);
            result[1] *= -(wnd.height / 2.0);
        }
        pick3DLocationFromDepthImage(result, location2d, real3DViewHalfWidth, pickingWindow) {
            vec3.transformMat4(this.tempVec3, location2d, pickingWindow.transformMatrix);
            if (this.tempVec3[0] < 0 || this.tempVec3[0] >= pickingWindow.width
                || this.tempVec3[1] < 0 || this.tempVec3[1] >= pickingWindow.height) {
                return false;
            }
            let imageData = pickingWindow.context.getImageData(Math.floor(this.tempVec3[0]), Math.floor(this.tempVec3[1]), 1, 1);
            let r = imageData.data[0];
            let g = imageData.data[1];
            let b = imageData.data[2];
            if (r == 0 && g == 0 && b == 0) {
                return false;
            }
            let depth = (r / 255) + (g / Math.pow(255, 2)) + (b / Math.pow(255, 3));
            depth *= pickingWindow.maxDepth;
            this.calculate3DLocationFrom2DLocation(result, location2d, depth, real3DViewHalfWidth);
            return true;
        }
    }
    ManualTracingTool.Posing3DView = Posing3DView;
    class PosingFigureShader extends RenderShader {
        constructor() {
            super(...arguments);
            this.aPosition = -1;
            this.aNormal = -1;
            this.aTexCoord = -1;
            this.uTexture0 = null;
            this.uNormalMatrix = null;
            this.uAlpha = null;
        }
        initializeVertexSourceCode() {
            this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}
                
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uNormalMatrix;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

void main(void) {

gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);

    vPosition = (uMVMatrix * vec4(aPosition, 1.0)).xyz;
    vNormal = (uNormalMatrix * vec4(aNormal, 1.0)).xyz;
    vTexCoord = aTexCoord;
}
`;
        }
        initializeFragmentSourceCode() {
            this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

uniform sampler2D uTexture0;
uniform float uAlpha;

void main(void) {

    vec3  directionalLight = normalize(vec3(0.0, 1.0, 1.0));

    vec3  nnormal = normalize(vNormal);
    float directional = clamp(dot(nnormal, directionalLight), 0.0, 1.0);

    vec3  viewVec = normalize(vPosition);
    float specular = pow(max(dot(nnormal, normalize(directionalLight - viewVec)), 0.0), 5.0);

    vec4 texColor = texture2D(uTexture0, vTexCoord);
    gl_FragColor = vec4(texColor.rgb * 0.2 + texColor.rgb * directional * 0.8, texColor.a * uAlpha);

}
`;
        }
        initializeAttributes() {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PosingFigureShader();
        }
        initializeAttributes_PosingFigureShader() {
            let gl = this.gl;
            this.aPosition = this.getAttribLocation('aPosition');
            this.aNormal = this.getAttribLocation('aNormal');
            this.aTexCoord = this.getAttribLocation('aTexCoord');
            this.uTexture0 = this.getUniformLocation('uTexture0');
            this.uNormalMatrix = this.getUniformLocation('uNormalMatrix');
            this.uAlpha = this.getUniformLocation('uAlpha');
        }
        setBuffers(model, images) {
            let gl = this.gl;
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
        }
        setNormalMatrix(matrix) {
            this.gl.uniformMatrix4fv(this.uNormalMatrix, false, matrix);
        }
        setAlpha(alpha) {
            this.gl.uniform1f(this.uAlpha, alpha);
        }
    }
    ManualTracingTool.PosingFigureShader = PosingFigureShader;
    class DepthShader extends PosingFigureShader {
        constructor() {
            super(...arguments);
            this.uMaxDepth = null;
        }
        initializeFragmentSourceCode() {
            this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

uniform sampler2D uTexture0;

uniform float uMaxDepth;
uniform float uAlpha;

void main(void) {

    float z1 = (-vPosition.z) / uMaxDepth * 255.0;
    float z2 = fract(z1) * 255.0;
    float z3 = fract(z2) * 255.0;

    float r = floor(z1) / 255.0;
    float g = floor(z2) / 255.0;
    float b = floor(z3) / 255.0;

    gl_FragColor = vec4(r, g, b , 1.0);

}
`;
        }
        initializeAttributes() {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PosingFigureShader();
            this.initializeAttributes_DepthShader();
        }
        initializeAttributes_DepthShader() {
            this.uMaxDepth = this.getUniformLocation('uMaxDepth');
        }
        setMaxDepth(depth) {
            this.gl.uniform1f(this.uMaxDepth, depth);
        }
    }
    ManualTracingTool.DepthShader = DepthShader;
})(ManualTracingTool || (ManualTracingTool = {}));
