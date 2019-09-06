
namespace ManualTracingTool {

    export class Tool_EditImageFileReference extends ToolBase {

        helpText = 'Oキーで画像ファイルを開きます。';

        isAvailable(env: ToolEnvironment): boolean { // @override

            return env.isCurrentLayerImageFileReferenceLayer();
        }

        keydown(e: KeyboardEvent, env: ToolEnvironment): boolean { // @override

            if (e.key == 'o') {

                env.openFileDialog(OpenFileDialogTargetID.imageFileReferenceLayerFilePath);
                return true;
            }

            return false;
        }

        toolWindowItemDoubleClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            env.openFileDialog(OpenFileDialogTargetID.imageFileReferenceLayerFilePath);
        }

        onOpenFile(filePath: string, env: ToolEnvironment) { // @override

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

        private executeCommand(filePath: string, env: ToolEnvironment) {

            let command = new Command_LoadReferenceImageToLayer();
            command.targetLayer = env.currentImageFileReferenceLayer;
            command.newFilePath = filePath;
            command.execute(env);

            env.commandHistory.addCommand(command);
        }
    }

    class Command_LoadReferenceImageToLayer extends CommandBase {

        targetLayer: ImageFileReferenceLayer = null;
        oldFilePath: string = null;
        newFilePath: string = null;

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            this.oldFilePath = this.targetLayer.imageFilePath;

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            this.targetLayer.imageFilePath = this.oldFilePath;
            this.targetLayer.imageResource.loaded = false;

            env.startLoadingCurrentDocumentResources();
        }

        redo(env: ToolEnvironment) { // @override

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

    class Tool_Transform_ReferenceImage extends Tool_Transform_Lattice {

        imageSize = vec3.create();
        pointLocation = vec3.create();
        transformMatrix = mat4.create();

        dLocation = vec3.create();

        isAvailable(env: ToolEnvironment): boolean { // @override

            return env.isCurrentLayerImageFileReferenceLayer();
        }

        protected checkTarget(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

            if (env.currentImageFileReferenceLayer == null) {

                return false;
            }

            return true;
        }

        protected prepareLatticePoints(env: ToolEnvironment): boolean { // @override
            
            this.calculateImageLatticePoints(
                env.currentImageFileReferenceLayer.imageResource.image,
                env.currentImageFileReferenceLayer.location,
                env.currentImageFileReferenceLayer.rotation,
                env.currentImageFileReferenceLayer.scale
            );

            this.resetLatticePointLocationToBaseLocation();

            return true;
        }

        protected calculateImageLatticePoints(image: RenderImage, location: Vec3, rotation: Vec3, scaling: Vec3) {

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

        protected setLatticeLocation(env: ToolEnvironment) { // @override

            // do nothing
        }

        protected prepareEditData(e: ToolMouseEvent, env: ToolEnvironment) { // @override

            for (let latticePoint of this.latticePoints) {

                latticePoint.latticePointEditType = LatticePointEditTypeID.allDirection;
            }
        }

        protected processTransform(env: ToolEnvironment) { // @override

            let ifrLayer = env.currentImageFileReferenceLayer;
            let image = ifrLayer.imageResource.image;

            if (this.transformModifyType == TransformModifyType.one) {

                if (this.transformType == TransformType.grabMove) {

                    ifrLayer.adjustingLocation[0] = -ifrLayer.imageResource.image.width / 2;
                    ifrLayer.adjustingLocation[1] = -ifrLayer.imageResource.image.height / 2;
                }
                else if (this.transformType == TransformType.rotate) {

                    ifrLayer.adjustingRotation[0] = 0.0;
                }
                else if (this.transformType == TransformType.scale) {

                    vec3.set(ifrLayer.adjustingScale, 1.0, 1.0, 1.0);
                }


                this.calculateImageLatticePoints(
                    env.currentImageFileReferenceLayer.imageResource.image,
                    env.currentImageFileReferenceLayer.adjustingLocation,
                    env.currentImageFileReferenceLayer.adjustingRotation,
                    env.currentImageFileReferenceLayer.adjustingScale
                );

                this.resetLatticePointLocationToBaseLocation();

                this.transformModifyType = TransformModifyType.none;

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

        protected executeCommand(env: ToolEnvironment) { // @override

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

        cancelModal(env: ToolEnvironment) { // @override

            let ifrLayer = env.currentImageFileReferenceLayer;

            vec3.copy(ifrLayer.adjustingLocation, ifrLayer.location);
            vec3.copy(ifrLayer.adjustingRotation, ifrLayer.rotation);
            vec3.copy(ifrLayer.adjustingScale, ifrLayer.scale);
        }

    }

    class Command_Transform_ReferenceImage extends CommandBase {

        targetLayer: ImageFileReferenceLayer = null;

        newLocation = vec3.fromValues(0.0, 0.0, 0.0);
        newRotation = vec3.fromValues(0.0, 0.0, 0.0);
        newScale = vec3.fromValues(1.0, 1.0, 1.0);

        oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
        oldRotation = vec3.fromValues(0.0, 0.0, 0.0);
        oldScale = vec3.fromValues(1.0, 1.0, 1.0);

        execute(env: ToolEnvironment) { // @override

            this.errorCheck();

            vec3.copy(this.oldLocation, this.targetLayer.location);
            vec3.copy(this.oldRotation, this.targetLayer.rotation);
            vec3.copy(this.oldScale, this.targetLayer.scale);

            this.redo(env);
        }

        undo(env: ToolEnvironment) { // @override

            vec3.copy(this.targetLayer.location, this.oldLocation);
            vec3.copy(this.targetLayer.rotation, this.oldRotation);
            vec3.copy(this.targetLayer.scale, this.oldScale);
        }

        redo(env: ToolEnvironment) { // @override

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

    export class Tool_Transform_ReferenceImage_GrabMove extends Tool_Transform_ReferenceImage {

        protected selectTransformCalculator(env: ToolEnvironment) { // @override

            this.setLatticeAffineTransform(TransformType.grabMove, env);
        }
    }

    export class Tool_Transform_ReferenceImage_Rotate extends Tool_Transform_ReferenceImage {

        protected selectTransformCalculator(env: ToolEnvironment) { // @override

            this.setLatticeAffineTransform(TransformType.rotate, env);
        }
    }

    export class Tool_Transform_ReferenceImage_Scale extends Tool_Transform_ReferenceImage {

        protected selectTransformCalculator(env: ToolEnvironment) { // @override

            this.setLatticeAffineTransform(TransformType.scale, env);
        }
    }
}
