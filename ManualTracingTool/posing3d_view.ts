
namespace ManualTracingTool {

    // Rendering
    export class ImageResource {

        fileName: string = null;
        image = new RenderImage();
        loaded = false;

        isGLTexture = false;

        file(fileName: string): ImageResource {

            this.fileName = fileName;

            return this;
        }

        tex(isGLTexture: boolean): ImageResource {

            this.isGLTexture = isGLTexture;

            return this;
        }
    }

    export class ModelResource {

        modelName: string = null;
        model = new RenderModel();
    }

    export class ModelFile {

        fileName: string = null;
        modelResources = new List<ModelResource>();
        modelResourceDictionary = new Dictionary<ModelResource>();
        loaded = false;

        file(fileName: string): ModelFile {

            this.fileName = fileName;

            return this;
        }
    }

    enum DrawImageType {

        visualImage = 1,
        depthImage = 2
    }

    export class Posing3DView {

        // Posing

        // Rendering
        render: WebGLRender = null;
        pickingWindow: CanvasWindow = null;
        posingFigureShader = new PosingFigureShader();
        depthShader = new DepthShader();

        imageResurces = new List<ImageResource>();

        axisModel: ModelResource = null;
        zTestShpereModel: ModelResource = null;
        zTestShpereEdgeModel: ModelResource = null;
        headModel: ModelResource = null;
        bodyModel: ModelResource = null;
        leftArm1Model: ModelResource = null;
        leftArm2Model: ModelResource = null;
        rightArm1Model: ModelResource = null;
        rightArm2Model: ModelResource = null;
        leftLeg1Model: ModelResource = null;
        leftLeg2Model: ModelResource = null;
        rightLeg1Model: ModelResource = null;
        rightLeg2Model: ModelResource = null;

        modelLocation = vec3.create();

        eyeLocation = vec3.create();
        lookatLocation = vec3.create();
        upVector = vec3.create();

        modelMatrix = mat4.create();
        normalMatrix = mat4.create();
        viewMatrix = mat4.create();
        modelViewMatrix = mat4.create();
        projectionMatrix = mat4.create();
        projectionInvMatrix = mat4.create();
        cameraMatrix = mat4.create();

        locationMatrix = mat4.create();
        tempVec3 = vec3.create();
        invProjectedVec3 = vec3.create();
        tmpMatrix = mat4.create();
        screenLocation = vec3.create();

        initialize(render: WebGLRender, pickingWindow: PickingWindow) {

            this.render = render;
            this.pickingWindow = pickingWindow;

            this.render.initializeShader(this.posingFigureShader);
            this.render.initializeShader(this.depthShader);

            this.render.setShader(this.depthShader);
            this.depthShader.setMaxDepth(pickingWindow.maxDepth);
        }

        storeResources(modelFile: ModelFile, imageResurces: List<ImageResource>) {

            this.axisModel = modelFile.modelResourceDictionary['Axis'];
            this.zTestShpereModel = modelFile.modelResourceDictionary['ZTestSphere'];
            this.zTestShpereEdgeModel = modelFile.modelResourceDictionary['ZTestSphereEdge'];

            this.headModel = modelFile.modelResourceDictionary['Head02'];
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
        }

        buildDrawingStructures(posingLayer: PosingLayer) {

            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;

            let drawingUnits = new List<JointPartDrawingUnit>();

            // Left arms
            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "leftArm1LocationInputData";
                unit.targetData = posingData.leftArm1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.parentMatrix = posingData.bodyLocationInputData.leftArm1RootMatrix;
                unit.subToolID = Posing3DSubToolID.locateLeftArm1;
                unit.hitTestSphereRadius = vec3.length(posingModel.leftArm1HeadLocation);
                unit.modelResource = this.leftArm1Model;
                drawingUnits.push(unit);
            }

            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "leftArm2LocationInputData";
                unit.targetData = posingData.leftArm2LocationInputData;
                unit.dependentInputData = posingData.leftArm1LocationInputData;
                unit.parentMatrix = posingData.leftArm1LocationInputData.childJointRootMatrix;
                unit.subToolID = Posing3DSubToolID.locateLeftArm2;
                unit.hitTestSphereRadius = vec3.length(posingModel.leftArm2HeadLocation);
                unit.modelResource = this.leftArm2Model;
                drawingUnits.push(unit);
            }

