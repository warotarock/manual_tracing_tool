var ManualTracingTool;
(function (ManualTracingTool) {
    class Tool_EditImageFileReference extends ManualTracingTool.ToolBase {
        constructor() {
            super(...arguments);
            this.helpText = 'Oキーで画像ファイルを開きます。';
        }
        isAvailable(env) {
            return env.isCurrentLayerImageFileReferenceLayer();
        }
        keydown(e, env) {
            if (e.key == 'o') {
                env.openFileDialog(ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath);
                return true;
            }
            return false;
        }
        toolWindowItemDoubleClick(e, env) {
            env.openFileDialog(ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath);
        }
        onOpenFile(filePath, env) {
            if (env.currentImageFileReferenceLayer != null) {
                let lastIndex = StringLastIndexOf(filePath, '\\');
                if (lastIndex != -1) {
                    let startIndex = lastIndex + 1;
                    filePath = StringSubstring(filePath, startIndex, filePath.length - startIndex);
                }
                if (env.currentImageFileReferenceLayer.imageFilePath != filePath) {
                    this.executeCommand(filePath, env);
                }
            }
        }
        executeCommand(filePath, env) {
            let command = new Command_LoadReferenceImageToLayer();
            command.targetLayer = env.currentImageFileReferenceLayer;
            command.newFilePath = filePath;
            command.execute(env);
            env.commandHistory.addCommand(command);
        }
    }
    ManualTracingTool.Tool_EditImageFileReference = Tool_EditImageFileReference;
    class Command_LoadReferenceImageToLayer extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.targetLayer = null;
            this.oldFilePath = null;
            this.newFilePath = null;
        }
        execute(env) {
            this.errorCheck();
            this.oldFilePath = this.targetLayer.imageFilePath;
            this.redo(env);
        }
        undo(env) {
            this.targetLayer.imageFilePath = this.oldFilePath;
            this.targetLayer.imageResource.loaded = false;
            env.startLoadingCurrentDocumentResources();
        }
        redo(env) {
            this.targetLayer.imageFilePath = this.newFilePath;
            if (this.targetLayer.imageResource != null) {
                this.targetLayer.imageResource.loaded = false;
            }
            else {
                this.targetLayer.imageLoading = true;
            }
            env.startLoadingCurrentDocumentResources();
        }
        errorCheck() {
            if (this.targetLayer == null) {
                throw ('Command_LoadReferenceImageToLayer: layer is null!');
            }
            if (StringIsNullOrEmpty(this.newFilePath)) {
                throw ('Command_LoadReferenceImageToLayer: new file path is empty!');
            }
        }
    }
    class Tool_Transform_ReferenceImage extends ManualTracingTool.Tool_Transform_Lattice {
        constructor() {
            super(...arguments);
            this.imageSize = vec3.create();
            this.pointLocation = vec3.create();
            this.transformMatrix = mat4.create();
            this.dLocation = vec3.create();
        }
        isAvailable(env) {
            return env.isCurrentLayerImageFileReferenceLayer();
        }
        checkTarget(e, env) {
            if (env.currentImageFileReferenceLayer == null) {
                return false;
            }
            return true;
        }
        prepareLatticePoints(env) {
            this.calculateImageLatticePoints(env.currentImageFileReferenceLayer.imageResource.image, env.currentImageFileReferenceLayer.location, env.currentImageFileReferenceLayer.rotation, env.currentImageFileReferenceLayer.scale);
            this.resetLatticePointLocationToBaseLocation();
            return true;
        }
        calculateImageLatticePoints(image, location, rotation, scaling) {
            // calculate matrix
            mat4.identity(this.transformMatrix);
            mat4.translate(this.transformMatrix, this.transformMatrix, location);
            let angle = rotation[0];
            mat4.rotateZ(this.transformMatrix, this.transformMatrix, angle);
            vec3.set(this.imageSize, image.width, image.height, 0.0);
            mat4.scale(this.transformMatrix, this.transformMatrix, this.imageSize);
            mat4.scale(this.transformMatrix, this.transformMatrix, scaling);
            // calculate lattice points
            vec3.set(this.pointLocation, 0.0, 0.0, 0.0);
            vec3.transformMat4(this.latticePoints[0].baseLocation, this.pointLocation, this.transformMatrix);
            vec3.set(this.pointLocation, 1.0, 0.0, 0.0);
            vec3.transformMat4(this.latticePoints[1].baseLocation, this.pointLocation, this.transformMatrix);
            vec3.set(this.pointLocation, 1.0, 1.0, 0.0);
            vec3.transformMat4(this.latticePoints[2].baseLocation, this.pointLocation, this.transformMatrix);
            vec3.set(this.pointLocation, 0.0, 1.0, 0.0);
            vec3.transformMat4(this.latticePoints[3].baseLocation, this.pointLocation, this.transformMatrix);
        }
        setLatticeLocation(env) {
            // do nothing
        }
        prepareEditData(e, env) {
            for (let latticePoint of this.latticePoints) {
                latticePoint.latticePointEditType = ManualTracingTool.LatticePointEditTypeID.allDirection;
            }
        }
        processTransform(env) {
            let ifrLayer = env.currentImageFileReferenceLayer;
            let image = ifrLayer.imageResource.image;
            if (this.transformModifyType == ManualTracingTool.TransformModifyType.one) {
                if (this.transformType == ManualTracingTool.TransformType.grabMove) {
                    ifrLayer.adjustingLocation[0] = -ifrLayer.imageResource.image.width / 2;
                    ifrLayer.adjustingLocation[1] = -ifrLayer.imageResource.image.height / 2;
                }
                else if (this.transformType == ManualTracingTool.TransformType.rotate) {
                    ifrLayer.adjustingRotation[0] = 0.0;
                }
                else if (this.transformType == ManualTracingTool.TransformType.scale) {
                    vec3.set(ifrLayer.adjustingScale, 1.0, 1.0, 1.0);
                }
                this.calculateImageLatticePoints(env.currentImageFileReferenceLayer.imageResource.image, env.currentImageFileReferenceLayer.adjustingLocation, env.currentImageFileReferenceLayer.adjustingRotation, env.currentImageFileReferenceLayer.adjustingScale);
                this.resetLatticePointLocationToBaseLocation();
                this.transformModifyType = ManualTracingTool.TransformModifyType.none;
                return;
            }
            // location
            vec3.copy(ifrLayer.adjustingLocation, this.latticePoints[0].location);
            // scale
            vec3.subtract(this.dLocation, this.latticePoints[0].location, this.latticePoints[3].location);
            let scaleH = vec3.length(this.dLocation) / image.height;
            vec3.subtract(this.dLocation, this.latticePoints[0].location, this.latticePoints[1].location);
            let scaleW = vec3.length(this.dLocation) / image.width;
            vec3.set(ifrLayer.adjustingScale, scaleW, scaleH, 0.0);
            // angle
            vec3.subtract(this.dLocation, this.latticePoints[1].location, this.latticePoints[0].location);
            let angle = Math.atan2(this.dLocation[1], this.dLocation[0]);
            ifrLayer.adjustingRotation[0] = angle;
        }
        executeCommand(env) {
            let ifrLayer = env.currentImageFileReferenceLayer;
            // Execute the command
            let command = new Command_Transform_ReferenceImage();
            command.targetLayer = ifrLayer;
            vec3.copy(command.newLocation, command.targetLayer.adjustingLocation);
            vec3.copy(command.newRotation, command.targetLayer.adjustingRotation);
            vec3.copy(command.newScale, command.targetLayer.adjustingScale);
            command.execute(env);
            env.commandHistory.addCommand(command);
        }
        cancelModal(env) {
            let ifrLayer = env.currentImageFileReferenceLayer;
            vec3.copy(ifrLayer.adjustingLocation, ifrLayer.location);
            vec3.copy(ifrLayer.adjustingRotation, ifrLayer.rotation);
            vec3.copy(ifrLayer.adjustingScale, ifrLayer.scale);
        }
    }
    class Command_Transform_ReferenceImage extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.targetLayer = null;
            this.newLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.newRotation = vec3.fromValues(0.0, 0.0, 0.0);
            this.newScale = vec3.fromValues(1.0, 1.0, 1.0);
            this.oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.oldRotation = vec3.fromValues(0.0, 0.0, 0.0);
            this.oldScale = vec3.fromValues(1.0, 1.0, 1.0);
        }
        execute(env) {
            this.errorCheck();
            vec3.copy(this.oldLocation, this.targetLayer.location);
            vec3.copy(this.oldRotation, this.targetLayer.rotation);
            vec3.copy(this.oldScale, this.targetLayer.scale);
            this.redo(env);
        }
        undo(env) {
            vec3.copy(this.targetLayer.location, this.oldLocation);
            vec3.copy(this.targetLayer.rotation, this.oldRotation);
            vec3.copy(this.targetLayer.scale, this.oldScale);
        }
        redo(env) {
            vec3.copy(this.targetLayer.location, this.newLocation);
            vec3.copy(this.targetLayer.rotation, this.newRotation);
            vec3.copy(this.targetLayer.scale, this.newScale);
        }
        errorCheck() {
            if (this.targetLayer == null) {
                throw ('Command_LoadReferenceImageToLayer: layer is null!');
            }
        }
    }
    class Tool_Transform_ReferenceImage_GrabMove extends Tool_Transform_ReferenceImage {
        selectTransformCalculator(env) {
            this.setLatticeAffineTransform(ManualTracingTool.TransformType.grabMove, env);
        }
    }
    ManualTracingTool.Tool_Transform_ReferenceImage_GrabMove = Tool_Transform_ReferenceImage_GrabMove;
    class Tool_Transform_ReferenceImage_Rotate extends Tool_Transform_ReferenceImage {
        selectTransformCalculator(env) {
            this.setLatticeAffineTransform(ManualTracingTool.TransformType.rotate, env);
        }
    }
    ManualTracingTool.Tool_Transform_ReferenceImage_Rotate = Tool_Transform_ReferenceImage_Rotate;
    class Tool_Transform_ReferenceImage_Scale extends Tool_Transform_ReferenceImage {
        selectTransformCalculator(env) {
            this.setLatticeAffineTransform(ManualTracingTool.TransformType.scale, env);
        }
    }
    ManualTracingTool.Tool_Transform_ReferenceImage_Scale = Tool_Transform_ReferenceImage_Scale;
})(ManualTracingTool || (ManualTracingTool = {}));