            // Right arm
            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "rightArm1LocationInputData";
                unit.targetData = posingData.rightArm1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.parentMatrix = posingData.bodyLocationInputData.rightArm1RootMatrix;
                unit.subToolID = Posing3DSubToolID.locateRightArm1;
                unit.hitTestSphereRadius = vec3.length(posingModel.rightArm1HeadLocation);
                unit.modelResource = this.rightArm1Model;
                drawingUnits.push(unit);
            }

            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "rightArm2LocationInputData";
                unit.targetData = posingData.rightArm2LocationInputData;
                unit.dependentInputData = posingData.rightArm1LocationInputData;
                unit.parentMatrix = posingData.rightArm1LocationInputData.childJointRootMatrix;
                unit.subToolID = Posing3DSubToolID.locateRightArm2;
                unit.hitTestSphereRadius = vec3.length(posingModel.rightArm2HeadLocation);
                unit.modelResource = this.rightArm2Model;
                drawingUnits.push(unit);
            }

            // Left leg
            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "leftLeg1LocationInputData";
                unit.targetData = posingData.leftLeg1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.parentMatrix = posingData.bodyLocationInputData.leftLeg1RootMatrix;
                unit.subToolID = Posing3DSubToolID.locateLeftLeg1;
                unit.hitTestSphereRadius = vec3.length(posingModel.leftLeg1HeadLocation);
                unit.modelResource = this.leftLeg1Model;
                drawingUnits.push(unit);
            }

            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "rightLeg2LocationInputData";
                unit.targetData = posingData.leftLeg2LocationInputData;
                unit.dependentInputData = posingData.leftLeg1LocationInputData;
                unit.parentMatrix = posingData.leftLeg1LocationInputData.childJointRootMatrix;
                unit.subToolID = Posing3DSubToolID.locateLeftLeg2;
                unit.hitTestSphereRadius = vec3.length(posingModel.leftLeg2HeadLocation);
                unit.modelResource = this.leftLeg2Model;
                drawingUnits.push(unit);
            }

            // Right leg
            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "rightLeg1LocationInputData";
                unit.targetData = posingData.rightLeg1LocationInputData;
                unit.dependentInputData = posingData.bodyLocationInputData;
                unit.parentMatrix = posingData.bodyLocationInputData.rightLeg1RootMatrix;
                unit.subToolID = Posing3DSubToolID.locateRightLeg1;
                unit.hitTestSphereRadius = vec3.length(posingModel.rightLeg1HeadLocation);
                unit.modelResource = this.rightLeg1Model;
                drawingUnits.push(unit);
            }

            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "rightLeg2LocationInputData";
                unit.targetData = posingData.rightLeg2LocationInputData;
                unit.dependentInputData = posingData.rightLeg1LocationInputData;
                unit.parentMatrix = posingData.rightLeg1LocationInputData.childJointRootMatrix;
                unit.subToolID = Posing3DSubToolID.locateRightLeg2;
                unit.hitTestSphereRadius = vec3.length(posingModel.rightLeg2HeadLocation);
                unit.modelResource = this.rightLeg2Model;
                drawingUnits.push(unit);
            }

            // Head twist
            {
                let unit = new JointPartDrawingUnit();
                unit.aName = "headTwistInputData";
                unit.targetData = posingData.headTwistInputData;
                unit.dependentInputData = posingData.headRotationInputData;
                unit.parentMatrix = posingData.headRotationInputData.neckSphereMatrix;
                unit.subToolID = Posing3DSubToolID.twistHead;
                unit.hitTestSphereRadius = posingModel.headTwistSphereSize;
                unit.drawModel = false;
                drawingUnits.push(unit);
            }

            posingLayer.drawingUnits = drawingUnits;
        }

        clear(env: ToolEnvironment) {

            this.render.setDepthTest(true)
            this.render.setCulling(true);
            this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
        }

        prepareDrawingStructures(posingLayer: PosingLayer) {

            if (posingLayer.drawingUnits == null) {

                this.buildDrawingStructures(posingLayer);
            }
        }

        drawManipulaters(posingLayer: PosingLayer, env: ToolEnvironment) {

            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;

            this.caluculateCameraMatrix(posingData.real3DViewHalfWidth, env.mainWindow);

            // Draws input manipulaters

            this.drawHeadSphere(DrawImageType.visualImage, posingLayer, env);

            this.drawBodySphere(DrawImageType.visualImage, posingLayer, env);

            this.drawBodyRotationSphere(DrawImageType.visualImage, posingLayer, env);

            for (let drawingUnit of posingLayer.drawingUnits) {

                if (env.subToolIndex == drawingUnit.subToolID) {

                    //this.drawAxis(drawingUnit.parentMatrix, 0.3, 0.5, env);

                    this.drawArmLegSphere(DrawImageType.visualImage
                        , drawingUnit.targetData.inputSideID
                        , drawingUnit.parentMatrix
                        , drawingUnit.hitTestSphereRadius
                        , posingLayer
                        , env);
                }
            }
        }

        drawPosingModel(posingLayer: PosingLayer, env: ToolEnvironment) {

            if (!posingLayer.isVisible) {
                return;
            }

            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;

            this.caluculateCameraMatrix(posingData.real3DViewHalfWidth, env.mainWindow);

            this.render.clearDepthBuffer();

            if (this.isHeadDrawable(posingData)) {

                this.setShaderParameters(posingData.headLocationInputData.headMatrix, false, this.posingFigureShader);
                this.posingFigureShader.setAlpha(1.0);
                this.drawModel(this.headModel.model, this.imageResurces[0].image);
            }

            if (this.isBodyDrawable(posingData)) {

                this.setShaderParameters(posingData.bodyLocationInputData.bodyMatrix, false, this.posingFigureShader);
                this.posingFigureShader.setAlpha(1.0);
                this.drawModel(this.bodyModel.model, this.imageResurces[0].image);

                let debugDraw = false;
                if (debugDraw) {
                    this.drawAxis(posingData.bodyLocationInputData.leftArm1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.bodyLocationInputData.rightArm1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.bodyLocationInputData.leftLeg1RootMatrix, 0.1, 0.5, env);
                    this.drawAxis(posingData.bodyLocationInputData.rightLeg1RootMatrix, 0.1, 0.5, env);
                }
            }

            for (let drawingUnit of posingLayer.drawingUnits) {

                if (drawingUnit.drawModel && drawingUnit.targetData.inputDone) {

                    this.setShaderParameters(drawingUnit.targetData.matrix, false, this.posingFigureShader);
                    this.posingFigureShader.setAlpha(drawingUnit.visualModelAlpha);
                    this.drawModel(drawingUnit.modelResource.model, this.imageResurces[0].image);

                    //this.drawAxis(drawingUnit.targetData.matrix, 0.2, 0.5, env);
                }
            }
        }

        drawPickingImage(posingLayer: PosingLayer, env: ToolEnvironment) {

            this.render.setBlendType(WebGLRenderBlendType.src);

            this.drawHeadSphere(DrawImageType.depthImage, posingLayer, env);

            this.drawBodySphere(DrawImageType.depthImage, posingLayer, env);

            this.drawBodyRotationSphere(DrawImageType.depthImage, posingLayer, env);

            for (let drawingUnit of posingLayer.drawingUnits) {

                if (env.subToolIndex == drawingUnit.subToolID) {

                    this.drawArmLegSphere(DrawImageType.depthImage
                        , drawingUnit.targetData.inputSideID
                        , drawingUnit.parentMatrix
                        , drawingUnit.hitTestSphereRadius
                        , posingLayer
                        , env);
                }
            }

            //let posingModel = env.currentPosingModel;
            //let posingData = env.currentPosingData;

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
        }

        private drawHeadSphere(drawImageType: DrawImageType, posingLayer: PosingLayer, env: ToolEnvironment) {

            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;

            let needsDrawing = (
                posingData != null
                && posingData.headLocationInputData.inputDone
                && (env.subToolIndex == Posing3DSubToolID.locateHead || env.subToolIndex == Posing3DSubToolID.rotateHead)
            );

            if (!needsDrawing) {
                return
            }

            mat4.copy(this.locationMatrix, posingData.headLocationInputData.matrix);
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

        private drawBodySphere(drawImageType: DrawImageType, posingLayer: PosingLayer, env: ToolEnvironment) {

            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;

            let needsDrawing = (
                posingData != null
                && posingData.headLocationInputData.inputDone
                && posingData.headRotationInputData.inputDone
                && env.subToolIndex == Posing3DSubToolID.locateBody
            );

            if (!needsDrawing) {
                return
            }

            Maths.getTranslationMat4(this.tempVec3, posingData.headLocationInputData.bodyRootMatrix);
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

        private drawBodyRotationSphere(drawImageType: DrawImageType, posingLayer: PosingLayer, env: ToolEnvironment) {

            let posingData = posingLayer.posingData;
            let posingModel = posingLayer.posingModel;

            let needsDrawing = (
                posingData != null
                && posingData.bodyLocationInputData.inputDone
                && env.subToolIndex == Posing3DSubToolID.rotateBody
            );

            if (!needsDrawing) {
                return
            }

            Maths.getTranslationMat4(this.tempVec3, posingData.bodyLocationInputData.rotationCenterMatrix);
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

        private drawArmLegSphere(drawImageType: DrawImageType, inputSideID: InputSideID, rootMatrix: Mat4, scale: float, posingLayer: PosingLayer, env: ToolEnvironment) {

            let posingData = posingLayer.posingData;

            Maths.getTranslationMat4(this.tempVec3, rootMatrix);
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

        private isHeadDrawable(posingData: PosingData): boolean {

            return (posingData != null
                && posingData.headRotationInputData.inputDone);
        }

        private isBodyDrawable(posingData: PosingData): boolean {

            return (posingData != null
                && posingData.bodyLocationInputData.inputDone
            );
        }

        private isLeftArm1Drawable(posingData: PosingData): boolean {

            return (posingData != null
                && posingData.leftArm1LocationInputData.inputDone
            );
        }

        private isRightArm1Drawable(posingData: PosingData): boolean {

            return (posingData != null
                && posingData.rightArm1LocationInputData.inputDone
            );
        }

        private isLeftLeg1Drawable(posingData: PosingData): boolean {

            return (posingData != null
                && posingData.leftLeg1LocationInputData.inputDone
            );
        }

        private isRightLeg1Drawable(posingData: PosingData): boolean {

            return (posingData != null
                && posingData.rightLeg1LocationInputData.inputDone
            );
        }

        private setShaderParameters(locationMatrix: Mat4, flipSide: boolean, shader: PosingFigureShader) {

            let gl = this.render.gl;

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
        }

        private drawZTestSphere(locationMatrix: Mat4, inputSideID: InputSideID, env: ToolEnvironment) {

            let modelResource: ModelResource = this.zTestShpereModel;

            let flipSide = (inputSideID == InputSideID.back);
            this.setShaderParameters(locationMatrix, flipSide, this.posingFigureShader);

            if (this.isHeadDrawable(env.currentPosingData)) {
                this.posingFigureShader.setAlpha(0.3);
            }
            else {
                this.posingFigureShader.setAlpha(0.8);
            }

            this.drawModel(modelResource.model, this.imageResurces[0].image);

            this.render.setCullingBackFace(true);
        }

        private drawZTestSphereDepth(locationMatrix: Mat4, inputSideID: InputSideID, env: ToolEnvironment) {

            let flipSide = (inputSideID == InputSideID.back);
            this.setShaderParameters(locationMatrix, flipSide, this.depthShader);

            let modelResource1: ModelResource = this.zTestShpereModel;
            this.drawModel(this.zTestShpereModel.model, this.imageResurces[0].image);

            let modelResource2: ModelResource = this.zTestShpereEdgeModel;
            this.drawModel(this.zTestShpereEdgeModel.model, this.imageResurces[0].image);
        }

        private drawAxis(locationMatrix: Mat4, scale: float, alpha: float, env: ToolEnvironment) {

            mat4.copy(this.modelMatrix, locationMatrix);
            mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.tempVec3, scale, scale, scale));

            this.setShaderParameters(this.modelMatrix, false, this.posingFigureShader);

            this.posingFigureShader.setAlpha(alpha);

            this.drawModel(this.axisModel.model, this.imageResurces[0].image);
        }

        private drawSphere(locationMatrix: Mat4, scale: float, alpha: float, env: ToolEnvironment) {

            mat4.copy(this.locationMatrix, locationMatrix);
            mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale));

            this.posingFigureShader.setAlpha(alpha);

            this.drawZTestSphere(this.locationMatrix, InputSideID.front, env);
        }

        private drawModel(model: RenderModel, image: RenderImage) {

            let gl = this.render.gl;

            this.render.setBuffers(model, [image]);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, image.texture);

            this.render.drawElements(model);
        }

        caluculateCameraMatrix(real3DViewHalfWidth: float, canvasWindow: CanvasWindow) {

            // Tareget position
            vec3.set(this.modelLocation, 0.0, 0.0, 0.0);

            // Camera position
            vec3.set(this.lookatLocation, 0.0, -1.0, 0.0);
            vec3.set(this.upVector, 0.0, 0.0, 1.0);
            vec3.set(this.eyeLocation, 0.0, 0.0, 0.0);

            // 2D scale
            let viewScale = canvasWindow.viewScale;
            let real2DViewHalfWidth = canvasWindow.width / 2 / viewScale;
            let real2DViewHalfHeight = canvasWindow.height / 2 / viewScale;

            // Projection
            let aspect = canvasWindow.height / canvasWindow.width;
            let orthoWidth = real3DViewHalfWidth / viewScale;
            mat4.ortho(this.projectionMatrix, -orthoWidth, orthoWidth, -orthoWidth, orthoWidth, 0.1, 10.0);

            let viewOffsetX = -(canvasWindow.viewLocation[0]) / real2DViewHalfWidth; // Normalize to fit to ortho matrix range (0.0-1.0)
            let viewOffsetY = (canvasWindow.viewLocation[1]) / real2DViewHalfHeight;
            mat4.identity(this.tmpMatrix);
            mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, aspect, 1.0, 1.0));
            mat4.rotateZ(this.tmpMatrix, this.tmpMatrix, -canvasWindow.viewRotation * Math.PI / 180.0);
            mat4.translate(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, viewOffsetX / aspect, viewOffsetY, 0.0));

            mat4.multiply(this.projectionMatrix, this.tmpMatrix, this.projectionMatrix);

            mat4.invert(this.projectionInvMatrix, this.projectionMatrix);

            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);

            mat4.invert(this.cameraMatrix, this.viewMatrix);
        }

        calculate3DLocationFrom2DLocation(result: Vec3, real2DLocation: Vec3, depth: float, real3DViewHalfWidth: float, canvasWindow: CanvasWindow) {

            this.caluculateCameraMatrix(real3DViewHalfWidth, canvasWindow);

            vec3.transformMat4(this.screenLocation, real2DLocation, canvasWindow.transformMatrix);

            let viewHalfWidth = canvasWindow.width / 2;
            let viewHalfHeight = canvasWindow.height / 2;
            this.screenLocation[0] = (this.screenLocation[0] - viewHalfWidth) / viewHalfWidth;
            this.screenLocation[1] = -(this.screenLocation[1] - viewHalfHeight) / viewHalfHeight;
            this.screenLocation[2] = 0.0;

            vec3.transformMat4(this.invProjectedVec3, this.screenLocation, this.projectionInvMatrix);
            this.invProjectedVec3[2] = -depth;

            vec3.transformMat4(result, this.invProjectedVec3, this.cameraMatrix);
        }

        pick3DLocationFromDepthImage(result: Vec3, location2d: Vec3, real3DViewHalfWidth: float, pickingWindow: PickingWindow): boolean {

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

            this.calculate3DLocationFrom2DLocation(result, location2d, depth, real3DViewHalfWidth, pickingWindow);

            return true;
        }
    }

    export class PosingFigureShader extends RenderShader {

        protected aPosition = -1;
        protected aNormal = -1;
        protected aTexCoord = -1;

        protected uTexture0: WebGLUniformLocation = null;
        protected uNormalMatrix: WebGLUniformLocation = null;
        protected uAlpha: WebGLUniformLocation = null;

        initializeVertexSourceCode() {

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
        }

        initializeFragmentSourceCode() {

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

        setBuffers(model: RenderModel, images: List<RenderImage>) {

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

        setNormalMatrix(matrix: Mat4) {

            this.gl.uniformMatrix4fv(this.uNormalMatrix, false, matrix);
        }

        setAlpha(alpha: float) {

            this.gl.uniform1f(this.uAlpha, alpha);
        }
    }

    export class DepthShader extends PosingFigureShader {

        uMaxDepth: WebGLUniformLocation = null;

        initializeFragmentSourceCode() {

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
        }

        initializeAttributes() {

            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PosingFigureShader();
            this.initializeAttributes_DepthShader();
        }

        initializeAttributes_DepthShader() {

            this.uMaxDepth = this.getUniformLocation('uMaxDepth');
        }

        setMaxDepth(depth: float) {

            this.gl.uniform1f(this.uMaxDepth, depth);
        }
    }

}